import { useEffect, useRef, useState } from "react";
import { planRestore, type Backup } from "./backup";
import type { State } from "./storage";

export function RestoreDialog({
  backup,
  current,
  onCancel,
  onConfirm,
  error,
}: {
  backup: Backup;
  current: State;
  onCancel: () => void;
  onConfirm: (mode: "merge" | "replace") => void;
  error: string;
}) {
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
      <h2 id="restore-title">Import library</h2>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <p>
        {backup.papers.length} papers in this backup. Nothing changes until you
        confirm.
      </p>
      <label>
        Import mode
        <select
          value={mode}
          onChange={(event) => {
            setMode(event.target.value as "merge" | "replace");
            setReplaceConfirmed(false);
          }}
        >
          <option value="merge">Merge with current library</option>
          <option value="replace">Replace current library</option>
        </select>
      </label>
      <p>{result.summary}</p>
      {result.conflicts.length > 0 && (
        <div className="hint">
          <p>
            {result.conflicts.length} matching papers differ but have equal or
            missing update timestamps. Confirming will use the imported
            versions:
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
          I understand that all current local library data will be replaced.
        </label>
      )}
      <div className="note-actions">
        <button
          type="button"
          disabled={mode === "replace" && !replaceConfirmed}
          onClick={() => onConfirm(mode)}
        >
          {mode === "replace" ? "Confirm replace" : "Confirm merge"}
        </button>
        <button type="button" className="quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </dialog>
  );
}
