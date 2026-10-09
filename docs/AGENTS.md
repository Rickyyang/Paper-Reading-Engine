# Paper Reading Companion — project guidance

## Session protocol

- Begin by reading this file and `docs/CODEX_STATE.md`, then inspect only files needed for the task.
- Use these documents as persistent context. Current code/configuration is authoritative when documentation conflicts; correct stale context rather than perpetuating it.
- Update `docs/CODEX_STATE.md` when a milestone, decision, issue, or direction materially changes the handoff. Review it before ending substantial development sessions.
- Update this file only for stable architecture, conventions, or project rules. Keep both documents concise; remove obsolete facts, avoid diaries, and distinguish verified facts from assumptions.
- Preserve existing uncommitted changes. Do not commit, push, or publish unless requested.

## Product and architecture

A personal, local browser application for organizing paper reading around manual ChatGPT interaction. Users fill a survey, copy a predefined local prompt into ChatGPT with their paper, paste a structured response back, and follow the imported plan.

- React 19, TypeScript 5.8 with strict checking, Vite 6; plain CSS and ordinary React state.
- No backend, AI/OpenAI API, direct ChatGPT communication, accounts, authentication, cloud storage, or unnecessary state-management/framework dependencies.
- Prompt preparation is deterministic placeholder substitution, never generated content. The paper is uploaded manually to ChatGPT, not to this app.
- Browser `localStorage` holds a versioned session envelope. Vite serves files only; it does not store reading sessions.
- Prioritize the smallest maintainable implementation and requested scope. Do not add reading features speculatively.

## Source map

- `src/main.tsx`, `index.html`: entry points.
- `src/App.tsx`: setup/reading transition, prompt/import UI, page options, persistence wiring. `src/SessionList.tsx`: per-session menu and deletion confirmation; `src/translations.ts`: complete English/Chinese UI dictionary, interpolation helper, and structured validation errors.
- `src/SurveyForm.tsx`: survey fields; `src/types.ts`: survey/session types and defaults.
- `src/prompts/initialReadingPlan.en.ts` and `initialReadingPlan.zhCN.ts`: explicit language templates with identical placeholders and English JSON keys. `initialReadingPlan.ts` retains English compatibility exports. The 中 / EN control selects the prompt language without translating stored survey values.
- `src/prompts.ts`: actual UI prompt-filling path. Keep its import aligned with the template export.
- `src/parser.ts`: marker/fence handling and JSON parsing; `src/readingPlan.ts`: current schema validation plus legacy saved-plan recognition.
- `src/ReadingWorkspace.tsx`: Part/Quest selection, reading guidance and persisted Parking lot; `src/WorkingNotes.tsx` owns the persisted continuous-section note UI.
- `src/storage.ts`: local persistence, reusable session validation, legacy survey migration.
- `src/backup.ts`, `src/RestoreDialog.tsx`: backup version/validation, merge/replace planning, atomic restore and confirmation UI.
- `src/exports.ts`: JSON/Markdown generation, filenames and Blob downloads; never reconstruct exports from rendered UI.
- `src/styles.css`: shared visual style; `src/*.test.ts`: Node built-in tests.
- `Start Paper Reading Companion.cmd`: Windows launcher, with a machine-specific Codex Node fallback after normal PATH lookup.

## Behavioral contracts

