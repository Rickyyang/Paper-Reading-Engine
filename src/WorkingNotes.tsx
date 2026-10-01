import { useRef, useState } from "react";
import type { NoteWorkspaceState, SavedSection } from "./types";
import { appendDraft } from "./noteSections";
import { MarkdownNote } from "./MarkdownNote";

type Context = { id: string; title: string };
export function WorkingNotes({
  state,
  onChange,
  part,
  quest,
}: {
  state: NoteWorkspaceState;
  onChange: (state: NoteWorkspaceState) => void;
  part?: Context;
  quest?: Context;
}) {
  const { workingSection, savedSections } = state;
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const [sectionEdit, setSectionEdit] = useState<string | null>(null);
  const [savedEdit, setSavedEdit] = useState<{
    id: string;
    markdown: string;
  } | null>(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const newest = [...savedSections]
    .reverse()
    .sort(
      (a, b) =>
        (b.createdAt ? Date.parse(b.createdAt) : 0) -
        (a.createdAt ? Date.parse(a.createdAt) : 0),
    );
  const sorted = sortOrder === "newest" ? newest : [...newest].reverse();
  const [openSections, setOpenSections] = useState<string[]>([]);
  const updateSections = (sections: SavedSection[]) =>
    onChange({ ...state, savedSections: sections });
  return (
    <>
      <section className="panel understanding-panel">
        <h2>My understanding</h2>
        <p className="muted small">
          Keep writing one section. Your working section and draft are saved
          locally.
        </p>
        <div className="current-section-heading">
          <div className="eyebrow">Current section</div>
          {workingSection.markdown.trim() && sectionEdit === null && (
            <button
              type="button"
              className="quiet"
              onClick={() => setSectionEdit(workingSection.markdown)}
            >
              Edit current section
            </button>
          )}
        </div>
        {sectionEdit !== null ? (
          <div>
            <label htmlFor="current-section-edit">Edit current section</label>
            <textarea
              id="current-section-edit"
              rows={12}
              value={sectionEdit}
              onChange={(e) => setSectionEdit(e.target.value)}
            />
            <div className="note-actions">
              <button
                type="button"
                onClick={() => {
                  onChange({
                    ...state,
                    workingSection: {
                      ...workingSection,
                      markdown: sectionEdit,
                    },
                  });
                  setSectionEdit(null);
                }}
              >
                Save edit
              </button>
              <button
                type="button"
                className="quiet"
                onClick={() => setSectionEdit(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="working-section"
            role="region"
            aria-label="Current working section"
          >
            {workingSection.markdown ? (
              <MarkdownNote text={workingSection.markdown} />
            ) : (
              <p className="muted">Your current section will appear here.</p>
            )}
          </div>
        )}
        <label htmlFor="section-draft">Write next:</label>
        <textarea
          ref={draftRef}
          id="section-draft"
          rows={8}
          value={workingSection.draft}
          onChange={(e) =>
            onChange({
              ...state,
              workingSection: { ...workingSection, draft: e.target.value },
            })
          }
        />
        <div className="note-actions working-actions">
          <button
            type="button"
            disabled={sectionEdit !== null || !workingSection.draft.trim()}
            onClick={() => {
              if (!workingSection.draft.trim()) return;
              onChange({
                ...state,
                workingSection: {
                  markdown: appendDraft(
                    workingSection.markdown,
                    workingSection.draft,
                  ),
                  draft: "",
                },
              });
              draftRef.current?.focus();
            }}
          >
            Render &amp; continue
          </button>

          <button
            type="button"
            disabled={
              sectionEdit !== null ||
              !(workingSection.markdown.trim() || workingSection.draft.trim())
            }
            onClick={() => {
              const markdown = appendDraft(
                workingSection.markdown,
                workingSection.draft,
              );
              if (!markdown.trim()) return;
              const section: SavedSection = {
                id: crypto.randomUUID(),
                markdown,
                createdAt: new Date().toISOString(),
                updatedAt: null,
                partId: part?.id ?? null,
                partTitle: part?.title ?? null,
                questId: quest?.id ?? null,
                questTitle: quest?.title ?? null,
              };
              onChange({
                workingSection: { markdown: "", draft: "" },
                savedSections: [...savedSections, section],
              });
              setOpenSections([]);
              draftRef.current?.focus();
            }}
          >
            Save section
          </button>
        </div>
      </section>
      <section
        className="panel saved-sections"
        aria-labelledby="saved-sections-title"
      >
        <div className="saved-sections-heading">
          <h2 id="saved-sections-title">Saved Sections</h2>
          <div className="section-sort">
            <select
              aria-label="Sort sections"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
        {sorted.length ? (
          sorted.map((section) => (
            <div className="saved-section" key={section.id}>
              <button
                type="button"
                className="section-disclosure quiet"
                aria-expanded={openSections.includes(section.id)}
                aria-controls={`section-${section.id}`}
                onClick={() =>
                  setOpenSections((ids) =>
                    ids.includes(section.id)
                      ? ids.filter((id) => id !== section.id)
                      : [...ids, section.id],
                  )
                }
              >
                <span>
                  {openSections.includes(section.id) ? "▾" : "▸"} Section{" "}
                  {newest.length -
                    newest.findIndex((item) => item.id === section.id)}
                </span>
                <span className="small">
                  {section.createdAt
                    ? new Date(section.createdAt).toLocaleString()
                    : "Saved time unavailable"}
                </span>
              </button>
              <div
                id={`section-${section.id}`}
                hidden={!openSections.includes(section.id)}
              >
                {savedEdit?.id === section.id ? (
                  <>
                    <label htmlFor={`edit-${section.id}`}>
                      Edit saved section
                    </label>
                    <textarea
                      id={`edit-${section.id}`}
                      rows={10}
                      value={savedEdit.markdown}
                      onChange={(e) =>
                        setSavedEdit({
                          id: section.id,
                          markdown: e.target.value,
                        })
                      }
                    />
                    <div className="note-actions">
                      <button
                        type="button"
                        disabled={!savedEdit.markdown.trim()}
                        onClick={() => {
                          if (!savedEdit.markdown.trim()) return;
                          updateSections(
                            savedSections.map((item) =>
                              item.id === section.id
                                ? {
                                    ...item,
                                    markdown: savedEdit.markdown,
                                    updatedAt: new Date().toISOString(),
                                  }
                                : item,
                            ),
                          );
                          setSavedEdit(null);
                        }}
                      >
                        Save changes
                      </button>
                      <button
                        type="button"
                        className="quiet"
                        onClick={() => setSavedEdit(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <MarkdownNote text={section.markdown} />
                    <div className="note-actions">
                      <button
                        type="button"
                        className="quiet"
                        onClick={() =>
                          setSavedEdit({
                            id: section.id,
                            markdown: section.markdown,
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="quiet"
                        onClick={() => {
                          if (
                            window.confirm("Permanently delete this section?")
                          )
                            updateSections(
                              savedSections.filter(
                                (item) => item.id !== section.id,
                              ),
                            );
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="muted">No saved sections yet.</p>
        )}
      </section>
    </>
  );
}
