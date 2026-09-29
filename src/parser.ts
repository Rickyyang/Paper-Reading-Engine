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
    if (end < start)
      throw new Error(
        "The import end marker must appear after the start marker.",
      );
    if (
      trimmed.indexOf(IMPORT_START, start + IMPORT_START.length) !== -1 ||
      trimmed.indexOf(IMPORT_END, end + IMPORT_END.length) !== -1
    ) {
      throw new Error(
        "Expected exactly one import block. Paste a response with one start marker and one end marker.",
      );
    }
    json = trimmed.slice(start + IMPORT_START.length, end).trim();
  }
  const fence = /^```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```$/i.exec(json);
  if (fence) json = fence[1].trim();
  let plan: unknown;
  try {
    plan = JSON.parse(json);
  } catch {
    throw new Error(
      "Invalid JSON. Paste raw JSON or a Markdown JSON code block. If including explanatory text, surround the JSON with both import markers.",
    );
  }
  validateInitialReadingPlan(plan);
  return plan;
}
