import type { InitialReadingPlan, LegacyReadingPlan } from "./readingPlan";
export type Survey = {
  reading_purpose: string;
  background: string;
  primary_reading_goal: string;
  depth: "Overview" | "Working understanding" | "Deep study";
  difficulties: string;
  effort: string;
};
export type Task = { id: string; title: string; done: boolean };
export type Quest = Task & { notes: string; subtasks: Task[] };
export type SavedNote = {
  id: string;
  text: string;
  // Optional for notes saved before metadata was introduced.
  createdAt?: string;
  partId?: string;
  questId?: string;
  partTitle?: string;
  questTitle?: string;
};
export type Session = {
  updatedAt?: string;
  parkingItems?: { id: string; text: string }[];
  workspaceState?: NoteWorkspaceState;
  id: string;
  title: string;
  survey: Survey;
  state: "setup" | "reading";
  stage: "initial" | "followup";
  quests: Quest[];
  notes: string;
  questions: Task[];
  sideQuests: Task[];
  readingPlan?: InitialReadingPlan | LegacyReadingPlan;
  completedQuestIds?: string[];
  savedNotes?: SavedNote[];
};
export type SavedSection = {
  id: string;
  markdown: string;
  createdAt: string | null;
  updatedAt: string | null;
  partId: string | null;
  partTitle: string | null;
  questId: string | null;
  questTitle: string | null;
};
export type NoteWorkspaceState = {
  workingSection: { markdown: string; draft: string };
  savedSections: SavedSection[];
};
export const emptySurvey = (): Survey => ({
  reading_purpose: "",
  background: "",
  primary_reading_goal: "Basic understanding",
  depth: "Working understanding",
  difficulties: "",
  effort: "",
});
export const task = (title: string): Task => ({
  id: crypto.randomUUID(),
  title,
  done: false,
});
