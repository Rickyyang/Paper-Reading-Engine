# Current development handoff

Updated 2026-10-09. Read `docs/AGENTS.md` first; there is no root AGENTS.md. Code is authoritative. Inspect only files relevant to the next task.

## Current goal and status

Version 0 is a local, manually ChatGPT-assisted paper-reading companion. JSON library backup/restore and Markdown paper export share a **▤ Data** menu with Redo reading setup. Cross-computer startup repair is complete; no new feature is pending authorization.

Current milestone: Overview is a selectable first item in Reading Plan navigation. The single center guidance panel switches between Overview, Part, and Quest content; no permanent overview panel remains. Browser reading data is separate: transfer it with JSON export/import.

## Latest Overview navigation change

- `ReadingWorkspace.tsx` uses null selection for Overview, outside the Part/Quest order. Initial selection still uses start_here with the existing first-Quest fallback; reopening never forces Overview. Selection remains temporary UI state.
- Overview displays main objective, suggested reading route, and the existing expandable Start here content through the unchanged Markdown/KaTeX renderer. A localized Go to {id} button selects the recommended Part/Quest. Previous/Next controls remain in Part/Quest guidance only; their order/behavior is unchanged.
- Existing Overview/main/start dictionary labels are reused; Chinese route label is 建议阅读路径. Notes, Parking Lot, schema, and stored plan content are unchanged.
- Type check, production build, and all 27 tests pass. Browser checked one guidance panel, selected Overview highlight, absent Quest controls in Overview, Chinese labels, Go to Q1.1, removal of overview content on Quest selection, and reload retaining the original start-Quest behavior. Temporary test server on 5174 was stopped; normal server was left untouched. Existing bundle-size warning remains.

## Latest math-formatting milestone

- Both explicit initial-reading templates now require Markdown-compatible inline/display LaTeX in human-readable and JSON plan text, prohibit approximate plain-text/Unicode substitutions, preserve technical labels/commands, and demonstrate JSON backslash/newline escaping. The old blanket ban on Markdown in JSON is replaced with allowance for math while excluding headings/tables/complex formatting. Placeholder filling and schema are unchanged.
- All displayed plan text in `ReadingWorkspace.tsx` uses the existing `MarkdownNote` pipeline. An optional inline mode uses span markup and noninteractive links for titles within headings/buttons; notes retain the same default block renderer and behavior. Raw HTML remains disabled and KaTeX trust false.
- Main objective/route summary and start_here text appear when Overview is selected in Reading Plan, with an expandable Start here instruction/focus/completion section. Part/Quest titles and objectives, read entries, focus/completion, and Part checkpoints all render math. Skim remains omitted as before.
- Plan-only overflow styling contains long equations without widening the workspace. Source JSON, storage envelope, importer, raw notes, exports, and UI language mechanism are unchanged. Three overview labels use the existing dictionary.
- Type check, production build, and 27 tests pass. Tests check both copied prompt examples produce valid JSON with normal LaTeX after parsing, schema/placeholder parity, and exact math preservation through import/save/reload. Browser verified English/Chinese inline/display/title/overview/start/checkpoint rendering, no KaTeX errors, horizontal scrolling for a long equation with page width unchanged, and math after reload.
- Math browser checks used a new sample session on isolated origin 127.0.0.1:5174. The temporary test server was stopped; the normal 5173 server was left alone. No real sessions were edited. Test-only browser sessions remain on 5174. Existing nonfatal bundle-size warning remains.

## Latest localization milestone

- All fixed UI text in App, SurveyForm, ReadingWorkspace, WorkingNotes, RestoreDialog, and SessionList now uses `translations.ts`; includes aria labels, placeholders, empty/legacy states, menus, confirmation/warning/error messages, restore counts, document title/lang, and date formatting. No runtime translation or new dependency.
- Validation throws `UiError` with a dictionary key and parameters. Its English Error.message is unchanged for tests/non-UI consumers; UI feedback localizes at render time so switching language updates existing errors. Schema keys/paths remain English. Backup planning additionally exposes structured summary parameters; merge/replace logic is unchanged.
- New sessions default to 基本理解 in Chinese and Basic understanding in English. Existing goals/answers never change on a language switch. Depth labels translate but stored enum values stay English. Prompt selection/substitution and both predefined templates remain unchanged.
- Note deletion uses an app-owned modal (same confirmation behavior) so Cancel/Delete labels follow app language instead of browser/OS language. Raw notes, GPT plans, titles, Parking Lot entries, saved Markdown/LaTeX, and export formats are unchanged. Setup helper/placeholder now accurately describes marker-wrapped responses and optional markers for JSON-only input.
- Type check, production build, and all 26 tests pass. Added dictionary/parameter parity, literal interpolation, structured-error localization, restore counts, and default-goal tests. Existing nonfatal bundle-size warning remains.
- Browser verified EN ↔ 中 on setup/reading, existing validation feedback, empty state, Chinese new-session default, depth labels, raw English/LaTeX note preservation, saved-note edit/cancel and delete/cancel, Data menu, and merge/replace preview/warning/cancel. No destructive restore/deletion performed. File-picker automation was slow but the restore-dialog check succeeded.
- Used a separate test origin on port 5174 for created test data; its server was stopped. Original server on 5173 was reused and left running; original selection/language restored. Temporary fixture files removed. A localization test session exists only in browser storage on the test origin.

