import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseBackup,
  planRestore,
  persistRestore,
  updateSession,
} from "./backup.ts";
import { exportLibraryAsJson } from "./exports.ts";
import { emptySurvey, type Session } from "./types.ts";
import { load, save } from "./storage.ts";

const paper = (id = "a", updatedAt?: string): Session => ({
  id,
  updatedAt,
  title: "论文",
  survey: emptySurvey(),
  state: "setup",
  stage: "initial",
  quests: [],
  notes: "",
  questions: [],
  sideQuests: [],
  parkingItems: [{ id: "p", text: "Why?" }],
  workspaceState: {
    workingSection: {
      markdown: "$x_k$",
      draft: "$$\ne_k \\in \\mathcal{E}(V,\\beta_k^2)\n$$",
    },
    savedSections: [],
  },
});
const backup = (papers: Session[]) =>
  parseBackup(exportLibraryAsJson(papers, papers[0]?.id ?? null));

test("backup validates before mutation and preserves raw notes, optional data and old backups", () => {
  const p = paper();
  delete p.updatedAt;
  const result = backup([p]);
  assert.deepEqual(result.papers[0], p);
  for (const [text, message] of [
    ["{", /Invalid JSON/],
    ["{}", /format_version is missing/],
    ['{"format_version":2}', /Unsupported backup version/],
    ['{"format_version":1,"papers":[]}', /exported_at/],
    [
      JSON.stringify({
        format_version: 1,
        exported_at: new Date().toISOString(),
        papers: [{}],
      }),
      /Invalid paper\/session data/,
    ],
  ] as const)
    assert.throws(() => parseBackup(text), message);
  assert.throws(() => backup([p, p]), /Invalid paper/);
  assert.throws(() => backup([{ ...p, updatedAt: "bad" }]), /Invalid paper/);
  assert.throws(
    () => backup([{ ...p, readingPlan: {} as any }]),
    /Invalid paper/,
  );
  assert.throws(
    () => backup([{ ...p, parkingItems: [{ id: "a", text: 2 } as any] }]),
    /Invalid paper/,
  );
});

test("merge deduplicates, keeps newer, flags ties/missing dates, and does not mutate", () => {
  const old = "2026-10-01T00:00:00Z",
    fresh = "2026-10-07T00:00:00Z";
  const current = {
    sessions: [paper("a", old), paper("b", fresh), paper("c"), paper("d", old)],
    activeId: "b",
  };
  const before = structuredClone(current);
  const imported = backup([
    { ...paper("a", fresh), title: "new" },
    { ...paper("b", old), title: "old" },
    { ...paper("c"), title: "conflict" },
    { ...paper("d", old), title: "tie" },
    paper("e"),
  ]);
  const result = planRestore(current, imported, "merge");
  assert.equal(result.state.sessions.length, 5);
  assert.equal(result.state.sessions[0].title, "new");
  assert.equal(result.state.sessions[1].title, "论文");
  assert.deepEqual(result.conflicts, ["conflict", "tie"]);
  assert.equal(
    result.summary,
    "1 papers added · 3 papers updated · 1 local papers unchanged",
  );
  assert.equal(result.state.activeId, "b");
  assert.deepEqual(current, before);
  assert.equal(
    planRestore(current, backup(current.sessions), "merge").conflicts.length,
    0,
  );
  const replaced = planRestore(current, backup([paper("z")]), "replace");
  assert.deepEqual(
    replaced.state.sessions,
    JSON.parse(JSON.stringify([paper("z")])),
  );
  assert.equal(replaced.state.activeId, "z");
});

test("restore is atomic on storage failure and reload preserves unfinished work and parking", () => {
  let raw: string | null = null;
  let fail = false;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => raw,
      setItem: (_key: string, value: string) => {
        if (fail) throw new Error("quota");
        raw = value;
      },
    },
  });
  const current = { sessions: [paper()], activeId: "a" };
  save(current);
  const before = raw;
  const next = planRestore(current, backup([paper("b")]), "replace").state;
  fail = true;
  assert.throws(() => persistRestore(next), /quota/);
  assert.equal(raw, before);
  assert.equal(current.sessions[0].id, "a");
  fail = false;
  persistRestore(next);
  assert.deepEqual(load(), next);
});

test("content changes advance session timestamp, no-op updates preserve it", () => {
  const p = paper("a", "2099-01-01T00:00:00.000Z");
  assert.equal(updateSession(p, { ...p }), p);
  const next = updateSession(p, { ...p, title: "Changed" });
  assert.ok(Date.parse(next.updatedAt!) > Date.parse(p.updatedAt!));
  assert.equal(next.id, p.id);
});
