import { UiError } from "./translations.ts";
export const IMPORT_START = "--- PAPER_READER_IMPORT_START ---";
export const IMPORT_END = "--- PAPER_READER_IMPORT_END ---";

export type ReadingQuest = {
  id: string;
  title: string;
  objective: string;
  read: string[];
  focus_question: string;
  completion_condition: string;
};
export type ReadingPart = {
  id: string;
  title: string;
  objective: string;
  quests: ReadingQuest[];
  checkpoint: { question: string };
};
export type InitialReadingPlan = {
  schema_version: 1;
  record_type: "initial_reading_plan";
  main_objective: string;
  route_summary: string;
  parts: ReadingPart[];
  skim_for_now: string[];
  start_here: {
    part_id: string;
    quest_id: string;
    instruction: string;
    focus_question: string;
    completion_condition: string;
  };
};

// Only for loading previously saved plans. New imports use the current schema.
export type LegacyReadingPlan = {
  schema_version: 1;
  record_type: "initial_reading_plan";
  main_quest: unknown;
  quests: unknown[];
  starting_point: unknown;
  [key: string]: unknown;
};
export function isLegacyReadingPlan(
  value: unknown,
): value is LegacyReadingPlan {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const plan = value as Record<string, unknown>;
  return (
    !("parts" in plan) &&
    plan.schema_version === 1 &&
    plan.record_type === "initial_reading_plan" &&
    plan.main_quest != null &&
    Array.isArray(plan.quests) &&
    plan.starting_point != null
  );
}

function object(
  value: unknown,
  path: string,
  fields: string[],
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new UiError("mustObject", { path });
  const record = value as Record<string, unknown>;
  for (const field of fields)
    if (!Object.hasOwn(record, field))
      throw new UiError("required", { path: `${path}.${field}` });
  for (const field of Object.keys(record))
    if (!fields.includes(field))
      throw new UiError("unknownField", { path: `${path}.${field}` });
  return record;
}
function text(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string") throw new UiError("mustString", { path });
}
function strings(value: unknown, path: string): void {
  if (!Array.isArray(value)) throw new UiError("mustStrings", { path });
  value.forEach((item, index) => text(item, `${path}[${index}]`));
}
export function validateInitialReadingPlan(
  value: unknown,
): asserts value is InitialReadingPlan {
  const plan = object(value, "plan", [
    "schema_version",
    "record_type",
    "main_objective",
    "route_summary",
    "parts",
    "skim_for_now",
    "start_here",
  ]);
  if (plan.schema_version !== 1) throw new UiError("schemaVersion");
  if (plan.record_type !== "initial_reading_plan")
    throw new UiError("recordType");
  text(plan.main_objective, "main_objective");
  text(plan.route_summary, "route_summary");
  strings(plan.skim_for_now, "skim_for_now");
  if (!Array.isArray(plan.parts) || !plan.parts.length)
    throw new UiError("nonemptyArray", { path: "parts" });
  const questParts = new Map<string, string>();
  plan.parts.forEach((item, index) => {
    const path = `parts[${index}]`;
    const part = object(item, path, [
      "id",
      "title",
      "objective",
      "quests",
      "checkpoint",
    ]);
    const partId = `P${index + 1}`;
    if (part.id !== partId)
      throw new UiError("mustId", { path: `${path}.id`, id: partId });
    text(part.title, `${path}.title`);
    text(part.objective, `${path}.objective`);
    const checkpoint = object(part.checkpoint, `${path}.checkpoint`, [
      "question",
    ]);
    text(checkpoint.question, `${path}.checkpoint.question`);
    if (!Array.isArray(part.quests) || !part.quests.length)
      throw new UiError("nonemptyArray", { path: `${path}.quests` });
    part.quests.forEach((item, questIndex) => {
      const questPath = `${path}.quests[${questIndex}]`;
      const quest = object(item, questPath, [
        "id",
        "title",
        "objective",
        "read",
        "focus_question",
        "completion_condition",
      ]);
      const questId = `Q${index + 1}.${questIndex + 1}`;
      if (quest.id !== questId)
        throw new UiError("mustId", { path: `${questPath}.id`, id: questId });
      for (const field of [
        "title",
        "objective",
        "focus_question",
        "completion_condition",
      ])
        text(quest[field], `${questPath}.${field}`);
      strings(quest.read, `${questPath}.read`);
      questParts.set(questId, partId);
    });
  });
  const start = object(plan.start_here, "start_here", [
    "part_id",
    "quest_id",
    "instruction",
    "focus_question",
    "completion_condition",
  ]);
  for (const field of Object.keys(start))
    text(start[field], `start_here.${field}`);
  if (
    !questParts.has(start.quest_id as string) ||
    questParts.get(start.quest_id as string) !== start.part_id
  )
    throw new UiError("startReference");
}
