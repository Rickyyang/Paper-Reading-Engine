import type { Survey } from "./types";
export function SurveyForm({
  survey,
  onChange,
}: {
  survey: Survey;
  onChange: (value: Survey) => void;
}) {
  const fields = [
    [
      "reading_purpose",
      "Reading purpose",
      "Why you are reading: current research, literature review, learning a method, reproduction…",
    ],
    [
      "primary_reading_goal",
      "Primary reading goal",
      "The most important thing you want to understand from this paper…",
    ],
    [
      "background",
      "What is your current background?",
      "Topics and methods you already know…",
    ],
    [
      "difficulties",
      "Any known difficulties?",
      "Unfamiliar notation, missing prerequisites…",
    ],
    [
      "effort",
      "How much reading effort can you spend?",
      "For example, 30 minutes or two focused sessions…",
    ],
  ] as const;
  return (
    <section className="panel">
      <div className="eyebrow">01 / Prepare</div>
      <h2>Your reading survey</h2>
      <p className="muted">
        A little context makes the predefined prompt more useful.
      </p>
      {fields.map(([key, label, placeholder]) => (
        <label key={key}>
          {label}
          <textarea
            rows={2}
            placeholder={placeholder}
            value={survey[key]}
            onChange={(e) => onChange({ ...survey, [key]: e.target.value })}
          />
        </label>
      ))}
      <label>
        Desired reading depth
        <select
          value={survey.depth}
          onChange={(e) =>
            onChange({ ...survey, depth: e.target.value as Survey["depth"] })
          }
        >
          <option>Overview</option>
          <option>Working understanding</option>
          <option>Deep study</option>
        </select>
      </label>
    </section>
  );
}
