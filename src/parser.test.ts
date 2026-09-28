import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePlan } from "./parser.ts";
const valid = {
  quests: [
    { title: "Understand the method", subtasks: ["Read section 2"], notes: "" },
  ],
  notes: "Orientation",
  questions: [],
  sideQuests: [],
};
test("accepts a complete plan and fenced ChatGPT JSON", () => {
  assert.deepEqual(parsePlan(JSON.stringify(valid)), valid);
  assert.deepEqual(
    parsePlan("```json\n" + JSON.stringify(valid) + "\n```"),
    valid,
  );
});
test("rejects malformed JSON and incomplete or incorrectly typed plans", () => {
  for (const input of [
    "no json",
    "null",
    "{}",
    JSON.stringify({ ...valid, quests: [] }),
    JSON.stringify({ ...valid, questions: [5] }),
    JSON.stringify({
      ...valid,
      quests: [{ title: "x", subtasks: [], notes: "" }],
    }),
    JSON.stringify({ ...valid, quests: [null] }),
  ])
    assert.throws(() => parsePlan(input));
});
