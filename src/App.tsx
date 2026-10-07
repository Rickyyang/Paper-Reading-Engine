import { useEffect, useRef, useState } from "react";
import {
  downloadTextFile,
  exportLibraryAsJson,
  exportPaperAsMarkdown,
  libraryFilename,
  paperMarkdownFilename,
} from "./exports";
import {
  parseBackup,
  planRestore,
  persistRestore,
  updateSession,
  type Backup,
} from "./backup";
import { RestoreDialog } from "./RestoreDialog";
import { emptySurvey, type Session } from "./types";
import { load, save } from "./storage";
import { filledPrompt } from "./prompts";
import { parsePlan } from "./parser";
import { SurveyForm } from "./SurveyForm";
import { ReadingWorkspace } from "./ReadingWorkspace";
import { noteWorkspace } from "./noteSections";
import { isLegacyReadingPlan } from "./readingPlan";

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
    session.survey.reading_purpose,
    session.survey.background,
    session.survey.primary_reading_goal,
  ].every((s) => s.trim());
  const prompt = filledPrompt(session);
  function importResponse() {
    try {
      const plan = parsePlan(response);
      onChange({
        ...session,
        state: "reading",
        readingPlan: plan,
        completedQuestIds: [],
      });
      setResponse("");
      setError("");
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
      setMessage("");
    }
  }
  return (
    <>
      <header>
        <div className="session-heading">
          <div className="eyebrow">Reading session</div>
        </div>
        <label className="title-label">
          Paper title
          <input
            className="paper-title"
            value={session.title}
            onChange={(e) => onChange({ ...session, title: e.target.value })}
          />
        </label>
      </header>
      {session.state === "setup" ? (
        <div className="columns">
          <SurveyForm
            survey={session.survey}
            onChange={(survey) => onChange({ ...session, survey })}
          />
          <section className="panel">
            <div className="eyebrow">02 / Bring to ChatGPT</div>
            <h2>Your prompt & reading plan</h2>
            <p className="muted">
              Copy the prompt, upload your paper in ChatGPT, then paste its
              entire response below. Only the marked JSON import block is saved.
            </p>
            {!ready && (
              <p className="hint">
                Fill in your reading purpose, background, and primary reading
                goal to prepare a prompt.
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
              Paste ChatGPT’s entire response
              <textarea
                rows={7}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Paste the explanation and the PAPER_READER_IMPORT_START / PAPER_READER_IMPORT_END block here."
              />
            </label>
            <p className="muted small">
              A valid import saves the initial reading plan and completes setup.
              Reimporting replaces this plan. An invalid response leaves your
              session unchanged.
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
      ) : session.readingPlan && !isLegacyReadingPlan(session.readingPlan) ? (
        <ReadingWorkspace
          parkingItems={session.parkingItems ?? []}
          onParkingChange={(parkingItems) =>
            onChange({ ...session, parkingItems })
          }
          plan={session.readingPlan}
          workspaceState={noteWorkspace(session)}
          onWorkspaceChange={(workspaceState) =>
            onChange({
              ...session,
              workspaceState,
            })
          }
        />
      ) : (
        <section className="panel">
          <h2>Reading workspace</h2>
          <p className="muted">
            This session has no plan in the current Parts-and-Quests format. Use
            the Data menu above to redo reading setup and import a current plan.
            Any previously saved data is retained until you replace the plan.
          </p>
        </section>
      )}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<Backup | null>(null);
  const [dataMessage, setDataMessage] = useState("");
  const [dataError, setDataError] = useState("");
  const [storageReady, setStorageReady] = useState(!initial.error);
  const [restoreGeneration, setRestoreGeneration] = useState(0);
  const persistedRestore = useRef<typeof state | null>(null);
  useEffect(() => {
    if (!storageReady) return;
    if (persistedRestore.current === state) {
      persistedRestore.current = null;
      return;
    }
    try {
      save(state);
      setStorageError("");
    } catch {
      setStorageError(
        "Changes could not be saved locally. Keep this tab open; browser storage may be full or unavailable.",
      );
    }
  }, [state, storageReady]);
  const active =
    state.sessions.find((s) => s.id === state.activeId) ?? state.sessions[0];
  function changeSession(session: Session) {
    setState((current) => ({
      ...current,
      sessions: current.sessions.map((previous) =>
        previous.id === session.id
          ? updateSession(previous, session)
          : previous,
      ),
    }));
  }
  return (
    <div className={`app ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside aria-label="App controls">
        <div className="sidebar-toggle-row">
          <div className="brand" hidden={sidebarCollapsed}>
            Paper Reading
            <br />
            <span>Companion</span>
          </div>
          <button
            type="button"
            className="quiet fold-toggle"
            aria-label={`${sidebarCollapsed ? "Expand" : "Collapse"} app controls`}
            title={`${sidebarCollapsed ? "Expand" : "Collapse"} app controls`}
            aria-expanded={!sidebarCollapsed}
            aria-controls="app-controls-content"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <span className="fold-icon" aria-hidden="true" />
          </button>
        </div>
        <div id="app-controls-content" hidden={sidebarCollapsed}>
          <p className="muted">One paper. A clearer path.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              const session: Session = {
                id: crypto.randomUUID(),
                updatedAt: new Date().toISOString(),
                title: title.trim(),
                survey: emptySurvey(),
                state: "setup",
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
            <button disabled={!title.trim() || !storageReady}>
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
                <small>{s.state === "setup" ? "Setup" : "Reading"}</small>
              </button>
            ))}
          </nav>
          <p className="local-note">
            Local browser storage · No API
            <br />
            Use the same browser and local address to return to your sessions.
            Clearing browser data removes them.
          </p>
        </div>
      </aside>
      <main>
        <div className="topline">
          <span>YOUR PERSONAL READING WORKSPACE</span>
          <div className="topline-actions">
            <details
              className="plan-options export-options"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                  event.currentTarget.open = false;
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.currentTarget.open = false;
                  event.currentTarget.querySelector("summary")?.focus();
                }
              }}
            >
              <summary>
                <span aria-hidden="true">▤</span> Data
              </summary>
              <div className="plan-options-panel">
                <button
                  type="button"
                  disabled={!active}
                  onClick={() => {
                    if (active)
                      downloadTextFile(
                        exportPaperAsMarkdown(active, active.parkingItems),
                        paperMarkdownFilename(active.title),
                        "text/markdown",
                      );
                  }}
                >
                  Export paper notes (.md)
                </button>
                <button
                  type="button"
                  disabled={!storageReady}
                  onClick={() => {
                    const now = new Date();
                    downloadTextFile(
                      exportLibraryAsJson(
                        state.sessions,
                        state.activeId,
                        {},
                        now,
                      ),
                      libraryFilename(now),
                      "application/json",
                    );
                  }}
                >
                  Export library backup (.json)
                </button>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                >
                  Import library (.json)
                </button>
                <button
                  type="button"
                  disabled={!active || active.state !== "reading"}
                  onClick={() => {
                    if (active) changeSession({ ...active, state: "setup" });
                  }}
                >
                  Redo reading setup
                </button>
              </div>
            </details>
            <span>
              {storageError ? "Storage needs attention" : "Saved locally"}
            </span>
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setDataError("");
            setDataMessage("");
            setPendingBackup(null);
            try {
              setPendingBackup(parseBackup(await file.text()));
            } catch (error) {
              setDataError(
                error instanceof Error
                  ? error.message
                  : "Could not read the backup file.",
              );
            }
          }}
        />
        {dataError && (
          <p role="alert" className="error">
            {dataError}
          </p>
        )}
        {dataMessage && (
          <p role="status" className="success">
            {dataMessage}
          </p>
        )}
        {pendingBackup && (
          <RestoreDialog
            error={dataError}
            backup={pendingBackup}
            current={state}
            onCancel={() => setPendingBackup(null)}
            onConfirm={(mode) => {
              const result = planRestore(state, pendingBackup, mode);
              try {
                const next = persistRestore(result.state);
                persistedRestore.current = next;
                setState(next);
                setStorageReady(true);
                setStorageError("");
                setRestoreGeneration((value) => value + 1);
                setPendingBackup(null);
                setDataError("");
                setDataMessage(`Import complete — ${result.summary}`);
              } catch {
                setDataError(
                  "Import could not be saved. Your previous library is unchanged. Storage may be full or unavailable.",
                );
              }
            }}
          />
        )}
        {storageError && (
          <p role="alert" className="error">
            {storageError}
          </p>
        )}
        {active ? (
          <SessionEditor
            key={`${active.id}:${active.state}:${restoreGeneration}`}
            session={active}
            onChange={changeSession}
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
              tailored prompt to ChatGPT. Import its reading plan to save it
              locally.
            </p>
            <ol>
              <li>Prepare a short reading survey</li>
              <li>Copy a prompt and import a plan</li>
              <li>
                Keep your imported plan saved for the future reading workspace
              </li>
            </ol>
            <p className="muted">Start with a paper title in the sidebar.</p>
          </section>
        )}
      </main>
    </div>
  );
}
