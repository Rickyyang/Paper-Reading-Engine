import { useState } from "react";
import { task, type Session, type Task } from "./types";
function EditableList({
  title,
  items,
  onChange,
}: {
  title: string;
  items: Task[];
  onChange: (items: Task[]) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <section className="panel">
      <h2>{title}</h2>
      {items.map((item) => (
        <div className="task-row" key={item.id}>
          <input
            type="checkbox"
            aria-label={`Complete ${item.title}`}
            checked={item.done}
            onChange={(e) =>
              onChange(
                items.map((t) =>
                  t.id === item.id ? { ...t, done: e.target.checked } : t,
                ),
              )
            }
          />
          <input
            aria-label={`${title} text`}
            className={item.done ? "completed" : ""}
            value={item.title}
            onChange={(e) =>
              onChange(
                items.map((t) =>
                  t.id === item.id ? { ...t, title: e.target.value } : t,
                ),
              )
            }
          />
          <button
            className="quiet"
            aria-label={`Remove ${item.title}`}
            onClick={() => onChange(items.filter((t) => t.id !== item.id))}
          >
            Remove
          </button>
        </div>
      ))}
      <form
        className="task-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) {
            onChange([...items, task(draft.trim())]);
            setDraft("");
          }
        }}
      >
        <input
          aria-label={`New ${title.toLowerCase()}`}
          placeholder="Add an item…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button disabled={!draft.trim()}>Add</button>
      </form>
    </section>
  );
}
export function ReadingWorkspace({
  session,
  onChange,
}: {
  session: Session;
  onChange: (session: Session) => void;
}) {
  const done = session.quests.filter((q) => q.done).length;
  return (
    <section>
      <div className="section-heading">
        <div>
          <div className="eyebrow">03 / Read & reflect</div>
          <h2>Your reading quests</h2>
        </div>
        <span>
          {done} / {session.quests.length} complete
        </span>
      </div>
      <progress max={session.quests.length || 1} value={done} />
      {!session.quests.length && (
        <p className="empty">
          Import a reading plan to turn it into a checklist.
        </p>
      )}
      {session.quests.map((q) => (
        <article className="panel" key={q.id}>
          <label className="check">
            <input
              type="checkbox"
              checked={q.done}
              onChange={(e) =>
                onChange({
                  ...session,
                  quests: session.quests.map((t) =>
                    t.id === q.id
                      ? {
                          ...t,
                          done: e.target.checked,
                          subtasks: t.subtasks.map((st) => ({
                            ...st,
                            done: e.target.checked,
                          })),
                        }
                      : t,
                  ),
                })
              }
            />
            <strong className={q.done ? "completed" : ""}>{q.title}</strong>
          </label>
          <div className="subtasks">
            {q.subtasks.map((st) => (
              <label className="check" key={st.id}>
                <input
                  type="checkbox"
                  checked={st.done}
                  onChange={(e) =>
                    onChange({
                      ...session,
                      quests: session.quests.map((t) => {
                        if (t.id !== q.id) return t;
                        const subtasks = t.subtasks.map((s) =>
                          s.id === st.id ? { ...s, done: e.target.checked } : s,
                        );
                        return {
                          ...t,
                          subtasks,
                          done: subtasks.every((s) => s.done),
                        };
                      }),
                    })
                  }
                />
                <span className={st.done ? "completed" : ""}>{st.title}</span>
              </label>
            ))}
          </div>
          <label>
            Quest notes
            <textarea
              rows={3}
              value={q.notes}
              onChange={(e) =>
                onChange({
                  ...session,
                  quests: session.quests.map((t) =>
                    t.id === q.id ? { ...t, notes: e.target.value } : t,
                  ),
                })
              }
            />
          </label>
        </article>
      ))}
      <section className="panel">
        <h2>Reading notes</h2>
        <textarea
          aria-label="Reading notes"
          rows={6}
          placeholder="Capture explanations, connections, and takeaways…"
          value={session.notes}
          onChange={(e) => onChange({ ...session, notes: e.target.value })}
        />
      </section>
      <EditableList
        title="Unresolved questions"
        items={session.questions}
        onChange={(questions) => onChange({ ...session, questions })}
      />
      <EditableList
        title="Side quests"
        items={session.sideQuests}
        onChange={(sideQuests) => onChange({ ...session, sideQuests })}
      />
    </section>
  );
}
