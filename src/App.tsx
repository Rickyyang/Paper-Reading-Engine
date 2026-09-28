import { useEffect, useState } from "react";
import { emptySurvey, task, type Session } from "./types";
import { load, save } from "./storage";
import { filledPrompt } from "./prompts";
import { parsePlan } from "./parser";
import { SurveyForm } from "./SurveyForm";
import { ReadingWorkspace } from "./ReadingWorkspace";

function SessionEditor({
  session,
  onChange,
}: {
  session: Session;
  onChange: (s: Session) => void;
}) {
  const [response, setResponse] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const ready = [
    session.survey.purpose,
    session.survey.background,
    session.survey.goals,
  ].every((s) => s.trim());
  const prompt = filledPrompt(session);
  function importResponse() {
    try {
      const plan = parsePlan(response);
      const quests = plan.quests.map((q) => ({
        ...task(q.title),
        notes: q.notes,
        subtasks: q.subtasks.map(task),
      }));
      onChange({
        ...session,
        stage: "followup",
        quests: [...session.quests, ...quests],
        notes: [session.notes, plan.notes].filter(Boolean).join("\n\n"),
        questions: [...session.questions, ...plan.questions.map(task)],
        sideQuests: [...session.sideQuests, ...plan.sideQuests.map(task)],
      });
      setResponse("");
      setError("");
      setMessage(
        `Imported ${quests.length} quests. Existing progress and notes were preserved.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
      setMessage("");
    }
  }
  return (
    <>
      <header>
        <div className="eyebrow">Reading session</div>
        <label className="title-label">
          Paper title
          <input
            className="paper-title"
            value={session.title}
            onChange={(e) => onChange({ ...session, title: e.target.value })}
          />
        </label>
      </header>
      <div className="columns">
        <SurveyForm
          survey={session.survey}
          onChange={(survey) => onChange({ ...session, survey })}
        />
        <section className="panel">
          <div className="eyebrow">02 / Bring to ChatGPT</div>
          <h2>Your prompt & reading plan</h2>
          <p className="muted">
            Copy the prompt, upload your paper in ChatGPT, then paste its JSON
            response below. Everything moves manually.
          </p>
          <label>
            Prompt template
            <select
              value={session.stage}
              onChange={(e) =>
                onChange({
                  ...session,
                  stage: e.target.value as Session["stage"],
                })
              }
            >
              <option value="initial">Initial reading plan</option>
              <option value="followup">Follow-up reading plan</option>
            </select>
          </label>
          {!ready && (
            <p className="hint">
              Fill in your purpose, background, and goals to prepare a prompt.
            </p>
          )}
          <label>
            Filled predefined prompt
            <textarea
              className="prompt"
              rows={12}
              readOnly
              value={ready ? prompt : ""}
              placeholder="Your completed prompt will appear here."
            />
          </label>
          <button
            disabled={!ready}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(prompt);
                setMessage(
                  "Prompt copied. Paste it into ChatGPT with your paper.",
                );
                setError("");
              } catch {
                setError(
                  "Clipboard unavailable. Select the prompt text and copy it manually.",
                );
              }
            }}
          >
            Copy prompt
          </button>
          <label className="import-label">
            Paste ChatGPT’s structured response
            <textarea
              rows={7}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder='{"quests": […], "notes": "…", "questions": [], "sideQuests": []}'
            />
          </label>
          <p className="muted small">
            Imports append to this session. Check the response before importing
            it once.
          </p>
          <button disabled={!response.trim()} onClick={importResponse}>
            Import reading plan
          </button>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="success">
              {message}
            </p>
          )}
        </section>
      </div>
      <ReadingWorkspace session={session} onChange={onChange} />
    </>
  );
}
export default function App() {
  const [initial] = useState(() => {
    try {
      return { state: load(), error: "" };
    } catch (e) {
      return {
        state: { sessions: [] as Session[], activeId: null as string | null },
        error:
          e instanceof Error ? e.message : "Unable to access local storage.",
      };
    }
  });
  const [state, setState] = useState(initial.state);
  const [storageError, setStorageError] = useState(initial.error);
  const [title, setTitle] = useState("");
  useEffect(() => {
    if (initial.error) return;
    try {
      save(state);
      setStorageError("");
    } catch {
      setStorageError(
        "Changes could not be saved locally. Keep this tab open; browser storage may be full or unavailable.",
      );
    }
  }, [state, initial.error]);
  const active =
    state.sessions.find((s) => s.id === state.activeId) ?? state.sessions[0];
  return (
    <div className="app">
      <aside>
        <div className="brand">
          Paper Reading
          <br />
          <span>Companion</span>
        </div>
        <p className="muted">One paper. A clearer path.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            const session: Session = {
              id: crypto.randomUUID(),
              title: title.trim(),
              survey: emptySurvey(),
              stage: "initial",
              quests: [],
              notes: "",
              questions: [],
              sideQuests: [],
            };
            setState({
              sessions: [...state.sessions, session],
              activeId: session.id,
            });
            setTitle("");
          }}
        >
          <label>
            Start a reading session
            <input
              placeholder="Paper title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <button disabled={!title.trim() || !!initial.error}>
            + New session
          </button>
        </form>
        <nav aria-label="Reading sessions">
          {state.sessions.map((s) => (
            <button
              key={s.id}
              className={`session-button ${active?.id === s.id ? "selected" : ""}`}
              onClick={() => setState({ ...state, activeId: s.id })}
            >
              {s.title || "Untitled paper"}
              <small>
                {s.quests.filter((q) => q.done).length} / {s.quests.length}{" "}
                quests
              </small>
            </button>
          ))}
        </nav>
        <p className="local-note">
          Local browser storage · No API
          <br />
          Use the same browser and local address to return to your sessions.
          Clearing browser data removes them.
        </p>
      </aside>
      <main>
        <div className="topline">
          <span>YOUR PERSONAL READING WORKSPACE</span>
          <span>
            {storageError ? "Storage needs attention" : "Saved locally"}
          </span>
        </div>
        {storageError && (
          <p role="alert" className="error">
            {storageError}
          </p>
        )}
        {active ? (
          <SessionEditor
            key={active.id}
            session={active}
            onChange={(session) =>
              setState((current) => ({
                ...current,
                sessions: current.sessions.map((s) =>
                  s.id === session.id ? session : s,
                ),
              }))
            }
          />
        ) : (
          <section className="welcome">
            <div className="eyebrow">From paper to understanding</div>
            <h1>
              Make your next paper
              <br />a little more approachable.
            </h1>
            <p>
              Create a session, describe what you want to learn, and bring a
              tailored prompt to ChatGPT. Your reading plan, notes, and open
              questions stay together here.
            </p>
            <ol>
              <li>Prepare a short reading survey</li>
              <li>Copy a prompt and import a plan</li>
              <li>Read, check off quests, and reflect</li>
            </ol>
            <p className="muted">Start with a paper title in the sidebar.</p>
          </section>
        )}
      </main>
    </div>
  );
}
