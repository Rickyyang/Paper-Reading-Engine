# Paper Reading Companion 论文阅读助手

A local React + TypeScript + Vite app for organizing academic paper reading around manual ChatGPT interaction. It prepares predefined prompts, imports reading plans, and keeps Markdown notes and questions together. No backend, accounts, cloud storage, or AI/OpenAI API integration.

一个基于 React + TypeScript + Vite 的本地网页应用，用于配合手动使用 ChatGPT 来组织学术论文阅读。它可以准备预设提示词、导入阅读计划，并将 Markdown 笔记和问题集中管理。无需后端、账户、云存储，也不集成 AI/OpenAI API。

## Install and open 安装与启动

Use Node.js 22.6 or newer and pnpm. From the project folder, on every new computer:
请使用 Node.js 22.6 或更高版本以及 pnpm。在每台新电脑上，进入项目文件夹后运行：

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/). This address points to your own computer. Vite serves the app files; your browser stores your reading data.

On Windows, after installing dependencies, double-click **Start Paper Reading Companion.cmd** instead of running the dev command. It opens your default browser and keeps a visible terminal running. Minimize that window while reading; press **Ctrl+C** or close it to stop the server. Closing only the browser does not stop the server.

The launcher uses Node on PATH, with a fallback to an existing Codex Node runtime. That fallback is not guaranteed on another computer; a normal Node installation is the portable option.

打开 http://127.0.0.1:5173/。这个地址指向你自己的电脑。Vite 负责提供应用文件，阅读数据则保存在浏览器中。
在 Windows 上，安装完依赖后，可以直接双击 Start Paper Reading Companion.cmd，无需运行开发命令。它会打开默认浏览器，并保留一个可见的终端窗口。阅读时可以将该窗口最小化；按 Ctrl+C 或关闭终端窗口即可停止服务器。仅关闭浏览器不会停止服务器。
启动脚本会优先使用 PATH 中的 Node，并在必要时回退到已有的 Codex Node 运行环境。这个后备方式不保证在其他电脑上可用，因此安装标准 Node 是更通用、可迁移的方案。

## After pulling updates or changing computers

Run this after pulling changes to `package.json` or `pnpm-lock.yaml`, then restart the app:

```sh
pnpm install --frozen-lockfile
```

**Git transfers code and the lockfile, not installed dependencies.** Do not copy `node_modules` between computers. Use the committed pnpm lockfile to install the same dependency versions locally.

For example, the Markdown/math features added `react-markdown`, `remark-math`, `rehype-katex`, and `katex`. An older local installation can still start Vite but fail to display the app because these packages or `katex/dist/katex.min.css` are missing. Installing from the lockfile fixes that mismatch.

The launcher checks for missing declared package manifests and prints the install command before opening a broken app. It does not automatically download packages or check whether already installed versions match the lockfile.

### Startup troubleshooting

- **Missing dependencies / failed to resolve an import:** stop the server, run the locked install above, and restart.
- **Node or pnpm not found:** install the missing tool and reopen your terminal so its PATH is refreshed.
- **Port 5173 already in use:** a server may already be running. Open the local address, or stop your previous app terminal before launching again. Do not terminate an unidentified process. The fixed port avoids accidentally switching browser storage locations.
- **Blank or outdated page after installation:** restart the dev server, refresh the browser, and run the build command below to check for remaining errors. Do not clear browser site data as a troubleshooting shortcut; it contains your library.

If dependencies are installed but your shell cannot run a package runner, start Vite directly:

```sh
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort
```

## Reading workflow

1. Create a paper session. It starts in `setup`.
2. Complete the survey: reading purpose, primary reading goal, background, difficulties, effort, and depth. The primary goal defaults to **Basic understanding** and is the central priority of the plan; reading purpose provides context.
3. Copy the filled predefined prompt into ChatGPT and upload the paper there yourself.
4. Paste the response into **Import reading plan**. A valid plan is saved and the session changes to `reading`; invalid input leaves it unchanged.
5. Use the Reading Plan outline or Previous/Next Quest to navigate guidance. The workspace also contains **My understanding** and a **Parking lot** for questions or concepts. Panels can be folded; narrower screens stack them.

Parts and Quests are reading guidance, not a completion checklist. The current workspace does not show completion counters or skim material. Selection starts from `start_here`; quest selection, folding, and note sorting are temporary UI state.

Use **Redo reading setup** inside the upper-right **Data** menu if needed. It retains the current plan until a valid replacement is imported. Older saved plans remain stored, but need a current-format plan to use the workspace.

## Notes

- Write Markdown and LaTeX in the draft field. **Render & continue** appends it to the current working section and clears the draft.
- **Save section** includes any pending draft, creates a saved section, and clears the working fields. Both working Markdown and draft are saved locally before this step.
- Saved sections can be expanded, edited, sorted, or deleted with confirmation. Whole-section editing has Save/Cancel.
- Notes preserve raw Markdown/LaTeX; rendering uses react-markdown and KaTeX with raw HTML disabled and KaTeX trust disabled.

## Reading-plan import format

The importer accepts raw JSON, a generic Markdown code fence, or a `json` code fence. To paste explanatory prose too, enclose the JSON in exactly one pair of marker lines:

```text
--- PAPER_READER_IMPORT_START ---
...JSON, optionally fenced...
--- PAPER_READER_IMPORT_END ---
```

