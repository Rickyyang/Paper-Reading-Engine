import { test } from "node:test";
import assert from "node:assert/strict";
import { appendDraft, noteWorkspace } from "./noteSections.ts";
import { emptySurvey, type Session } from "./types.ts";
import { load, save } from "./storage.ts";

test("appends raw Markdown without rewriting and ignores blank additions", () => {
  const first = "# Section\n\n$x_k$";
  const second = "  $$\nA^\\top P A\n$$\n";
  assert.equal(appendDraft("", first), first);
  assert.equal(appendDraft(first, second), first + "\n\n" + second);
  assert.equal(appendDraft(first, " \n "), first);
});

test("preserves legacy notes and persists unfinished sections and edits without resurrection", () => {
  let raw: string | null = null;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => raw,
      setItem: (_key: string, value: string) => {
        raw = value;
      },
    },
  });
  const session: Session = {
    id: "paper",
    title: "Paper",
    survey: emptySurvey(),
    state: "reading",
    stage: "initial",
    quests: [],
    notes: "",
    questions: [],
    sideQuests: [],
    savedNotes: [{ id: "old", text: "$x_k$", partId: "P1" }],
  };
  const workspace = noteWorkspace(session);
  assert.equal(workspace.savedSections[0].markdown, "$x_k$");
  assert.equal(workspace.savedSections[0].id, "old");
  assert.equal(workspace.savedSections[0].createdAt, null);
  workspace.workingSection = {
    markdown: "# Work\n\n$x_k$",
    draft: "Unfinished $A^\\top P A$",
  };
  workspace.savedSections[0] = {
    ...workspace.savedSections[0],
    markdown: "Edited",
    updatedAt: "2026-10-01T10:00:00Z",
  };
  const current = { ...session, workspaceState: workspace };
  save({ sessions: [current], activeId: session.id });
  assert.deepEqual(load().sessions[0], current);
  const deleted = {
    ...current,
    workspaceState: { ...workspace, savedSections: [] },
  };
  save({ sessions: [deleted], activeId: session.id });
  assert.deepEqual(noteWorkspace(load().sessions[0]).savedSections, []);
  const valid = raw;
  for (const broken of [
    null,
    { workingSection: { markdown: 42, draft: "" }, savedSections: [] },
    {
      ...workspace,
      savedSections: [{ ...workspace.savedSections[0], updatedAt: "bad date" }],
    },
  ]) {
    const data = JSON.parse(valid!);
    data.sessions[0].workspaceState = broken;
    raw = JSON.stringify(data);
    const before = raw;
    assert.throws(() => load(), /has not been overwritten/);
    assert.equal(raw, before);
  }
});
