# Current development handoff

Verified against the working tree on 2026-09-29. This is current state, not a development diary. Read `AGENTS.md` first.

## Goal and milestone

Test whether a lightweight, manually ChatGPT-assisted paper-reading workflow is useful. The first schema-driven reading workspace is implemented. No new feature milestone has been requested; preserve the narrow scope and existing style.

## Implemented behavior

- New sessions start in setup. Survey order: reading purpose, primary reading goal, background, difficulties, effort, depth. Primary goal defaults to `Basic understanding` and can be replaced.
- Local prompt prioritizes that primary goal and asks for a concise human-readable plan plus its JSON equivalent. It does not teach the paper or invent background side quests.
- Imports accept raw JSON, generic/JSON fences, or one marker-wrapped block with surrounding prose. Parsing and schema errors leave the existing session unchanged.
- Successful import stores `readingPlan`, clears `completedQuestIds`, and enters reading. Setup UI is hidden.
- Workspace shows main objective, route summary, Start here instruction, collapsible Parts and Quests, Part checkpoint questions, and collapsed skim material. One Quest's details are expanded at a time.
- `start_here` sets the initial open Part/Quest and CURRENT badge. Opening another Quest changes CURRENT. Completion does not auto-advance. Disclosure/current selection is temporary and resets to `start_here` on remount; completion persists and shows a completed/total count.
- A visible but restrained **⋯** control sits upper-right, below Saved locally, aligned with Reading session. Redo reading setup is inside it and preserves existing plan/progress until a valid replacement import.
- No workspace notes, side quests, checkpoint recording, follow-up prompts, or other reading features are implemented in this version.

## Current data contract and decisions

`src/readingPlan.ts` is the authoritative import contract:

- Top level: `schema_version: 1`, `record_type: "initial_reading_plan"`, `main_objective`, `route_summary`, `parts`, `skim_for_now`, `start_here`.
- Part: `id`, `title`, `objective`, `quests`, `checkpoint: { question }`.
- Quest: `id`, `title`, `objective`, `read: string[]`, `focus_question`, `completion_condition`.
- Start: `part_id`, `quest_id`, `instruction`, `focus_question`, `completion_condition`.
- Exact fields and text types are checked; extra fields are rejected. Parts and their Quests must be nonempty and sequentially named P1/P2 and Q1.1/Q1.2/Q2.1. Start must reference an existing Quest within the named Part. Text may be empty; read/skim arrays may be empty. No semantic fact-checking of references is performed.

Storage key is `paper-reading-companion:v0`, envelope version 1. Old schema used the same version and `record_type`, so structural legacy recognition remains necessary. Old `main_quest`/top-level `quests`/`starting_point` plans load but do not render as current plans; the page directs users to redo setup. New imports require the current schema.

Session types still retain legacy `stage`, `quests`, `notes`, `questions`, and `sideQuests` fields for compatibility. Do not mistake them for active feature requirements or delete saved data casually. Storage migrates old purpose/goal field names and missing effort. Current completion is `completedQuestIds?: string[]`, separate from the immutable imported plan.

## Validation and relevant files

- Last code verification: TypeScript check and Vite production build passed; all nine Node tests passed (parser, prompt filling/default, storage/legacy migration/completion persistence).
- Last browser check: imported a two-Part/three-Quest sample starting at P2/Q2.2; verified correct initial expansion, one-Quest-at-a-time behavior, CURRENT movement, progress updates, and completion after reload.
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

Correct the stale README import example/requirements and setup helper copy to match the current schema and accepted input formats. Then test a real imported paper plan and collect the user's next specific workspace requirement. Do not independently add notes, side quests, automatic progression, or a new workflow.

Before ending substantial future sessions, update this file to state what changed, what remains unresolved, and the next useful step; replace outdated entries instead of appending a log.
