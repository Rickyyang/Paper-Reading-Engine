import type { Session } from "./types";

const templates = {
  initial:
    "Help me read the paper I have uploaded. Build a small, actionable reading plan tailored to my survey and desired depth. Each quest should have concrete subtasks. Identify questions that need investigation. Do not invent details absent from the paper.",
  followup:
    "Help me continue reading the paper I have uploaded. Use my survey and reading context below to propose a small number of additional quests that address unresolved questions and difficulties. Avoid repeating existing quests. Do not invent details absent from the paper.",
};
export function filledPrompt(session: Session): string {
  const { survey } = session;
  return `${templates[session.stage]}

Paper: ${session.title}
Why I am reading: ${survey.purpose}
My background: ${survey.background}
What I want to understand: ${survey.goals}
Desired depth: ${survey.depth}
Known difficulties: ${survey.difficulties || "None specified"}
${
  session.stage === "followup"
    ? `
Current reading context (JSON):
${JSON.stringify({ quests: session.quests, notes: session.notes, unresolvedQuestions: session.questions.filter((q) => !q.done), sideQuests: session.sideQuests }, null, 2)}
`
    : ""
}
Return only a JSON object in exactly this structure. All text fields must be strings. Include at least one quest and at least one subtask for each quest. Do not include completion flags or IDs; the application manages them.
{
  "quests": [
    { "title": "A specific reading objective", "subtasks": ["A concrete reading step"], "notes": "Pointers or relevant sections" }
  ],
  "notes": "Brief orientation for this reading stage",
  "questions": ["An unresolved question to investigate"],
  "sideQuests": ["An optional supporting topic"]
}
The questions and sideQuests arrays may be empty.`;
}