Text outside the markers is ignored. Without markers, paste only JSON or its code fence. The importer does not interpret prose, repair JSON, or perform fuzzy extraction.

Example of the current schema (illustrative reading locations):

```json
{
  "schema_version": 1,
  "record_type": "initial_reading_plan",
  "main_objective": "Understand the paper's central argument",
  "route_summary": "Identify the problem, then connect the method to the results.",
  "parts": [
    {
      "id": "P1",
      "title": "Frame the problem",
      "objective": "Identify the research question and proposed approach.",
      "quests": [
        {
          "id": "Q1.1",
          "title": "Identify the research question",
          "objective": "Explain what problem the paper addresses.",
          "read": ["Abstract", "Introduction"],
          "focus_question": "What problem motivates this work?",
          "completion_condition": "State the problem in your own words."
        }
      ],
      "checkpoint": {
        "question": "How does the proposed approach relate to the problem?"
      }
    }
  ],
  "skim_for_now": [],
  "start_here": {
    "part_id": "P1",
    "quest_id": "Q1.1",
    "instruction": "Read the abstract to identify the research question.",
    "focus_question": "What problem motivates this work?",
    "completion_condition": "State the problem in your own words."
  }
}
```

Validation checks exact field names/types, nonempty Parts and Quest arrays, sequential IDs (`P1`, `P2`; `Q1.1`, `Q1.2`, `Q2.1`), and that `start_here` references an existing Quest in the named Part. Additional fields are rejected. `read` and `skim_for_now` are arrays of strings and may be empty. `skim_for_now` remains part of the stored schema even though the workspace does not display it.

## Save, export, and move your library

Sessions autosave in browser localStorage under `paper-reading-companion:v0`. Use the same browser profile and local address to reopen them. Clearing site data removes them. The app is intended for one tab at a time; no cloud or cross-tab synchronization is provided.

The **Data** menu provides:

- **JSON backup/export:** the entire library, including imported plans, notes, unfinished working sections/drafts, and added Parking Lot items. This is the format for restoring data or moving it to another computer.
- **JSON import/restore:** validates a backup and previews changes before confirmation. Merge matches paper IDs and keeps newer versions; equal/missing timestamp conflicts are disclosed. Replace requires acknowledgement and replaces the local library. Failed storage writes leave existing data intact.
- **Markdown export:** the current paper's setup, reading plan, saved notes, unfinished work, and Parking Lot for reading outside the app. This is not a restorable library backup.

Each sidebar session card also has a **⋯** menu beside its status: redo that session's setup (retaining existing data), export only that session as a restorable JSON backup, or delete it after a confirmation naming the paper. Session exports preserve raw Markdown/LaTeX and use a sanitized `<paper-title>-session.json` filename. Restore them through **Data → Import library**. These menu labels follow the **中 / EN** selection.

Exporting does not save a section, clear notes, or otherwise change the session. To move computers, export JSON on the old computer, transfer the file, and import it using Data on the new one. Pulling the Git repository alone does not move browser data. Unsubmitted Parking Lot input and temporary whole-section edit buffers are not persisted.

## Development

```sh
pnpm test
pnpm run build
pnpm run preview
```

The build runs TypeScript checking before Vite. Tests use Node's built-in test runner. No lint command is configured. Preview may use a different port, which means different browser storage.

Direct verification commands, after dependencies are installed:

```sh
node node_modules/typescript/bin/tsc -b
node node_modules/vite/bin/vite.js build
node --experimental-strip-types --test src/*.test.ts
```

Use the top-right **中 / EN** control to switch the entire application interface and prepared prompts between Simplified Chinese and English. Labels, placeholders, menus, confirmations, validation messages, and date formatting follow the selection immediately. The preference is separate from the reading library. Paper titles, existing survey answers, imported plan content, notes, Markdown/LaTeX, and Parking Lot entries are never translated. New sessions start with “Basic understanding” in English or “基本理解” in Chinese; switching language does not rewrite an existing goal. Reading-depth options have translated labels but retain the same stored values.

Fixed UI messages live in `src/translations.ts`. Add both language versions there rather than placing interface text in components. Validation errors retain message keys and parameters so existing feedback can switch languages without changing the JSON schema or its English field names.

Edit the explicit templates in `src/prompts/initialReadingPlan.en.ts` and `src/prompts/initialReadingPlan.zhCN.ts`; `src/prompts.ts` selects and fills them. The original `initialReadingPlan.ts` retains English compatibility exports. Both templates use `reading_purpose`, `background`, `primary_reading_goal`, `known_difficulties`, `reading_depth`, and `reading_effort` in double braces. Both request the same English JSON keys and fixed IDs, with natural-language values in the selected language. Substitution is deterministic and local.

Both prompts request `$...$` inline math and `$$...$$` display math in the readable plan and JSON values. JSON must escape LaTeX backslashes (`\\`) and line breaks (`\n`). Imported plans use the same Markdown/KaTeX renderer as notes, including titles, objectives, reading locations, questions, checkpoints, and the expandable **Start here** section. Long equations scroll horizontally. The original LaTeX strings stay in storage; rendered HTML is never saved.

Schema validation is in `src/readingPlan.ts`, extraction in `src/parser.ts`, persistence in `src/storage.ts`, backup/restore in `src/backup.ts`, and exports in `src/exports.ts`.

For development context, read [docs/AGENTS.md](docs/AGENTS.md) and [docs/CODEX_STATE.md](docs/CODEX_STATE.md) before making changes.
