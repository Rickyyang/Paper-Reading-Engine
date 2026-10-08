import type { Session } from "./types.ts";
import { BACKUP_VERSION } from "./backup.ts";
import { noteWorkspace } from "./noteSections.ts";
import { isLegacyReadingPlan } from "./readingPlan.ts";

export type ParkingItem = { id: string; text: string };

export function exportLibraryAsJson(
  sessions: readonly Session[],
  activeId: string | null,
  parking: Record<string, ParkingItem[]> = {},
  now = new Date(),
) {
  return JSON.stringify(
    {
      format_version: BACKUP_VERSION,
      exported_at: now.toISOString(),
      activeId,
      papers: sessions.map((session) =>
        parking[session.id]?.length
          ? { ...session, parkingItems: parking[session.id] }
          : session,
      ),
    },
    null,
    2,
  );
}

// Only plain-text metadata is escaped. Note Markdown is appended verbatim.
const plain = (text: string) =>
  text.replace(/([\\`*_{}\[\]<>#!|])/g, "\\$1").replace(/\r?\n/g, " ");

export function exportPaperAsMarkdown(
  session: Session,
  parking: readonly ParkingItem[] = [],
) {
  const blocks = [
    `# ${plain(session.title || "Untitled paper")}`,
    "## Reading setup",
  ];
  const fields = [
    ["Reading purpose", session.survey.reading_purpose],
    ["Primary reading goal", session.survey.primary_reading_goal],
    ["Desired reading depth", session.survey.depth],
    ["Available reading effort", session.survey.effort],
    ["Background", session.survey.background],
    ["Difficulties", session.survey.difficulties],
  ];
  for (const [label, value] of fields)
    if (value?.trim()) blocks.push(`**${label}:** ${plain(value)}`);
  const plan = session.readingPlan;
  if (plan && !isLegacyReadingPlan(plan)) {
    blocks.push(
      "## Reading plan",
      `**Main objective:** ${plain(plan.main_objective)}`,
    );
    if (plan.route_summary.trim()) blocks.push(plain(plan.route_summary));
    for (const part of plan.parts) {
      blocks.push(
        `### Part ${part.id.slice(1)} — ${plain(part.title)}`,
        plain(part.objective),
      );
      for (const quest of part.quests) {
        blocks.push(
          `#### Quest ${quest.id.slice(1)} — ${plain(quest.title)}`,
          `**Objective:** ${plain(quest.objective)}`,
          `**Read:** ${quest.read.map(plain).join("; ")}`,
          `**Focus question:** ${plain(quest.focus_question)}`,
          `**Done when:** ${plain(quest.completion_condition)}`,
        );
      }
      if (part.checkpoint.question.trim())
        blocks.push(`**Part checkpoint:** ${plain(part.checkpoint.question)}`);
    }
  } else if (plan) {
    blocks.push(
      "## Reading plan",
      "This paper uses an older reading-plan format. The original plan is preserved in the JSON library backup.",
    );
  }
  blocks.push("## Reading notes");
  const workspace = noteWorkspace(session);
  const sections = [...workspace.savedSections].sort(
    (a, b) =>
      (a.createdAt ? Date.parse(a.createdAt) : 0) -
      (b.createdAt ? Date.parse(b.createdAt) : 0),
  );
  sections.forEach((section, index) =>
    blocks.push(`### Note Section ${index + 1}`, section.markdown),
  );
  if (workspace.workingSection.markdown.trim())
    blocks.push(
      "### Current working section",
      workspace.workingSection.markdown,
    );
  if (workspace.workingSection.draft.trim())
    blocks.push("**Unrendered draft**", workspace.workingSection.draft);
  if (parking.length)
    blocks.push(
      "## Parking Lot",
      parking.map((item) => `- ${plain(item.text)}`).join("\n"),
    );
  return blocks.join("\n\n") + "\n";
}

export function exportSessionAsJson(session: Session) {
  return exportLibraryAsJson([session], session.id);
}

function paperFilenameBase(title: string) {
  let name = title
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 150)
    .replace(/[. -]+$/, "");
  if (!name) name = "Untitled-paper";
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name))
    name = `Paper-${name}`;
  return name;
}

export function paperMarkdownFilename(title: string) {
  return `${paperFilenameBase(title)}.md`;
}

export function sessionJsonFilename(title: string) {
  return `${paperFilenameBase(title)}-session.json`;
}

export function libraryFilename(now = new Date()) {
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return `paper-reader-backup-${date}.json`;
}

export function downloadTextFile(text: string, filename: string, mime: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: `${mime};charset=utf-8` }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
