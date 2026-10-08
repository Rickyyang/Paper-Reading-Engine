import type { Session } from "./types";
import { initialReadingPlanPrompt as englishPrompt } from "./prompts/initialReadingPlan.en.ts";
import { initialReadingPlanPrompt as chinesePrompt } from "./prompts/initialReadingPlan.zhCN.ts";

export type PromptLanguage = "en" | "zh-CN";

export function filledPrompt(
  session: Session,
  language: PromptLanguage = "en",
): string {
  const { survey } = session;
  const values: Record<string, string> = {
    reading_purpose: survey.reading_purpose,
    background: survey.background,
    primary_reading_goal: survey.primary_reading_goal,
    known_difficulties:
      survey.difficulties ||
      (language === "zh-CN" ? "未指定" : "None specified"),
    reading_depth: survey.depth,
    reading_effort:
      survey.effort || (language === "zh-CN" ? "未指定" : "Not specified"),
  };
  // A single pass keeps placeholder-like text in answers literal.
  const template = language === "zh-CN" ? chinesePrompt : englishPrompt;
  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, key: string) =>
    Object.hasOwn(values, key) ? values[key] : placeholder,
  );
}
