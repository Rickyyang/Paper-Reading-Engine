import { test } from "node:test";
import assert from "node:assert/strict";
import {
  downloadTextFile,
  exportLibraryAsJson,
  exportPaperAsMarkdown,
  paperMarkdownFilename,
  libraryFilename,
} from "./exports.ts";
import { emptySurvey, type Session } from "./types.ts";

const math =
  "# 理解 🧪\n\n**Bold** and $x_k$\n\n$$\ne_k \\in \\mathcal{E}(V,\\beta_k^2)\n$$\n\n```ts\nconst x = 1;\n```\n";
function paper(): Session {
  return {
    id: "permanent-id",
    title: "论文: Robust / Tubes?",
    survey: emptySurvey(),
    state: "reading",
    stage: "initial",
    notes: "",
    quests: [],
    questions: [],
    sideQuests: [],
    savedNotes: [{ id: "legacy", text: "Do not duplicate" }],
    workspaceState: {
      workingSection: {
        markdown: "Unfinished $V$",
        draft: "  Draft $A^\\top P A$\n",
      },
      savedSections: [
        {
          id: "new",
          markdown: math,
          createdAt: "2026-10-07T10:00:00Z",
          updatedAt: null,
          partId: "P1",
          partTitle: "Method",
          questId: "Q1.1",
          questTitle: "Read",
        },
        {
          id: "old",
          markdown: "Older note",
          createdAt: "2026-10-01T10:00:00Z",
          updatedAt: null,
          partId: null,
          partTitle: null,
          questId: null,
          questTitle: null,
        },
      ],
    },
    readingPlan: {
      schema_version: 1,
      record_type: "initial_reading_plan",
      main_objective: "Understand",
      route_summary: "Read then reflect",
      parts: [
        {
          id: "P1",
          title: "方法",
          objective: "Learn method",
          quests: [
            {
              id: "Q1.1",
              title: "Study",
              objective: "Explain",
              read: ["§2", "Fig. 1"],
              focus_question: "Why?",
              completion_condition: "Describe",
            },
          ],
          checkpoint: { question: "How?" },
        },
      ],
      skim_for_now: ["OMIT THIS"],
      start_here: {
        part_id: "P1",
        quest_id: "Q1.1",
        instruction: "Start",
        focus_question: "Why?",
        completion_condition: "Explain",
      },
    },
  };
}

test("JSON backup preserves every session, raw Unicode/math, IDs and timestamps without mutation", () => {
  const sessions = [paper(), { ...paper(), id: "second", title: "Second" }];
  const before = structuredClone(sessions);
  const parking = { "permanent-id": [{ id: "question", text: "为什么 $V$?" }] };
  const text = exportLibraryAsJson(
    sessions,
    "second",
    parking,
    new Date("2026-10-07T00:00:00Z"),
  );
  const parsed = JSON.parse(
    new TextDecoder().decode(new TextEncoder().encode(text)),
  );
  assert.equal(parsed.format_version, 1);
  assert.equal(parsed.exported_at, "2026-10-07T00:00:00.000Z");
  assert.equal(parsed.activeId, "second");
  assert.deepEqual(parsed.papers, [
    { ...sessions[0], parkingItems: parking["permanent-id"] },
    sessions[1],
  ]);
  assert.ok(text.includes('\n  "papers":'));
  assert.deepEqual(sessions, before);
});

test("Markdown exports chronological raw sections and unfinished work once without saving or rewriting", () => {
  const session = paper();
  const before = structuredClone(session);
  const text = exportPaperAsMarkdown(session, [
    { id: "p", text: "Question\ncontinued" },
  ]);
  assert.ok(text.includes(math));
  assert.ok(text.indexOf("Older note") < text.indexOf(math));
  assert.ok(text.includes("### Current working section\n\nUnfinished $V$"));
  assert.ok(text.includes("**Unrendered draft**\n\n  Draft $A^\\top P A$\n"));
  assert.ok(text.includes("### Part 1 — 方法"));
  assert.ok(text.includes("#### Quest 1.1 — Study"));
  assert.ok(text.includes("**Part checkpoint:** How?"));
  assert.ok(text.includes("## Parking Lot\n\n- Question continued"));
  assert.equal(text.split(math).length, 2);
  assert.ok(!text.includes("Do not duplicate"));
  assert.ok(!text.includes("OMIT THIS"));
  assert.ok(!text.includes("<span"));
  assert.deepEqual(session, before);
});

test("empty/setup and legacy notes export safely; filenames are portable", () => {
  const session = paper();
  delete session.workspaceState;
  delete session.readingPlan;
  const text = exportPaperAsMarkdown(session);
  assert.ok(text.includes("Do not duplicate"));
  assert.ok(!text.includes("## Parking Lot"));
  assert.ok(!text.includes("Unrendered draft"));
  assert.equal(paperMarkdownFilename(session.title), "论文-Robust-Tubes.md");
  assert.equal(paperMarkdownFilename("CON"), "Paper-CON.md");
  assert.equal(paperMarkdownFilename(" /:*? "), "Untitled-paper.md");
  assert.equal(
    libraryFilename(new Date(2026, 9, 7)),
    "paper-reader-backup-2026-10-07.json",
  );
});

test("download uses UTF-8 Blob, filename, click and delayed URL cleanup", async (t) => {
  let blob: Blob | undefined;
  let clicked = false;
  let removed = false;
  let revoked = false;
  let cleanup: (() => void) | undefined;
  const link = {
    href: "",
    download: "",
    click: () => {
      clicked = true;
    },
    remove: () => {
      removed = true;
    },
  };
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => link,
      body: { append: () => {} },
    },
  });
  t.after(() => {
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
    else delete (globalThis as any).document;
  });
  t.mock.method(URL, "createObjectURL", (value: Blob) => {
    blob = value;
    return "blob:test";
  });
  t.mock.method(URL, "revokeObjectURL", (value: string) => {
    assert.equal(value, "blob:test");
    revoked = true;
  });
  t.mock.method(globalThis, "setTimeout", (fn: () => void) => {
    cleanup = fn;
    return 0;
  });
  downloadTextFile(math, "notes.md", "text/markdown");
  assert.equal(await blob!.text(), math);
  assert.equal(blob!.type, "text/markdown;charset=utf-8");
  assert.equal(link.download, "notes.md");
  assert.ok(clicked && removed);
  assert.equal(revoked, false);
  cleanup!();
  assert.ok(revoked);
});
