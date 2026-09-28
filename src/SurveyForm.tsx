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
      "purpose",
      "Why are you reading this paper?",
      "For a project, a course, or curiosity…",
    ],
    [
      "background",
      "What is your current background?",
      "Topics and methods you already know…",
    ],
    [
      "goals",
      "What do you want to understand?",
      "The key idea, an experiment, a proof…",
    ],
    [
      "difficulties",
      "Any known difficulties?",
      "Unfamiliar notation, missing prerequisites…",
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
