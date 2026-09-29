import { useState } from "react";
import type { InitialReadingPlan } from "./readingPlan";

export function ReadingWorkspace({
  plan,
  completedQuestIds,
  onCompletionChange,
}: {
  plan: InitialReadingPlan;
  completedQuestIds: string[];
  onCompletionChange: (ids: string[]) => void;
}) {
  const [openParts, setOpenParts] = useState<string[]>([
    plan.start_here.part_id,
  ]);
  const [currentQuest, setCurrentQuest] = useState(plan.start_here.quest_id);
  const [expandedQuest, setExpandedQuest] = useState<string | null>(
    plan.start_here.quest_id,
  );
  const quests = plan.parts.flatMap((part) => part.quests);
  const completed = quests.filter((quest) =>
    completedQuestIds.includes(quest.id),
  ).length;

  return (
    <section className="reading-workspace" aria-label="Reading workspace">
      <section className="panel">
        <div className="eyebrow">Main objective</div>
        <h2>{plan.main_objective}</h2>
        <p className="route-summary">{plan.route_summary}</p>
        <p className="reading-progress" role="status">
          {completed} / {quests.length} quests complete
        </p>
        <div className="start-callout">
          <strong>Start here</strong>
          <p>{plan.start_here.instruction}</p>
        </div>
      </section>
      {plan.parts.map((part) => {
        const open = openParts.includes(part.id);
        return (
          <section className="panel reading-part" key={part.id}>
            <h2 className="disclosure-heading">
              <button
                className="disclosure-button"
                aria-expanded={open}
                aria-controls={`part-${part.id}`}
                onClick={() =>
                  setOpenParts((parts) =>
                    open
                      ? parts.filter((id) => id !== part.id)
                      : [...parts, part.id],
                  )
                }
              >
                <span className="disclosure-arrow" aria-hidden="true">
                  {open ? "▾" : "▸"}
                </span>
                <span>
                  <span className="eyebrow">Part {part.id.slice(1)}</span>
                  <span className="disclosure-title">{part.title}</span>
                </span>
              </button>
            </h2>
            <div id={`part-${part.id}`} hidden={!open}>
              <p className="part-objective">{part.objective}</p>
              <div className="reading-quests">
                {part.quests.map((quest) => {
                  const expanded = expandedQuest === quest.id;
                  const done = completedQuestIds.includes(quest.id);
                  return (
                    <article
                      className={`reading-quest ${currentQuest === quest.id ? "current-quest" : ""}`}
                      key={quest.id}
                    >
                      <div className="quest-heading">
                        <input
                          type="checkbox"
                          aria-label={`Complete ${quest.id}: ${quest.title}`}
                          checked={done}
                          onChange={(event) =>
                            onCompletionChange(
                              event.target.checked
                                ? [...completedQuestIds, quest.id]
                                : completedQuestIds.filter(
                                    (id) => id !== quest.id,
                                  ),
                            )
                          }
                        />
                        <h3>
                          <button
                            className="disclosure-button"
                            aria-expanded={expanded}
                            aria-controls={`quest-${quest.id}`}
                            onClick={() => {
                              setExpandedQuest(expanded ? null : quest.id);
                              if (!expanded) setCurrentQuest(quest.id);
                            }}
                          >
                            <span
                              className="disclosure-arrow"
                              aria-hidden="true"
                            >
                              {expanded ? "▾" : "▸"}
                            </span>
                            <span className={done ? "completed" : ""}>
                              {quest.id} · {quest.title}
                            </span>
                            {currentQuest === quest.id && (
                              <span className="current-badge">CURRENT</span>
                            )}
                          </button>
                        </h3>
                      </div>
                      <div
                        className="quest-details"
                        id={`quest-${quest.id}`}
                        hidden={!expanded}
                      >
                        <dl>
                          <dt>Objective</dt>
                          <dd>{quest.objective}</dd>
                          <dt>Where to read</dt>
                          <dd>
                            {quest.read.length ? (
                              <ul>
                                {quest.read.map((location, index) => (
                                  <li key={index}>{location}</li>
                                ))}
                              </ul>
                            ) : (
                              "No specific location provided."
                            )}
                          </dd>
                          <dt>Focus question</dt>
                          <dd>{quest.focus_question}</dd>
                          <dt>Completion condition</dt>
                          <dd>{quest.completion_condition}</dd>
                        </dl>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="part-checkpoint">
                <h3>Part checkpoint</h3>
                <p>{part.checkpoint.question}</p>
              </div>
            </div>
          </section>
        );
      })}
      <details className="panel skim-section">
        <summary>Skim for now</summary>
        {plan.skim_for_now.length ? (
          <ul>
            {plan.skim_for_now.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">No material marked for skimming.</p>
        )}
      </details>
    </section>
  );
}
