export type ImportedPlan = {
  quests: { title: string; subtasks: string[]; notes: string }[];
  notes: string;
  questions: string[];
  sideQuests: string[];
};
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((v) => typeof v === "string" && v.trim().length > 0);
export function parsePlan(input: string): ImportedPlan {
  const clean = input
    .trim()
    .replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i, "$1");
  let data: unknown;
  try {
    data = JSON.parse(clean);
  } catch {
    throw new Error(
      "Invalid JSON. Paste the complete JSON object from ChatGPT, without surrounding commentary.",
    );
  }
  if (!object(data) || !Array.isArray(data.quests) || data.quests.length === 0)
    throw new Error("The response must contain a non-empty quests array.");
  data.quests.forEach((q: unknown, index: number) => {
    if (
      !object(q) ||
      typeof q.title !== "string" ||
      !q.title.trim() ||
      !strings(q.subtasks) ||
      !q.subtasks.length ||
      typeof q.notes !== "string"
    )
      throw new Error(
        `Quest ${index + 1} needs a title, a non-empty array of subtask strings, and a notes string.`,
      );
  });
  if (
    typeof data.notes !== "string" ||
    !strings(data.questions) ||
    !strings(data.sideQuests)
  )
    throw new Error(
      "Include a notes string, a questions array of strings, and a sideQuests array of strings. Arrays may be empty.",
    );
  return data as ImportedPlan;
}
