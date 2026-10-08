import { test } from "node:test";
import assert from "node:assert/strict";
import {
  translations,
  formatMessage,
  localizeFeedback,
  UiError,
  type MessageKey,
} from "./translations.ts";
import { parsePlan } from "./parser.ts";
import { parseBackup, planRestore } from "./backup.ts";
import { emptySurvey } from "./types.ts";

test("both UI dictionaries contain the same nonempty messages and interpolation parameters", () => {
  assert.deepEqual(
    Object.keys(translations.en).sort(),
    Object.keys(translations["zh-CN"]).sort(),
  );
  const params = (s: string) =>
    [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const key of Object.keys(translations.en) as MessageKey[]) {
    assert.ok(translations["zh-CN"][key].trim(), key);
    assert.deepEqual(
      params(translations.en[key]),
      params(translations["zh-CN"][key]),
      key,
    );
  }
});

test("localized messages preserve user text and schema paths without recursive substitution", () => {
  const title = "English $& {title} \\alpha 中文";
  assert.equal(
    formatMessage("zh-CN", "deleteTitle", { title }),
    `删除“${title}”？`,
  );
  const error = new UiError("mustId", {
    path: "parts[0].quests[0].id",
    id: "Q1.1",
  });
  assert.equal(error.message, 'parts[0].quests[0].id must be "Q1.1".');
  assert.equal(
    localizeFeedback(error, "zh-CN"),
    'parts[0].quests[0].id 必须为 "Q1.1"。',
  );
  assert.equal(localizeFeedback(error, "en"), error.message);
});

test("parser and backup failures retain structured localization after language switching", () => {
  for (const [parse, input, key] of [
    [parsePlan, "not JSON", "invalidPlanJson"],
    [parsePlan, "{}", "required"],
    [parseBackup, "{}", "missingVersion"],
  ] as const) {
    assert.throws(
      () => parse(input),
      (error) => {
        assert.ok(error instanceof UiError);
        assert.equal(error.key, key);
        assert.notEqual(localizeFeedback(error, "zh-CN"), error.message);
        assert.equal(localizeFeedback(error, "en"), error.message);
        return true;
      },
    );
  }
});

test("restore counts localize without changing restore data; new goals use the selected language", () => {
  const state = { sessions: [], activeId: null };
  const result = planRestore(
    state,
    { format_version: 1, exported_at: new Date().toISOString(), papers: [] },
    "merge",
  );
  assert.equal(
    formatMessage("zh-CN", result.summaryKey, result.summaryValues),
    "新增 0 篇论文 · 更新 0 篇论文 · 0 篇本地论文保持不变",
  );
  assert.deepEqual(result.state, state);
  assert.equal(
    emptySurvey(translations["zh-CN"].basicUnderstanding).primary_reading_goal,
    "基本理解",
  );
  assert.equal(emptySurvey().primary_reading_goal, "Basic understanding");
  assert.equal(
    emptySurvey(translations["zh-CN"].basicUnderstanding).depth,
    "Working understanding",
  );
});
