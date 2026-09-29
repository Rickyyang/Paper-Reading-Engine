# Paper Reading Companion

A small, local React + TypeScript + Vite application for organizing a manual paper-reading workflow with ChatGPT. No backend, accounts, cloud storage, or AI/API integration.

## Run

On Windows, double-click `Start Paper Reading Companion.cmd` in this folder. It starts Vite and opens your default browser. Keep its terminal window open; closing it stops the server. If the app is already running, open http://127.0.0.1:5173/ directly. The launcher requires installed dependencies and either Node.js on PATH or the existing Codex Node runtime.

Install Node.js (22.6 or newer) with npm, then:

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Use the same browser and address each time: localStorage belongs to an origin (including its port). For build and validation:

```sh
npm run build
npm test
```

Dependencies are already installed in this workspace. If your shell has Node but no npm command, start it directly:

```sh
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort
```

## Workflow

1. Enter a paper title and create a session. New sessions begin in `setup`.
2. Complete reading purpose, background, primary reading goal (default: Basic understanding), depth, optional difficulties, and available reading effort.
3. Copy the filled predefined prompt. Upload the paper and paste the prompt in ChatGPT yourself.
4. Paste ChatGPT's entire response into the application and import it. The parser extracts only the JSON between the exact import markers; the human-readable portion is ignored.
5. A successful import saves the plan and switches to the reading workspace. It displays the main objective, route summary, starting instruction, collapsible Parts and Quests, Part checkpoints, and collapsed skim material. The Part and Quest in `start_here` open initially. Opening another Quest marks it CURRENT and closes the previous Quest's details. Checkboxes save completion with the session and update the completed/total count.
6. Use **Redo reading setup** inside the upper-right **⋯** control to return to `setup`. The saved plan and completion are retained until a valid new import replaces the plan and resets completion. Older checklist data is preserved separately.

Invalid imports leave the session in setup without changing saved plan data. Session state and quest completion survive reopening; disclosure state starts again from `start_here`. Plans saved in the older format remain stored but need a current Parts-and-Quests plan to use this workspace. No notes, side quests, checkpoint recording, or additional prompts are provided by the workspace.

## Response format

```text
Here is a readable explanation of your reading plan...

--- PAPER_READER_IMPORT_START ---
{
  "schema_version": 1,
  "record_type": "initial_reading_plan",
  "main_quest": { "title": "Understand the main result" },
  "quests": [
    {
      "title": "Understand the main result",
      "subtasks": ["Read the abstract", "Locate the main claim"],
      "notes": "Start with the introduction."
    }
  ],
  "starting_point": { "instruction": "Read the abstract" }
}
--- PAPER_READER_IMPORT_END ---
```

Exactly one pair of markers is required. An optional Markdown json code fence inside the markers is accepted. The minimum schema requires numeric `schema_version: 1`, `record_type: "initial_reading_plan"`, non-null `main_quest` and `starting_point`, and a `quests` array. Nested structures are intentionally not constrained yet. The entire parsed object, including additional fields, is saved in `session.readingPlan`. There is no natural-language interpretation, JSON repair, or fuzzy parsing. Invalid responses do not modify the session or the saved plan.

## Persistence and scope

Sessions and the active session are saved in localStorage under `paper-reading-companion:v0`, with a versioned envelope. Storage failures are shown visibly. Unreadable saved data is preserved rather than overwritten. Pasted response drafts are temporary until imported. Clearing browser data removes saved sessions. This prototype is intended for one browser tab at a time; there is no cross-tab synchronization or backup/export feature.

Edit prompt wording in `src/prompts/initialReadingPlan.ts`. The six placeholders are `reading_purpose`, `background`, `primary_reading_goal`, `known_difficulties`, `reading_depth`, and `reading_effort`, each surrounded by double braces. `src/prompts.ts` substitutes survey values in a single deterministic pass; blank difficulties and effort use "None specified" and "Not specified". Existing surveys gain an empty effort field when loaded.

The import type, marker constants, and minimum validation live in `src/readingPlan.ts`; extraction and JSON parsing live in `src/parser.ts`; persistence lives in `src/storage.ts`. Components use ordinary React state. All styles and runtime resources are local. No external API calls are made by the application.
