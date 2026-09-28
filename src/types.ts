export type Survey = {
  purpose: string;
  background: string;
  goals: string;
  depth: "Overview" | "Working understanding" | "Deep study";
  difficulties: string;
};
export type Task = { id: string; title: string; done: boolean };
export type Quest = Task & { notes: string; subtasks: Task[] };
export type Session = {
  id: string;
  title: string;
  survey: Survey;
  stage: "initial" | "followup";
  quests: Quest[];
  notes: string;
  questions: Task[];
  sideQuests: Task[];
};
export const emptySurvey = (): Survey => ({
  purpose: "",
  background: "",
  goals: "",
  depth: "Working understanding",
  difficulties: "",
});
export const task = (title: string): Task => ({
  id: crypto.randomUUID(),
  title,
  done: false,
});
