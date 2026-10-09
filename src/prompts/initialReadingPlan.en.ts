export const initialReadingPlanPrompt = `
I am starting a new academic paper.

I have uploaded the paper in this conversation. Respond in English, including the human-readable plan and JSON text values. Keep JSON field names, record_type, IDs, and import markers unchanged. Preserve technical symbols, equations, variable names, and paper labels where appropriate.

My reading information is:

Reading purpose (why I am reading; context for the plan):
{{reading_purpose}}

Current background:
{{background}}

Primary reading goal (the most important thing I want to understand):
{{primary_reading_goal}}

Known difficulties:
{{known_difficulties}}

Desired reading depth:
{{reading_depth}}

Available reading effort:
{{reading_effort}}

PRIMARY-GOAL PRIORITY

Treat my Primary reading goal as the key thread of the reading process.

The reading plan should be organized so that each major Part contributes either:
- directly to understanding this goal, or
- to essential supporting knowledge needed to understand it.

Use the Primary reading goal when deciding:
- what deserves close reading,
- what can be skimmed,
- how quests should be ordered,
- how deeply each topic should be studied,
- and what the final understanding should emphasize.

If the Primary reading goal is "Basic understanding", use a balanced paper-wide understanding as the main thread instead.

READING-PLAN PRINCIPLES

1. Adapt the plan to all six survey inputs: reading purpose, current background, primary reading goal, known difficulties, desired reading depth, and available reading effort.

   Treat Primary reading goal as the highest-priority objective and central thread of the entire reading plan. Build the main objective around it. Part selection, quest ordering, reading depth, skim decisions, and starting point must all prioritize it while respecting the available effort.

   Reading purpose explains why I am reading and provides context; it is not necessarily the main organizing principle. Include supporting material only when necessary to understand the primary goal or maintain a coherent understanding of the paper. Do not allow secondary details to dominate the reading route.

   When Primary reading goal is "Basic understanding", create a balanced route covering the paper's main problem, core method, important reasoning, main results, and overall conclusion, without overemphasizing any one technical detail.

2. Inspect the uploaded paper before constructing the route. If it is missing or unreadable, ask me to provide it rather than inventing a plan.

3. Identify one main reading objective for the paper.

4. Choose a useful reading order.
   The route does not need to follow the paper section by section if another order better supports understanding.

5. Divide the paper into a small number of conceptual PARTS.

   Each Part should represent one major stage in understanding the paper.
   A Part should NOT simply correspond to one paper section unless that section naturally forms one conceptual stage.

6. Inside each Part, create several small QUESTS.

   Each Quest should specify:
   - a short title,
   - what I am trying to understand,
   - where I should read,
   - one focus question to keep in mind,
   - and what counts as enough understanding to move on.

   Quests should be small enough to complete in one focused reading segment.

7. At the end of each Part, include one short CHECKPOINT.

   The checkpoint should not introduce new material.
   It should help me reconnect the Quests in that Part and verify that I understand how they fit together before moving to the next Part.

8. Do not use the quests to teach the material in advance.
   A quest should describe the reading task, not contain the solution.

9. Do not predict prerequisite topics or background-learning side quests.
   If unfamiliar concepts appear later while I am reading, I will record them separately.

10. Identify material that can be skimmed or postponed on the first pass.

11. Keep the entire plan lightweight.
    The purpose is to reduce cognitive load, not create another long document that I must study.

12. Be rigorous.
    Base section, equation, figure, theorem, and appendix references on the actual paper.
    If you are uncertain about a reference or the role of something, state that uncertainty rather than inventing references or explanations.

MATHEMATICAL NOTATION

Apply these rules to BOTH the human-readable plan and all JSON reading-plan text values.
Preserve mathematical variables, symbols, sets, and equations using Markdown-compatible LaTeX. Use $...$ for inline math and $$...$$ on separate lines for display math. Do not replace appropriate LaTeX notation with approximate plain-text or Unicode versions. Do not translate variable names, equation symbols, LaTeX commands, equation references, or section/theorem labels.

Inline examples: $\\Theta_t$, $W_k^0$, and $\\mathcal{E}(V,\\beta_k^2)$.
Display example:
$$
e_k \\in \\mathcal{E}(V,\\beta_k^2)
$$

In JSON, escape every LaTeX backslash as two backslashes and encode line breaks as \\n; never put literal line breaks inside a JSON string. After JSON parsing, the string must contain normal LaTeX backslashes and actual line breaks. For example, these are valid JSON string values (illustrations only, not additional schema fields or an extra import block):
\`\`\`json
{
  "focus_question": "How does $\\\\Theta_t$ affect $W_k^0$?",
  "objective": "Understand the tube $\\\\mathcal{E}(V,\\\\beta_k^2)$.",
  "completion_condition": "Explain:\\n\\n$$\\ne_k \\\\in \\\\mathcal{E}(V,\\\\beta_k^2)\\n$$"
}
\`\`\`

RESPONSE FORMAT

Your completed reading-plan response must contain exactly two conceptual sections: the human-readable plan and the website import data.

PART 1 — HUMAN-READABLE READING PLAN

Respond first in normal ChatGPT prose.

Make this section concise and easy to skim.

Use this general structure:

Main objective
- Briefly state what I should try to understand from this paper.

Suggested reading route
- Briefly explain the recommended order and why.

Part 1 — ...
- State the purpose of this Part.

  Quest 1.1 — ...
  - Objective:
  - Read:
  - Focus question:
  - Done when:

  Quest 1.2 — ...
  - Objective:
  - Read:
  - Focus question:
  - Done when:

  Part checkpoint:
  - One short question or reconstruction task that checks whether I understand how the quests in this Part fit together.

Part 2 — ...
- Continue in the same structure.

Skim for now
- Identify material that does not require close reading yet.

Start here
- Give me one concrete first reading task.
- Tell me exactly what to read first.
- Give me one question to keep in mind.
- State what counts as enough understanding to continue.

IMPORTANT:
- Do not turn this section into a detailed paper summary.
- Do not explain the answers to the quest questions.
- Do not start teaching prerequisite concepts.
- Describe the reading tasks and leave the detailed understanding for our later discussion.

PART 2 — WEBSITE IMPORT DATA

After the human-readable plan, output exactly one import block in the format below. Replace the empty strings and example entries with the actual plan. Keep the marker lines outside the fenced Markdown JSON block.

--- PAPER_READER_IMPORT_START ---
\`\`\`json
{
  "schema_version": 1,
  "record_type": "initial_reading_plan",
  "main_objective": "",
  "route_summary": "",
  "parts": [
    {
      "id": "P1",
      "title": "",
      "objective": "",
      "quests": [
        {
          "id": "Q1.1",
          "title": "",
          "objective": "",
          "read": [],
          "focus_question": "",
          "completion_condition": ""
        }
      ],
      "checkpoint": {
        "question": ""
      }
    }
  ],
  "skim_for_now": [],
  "start_here": {
    "part_id": "P1",
    "quest_id": "Q1.1",
    "instruction": "",
    "focus_question": "",
    "completion_condition": ""
  }
}

\`\`\`
--- PAPER_READER_IMPORT_END ---

JSON RULES

- The JSON must be valid JSON.
- Use double quotes for all keys and string values; do not include trailing commas.
- Do not put comments inside the JSON.
- JSON string values should remain simple text, but LaTeX math using $...$ and $$...$$ is allowed and encouraged where mathematical notation is needed. Do not use Markdown headings, tables, or complex formatting inside JSON string values. Escape LaTeX backslashes and line breaks as required by JSON.
- Do not include citations, source markers, footnotes, or ChatGPT file-reference markers inside the JSON.
- Do not add fields that are not in the schema.
- Do not repeat the original survey fields; the website already stores them.
- Use strings for text fields and arrays of strings for read and skim_for_now.
- Use empty arrays when appropriate rather than inventing information.
- Part IDs must be sequential: P1, P2, P3, ...
- Quest IDs must follow their Part: Q1.1, Q1.2, Q2.1, Q2.2, ...
- start_here must identify one existing Part and Quest and give its explicit first task, focus question, and completion condition.
- The structured JSON must describe the SAME reading plan as Part 1.
- Do not introduce additional analysis in the JSON that was not present in Part 1.
`.trim();
