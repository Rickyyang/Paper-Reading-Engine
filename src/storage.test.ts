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
  save({ sessions: [current], activeId: current.id });
  assert.deepEqual(load().sessions[0], current);
  const beforeInvalidImport = stored;
  assert.throws(() => parsePlan('{"schema_version": 1}'));
  assert.equal(stored, beforeInvalidImport);
});
