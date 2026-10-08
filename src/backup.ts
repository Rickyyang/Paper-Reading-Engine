import {
  UiError,
  formatMessage,
  type MessageKey,
  type MessageValues,
} from "./translations.ts";
import type { Session } from "./types.ts";
import { isSession, save, type State } from "./storage.ts";
import {
  isLegacyReadingPlan,
  validateInitialReadingPlan,
} from "./readingPlan.ts";

export const BACKUP_VERSION = 1;
export type Backup = {
  format_version: number;
  exported_at: string;
  papers: Session[];
  activeId?: string | null;
};
export function parseBackup(text: string): Backup {
  let value: any;
  try {
    value = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new UiError("invalidBackupJson");
  }
  if (
    !value ||
    typeof value !== "object" ||
    !Object.hasOwn(value, "format_version")
  )
    throw new UiError("missingVersion");
  if (value.format_version !== BACKUP_VERSION)
    throw new UiError("unsupportedVersion");
  if (
    typeof value.exported_at !== "string" ||
    !Number.isFinite(Date.parse(value.exported_at)) ||
    !Array.isArray(value.papers)
  )
    throw new UiError("invalidEnvelope");
  const ids = new Set<string>();
  const papers = value.papers.map((paper: unknown, index: number) => {
    try {
      if (!isSession(paper) || !paper.id.trim() || ids.has(paper.id))
        throw new UiError("invalidSession");
      if (
        paper.readingPlan !== undefined &&
        !isLegacyReadingPlan(paper.readingPlan)
      )
        validateInitialReadingPlan(paper.readingPlan);
      ids.add(paper.id);
      return {
        ...paper,
        survey: { ...paper.survey, effort: paper.survey.effort ?? "" },
        state:
          paper.state ??
          (paper.readingPlan || paper.quests.length ? "reading" : "setup"),
      };
    } catch {
      throw new UiError("invalidPaper", { number: index + 1 });
    }
  });
  return { ...value, papers };
}

function canonical(value: any): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export function planRestore(
  current: State,
  backup: Backup,
  mode: "merge" | "replace",
) {
  const conflicts: string[] = [];
  let added = 0,
    updated = 0;
  const sessions =
    mode === "replace" ? [...backup.papers] : [...current.sessions];
  if (mode === "merge")
    for (const incoming of backup.papers) {
      const index = sessions.findIndex((p) => p.id === incoming.id);
      if (index < 0) {
        sessions.push(incoming);
        added++;
        continue;
      }
      const local = sessions[index];
      if (canonical(local) === canonical(incoming)) continue;
      const a = local.updatedAt ? Date.parse(local.updatedAt) : null;
      const b = incoming.updatedAt ? Date.parse(incoming.updatedAt) : null;
      if (a !== null && b !== null && a > b) continue;
      if (a === null || b === null || a === b)
        conflicts.push(incoming.title || incoming.id);
      sessions[index] = incoming;
      updated++;
    }
  const preferred = mode === "merge" ? current.activeId : backup.activeId;
  const activeId = sessions.some((p) => p.id === preferred)
    ? preferred!
    : (sessions[0]?.id ?? null);
  const summaryKey: MessageKey =
    mode === "replace" ? "restoredCount" : "mergeCounts";
  const summaryValues: MessageValues = {
    count: sessions.length,
    added,
    updated,
    unchanged: current.sessions.length - updated,
  };
  return {
    state: { sessions, activeId },
    conflicts,
    summaryKey,
    summaryValues,
    summary: formatMessage("en", summaryKey, summaryValues),
  };
}

// localStorage.setItem is atomic. Publish React state only after this succeeds;
// failure leaves both the previous stored value and in-memory state intact.
export function persistRestore(next: State) {
  save(next);
  return next;
}

export function updateSession(previous: Session, next: Session): Session {
  if (canonical(previous) === canonical(next)) return previous;
  const previousTime = previous.updatedAt ? Date.parse(previous.updatedAt) : 0;
  return {
    ...next,
    updatedAt: new Date(Math.max(Date.now(), previousTime + 1)).toISOString(),
  };
}
