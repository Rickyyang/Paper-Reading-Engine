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

打开 [http://127.0.0.1:5173/](http://127.0.0.1:5173/)。这个地址指向你自己的电脑。Vite 负责提供应用文件，阅读数据则保存在浏览器中。
在 Windows 上，安装完依赖后，可以直接双击 Start Paper Reading Companion.cmd，无需运行开发命令。它会打开默认浏览器，并保留一个可见的终端窗口。阅读时可以将该窗口最小化；按 Ctrl+C 或关闭终端窗口即可停止服务器。仅关闭浏览器不会停止服务器。
启动脚本会优先使用 PATH 中的 Node，并在必要时回退到已有的 Codex Node 运行环境。这个后备方式不保证在其他电脑上可用，因此安装标准 Node 是更通用、可迁移的方案。

## Reading workflow 阅读流程

1. Create a paper session. It starts in `setup`.
2. Complete the survey: reading purpose, primary reading goal, background, difficulties, effort, and depth. The primary goal defaults to **Basic understanding** and is the central priority of the plan; reading purpose provides context.
3. Copy the filled predefined prompt into ChatGPT and upload the paper there yourself.
4. Paste the response into **Import reading plan**. A valid plan is saved and the session changes to `reading`; invalid input leaves it unchanged.
5. Use the Reading Plan outline or Previous/Next Quest to navigate guidance. The workspace also contains **My understanding** and a **Parking lot** for questions or concepts. Panels can be folded; narrower screens stack them.

Parts and Quests are reading guidance, not a completion checklist. The current workspace does not show completion counters or skim material. Selection starts from `start_here`; quest selection, folding, and note sorting are temporary UI state.

Use **Redo reading setup** inside the upper-right **Data** menu if needed. It retains the current plan until a valid replacement is imported. Older saved plans remain stored, but need a current-format plan to use the workspace.

1. 创建一个论文阅读会话。新会话会从 `准备中` 状态开始。
2. 完成阅读问卷，包括：阅读目的、主要阅读目标、已有背景、已知困难、可投入精力和期望阅读深度。主要阅读目标默认设置为 **基本理解**，并作为整个阅读计划的核心优先级；阅读目的用于提供阅读背景。
3. 将网页填充好的预设提示词复制到自己使用的 AI 助手中，并在那里上传论文。
4. 将 AI 助手的回复粘贴到 导入阅读计划 中。有效的阅读计划会被保存，同时会话状态切换为 **阅读中**；无效输入不会改变当前会话。
5. 使用 **阅读计划** 大纲，或 **上一个任务 / 下一个任务** 在不同阅读指引之间导航。工作区还包括 **我的理解** 笔记区，以及用于暂存问题或概念的 **暂存区**。各面板均可折叠；在较窄屏幕上会自动纵向排列。
**阶段** 和 **任务** 用于提供阅读指引，而不是必须逐项完成的任务清单。当前工作区不会显示完成计数，也不会显示略读材料。任务选择、面板折叠状态和笔记排序属于临时 UI 状态。
如有需要，可以使用右上角 **数据** 菜单或左侧会话卡片右下角下拉菜单中的 **重新设置阅读计划**。在成功导入新的有效阅读计划之前，当前计划会继续保留。以前保存的旧计划仍会继续存储，但需要使用当前格式的阅读计划才能正常使用工作区。

## Notes 笔记

- Write Markdown and LaTeX in the draft field. **Render & continue** appends it to the current working section and clears the draft.
- **Save section** includes any pending draft, creates a saved section, and clears the working fields. Both working Markdown and draft are saved locally before this step.
- Saved sections can be expanded, edited, sorted, or deleted with confirmation. Whole-section editing has Save/Cancel.
- Notes preserve raw Markdown/LaTeX; rendering uses react-markdown and KaTeX with raw HTML disabled and KaTeX trust disabled.

- 在草稿输入框中编写 Markdown 和 LaTeX。点击 **渲染并继续** 后，内容会追加到当前工作段落，并清空草稿输入框。
- 点击 **保存段落** 时，会先包含尚未提交的草稿内容，然后创建一个已保存段落，并清空当前工作区。在此之前，当前工作 Markdown 和草稿内容都会自动保存在本地。
- 已保存段落可以展开、编辑、排序或删除；删除时需要确认。整段编辑支持 保存 / 取消。
- 笔记始终保留原始 Markdown/LaTeX 文本；显示时使用 react-markdown 和 KaTeX 进行渲染。原始 HTML 被禁用，同时关闭 KaTeX 的 trust 选项。

## Reading-plan import format 阅读计划导入格式

The importer accepts raw JSON, a generic Markdown code fence, or a `json` code fence. To paste explanatory prose too, enclose the JSON in exactly one pair of marker lines:

导入器支持原始 JSON、普通 Markdown 代码块，或带有 `json` 标记的代码块。如果还需要一并粘贴 AI 助手生成的解释性文字，请使用且仅使用一对如下标记，将 JSON 内容包裹其中：

```text
--- PAPER_READER_IMPORT_START ---
...JSON, optionally fenced...
--- PAPER_READER_IMPORT_END ---
```

Text outside the markers is ignored. Without markers, paste only JSON or its code fence. The importer does not interpret prose, repair JSON, or perform fuzzy extraction.

Example of the current schema (illustrative reading locations):

标记之外的文字会被忽略。如果不使用标记，则只能粘贴 JSON 本身或包含 JSON 的代码块。导入器不会解析普通说明文字，也不会自动修复 JSON 或进行模糊提取。
当前 schema 示例（其中阅读位置仅作示意）：

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

验证过程会检查字段名和字段类型是否完全匹配、Parts 与 Quest 数组是否非空、ID 是否按顺序排列（如`P1`, `P2`; `Q1.1`, `Q1.2`, `Q2.1`），并确认 `start_here` 引用的 Quest 确实存在于指定 Part 中。额外字段会被拒绝。
`read` 和 `skim_for_now`都是字符串数组，可以为空。虽然当前工作区不会显示 `skim_for_now`，但它仍然属于保存的数据。

## Save, export, and move your library 保存、导出与迁移论文库

Sessions autosave in browser localStorage under `paper-reading-companion:v0`. Use the same browser profile and local address to reopen them. Clearing site data removes them. The app is intended for one tab at a time; no cloud or cross-tab synchronization is provided.

The **Data** menu provides:

- **JSON backup/export:** the entire library, including imported plans, notes, unfinished working sections/drafts, and added Parking Lot items. This is the format for restoring data or moving it to another computer.
- **JSON import/restore:** validates a backup and previews changes before confirmation. Merge matches paper IDs and keeps newer versions; equal/missing timestamp conflicts are disclosed. Replace requires acknowledgement and replaces the local library. Failed storage writes leave existing data intact.
- **Markdown export:** the current paper's setup, reading plan, saved notes, unfinished work, and Parking Lot for reading outside the app. This is not a restorable library backup.


Each sidebar session card also has a **⋯** menu beside its status: redo that session's setup (retaining existing data), export only that session as a restorable JSON backup, or delete it after a confirmation naming the paper. Session exports preserve raw Markdown/LaTeX and use a sanitized `<paper-title>-session.json` filename. Restore them through **Data → Import library**. These menu labels follow the **中 / EN** selection.

Exporting does not save a section, clear notes, or otherwise change the session. To move computers, export JSON on the old computer, transfer the file, and import it using Data on the new one. Pulling the Git repository alone does not move browser data. Unsubmitted Parking Lot input and temporary whole-section edit buffers are not persisted.

会话会自动保存在浏览器的 localStorage 中，对应键名为`paper-reading-companion:v0`。重新打开时，应使用相同的浏览器配置文件和本地地址。清除站点数据会删除这些会话。当前应用按单标签页使用进行设计，不提供云同步或跨标签页同步。

**数据** 菜单提供以下功能：
- **JSON 备份 / 导出：** 导出整个论文库，包括已导入的阅读计划、笔记、未完成的工作段落/草稿，以及已经添加到暂存区中的内容。该格式可用于恢复数据或迁移到另一台电脑。
- **JSON 导入 / 恢复：** 导入前会验证备份文件，并在确认前预览变化。合并模式会根据论文 ID 匹配会话并保留较新的版本；如果时间戳相同或缺失，会明确提示冲突。替换模式需要确认，并会用导入的数据替换本地论文库。如果写入本地存储失败，现有数据会保持不变。
- **Markdown 导出：** 导出当前论文的阅读设置、阅读计划、已保存笔记、未完成内容和暂存区，便于在应用外阅读。Markdown 导出不能用于恢复整个论文库。

左侧栏中的每个阅读会话卡片，在状态旁边都有一个 **⋯** 菜单。可以通过该菜单重新设置当前会话的阅读计划（保留已有数据）、仅导出该会话的可恢复 JSON 备份，或在显示论文标题并确认后删除该会话。
单会话导出会保留原始 Markdown/LaTeX 内容，并使用清理后的 `<paper-title>-session.json` 文件名。可以通过 **数据 → 导入论文库** 进行恢复。相关菜单文字会随 **中 / EN** 语言选择切换。
导出操作不会自动保存当前段落、清空笔记，也不会以其他方式修改当前会话。更换电脑时，应先在旧电脑导出 JSON 文件，将其传输到新电脑，再通过 数据 菜单导入。仅拉取 Git 仓库不会迁移浏览器中的阅读数据。尚未提交的暂存区输入，以及临时的整段编辑缓冲内容，不会被持久保存。

### Startup troubleshooting 启动故障排查

- **Missing dependencies / failed to resolve an import:** stop the server, run the locked install above, and restart.
- **Node or pnpm not found:** install the missing tool and reopen your terminal so its PATH is refreshed.
- **Port 5173 already in use:** a server may already be running. Open the local address, or stop your previous app terminal before launching again. Do not terminate an unidentified process. The fixed port avoids accidentally switching browser storage locations.
- **Blank or outdated page after installation:** restart the dev server, refresh the browser, and run the build command below to check for remaining errors. Do not clear browser site data as a troubleshooting shortcut; it contains your library.


If dependencies are installed but your shell cannot run a package runner, start Vite directly:

- 缺少依赖 / 无法解析导入： 停止服务器，执行上面的锁定安装命令，然后重新启动。
- 找不到 Node 或 pnpm： 安装缺失的工具，并重新打开终端，使 PATH 更新生效。
- 5173 端口已被占用： 可能已有服务器正在运行。可以直接打开本地地址，或者先关闭之前运行应用的终端再重新启动。不要随意终止无法确认身份的进程。固定使用该端口可以避免浏览器意外切换到另一套本地存储位置。
- 安装后页面空白或内容过旧： 重新启动开发服务器、刷新浏览器，并运行下方的构建命令检查是否仍有错误。不要把清除浏览器站点数据当作常规排查方式，因为其中保存着你的论文库。
如果依赖已经安装，但当前 shell 无法运行包执行器，可以直接启动 Vite：

```sh
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort
```


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

