import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Session } from "./types";
import type { PromptLanguage } from "./prompts";
import { translations, formatMessage } from "./translations";

export function SessionList({
  sessions,
  activeId,
  language,
  onSelect,
  onRedo,
  onExport,
  onDelete,
}: {
  sessions: Session[];
  activeId: string | undefined;
  language: PromptLanguage;
  onSelect: (id: string) => void;
  onRedo: (session: Session) => void;
  onExport: (session: Session) => void;
  onDelete: (id: string) => void;
}) {
  const t = translations[language];
  const [menu, setMenu] = useState<{
    id: string;
    anchor: HTMLButtonElement;
    left: number;
    top: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const target = sessions.find((session) => session.id === menu?.id);
  const deleting = sessions.find((session) => session.id === pendingDelete);

  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const dismiss = (event: PointerEvent) => {
      if (
        !menuRef.current?.contains(event.target as Node) &&
        !menu.anchor.contains(event.target as Node)
      )
        setMenu(null);
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(null);
        menu.anchor.focus();
      }
    };
    const reposition = () => setMenu(null);
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [menu]);

  useEffect(() => {
    if (!deleting) return;
    const node = dialog.current!;
    node.showModal();
    return () => node.close();
  }, [deleting?.id]);

  function action(callback: () => void) {
    menu?.anchor.focus();
    setMenu(null);
    callback();
  }

  return (
    <>
      <nav aria-label={t.sessions}>
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`session-card ${activeId === session.id ? "selected" : ""}`}
          >
            <button
              className="session-select"
              aria-current={activeId === session.id ? "true" : undefined}
              onClick={() => {
                setMenu(null);
                onSelect(session.id);
              }}
            >
              <span>{session.title || t.untitled}</span>
              <small>{session.state === "setup" ? t.setup : t.reading}</small>
            </button>
            <button
              className="session-menu-trigger"
              type="button"
              aria-label={`${t.sessionOptions}: ${session.title || t.untitled}`}
              title={t.sessionOptions}
              aria-expanded={menu?.id === session.id}
              aria-controls={
                menu?.id === session.id ? "session-options" : undefined
              }
              onClick={(event) => {
                if (menu?.id === session.id) {
                  setMenu(null);
                  return;
                }
                const anchor = event.currentTarget;
                const rect = anchor.getBoundingClientRect();
                setMenu({
                  id: session.id,
                  anchor,
                  left: Math.max(
                    8,
                    Math.min(rect.right - 220, window.innerWidth - 228),
                  ),
                  top: Math.max(
                    8,
                    Math.min(rect.bottom + 4, window.innerHeight - 148),
                  ),
                });
              }}
            >
              ⋯
            </button>
          </div>
        ))}
      </nav>
      {menu &&
        target &&
        createPortal(
          <div
            id="session-options"
            className="session-dropdown"
            ref={menuRef}
            style={{ left: menu.left, top: menu.top }}
            aria-label={t.sessionOptions}
            onBlur={(event) => {
              if (
                event.relatedTarget &&
                !event.currentTarget.contains(event.relatedTarget) &&
                event.relatedTarget !== menu.anchor
              )
                setMenu(null);
            }}
          >
            <button onClick={() => action(() => onRedo(target))}>
              {t.redoSetup}
            </button>
            <button onClick={() => action(() => onExport(target))}>
              {t.exportSession}
            </button>
            <button
              className="delete-action"
              onClick={() =>
                action(() => {
                  setError(false);
                  setPendingDelete(target.id);
                })
              }
            >
              {t.deleteSession}
            </button>
          </div>,
          document.body,
        )}
      {deleting && (
        <dialog
          ref={dialog}
          className="restore-dialog"
          aria-labelledby="delete-session-title"
          aria-describedby="delete-session-warning"
          onCancel={() => setPendingDelete(null)}
        >
          <h2 id="delete-session-title">
            {formatMessage(language, "deleteTitle", {
              title: deleting.title || t.untitled,
            })}
          </h2>
          <p id="delete-session-warning">{t.deleteWarning}</p>
          {error && (
            <p className="error" role="alert">
              {t.deleteFailed}
            </p>
          )}
          <div className="session-dialog-actions">
            <button
              className="quiet"
              autoFocus
              onClick={() => setPendingDelete(null)}
            >
              {t.cancel}
            </button>
            <button
              className="delete-confirm"
              onClick={() => {
                try {
                  onDelete(deleting.id);
                  setPendingDelete(null);
                } catch {
                  setError(true);
                }
              }}
            >
              {t.delete}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
