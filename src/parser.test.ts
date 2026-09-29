import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePlan } from "./parser.ts";
import { IMPORT_START, IMPORT_END } from "./readingPlan.ts";
const valid = {
  schema_version: 1,
  record_type: "initial_reading_plan",
  main_objective: "Understand the method",
  route_summary: "Problem, method, results",
  parts: [
    {
      id: "P1",
      title: "The method",
      objective: "Identify the core method",
      quests: [
        {
          id: "Q1.1",
          title: "Read the method",
          objective: "Identify its steps",
          read: ["Section 2"],
          focus_question: "What are the steps?",
          completion_condition: "List the steps",
        },
      ],
      checkpoint: { question: "How do the steps connect?" },
    },
  ],
  skim_for_now: [],
  start_here: {
    part_id: "P1",
    quest_id: "Q1.1",
    instruction: "Read section 2",
    focus_question: "What are the steps?",
    completion_condition: "List the steps",
  },
};
const wrap = (json: string) =>
  `Explanation with unrelated JSON {"ignore":true}\n${IMPORT_START}\n${json}\n${IMPORT_END}\nMore prose.`;
test("extracts only the marked block and preserves the complete object", () => {
  assert.deepEqual(parsePlan(wrap(JSON.stringify(valid))), valid);
  assert.deepEqual(
    parsePlan(wrap("```json\r\n" + JSON.stringify(valid) + "\r\n```")),
    valid,
  );
  assert.deepEqual(
    parsePlan(wrap("```\n" + JSON.stringify(valid) + "\n```")),
    valid,
  );
});
test("accepts raw JSON and either Markdown fence without markers", () => {
  const json = JSON.stringify(valid, null, 2);
  for (const input of [
    json,
    "```json\n" + json + "\n```",
    "```\r\n" + json + "\r\n```",
  ])
    assert.deepEqual(parsePlan(" \r\n" + input + "\n\t "), valid);
});
test("rejects unmarked prose and incomplete markers without fuzzy parsing", () => {
  for (const input of [
    "",
    "Here is the plan:\n" + JSON.stringify(valid),
    JSON.stringify(valid) + "\nExplanation",
    "```json\n" + JSON.stringify(valid) + "\n```\nExplanation",
    IMPORT_START,
    IMPORT_END,
    IMPORT_START + "\n" + JSON.stringify(valid),
    JSON.stringify(valid) + "\n" + IMPORT_END,
  ])
    assert.throws(() => parsePlan(input), /Invalid JSON/);
});
test("rejects reversed and duplicate markers", () => {
  for (const input of [
    `${IMPORT_END}${IMPORT_START}`,
    wrap(JSON.stringify(valid)) + IMPORT_START,
    wrap(JSON.stringify(valid)) + IMPORT_END,
  ])
    assert.throws(() => parsePlan(input), /marker|block/);
});
test("rejects malformed JSON and every required schema violation", () => {
  for (const json of [
    "not json",
    '{"quests": [],}',
    "null",
    "[]",
    "{}",
    JSON.stringify({ ...valid, schema_version: "1" }),
    JSON.stringify({ ...valid, record_type: "other" }),
    JSON.stringify({ ...valid, main_objective: undefined }),
    JSON.stringify({ ...valid, main_objective: null }),
    JSON.stringify({ ...valid, parts: {} }),
    JSON.stringify({ ...valid, parts: [] }),
    JSON.stringify({ ...valid, start_here: undefined }),
    JSON.stringify({ ...valid, start_here: null }),
    JSON.stringify({ ...valid, extra: true }),
  ]) {
    assert.throws(() => parsePlan(wrap(json)));
    assert.throws(() => parsePlan(json));
    assert.throws(() => parsePlan("```json\n" + json + "\n```"));
  }
});

test("validates nested quests, checkpoints, IDs, and starting references with clear paths", () => {
  const cases: [(plan: any) => void, RegExp][] = [
    [
      (p) => {
        delete p.parts[0].quests[0].objective;
      },
      /quests\[0\].objective/,
    ],
    [
      (p) => {
        p.parts[0].quests[0].read = [4];
      },
      /read\[0\]/,
    ],
    [
      (p) => {
        p.parts[0].quests[0].focus_question = false;
      },
      /focus_question/,
    ],
    [
      (p) => {
        p.parts[0].quests = [];
      },
      /quests/,
    ],
    [
      (p) => {
        p.parts[0].checkpoint = {};
      },
      /checkpoint.question/,
    ],
    [
      (p) => {
        p.parts[0].id = "P2";
      },
      /id must be "P1"/,
    ],
    [
      (p) => {
        p.parts[0].quests[0].id = "Q2.1";
      },
      /id must be "Q1.1"/,
    ],
    [
      (p) => {
        p.start_here.quest_id = "Q1.9";
      },
      /existing quest/,
    ],
    [
      (p) => {
        p.start_here.part_id = "P9";
      },
      /existing quest/,
    ],
    [
      (p) => {
        p.skim_for_now = [null];
      },
      /skim_for_now/,
    ],
    [
      (p) => {
        p.parts[0].quests[0].extra = "unexpected";
      },
      /extra/,
    ],
  ];
  for (const [mutate, error] of cases) {
    const plan = structuredClone(valid);
    mutate(plan);
    assert.throws(() => parsePlan(JSON.stringify(plan)), error);
  }
});
