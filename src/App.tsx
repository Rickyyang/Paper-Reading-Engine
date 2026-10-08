import { useEffect, useRef, useState } from "react";
import {
  downloadTextFile,
  exportLibraryAsJson,
  exportPaperAsMarkdown,
  libraryFilename,
  paperMarkdownFilename,
  exportSessionAsJson,
  sessionJsonFilename,
} from "./exports";
import {
  parseBackup,
  planRestore,
  persistRestore,
  updateSession,
  type Backup,
} from "./backup";
import { RestoreDialog } from "./RestoreDialog";
import { SessionList } from "./SessionList";
import {
  translations,
  en,
  localizeFeedback,
  formatMessage,
} from "./translations";
import { emptySurvey, type Session } from "./types";
import { load, save } from "./storage";
import { filledPrompt, type PromptLanguage } from "./prompts";
import { parsePlan } from "./parser";
import { SurveyForm } from "./SurveyForm";
import { ReadingWorkspace } from "./ReadingWorkspace";
import { noteWorkspace } from "./noteSections";
import { isLegacyReadingPlan } from "./readingPlan";

function SessionEditor({
  session,
  language,
  onChange,
}: {
  session: Session;
  language: PromptLanguage;
  onChange: (s: Session) => void;
}) {
  const t = translations[language];
  const [response, setResponse] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<Error | string>("");

  const ready = [
    session.survey.reading_purpose,
    session.survey.background,
    session.survey.primary_reading_goal,
  ].every((s) => s.trim());
  const prompt = filledPrompt(session, language);
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
      setError(e instanceof Error ? e : en.importFailed);
      setMessage("");
    }
  }
  return (
    <>
      <header>
        <div className="session-heading">
          <div className="eyebrow">{t.readingSession}</div>
        </div>
        <label className="title-label">
          {t.paperTitle}
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
            language={language}
            survey={session.survey}
            onChange={(survey) => onChange({ ...session, survey })}
          />
          <section className="panel">
            <div className="eyebrow">{t.bring}</div>
            <h2>{t.promptTitle}</h2>
            <p className="muted">{t.promptHelp}</p>
            {!ready && <p className="hint">{t.promptReady}</p>}
            <label>
              {t.filledPrompt}
              <textarea
                className="prompt"
                rows={12}
                readOnly
                value={ready ? prompt : ""}
                placeholder={t.promptPlaceholder}
              />
            </label>
            <button
              disabled={!ready}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(prompt);
                  setMessage(en.copied);
                  setError("");
                } catch {
                  setError(en.clipboardFailed);
                }
              }}
            >
              {t.copyPrompt}
            </button>
            <label className="import-label">
              {t.pasteResponse}
              <textarea
                rows={7}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder={t.importPlaceholder}
              />
            </label>
            <p className="muted small">{t.importHelp}</p>
            <button disabled={!response.trim()} onClick={importResponse}>
              {t.importPlan}
            </button>
            {error && (
              <p role="alert" className="error">
                {localizeFeedback(error, language)}
              </p>
            )}
            {message && (
              <p role="status" className="success">
                {localizeFeedback(message, language)}
              </p>
            )}
          </section>
        </div>
      ) : session.readingPlan && !isLegacyReadingPlan(session.readingPlan) ? (
        <ReadingWorkspace
          language={language}
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
          <h2>{t.readingWorkspace}</h2>
          <p className="muted">{t.legacyPlan}</p>
        </section>
      )}
    </>
  );
}
export default function App() {
  const [language, setLanguage] = useState<PromptLanguage>(() => {
    try {
      return localStorage.getItem("paper-reading-companion:language") ===
        "zh-CN"
        ? "zh-CN"
        : "en";
    } catch {
      return "en";
    }
  });
  const t = translations[language];
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translations[language].appTitle;
  }, [language]);
  function selectLanguage(next: PromptLanguage) {
    setLanguage(next);
    try {
      localStorage.setItem("paper-reading-companion:language", next);
    } catch {
      /* The selection still works for this visit. */
    }
  }
  const [initial] = useState(() => {
    try {
      return { state: load(), error: "" };
    } catch (e) {
      return {
        state: { sessions: [] as Session[], activeId: null as string | null },
        error: e instanceof Error ? e : en.storageUnavailable,
      };
    }
  });
  const [state, setState] = useState(initial.state);
  const [storageError, setStorageError] = useState(initial.error);
  const [title, setTitle] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<Backup | null>(null);
  const [dataMessage, setDataMessage] = useState<Pick<
    ReturnType<typeof planRestore>,
    "summaryKey" | "summaryValues"
  > | null>(null);
  const [dataError, setDataError] = useState<Error | string>("");
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
      setStorageError(en.saveFailed);
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
      <aside aria-label={t.appControls}>
        <div className="sidebar-toggle-row">
          <div className="brand" hidden={sidebarCollapsed}>
            {t.brandReading}
            <br />
            <span>{t.brandCompanion}</span>
          </div>
          <button
            type="button"
            className="quiet fold-toggle"
            aria-label={sidebarCollapsed ? t.expandApp : t.collapseApp}
            title={sidebarCollapsed ? t.expandApp : t.collapseApp}
            aria-expanded={!sidebarCollapsed}
            aria-controls="app-controls-content"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <span className="fold-icon" aria-hidden="true" />
          </button>
        </div>
        <div id="app-controls-content" hidden={sidebarCollapsed}>
          <p className="muted">{t.tagline}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              const session: Session = {
                id: crypto.randomUUID(),
                updatedAt: new Date().toISOString(),
                title: title.trim(),
                survey: emptySurvey(t.basicUnderstanding),
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
              {t.startSession}
              <input
                placeholder={t.paperTitle}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <button disabled={!title.trim() || !storageReady}>
              {t.newSession}
            </button>
          </form>
          <SessionList
            key={String(sidebarCollapsed)}
            sessions={state.sessions}
            activeId={active?.id}
            language={language}
            onSelect={(id) =>
              setState((current) => ({ ...current, activeId: id }))
            }
            onRedo={(session) => changeSession({ ...session, state: "setup" })}
            onExport={(session) => {
              try {
                downloadTextFile(
                  exportSessionAsJson(session),
                  sessionJsonFilename(session.title),
                  "application/json",
                );
              } catch {
                setDataError(en.exportFailed);
              }
            }}
            onDelete={(id) => {
              if (!storageReady) throw new Error("Storage unavailable");
              const sessions = state.sessions.filter(
                (session) => session.id !== id,
              );
              const next = {
                sessions,
                activeId:
                  active?.id === id
                    ? (sessions[0]?.id ?? null)
                    : state.activeId,
              };
              save(next);
              persistedRestore.current = next;
              setState(next);
              setStorageError("");
            }}
          />
          <p className="local-note">
            {t.localStorage}
            <br />
            {t.storageHelp}
          </p>
        </div>
      </aside>
      <main>
        <div className="topline">
          <span>{t.workspaceTitle}</span>
          <div className="topline-actions">
            <div
              className="language-switch"
              role="group"
              aria-label={t.languageLabel}
            >
              <button
                type="button"
                lang="zh-CN"
                aria-label={t.chineseLabel}
                aria-pressed={language === "zh-CN"}
                onClick={() => selectLanguage("zh-CN")}
              >
                {t.chineseShort}
              </button>
              <span aria-hidden="true">/</span>
              <button
                type="button"
                lang="en"
                aria-label={t.englishLabel}
                aria-pressed={language === "en"}
                onClick={() => selectLanguage("en")}
              >
                {t.englishShort}
              </button>
            </div>
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
                <span aria-hidden="true">▤</span> {t.data}
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
                  {t.exportMarkdown}
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
                  {t.exportLibrary}
                </button>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                >
                  {t.importLibraryJson}
                </button>
                <button
                  type="button"
                  disabled={!active || active.state !== "reading"}
                  onClick={() => {
                    if (active) changeSession({ ...active, state: "setup" });
                  }}
                >
                  {t.redoSetup}
                </button>
              </div>
            </details>
            <span>{storageError ? t.storageAttention : t.savedLocally}</span>
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
            setDataMessage(null);
            setPendingBackup(null);
            try {
              setPendingBackup(parseBackup(await file.text()));
            } catch (error) {
              setDataError(
                error instanceof Error ? error : en.backupReadFailed,
              );
            }
          }}
        />
        {dataError && (
          <p role="alert" className="error">
            {localizeFeedback(dataError, language)}
          </p>
        )}
        {dataMessage && (
          <p role="status" className="success">
            {formatMessage(language, "importComplete", {
              summary: formatMessage(
                language,
                dataMessage.summaryKey,
                dataMessage.summaryValues,
              ),
            })}
          </p>
        )}
        {pendingBackup && (
          <RestoreDialog
            language={language}
            error={localizeFeedback(dataError, language)}
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
                setDataMessage({
                  summaryKey: result.summaryKey,
                  summaryValues: result.summaryValues,
                });
              } catch {
                setDataError(en.restoreFailed);
              }
            }}
          />
        )}
        {storageError && (
          <p role="alert" className="error">
            {localizeFeedback(storageError, language)}
          </p>
        )}
        {active ? (
          <SessionEditor
            key={`${active.id}:${active.state}:${restoreGeneration}`}
            session={active}
            language={language}
            onChange={changeSession}
          />
        ) : (
          <section className="welcome">
            <div className="eyebrow">{t.welcomeEyebrow}</div>
            <h1>
              {t.welcomeFirst}
              <br />
              {t.welcomeSecond}
            </h1>
            <p>{t.welcomeHelp}</p>
            <ol>
              <li>{t.welcomeSurvey}</li>
              <li>{t.welcomeImport}</li>
              <li>{t.welcomeRead}</li>
            </ol>
            <p className="muted">{t.welcomeStart}</p>
          </section>
        )}
      </main>
    </div>
  );
}
