# Current development handoff

Verified against the working tree on 2026-10-01. This is current state, not a development diary. Read `docs/AGENTS.md` first.

## Goal and milestone

Test whether a lightweight, manually ChatGPT-assisted paper-reading workflow is useful. Version 0 now has a three-column reading workspace with persisted continuous working sections and a temporary parking lot. Preserve the narrow scope and existing style.

## Implemented behavior

- New sessions start in setup. Survey order: reading purpose, primary reading goal, background, difficulties, effort, depth. Primary goal defaults to `Basic understanding` and can be replaced.
- Local prompt prioritizes that primary goal and asks for a concise human-readable plan plus its JSON equivalent. It does not teach the paper or invent background side quests.
- Imports accept raw JSON, generic/JSON fences, or one marker-wrapped block with surrounding prose. Parsing and schema errors leave the existing session unchanged.
- Successful import stores `readingPlan`, clears `completedQuestIds`, and enters reading. Setup UI is hidden.
- Desktop workspace has a narrow hierarchical Part/Quest selector, a larger guidance-and-notes center, and a narrow Parking lot. At 1200px and below these stack in plan, guidance/notes, parking-lot order. Selected items are highlighted; skim material and completion controls/counters are not rendered. One Quest's details are expanded at a time.
- Initial selection uses the Quest matching both `start_here` IDs, with a first-available-Quest fallback. Selecting a Part shows its objective/checkpoint; selecting a Quest shows its objective, read locations, focus question, and completion condition. These are guidance, not mandatory tasks.
- A visible but restrained **⋯** control sits upper-right, below Saved locally, aligned with Reading session. Redo reading setup is inside it and preserves existing plan/progress until a valid replacement import.
- My understanding uses one continuous working Markdown string, rendered above a separate writing draft. Render & continue appends nonblank draft with a blank line, clears and focuses the draft, and does not create a saved section. Edit current section edits the whole raw source with Save edit/Cancel. Save section includes pending draft, records current Part/Quest context, and clears both working fields. Saved Sections appears directly below, all collapsed by default including after saving. Headers show only section number and created timestamp; Part/Quest metadata remains stored but hidden. A local Newest first / Oldest first control changes display order only. Expanded sections reveal rendered content and Edit/Delete. Edit current section sits beside the Current section heading and appears only for nonblank content. Editing preserves ID/createdAt/context and sets updatedAt. Both working Markdown and draft persist locally across session changes/reloads. MarkdownNote and KaTeX rendering remain unchanged; Parking lot remains temporary.
- Reading Plan folds to clickable Part numbers and Quest IDs with selection highlighting. Parking lot and the far-left app controls sidebar (brand, new session, session list) hide their contents when folded. The paper header stays visible; its former fold control was removed. The app sidebar shrinks from 270px to a 54px desktop rail with an expand button. All folds preserve workspace state and free desktop width for the center. The main workspace has no maximum-width cap, so collapsing the app sidebar uses all freed width even on wide monitors. Fold state is temporary.
- Previous Quest (bottom-left) and Next Quest (bottom-right) follow imported order across Parts and disable at their respective endpoints. From Part guidance it selects that Part's first Quest. It preserves the draft and never marks completion.

## Current data contract and decisions

`src/readingPlan.ts` is the authoritative import contract:

- Top level: `schema_version: 1`, `record_type: "initial_reading_plan"`, `main_objective`, `route_summary`, `parts`, `skim_for_now`, `start_here`.
- Part: `id`, `title`, `objective`, `quests`, `checkpoint: { question }`.
- Quest: `id`, `title`, `objective`, `read: string[]`, `focus_question`, `completion_condition`.
- Start: `part_id`, `quest_id`, `instruction`, `focus_question`, `completion_condition`.
- Exact fields and text types are checked; extra fields are rejected. Parts and their Quests must be nonempty and sequentially named P1/P2 and Q1.1/Q1.2/Q2.1. Start must reference an existing Quest within the named Part. Text may be empty; read/skim arrays may be empty. No semantic fact-checking of references is performed.

Storage key is `paper-reading-companion:v0`, envelope version 1. Old schema used the same version and `record_type`, so structural legacy recognition remains necessary. Old `main_quest`/top-level `quests`/`starting_point` plans load but do not render as current plans; the page directs users to redo setup. New imports require the current schema.

