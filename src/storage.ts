import type { Session } from "./types";
import { isNoteWorkspace } from "./noteSections.ts";
import {
  isLegacyReadingPlan,
  validateInitialReadingPlan,
} from "./readingPlan.ts";
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
    (s.workspaceState === undefined || isNoteWorkspace(s.workspaceState)) &&
    (s.savedNotes === undefined ||
      (Array.isArray(s.savedNotes) &&
        s.savedNotes.every(
          (note: any) =>
            note &&
            typeof note.id === "string" &&
            typeof note.text === "string" &&
            ["partId", "questId", "partTitle", "questTitle"].every(
              (key) => note[key] === undefined || typeof note[key] === "string",
            ) &&
            (note.createdAt === undefined ||
              (typeof note.createdAt === "string" &&
                Number.isFinite(Date.parse(note.createdAt)))),
        ))) &&
    (s.completedQuestIds === undefined ||
      (Array.isArray(s.completedQuestIds) &&
        s.completedQuestIds.every((id: unknown) => typeof id === "string"))) &&
    (s.state === undefined || ["setup", "reading"].includes(s.state)) &&
    ["initial", "followup"].includes(s.stage) &&
    typeof s.notes === "string" &&
    s.survey &&
    (s.survey.effort === undefined || typeof s.survey.effort === "string") &&
    [
      "reading_purpose",
      "background",
      "primary_reading_goal",
      "difficulties",
    ].every((k) => typeof s.survey[k] === "string") &&
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
  // Rename legacy survey fields before validation, preserving existing answers.
  if (Array.isArray(data?.sessions)) {
    data.sessions = data.sessions.map((session: any) => {
      if (!session?.survey || typeof session.survey !== "object")
        return session;
      const { purpose, goals, reading_goal, target_understanding, ...survey } =
        session.survey;
      return {
        ...session,
        survey: {
          ...survey,
          reading_purpose:
            survey.reading_purpose ?? purpose ?? reading_goal ?? "",
          primary_reading_goal:
            survey.primary_reading_goal ??
            goals ??
            target_understanding ??
            "Basic understanding",
        },
      };
    });
  }
  if (
    data?.version !== 1 ||
    !Array.isArray(data.sessions) ||
    !data.sessions.every(isSession) ||
    !(data.activeId === null || typeof data.activeId === "string")
  )
    throw new Error(
      "Saved data could not be read. It has not been overwritten.",
    );
  return {
    sessions: data.sessions.map((session: Session) => {
      if (
        session.readingPlan !== undefined &&
        !isLegacyReadingPlan(session.readingPlan)
      )
        validateInitialReadingPlan(session.readingPlan);
      return {
        ...session,
        survey: { ...session.survey, effort: session.survey.effort ?? "" },
        // Sessions saved before setup/reading states existed keep their data.
        state:
          session.state ??
          (session.readingPlan || session.quests.length ? "reading" : "setup"),
      };
    }),
    activeId: data.activeId,
  };
}
export function save(state: State): void {
  localStorage.setItem(KEY, JSON.stringify({ version: 1, ...state }));
}
