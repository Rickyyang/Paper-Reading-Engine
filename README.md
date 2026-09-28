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

1. Enter a paper title and create a session.
2. Complete purpose, background, goals, depth, and optional difficulties.
3. Copy the filled predefined prompt. Upload the paper and paste the prompt in ChatGPT yourself.
4. Paste ChatGPT's JSON response into the application and import it.
5. Complete quests and subtasks, edit notes, and add, edit, resolve, or remove questions and side quests.
6. Use the follow-up template for additional reading. It includes current notes, progress, and unresolved questions. Imports append; importing the same response twice creates duplicates.

Quest completion marks all its subtasks complete; unchecking a quest clears its subtasks. Completing every subtask completes its quest.

## Response format

```json
{
  "quests": [
    {
      "title": "Understand the main result",
      "subtasks": ["Read the abstract", "Locate the main claim"],
      "notes": "Start with the introduction."
    }
  ],
  "notes": "Initial reading orientation",
  "questions": ["Which assumptions matter?"],
  "sideQuests": ["Review the prerequisite method"]
}
```

At least one quest and one subtask per quest are required. Notes are strings; questions and sideQuests are arrays of non-empty strings and may be empty. A JSON code fence is accepted. Invalid responses do not modify the session.

## Persistence and scope

Sessions and the active session are saved in localStorage under `paper-reading-companion:v0`, with a versioned envelope. Storage failures are shown visibly. Unreadable saved data is preserved rather than overwritten. Pasted response drafts are temporary until imported. Clearing browser data removes saved sessions. This prototype is intended for one browser tab at a time; there is no cross-tab synchronization or backup/export feature.

Predefined templates live in `src/prompts.ts`; response validation lives in `src/parser.ts`; persistence lives in `src/storage.ts`. Components use ordinary React state. All styles and runtime resources are local. No external API calls are made by the application.
