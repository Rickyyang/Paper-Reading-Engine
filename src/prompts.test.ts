import { test } from "node:test";
import assert from "node:assert/strict";
import { filledPrompt } from "./prompts.ts";
import { emptySurvey, type Session } from "./types.ts";
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