- Session `state` is `setup` or `reading`. Only a valid plan import or validated backup restore introduces reading state. Errors must not mutate the saved plan or session state.
- Keep survey, prompt, import schema, and tests consistent when changing the contract. Preserve saved sessions through explicit compatibility handling rather than deleting incompatible data.
- `reading_purpose` is context; `primary_reading_goal` (default `Basic understanding`) organizes the plan. Do not conflate them.
- All application-authored UI text, including accessibility labels, errors, and confirmations, must use `translations.ts` in both languages. Pass language to components; do not translate user/GPT content, stored survey answers, Markdown, or schema keys. New sessions use the selected language's goal default (`Basic understanding` / `基本理解`); depth option values stay canonical English. `UiError` keeps English Error.message compatibility while the UI formats its key/parameters at render time. Document title/lang and displayed dates follow the selected language. Prompt templates stay separate and predefined.
- Accept marker-wrapped responses, raw JSON, and generic/JSON Markdown fences. Without markers, reject surrounding prose; never fuzzy-extract or repair JSON.
- Imported plans are guidance only: no completion controls or counters. Retain saved completion fields for compatibility; the existing import flow resets them on replacement. Parking lot items persist on the session for backup/restore. Session updatedAt advances only on content changes. Working-section Markdown and draft persist in session.workspaceState, separate from savedSections. Render & continue appends raw Markdown with a blank line; Save section includes pending draft and clears the working section. Section edits retain ID/createdAt/context and set updatedAt; deletion requires confirmation. Legacy savedNotes are preserved and used as initial saved sections only when workspaceState is absent.
- Imported plan text and notes share MarkdownNote (react-markdown, remark-math, rehype-katex); raw HTML is disabled and KaTeX trust is false. Plan titles use its inline mode for valid heading/button markup without nested links; notes retain the default block mode. Preserve original Markdown/LaTeX source and render only in the display layer; never store rendered HTML. Both prompt templates require $...$ / $$...$$ math and correct JSON backslash/newline escaping. Keep long equations locally scrollable. Retain accessible labels, keyboard controls, and disclosure states.
- Backup version is centralized in `backup.ts`. Validate the entire backup before confirmation; restore storage atomically before publishing React state. Preserve IDs/raw text/timestamps; never silently duplicate IDs. Merge conflicts with equal/missing timestamps must be disclosed. Replace requires explicit acknowledgement.
- Preserve the existing restrained green/neutral style. Global library controls remain in the upper-right Data menu. Each sidebar card has a compact session-only menu for redo, JSON export, and confirmed deletion. Single-session JSON uses the same backup envelope with one paper; preserve all raw fields. Deletion writes storage before publishing state and must leave the session unchanged on storage failure.

## Commands and portability

Use Node.js 22.6+ (Node 24 was used in development). `pnpm-lock.yaml` is the existing lockfile; use pnpm on a fresh checkout (`pnpm install --frozen-lockfile`), as documented in README. Do not introduce a competing lockfile without a reason. Scripts can also run through npm once dependencies are installed.

| Purpose              | Command                                                       |
| -------------------- | ------------------------------------------------------------- |
| Development          | `pnpm run dev` (or `npm run dev`)                             |
| Type check           | `node node_modules/typescript/bin/tsc -b`                     |
| Production build     | `pnpm run build` (or `npm run build`)                         |
| Tests                | `pnpm test` (or `npm test`)                                   |
| Production preview   | `pnpm run preview`                                            |
| Format touched files | `node node_modules/prettier/bin/prettier.cjs --write <files>` |

No lint script/configuration is installed. Tests use Node's built-in runner with TypeScript stripping; test files are excluded from the app's TypeScript build.

If a shell has Node but no working package runner, after installing dependencies:

```sh
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
node --experimental-strip-types --test src/*.test.ts
```

After cloning or pulling changes to package.json/pnpm-lock.yaml, run `pnpm install --frozen-lockfile` on that computer before launching. Git does not install dependencies; do not copy node_modules between machines. The launcher checks for missing declared package manifests and explains how to install them, but does not verify installed versions or automatically download packages.

Dev origin is `http://127.0.0.1:5173/`; strict port prevents silently switching storage origins. The Windows launcher opens the browser and keeps a visible terminal running. Stop only servers you started, and say whether you left one running. Do not kill an unidentified process occupying the port.

Reading data belongs to the browser profile and origin, not the repository. Another computer/browser or clearing site data will not retain it; JSON backup and Markdown export are available, with local JSON merge/replace restore; cloud sync is not available. Do not assume Codex runtime paths or installed dependencies exist on other computers.

Do not hand-edit generated/vendor directories (`dist/`, `node_modules/`, `.pnpm-store/`) or `*.tsbuildinfo`. Do not modify `.git` internals or erase browser data to fix an application problem. Run relevant tests and the build for code changes; UI changes need targeted browser checks when available, not redundant tests that mirror markup.