Session types retain legacy fields for compatibility. Optional workspaceState holds workingSection { markdown, draft } and savedSections { id, markdown, createdAt, updatedAt, partId, partTitle, questId, questTitle }. Metadata is nullable for migrated notes. New sections always have createdAt; later edits set updatedAt. noteSections.ts supplies legacy savedNotes conversion only when workspaceState is absent; original legacy data remains intact and cannot resurrect deleted sections after workspaceState exists. Storage validates the new fields before loading; malformed data is not overwritten. Only raw Markdown is stored.

## Validation and relevant files

- Note UI verification: all 11 tests pass; browser verified newest/oldest sorting with stable labels, collapsed defaults, hidden metadata, Edit placement, and expanded-only content/actions. A local dev server was started for verification and left running at http://127.0.0.1:5173/.

- Current section workflow: build and all 11 tests pass. Tests cover raw append, legacy conversion, unfinished-work persistence, edits, deleted-section non-resurrection, and malformed-state rejection. Browser verified repeated rendering as one section, reload recovery of both fields, whole-section Cancel/Save edit, saving pending draft and clearing, default collapses, and saved-section edits with updated timestamp. Existing local server left running; test session retains sample section data.

- Markdown verification: build and nine tests passed, including raw Markdown/LaTeX storage round-trip. Browser checked all requested Markdown elements, four math expressions with no KaTeX errors, Edit/Preview source preservation, saved-note source after reload, rendering after edit, disabled raw HTML, and horizontal scrolling of long display math. KaTeX increases bundle size and Vite reports its standard chunk-size warning. Existing server left running.
- Last code verification: TypeScript check and Vite production build passed; all nine Node tests passed (parser, prompt filling/default, storage/legacy migration/completion persistence).
- Latest note/navigation checks: build and nine tests passed, including metadata validation and legacy notes. Browser verified Previous/Next, Quest and Part-only saving, newest-first ordering, editing with original timestamp, reload persistence, and the deletion confirmation prompt. Existing server left running.
- Width check: at a 1920px viewport, collapsing the app sidebar expanded main from 1635px to 1851px (the full 216px released). Build and nine tests passed; existing server left running.
- Sidebar correction: browser-checked app sidebar collapse/expand preserves the selected Quest and unsaved draft while keeping the paper header visible. Build and all nine tests pass. No server started or stopped.
- Previous browser check: verified folding preserves drafts/parking items, compact plan labels, Next Quest across Parts/final disabled state, saving clears the draft, and saved text survives reload. At 1440px the center grew from about 580px to 787px with both sides folded; mobile had no horizontal overflow. Workspace layout check remains with a saved test note. Existing server used; none started or stopped.
- Core files for next work: `src/ReadingWorkspace.tsx`, `src/App.tsx`, `src/readingPlan.ts`, `src/storage.ts`, `src/types.ts`, `src/styles.css`.
- Prompt edits: `src/prompts/initialReadingPlan.ts` plus `src/prompts.ts`. The latter is the UI filling path; the template file also exports a helper not currently called by the UI. Keep exports aligned: a former `initialReadingPlanTemplate` import caused a blank page; this was fixed to `initialReadingPlanPrompt`.

## Known gaps and constraints

- README's response-format section is stale: it shows the old schema, says markers are mandatory, and says extra fields are accepted. Its workflow section is newer. Use the code/schema above until the README is corrected.
- Setup help text in `App.tsx` says only the marked JSON block is saved, though JSON-only imports are supported. This is a copy discrepancy, not a parsing limitation.
- Storage is single-browser/origin and intended for one tab. No cross-tab synchronization, backup/export, or cross-computer reading-data transfer exists. These context files transfer development knowledge only.
- New-machine setup must install dependencies. The previous environment had Node but no npm command, so direct Node tool commands were used. Do not assume this limitation exists elsewhere.
- Existing uncommitted implementation changes were present when these handoff files were created. Inspect Git status and preserve them; this context task does not commit or push them.
- No additional runtime defect was established in the last checks. UI automation used local test sessions; do not confuse sample data with user paper content or remove it without authorization.

## Next recommended step

Correct stale README import documentation and setup helper copy when requested. Collect the user's next workspace requirement. Do not independently add formatting toolbars, WYSIWYG, side quests, automatic progression, or a new workflow.

Before ending substantial future sessions, update this file to state what changed, what remains unresolved, and the next useful step; replace outdated entries instead of appending a log.
