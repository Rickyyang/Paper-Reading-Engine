import type { NoteWorkspaceState, Session } from "./types.ts";

export function appendDraft(markdown: string, draft: string): string {
  if (!draft.trim()) return markdown;
  return markdown ? `${markdown}\n\n${draft}` : draft;
}

// Legacy notes remain intact; once workspaceState exists it is authoritative.
export function noteWorkspace(session: Session): NoteWorkspaceState {
  return (
    session.workspaceState ?? {
      workingSection: { markdown: "", draft: "" },
      savedSections: (session.savedNotes ?? []).map((note) => ({
        id: note.id,
        markdown: note.text,
        createdAt: note.createdAt ?? null,
        updatedAt: null,
        partId: note.partId ?? null,
        partTitle: note.partTitle ?? null,
        questId: note.questId ?? null,
        questTitle: note.questTitle ?? null,
      })),
    }
  );
}

export function isNoteWorkspace(value: any): boolean {
  const date = (v: unknown) =>
    v === null || (typeof v === "string" && Number.isFinite(Date.parse(v)));
  return (
    !!value &&
    !!value.workingSection &&
    typeof value.workingSection.markdown === "string" &&
    typeof value.workingSection.draft === "string" &&
    Array.isArray(value.savedSections) &&
    value.savedSections.every(
      (s: any) =>
        s &&
        typeof s.id === "string" &&
        typeof s.markdown === "string" &&
        date(s.createdAt) &&
        date(s.updatedAt) &&
        ["partId", "partTitle", "questId", "questTitle"].every(
          (key) => s[key] === null || typeof s[key] === "string",
        ),
    )
  );
}
