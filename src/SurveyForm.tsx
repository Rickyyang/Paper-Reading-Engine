import { translations } from "./translations";
import type { PromptLanguage } from "./prompts";
import type { Survey } from "./types";
export function SurveyForm({
  language,
  survey,
  onChange,
}: {
  language: PromptLanguage;
  survey: Survey;
  onChange: (value: Survey) => void;
}) {
  const t = translations[language];
  const fields = [
    ["reading_purpose", t.purpose, t.purposePlaceholder],
    ["primary_reading_goal", t.primaryGoal, t.goalPlaceholder],
    ["background", t.background, t.backgroundPlaceholder],
    ["difficulties", t.difficulties, t.difficultiesPlaceholder],
    ["effort", t.effort, t.effortPlaceholder],
  ] as const;
  return (
    <section className="panel">
      <div className="eyebrow">{t.prepare}</div>
      <h2>{t.surveyTitle}</h2>
      <p className="muted">{t.surveyHelp}</p>
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
        {t.depth}
        <select
          value={survey.depth}
          onChange={(e) =>
            onChange({ ...survey, depth: e.target.value as Survey["depth"] })
          }
        >
          <option value="Overview">{t.overview}</option>
          <option value="Working understanding">
            {t.workingUnderstanding}
          </option>
          <option value="Deep study">{t.deepStudy}</option>
        </select>
      </label>
    </section>
  );
}
