import type { Session } from "./types";
import { initialReadingPlanPrompt } from "./prompts/initialReadingPlan.ts";

export function filledPrompt(session: Session): string {
  const { survey } = session;
  const values: Record<string, string> = {
    reading_purpose: survey.reading_purpose,
    background: survey.background,
    primary_reading_goal: survey.primary_reading_goal,
    known_difficulties: survey.difficulties || "None specified",
    reading_depth: survey.depth,
    reading_effort: survey.effort || "Not specified",
  };
  // A single pass keeps placeholder-like text in answers literal.
  return initialReadingPlanPrompt.replace(
    /\{\{(\w+)\}\}/g,
    (placeholder, key: string) =>
      Object.hasOwn(values, key) ? values[key] : placeholder,
  );
}
