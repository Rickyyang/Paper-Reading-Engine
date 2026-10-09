import { test } from "node:test";
import assert from "node:assert/strict";
import { filledPrompt } from "./prompts.ts";
import { emptySurvey, type Session } from "./types.ts";
import { initialReadingPlanPrompt as english } from "./prompts/initialReadingPlan.en.ts";
import { initialReadingPlanPrompt as chinese } from "./prompts/initialReadingPlan.zhCN.ts";
import { parsePlan } from "./parser.ts";
test("fills all six survey values once without interpreting replacement characters", () => {
  const session = {
    survey: {
      ...emptySurvey(),
      reading_purpose: "Literal {{background}} $&",
      background: "My background",
      primary_reading_goal: "My goal",
      difficulties: "Notation",
      depth: "Deep study",
      effort: "Two hours",
    },
  } as Session;
  const prompt = filledPrompt(session);
  for (const value of Object.values(session.survey))
    assert.ok(prompt.includes(value));
  assert.match(prompt, /Reading purpose[^\n]*\nLiteral \{\{background\}\} \$&/);
  assert.equal(prompt, filledPrompt(session));
});

test("new surveys default to a replaceable primary reading goal", () => {
  assert.equal(emptySurvey().primary_reading_goal, "Basic understanding");
  assert.equal(emptySurvey().reading_purpose, "");
});

test("both prompts show correctly escaped inline and display LaTeX JSON examples", () => {
  const math = String.raw`e_k \in \mathcal{E}(V,\beta_k^2)`;
  for (const template of [english, chinese]) {
    assert.ok(template.includes(String.raw`$\Theta_t$`));
    assert.ok(template.includes(String.raw`$\mathcal{E}(V,\beta_k^2)$`));
    assert.ok(template.includes(`$$\n${math}\n$$`));
    // The first fenced block illustrates escaping; the marked block remains
    // the unchanged schema, checked by the schema-parity test below.
    const example = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(template)![1]);
    assert.ok(example.focus_question.includes(String.raw`$\Theta_t$`));
    assert.ok(
      example.objective.includes(String.raw`$\mathcal{E}(V,\beta_k^2)$`),
    );
    assert.ok(example.completion_condition.includes(`$$\n${math}\n$$`));
    assert.ok(!/[\u0000-\u0009\u000b-\u001f]/.test(example.objective));
  }
  assert.ok(!english.includes("Do not put Markdown inside JSON string values"));
  assert.ok(!chinese.includes("JSON 字符串值内不要使用 Markdown"));
});

test("both predefined templates have identical placeholders and import schema", () => {
  const placeholders = (template: string) =>
    [...template.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();
  assert.deepEqual(
    placeholders(english),
    [
      "reading_purpose",
      "primary_reading_goal",
      "background",
      "known_difficulties",
      "reading_depth",
      "reading_effort",
    ].sort(),
  );
  assert.deepEqual(placeholders(chinese), placeholders(english));
  assert.deepEqual(parsePlan(chinese), parsePlan(english));
  assert.match(english, /Respond in English/);
  assert.match(chinese, /请用简体中文回答/);
});

test("switching prompt languages is deterministic and does not mutate survey values", () => {
  const session = {
    survey: {
      ...emptySurvey(),
      reading_purpose: "Literal {{background}} $&",
      background: "数学 / Mathematics",
      primary_reading_goal: "Basic understanding",
      difficulties: "Symbols",
      effort: "2 hours",
    },
  } as Session;
  const original = structuredClone(session);
  const en = filledPrompt(session, "en");
  const zh = filledPrompt(session, "zh-CN");
  assert.notEqual(en, zh);
  for (const text of Object.values(session.survey)) {
    assert.ok(en.includes(text));
    assert.ok(zh.includes(text));
  }
  assert.deepEqual(session, original);
  assert.equal(filledPrompt(session, "en"), en);
  assert.equal(filledPrompt(session, "zh-CN"), zh);
});
