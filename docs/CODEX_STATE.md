# Current development handoff

Updated 2026-10-07. Read `docs/AGENTS.md` first; there is no root AGENTS.md. Code is authoritative. Inspect only files relevant to the next task.

## Current goal and status

Version 0 is a local, manually ChatGPT-assisted paper-reading companion. The latest requested implementation is complete: JSON library backup/restore and Markdown paper export share a more visible **▤ Data** menu with Redo reading setup. This turn consolidates documentation only. No new feature is pending authorization.

The working tree is **uncommitted**, including new untracked export/restore files. Do not discard, commit, or push without user instruction. Moving only committed files to another computer would omit this work; transfer the complete working tree or arrange a user-authorized commit first. Browser reading data is separate: transfer it with JSON export/import.

## Completed product behavior

- Setup survey → deterministic local prompt copied manually to ChatGPT → validated reading-plan import → reading workspace. No backend or AI API.
- Desktop: hierarchical Reading Plan, guidance + notes, Parking Lot; narrower screens stack them. Parts and Quests are guidance only, with no completion controls or skim material. Previous/Next Quest follows imported order. Selection starts from `start_here`, with first-Quest fallback.
- Three-line fold controls preserve state and free center width, including the far-left app sidebar. The paper header remains visible. Quest selection, folding, and note sorting are temporary UI state.
- Notes use one continuous raw Markdown working section plus a separate draft. Render & continue appends with a blank line and clears the draft. Whole-section edit has Save/Cancel. Save section includes pending draft, stores one section with context, and clears both working fields. Both fields persist before saving a section.
- Saved sections default collapsed; header shows number/time only. Part/Quest metadata is stored but hidden. A top-right unlabeled newest/oldest dropdown changes display order only. Expanded sections have Edit/Delete; deletion asks confirmation. Edit preserves ID/createdAt/context and updates updatedAt.
- Shared react-markdown + remark-math + rehype-katex renderer; KaTeX CSS is application-level. Raw HTML disabled, KaTeX trust false. Source Markdown/LaTeX is never rewritten or stored as HTML.

## Export/restore decisions and data flow

- Storage key `paper-reading-companion:v0`, envelope `{version: 1, sessions, activeId}`. App owns session state and normal autosave. Existing legacy session fields remain intact.
- JSON backup: `{format_version: 1, exported_at, activeId, papers}`. `BACKUP_VERSION` in `src/backup.ts` is shared by export/import. Export serializes full session objects, pretty-printed UTF-8, without state changes. Earlier exports may contain `parkingItems` added from live temporary state; restore accepts those.
- Session now optionally has `updatedAt` and `parkingItems: {id,text}[]`. Parking items persist so restore/reload retains them. App content updates go through `updateSession`; no-op updates retain timestamps, changed content advances them monotonically. Creation timestamps new sessions; old sessions remain undated until edited. Selection/folding/sorting are not persisted or timestamped.
- `parseBackup` reads JSON (including optional UTF-8 BOM), rejects missing/unsupported format version, invalid export timestamp/array, malformed sessions/plans, and duplicate/empty paper IDs. It preserves session fields and plan content, defaulting only missing effort/state for compatibility. No state changes before confirmation.
- Merge matches permanent IDs, adds missing sessions, keeps the newer session timestamp. Identical objects are unchanged regardless of key order or undefined optional properties. Differing equal/undated versions use imported content only after the dialog warns and lists affected titles. No duplicate sessions are created.
- Replace requires a warning checkbox and confirmation. `persistRestore` writes the whole envelope with atomic localStorage.setItem **before** publishing React state. Write failure leaves old memory/storage intact and displays an error inside the dialog. Success remounts the editor to avoid stale temporary edits/selection and reports counts. Merge keeps local active paper; replace uses backup activeId, otherwise first paper/null.
- Markdown export behavior is unchanged: current paper only; setup, current-format plan (excluding skim), chronological saved raw sections, working Markdown, unrendered draft, and nonempty Parking Lot. No saving/clearing as a side effect. Legacy savedNotes are used only when workspaceState is absent. Legacy plans get an explanatory sentence in Markdown and remain fully preserved in JSON. Filenames are sanitized; download uses Blob/object URL with delayed revocation.
- Workspace data: `workspaceState: {workingSection: {markdown,draft}, savedSections: [{id,markdown,createdAt,updatedAt,partId,partTitle,questId,questTitle}]}`. Nullable metadata/dates support legacy notes. `noteSections.ts` converts old savedNotes only if workspaceState is absent, preventing deleted notes from reappearing.

