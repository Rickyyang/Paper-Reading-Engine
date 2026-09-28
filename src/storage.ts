import type { Session } from "./types";
const KEY = "paper-reading-companion:v0";
type State = { sessions: Session[]; activeId: string | null };
const isTask = (t: any): boolean =>
  t &&
  typeof t.id === "string" &&
  typeof t.title === "string" &&
  typeof t.done === "boolean";
function isSession(s: any): boolean {
  return (
    s &&
    typeof s.id === "string" &&
    typeof s.title === "string" &&
    ["initial", "followup"].includes(s.stage) &&
    typeof s.notes === "string" &&
    s.survey &&
    ["purpose", "background", "goals", "difficulties"].every(
      (k) => typeof s.survey[k] === "string",
    ) &&
    ["Overview", "Working understanding", "Deep study"].includes(
      s.survey.depth,
    ) &&
    Array.isArray(s.quests) &&
    s.quests.every(
      (q: any) =>
        isTask(q) &&
        typeof q.notes === "string" &&
        Array.isArray(q.subtasks) &&
        q.subtasks.every(isTask),
    ) &&
    Array.isArray(s.questions) &&
    s.questions.every(isTask) &&
    Array.isArray(s.sideQuests) &&
    s.sideQuests.every(isTask)
  );
}
export function load(): State {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { sessions: [], activeId: null };
  const data = JSON.parse(raw);
  if (
    data.version !== 1 ||
    !Array.isArray(data.sessions) ||
    !data.sessions.every(isSession) ||
    !(data.activeId === null || typeof data.activeId === "string")
  )
    throw new Error(
      "Saved data could not be read. It has not been overwritten.",
    );
  return { sessions: data.sessions, activeId: data.activeId };
}
export function save(state: State): void {
  localStorage.setItem(KEY, JSON.stringify({ version: 1, ...state }));
}
