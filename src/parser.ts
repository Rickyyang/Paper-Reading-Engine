import { UiError } from "./translations.ts";
import {
  IMPORT_START,
  IMPORT_END,
  validateInitialReadingPlan,
  type InitialReadingPlan,
} from "./readingPlan.ts";

export function parsePlan(input: string): InitialReadingPlan {
  const trimmed = input.trim();
  const start = trimmed.indexOf(IMPORT_START);
  const end = trimmed.indexOf(IMPORT_END);
  let json = trimmed;
  if (start >= 0 && end >= 0) {
    if (end < start) throw new UiError("markerOrder");
    if (
      trimmed.indexOf(IMPORT_START, start + IMPORT_START.length) !== -1 ||
      trimmed.indexOf(IMPORT_END, end + IMPORT_END.length) !== -1
    ) {
      throw new UiError("markerCount");
    }
    json = trimmed.slice(start + IMPORT_START.length, end).trim();
  }
  const fence = /^```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```$/i.exec(json);
  if (fence) json = fence[1].trim();
  let plan: unknown;
  try {
    plan = JSON.parse(json);
  } catch {
    throw new UiError("invalidPlanJson");
  }
  validateInitialReadingPlan(plan);
  return plan;
}