## Files to inspect for continuation

| Files | Responsibility / latest change |
| --- | --- |
| `src/backup.ts`, `src/backup.test.ts` (new) | Backup version, validation, merge/replace planning, atomic persistence, content timestamps; restore regression tests |
| `src/RestoreDialog.tsx` (new) | Modal mode/count/conflict preview, replace acknowledgement, confirmation/cancel/error |
| `src/exports.ts`, `src/exports.test.ts` (new) | JSON/Markdown generation, filenames, browser download helper and fidelity tests |
| `src/App.tsx` (modified) | Unified Data menu/file picker, restore transaction, session timestamp wiring and autosave |
| `src/types.ts`, `src/storage.ts` (modified) | Optional timestamp/parking fields; reusable session validation and exported State type |
| `src/ReadingWorkspace.tsx` (modified) | Parking items now controlled by Session; selection/guidance/navigation unchanged |
| `src/styles.css` (modified) | More visible Data control, compact restore dialog |
| `src/WorkingNotes.tsx`, `src/MarkdownNote.tsx`, `src/noteSections.ts` | Existing working/saved note workflow, rendering and legacy conversion |
| `src/readingPlan.ts`, `src/parser.ts` | Plan schema/legacy recognition and marked/fenced/raw JSON parsing |
| `src/prompts.ts`, `src/prompts/initialReadingPlan.ts` | Actual prompt filling path and template; keep `initialReadingPlanPrompt` export aligned |

## Plan compatibility

Current plan requires `schema_version: 1`, `record_type: initial_reading_plan`, main_objective, route_summary, parts, skim_for_now, start_here. Parts contain id/title/objective/quests/checkpoint.question; Quests contain id/title/objective/read[]/focus_question/completion_condition. Start includes part_id/quest_id/instruction/focus_question/completion_condition. IDs are sequential P1/P2, Q1.1/Q1.2/Q2.1; start must reference an existing Quest. Extra plan fields are rejected by current validation.

Legacy plans with main_quest/top-level quests/starting_point load but do not render as current plans; redo setup imports a replacement. Marker-wrapped responses permit surrounding prose; raw JSON and generic/JSON fences also work. Invalid imports preserve existing data. Redo setup preserves old plan until valid replacement.

## Validation and remaining limits

- Latest implementation verification: `pnpm test` **19 passed**; `pnpm run build` passed. Tests cover invalid/unsupported backups, duplicates, merge conflicts/newer versions, raw Unicode/LaTeX, unfinished work, nonmutation, persistence failure/reload, filenames, and Blob cleanup. Vite still reports the nonfatal >500 kB bundle warning from Markdown/KaTeX.
- Browser verified unified menu, local file picker, default Merge/count preview, disabled Replace until acknowledgement, and Cancel returning to unchanged notes. Destructive replace was tested with isolated fake storage, not against the real browser library. Full successful restore/re-export in a disposable browser library remains a useful end-to-end check.
- Automated export download-event wait timed out in the in-app browser. Do not treat that as a confirmed export defect or claim completed browser downloads were verified. Generation/helper tests pass; manually checking actual downloaded files is still useful.
- Existing dev server was left running at `http://127.0.0.1:5173/` during implementation; do not assume it survives restart or exists on another computer. Browser sample session “Workspace layout check” contains test notes; do not delete it without permission.
- README response-format section is stale (old schema, mandatory markers, extra fields accepted). Setup help still says only marked JSON is saved. Code above is authoritative; documentation/copy correction has not been implemented.
- Backup restore uses current session validation; arbitrary ancient pre-survey-migration data is not guaranteed compatible. Backups exported by the current export feature are the intended input. No cloud/cross-tab sync; only explicit file transfer. Temporary whole-section edit buffers and unsubmitted parking input are not persisted; working Markdown/draft and added parking items are.

## Next recommended step

On another computer, bring all uncommitted/new files, install with `pnpm install --frozen-lockfile`, run `pnpm test` and `pnpm run build`, then start `pnpm run dev`. See AGENTS for Node requirements and direct commands. To close the remaining verification gap, use a disposable library to check actual JSON download → merge/replace → reload → re-export and inspect Markdown output. Do not replace the user's real library for testing. Otherwise wait for the next requested feature; fix stale README/setup copy when requested. Do not add sync, integrations, rich-text tools, or new reading workflows speculatively.
