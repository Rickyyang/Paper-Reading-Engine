import { test } from "node:test";
import assert from "node:assert/strict";
import { load, save } from "./storage.ts";
import { emptySurvey, type Session } from "./types.ts";
import { parsePlan } from "./parser.ts";
import { initialReadingPlanPrompt } from "./prompts/initialReadingPlan.ts";
test("persists the complete plan and reading state; migrates older surveys without losing data", () => {
  let stored: string | null = null;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => stored,
      setItem: (_key: string, value: string) => {
        stored = value;
      },
    },
  });
  const session: Session = {
    id: "test",
    title: "Paper",
    survey: emptySurvey(),
    state: "reading",
    stage: "initial",
    quests: [],
    notes: "Legacy notes",
    questions: [],
    sideQuests: [],
    readingPlan: {
      schema_version: 1,
      record_type: "initial_reading_plan",
      main_quest: "Goal",
      quests: [],
      starting_point: "Start",
      extra: { preserved: true },
    },
  };
  save({ sessions: [session], activeId: session.id });
  assert.deepEqual(load().sessions[0], session);
  const legacy = JSON.parse(stored!);
  delete legacy.sessions[0].survey.effort;
  stored = JSON.stringify(legacy);
  assert.deepEqual(load().sessions[0], session);
  const oldSurvey = legacy.sessions[0].survey;
  delete oldSurvey.reading_purpose;
  delete oldSurvey.primary_reading_goal;
  oldSurvey.purpose = "Literature review";
  oldSurvey.goals = "Understand the convergence argument";
  stored = JSON.stringify(legacy);
  const migrated = load().sessions[0];
  assert.deepEqual(migrated, {
    ...session,
    survey: {
      ...session.survey,
      reading_purpose: "Literature review",
      primary_reading_goal: "Understand the convergence argument",
    },
  });
  save({ sessions: [migrated], activeId: migrated.id });
  assert.deepEqual(load().sessions[0], migrated);
  // The exact schema example in the current prompt must import and survive reload.
  const current = {
    ...migrated,
    readingPlan: parsePlan(initialReadingPlanPrompt),
    completedQuestIds: ["Q1.1"],
  };
  const math =
    "How does $\\Theta_t$ affect $W_k^0$?\n\n$$\ne_k \\in \\mathcal{E}(V,\\beta_k^2)\n$$";
  const plan = current.readingPlan;
  plan.main_objective = math;
  plan.route_summary = math;
  plan.parts[0].title = math;
  plan.parts[0].objective = math;
  plan.parts[0].checkpoint.question = math;
  Object.assign(plan.parts[0].quests[0], {
    title: math,
    objective: math,
    read: [math],
    focus_question: math,
    completion_condition: math,
  });
  Object.assign(plan.start_here, {
    instruction: math,
    focus_question: math,
    completion_condition: math,
  });
  plan.skim_for_now = [math];
  // JSON parsing and local persistence preserve the source, never HTML.
  assert.deepEqual(parsePlan(JSON.stringify(plan)), plan);
  save({ sessions: [current], activeId: current.id });
  assert.deepEqual(load().sessions[0], current);
  const beforeInvalidImport = stored;
  assert.throws(() => parsePlan('{"schema_version": 1}'));
  assert.equal(stored, beforeInvalidImport);
  // Saved notes are paper-level data, independent of legacy notes and plan replacement.
  const withNotes: Session = {
    ...current,
    savedNotes: [
      {
        id: "note-1",
        text: "# Understanding\n\n**Bold** and $x_k$\n\n$$\ne_k \\in \\mathcal{E}(V,\\beta_k^2)\n$$\n\n```tex\nA^\\top P A\n```\n",
      },
    ],
  };
  save({ sessions: [withNotes], activeId: withNotes.id });
  assert.deepEqual(load().sessions[0], withNotes);
  save({
    sessions: [{ ...withNotes, state: "setup" }],
    activeId: withNotes.id,
  });
  assert.deepEqual(load().sessions[0].savedNotes, withNotes.savedNotes);
  const annotated = {
    id: "note-2",
    text: "Quest note",
    createdAt: "2026-09-30T10:00:00.000Z",
    partId: "P1",
    questId: "Q1.1",
    partTitle: "Part title",
    questTitle: "Quest title",
  };
  const edited = { ...annotated, text: "Edited quest note" };
  save({
    sessions: [
      { ...withNotes, savedNotes: [...withNotes.savedNotes!, edited] },
    ],
    activeId: withNotes.id,
  });
  assert.deepEqual(load().sessions[0].savedNotes, [
    ...withNotes.savedNotes!,
    edited,
  ]);
  const validNotes = stored;
  for (const invalid of [
    { createdAt: "not-a-date" },
    { partId: 42 },
    { questTitle: false },
  ]) {
    const badMetadata = JSON.parse(validNotes!);
    Object.assign(badMetadata.sessions[0].savedNotes[1], invalid);
    stored = JSON.stringify(badMetadata);
    assert.throws(() => load(), /has not been overwritten/);
  }
  stored = validNotes;
  const malformed = JSON.parse(stored!);
  malformed.sessions[0].savedNotes[0].text = 42;
  stored = JSON.stringify(malformed);
  const unreadable = stored;
  assert.throws(() => load(), /has not been overwritten/);
  assert.equal(stored, unreadable);
});
