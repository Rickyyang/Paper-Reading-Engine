export { initialReadingPlanPrompt } from "./initialReadingPlan.en.ts";
import { initialReadingPlanPrompt } from "./initialReadingPlan.en.ts";

export type InitialReadingSurvey = {
  reading_purpose: string;
  background: string;
  primary_reading_goal: string;
  known_difficulties: string;
  reading_depth: string;
  reading_effort: string;
};

const PLACEHOLDER_PATTERN = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

export function fillInitialReadingPlanPrompt(
  survey: InitialReadingSurvey,
): string {
  return initialReadingPlanPrompt.replace(
    PLACEHOLDER_PATTERN,
    (_match, key: keyof InitialReadingSurvey) => survey[key] ?? "",
  );
}