## Latest session-menu milestone

- `SessionList.tsx` renders a bottom-right ⋯ beside each status. One portal dropdown avoids sidebar clipping; outside click, focus leaving, Escape, action selection, scrolling/resizing, and sidebar folding dismiss it. Opening another card's menu does not select that card.
- Redo uses the existing setup transition and preserves plan/notes. Session JSON reuses the library backup envelope with exactly one complete session and a sanitized title-based filename; the existing importer can restore it. Global Data controls are unchanged.
- Delete requires a native modal naming the session, initially focused on Cancel. App saves the filtered library before publishing state; failure keeps the dialog/error and original session. Deleting the active session selects the first remaining session, or shows the empty state.
- Session menu/status strings share the complete UI dictionary and 中 / EN preference.
- Type check, production build, and 22 tests pass, including single-session export/parse fidelity and nonmutation. Existing bundle-size warning remains. Browser verified menu placement, both languages, non-selected card action targeting, exclusive menus, outside dismissal, and deletion Cancel without changing real data. Actual deletion and file download were not exercised against the user's library. Existing dev server was reused and left running.

## Latest startup diagnosis and repair

- Confirmed this computer retained older `node_modules` after pulling newer source. `react-markdown`, `remark-math`, `rehype-katex`, and `katex` were absent. TypeScript could not resolve the Markdown modules; Vite could not resolve `katex/dist/katex.min.css`, preventing startup.
- `pnpm install --frozen-lockfile` installed the missing locked dependencies without changing package.json or pnpm-lock.yaml. Git does not transfer or update node_modules.
- The Windows launcher now checks package manifests for all declared dependencies and devDependencies before starting Vite, and directs users to the locked install command if any are missing. It checks presence, not version freshness: always install after a pull that changes dependencies/lockfile. Type-only packages must not be checked with require.resolve(packageName), since they have no runtime entry point.
- Type check, production build and all 19 tests passed after repair; browser visibly rendered the reading workspace and notes/Parking Lot controls. No user data was changed in verification. The existing nonfatal >500 kB bundle warning remains.
- The test server started for this repair was stopped afterward, leaving the port available for the user's launcher. Do not assume any dev server is currently running.

## Completed product behavior

- Prompt localization: separate `initialReadingPlan.en.ts` and `initialReadingPlan.zhCN.ts` templates share six placeholders and identical JSON schema. `filledPrompt(session, language)` selects the template. The original module retains English compatibility exports. 中 / EN selects prompt and all UI language without translating stored answers. Preference is stored separately at `paper-reading-companion:language` (English default). No runtime translation or icon dependency.
- Localization checks: type check/build and all 21 tests pass, including schema/placeholder parity and survey nonmutation. Browser session “Prompt language check” verified Chinese preview with unchanged answers. Existing dev server was reused and left running.

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
- Browser sample session “Workspace layout check” was used in prior implementation; do not delete sample or real reading data without permission. Server lifecycle for the latest repair is recorded above.
- README documents locked dependency installation after pulls, launcher troubleshooting, the current Parts/Quests import schema and optional markers, notes/Parking Lot, Data export/restore, and complete UI language behavior. Its JSON example was checked through the real parser. Setup helper copy now reflects optional markers for JSON-only input.
- Backup restore uses current session validation; arbitrary ancient pre-survey-migration data is not guaranteed compatible. Backups exported by the current export feature are the intended input. No cloud/cross-tab sync; only explicit file transfer. Temporary whole-section edit buffers and unsubmitted parking input are not persisted; working Markdown/draft and added parking items are.

## Next recommended step

After pulling onto another computer, install with `pnpm install --frozen-lockfile`, run `pnpm test` and `pnpm run build`, then use the launcher or `pnpm run dev`. Do not copy node_modules between machines. The remaining product verification gap is actual JSON download → merge/replace → reload → re-export and Markdown inspection in a disposable library, without replacing the user's real library. Otherwise wait for the next requested feature. New interface strings must include both dictionary entries. Do not add sync, integrations, rich-text tools, or new reading workflows speculatively.
