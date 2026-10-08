import { translations, formatMessage } from "./translations";
import type { PromptLanguage } from "./prompts";
import { useEffect, useRef, useState } from "react";
import { planRestore, type Backup } from "./backup";
import type { State } from "./storage";

export function RestoreDialog({
  language,
  backup,
  current,
  onCancel,
  onConfirm,
  error,
}: {
  language: PromptLanguage;
  backup: Backup;
  current: State;
  onCancel: () => void;
  onConfirm: (mode: "merge" | "replace") => void;
  error: string;
}) {
  const t = translations[language];
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const result = planRestore(current, backup, mode);
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    return () => node.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="restore-dialog"
      aria-labelledby="restore-title"
      onCancel={onCancel}
    >
      <h2 id="restore-title">{t.importLibrary}</h2>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <p>
        {formatMessage(language, "backupCount", {
          count: backup.papers.length,
        })}
      </p>
      <label>
        {t.importMode}
        <select
          value={mode}
          onChange={(event) => {
            setMode(event.target.value as "merge" | "replace");
            setReplaceConfirmed(false);
          }}
        >
          <option value="merge">{t.mergeLibrary}</option>
          <option value="replace">{t.replaceLibrary}</option>
        </select>
      </label>
      <p>{formatMessage(language, result.summaryKey, result.summaryValues)}</p>
      {result.conflicts.length > 0 && (
        <div className="hint">
          <p>
            {formatMessage(language, "conflictCount", {
              count: result.conflicts.length,
            })}
          </p>
          <ul>
            {result.conflicts.map((title, index) => (
              <li key={index}>{title}</li>
            ))}
          </ul>
        </div>
      )}
      {mode === "replace" && (
        <label className="replace-confirm">
          <input
            type="checkbox"
            checked={replaceConfirmed}
            onChange={(event) => setReplaceConfirmed(event.target.checked)}
          />{" "}
          {t.replaceWarning}
        </label>
      )}
      <div className="note-actions">
        <button
          type="button"
          disabled={mode === "replace" && !replaceConfirmed}
          onClick={() => onConfirm(mode)}
        >
          {mode === "replace" ? t.confirmReplace : t.confirmMerge}
        </button>
        <button type="button" className="quiet" onClick={onCancel}>
          {t.cancel}
        </button>
      </div>
    </dialog>
  );
}
