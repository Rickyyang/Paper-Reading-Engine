import { translations, formatMessage } from "./translations";
import type { PromptLanguage } from "./prompts";
import { useState } from "react";
import type { ParkingItem } from "./exports";
import type { InitialReadingPlan } from "./readingPlan";
import type { NoteWorkspaceState } from "./types";
import { WorkingNotes } from "./WorkingNotes";
import { MarkdownNote } from "./MarkdownNote";

type Selection = { partId: string; questId?: string };

export function ReadingWorkspace({
  language,
  plan,
  workspaceState,
  onWorkspaceChange,
  onParkingChange,
  parkingItems,
}: {
  language: PromptLanguage;
  plan: InitialReadingPlan;
  workspaceState: NoteWorkspaceState;
  onWorkspaceChange: (state: NoteWorkspaceState) => void;
  onParkingChange: (items: ParkingItem[]) => void;
  parkingItems: ParkingItem[];
}) {
  const t = translations[language];
  // null represents Overview; it is deliberately outside the Quest order.
  const [selection, setSelection] = useState<Selection | null>(() => {
    const startPart = plan.parts.find(
      (part) => part.id === plan.start_here.part_id,
    );
    if (
      startPart?.quests.some((quest) => quest.id === plan.start_here.quest_id)
    ) {
      return { partId: startPart.id, questId: plan.start_here.quest_id };
    }
    const firstPart = plan.parts.find((part) => part.quests.length > 0);
    return {
      partId: firstPart?.id ?? plan.parts[0]?.id ?? "",
      questId: firstPart?.quests[0]?.id,
    };
  });
  const [planCollapsed, setPlanCollapsed] = useState(false);
  const [parkingCollapsed, setParkingCollapsed] = useState(false);
  const [parkingDraft, setParkingDraft] = useState("");
  const part = plan.parts.find((item) => item.id === selection?.partId);
  const quest = part?.quests.find((item) => item.id === selection?.questId);
  const questOrder = plan.parts.flatMap((item) =>
    item.quests.map((child) => ({ partId: item.id, questId: child.id })),
  );
  const currentIndex = questOrder.findIndex(
    (item) =>
      item.partId === selection?.partId && item.questId === selection?.questId,
  );
  const nextQuest = quest
    ? questOrder[currentIndex + 1]
    : questOrder.find((item) => item.partId === selection?.partId);
  const previousQuest =
    questOrder[
      (quest
        ? currentIndex
        : questOrder.findIndex((item) => item.partId === selection?.partId)) - 1
    ];
  return (
    <section
      className={`reading-workspace ${planCollapsed ? "plan-collapsed" : ""} ${parkingCollapsed ? "parking-collapsed" : ""}`}
      aria-label={t.readingWorkspace}
    >
      <nav className="panel reading-plan" aria-label={t.readingPlan}>
        <div className="panel-heading">
          <h2>{t.readingPlan}</h2>
          <button
            type="button"
            className="quiet fold-toggle"
            aria-label={planCollapsed ? t.expandPlan : t.collapsePlan}
            aria-expanded={!planCollapsed}
            aria-controls="plan-outline"
            onClick={() => setPlanCollapsed(!planCollapsed)}
          >
            <span className="fold-icon" aria-hidden="true" />
          </button>
        </div>
        <ul className="plan-parts" id="plan-outline">
          <li>
            <button
              type="button"
              className="plan-item plan-part"
              aria-current={selection === null ? "true" : undefined}
              onClick={() => setSelection(null)}
            >
              {t.overview}
            </button>
          </li>
          {plan.parts.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="plan-item plan-part"
                aria-current={
                  selection?.partId === item.id && !selection?.questId
                    ? "true"
                    : undefined
                }
                onClick={() => setSelection({ partId: item.id })}
              >
                <span className="eyebrow">
                  {formatMessage(language, "partNumber", {
                    number: item.id.slice(1),
                  })}
                </span>
                <span hidden={planCollapsed}>
                  <MarkdownNote text={item.title} inline />
                </span>
              </button>
              <ul className="plan-quests">
                {item.quests.map((child) => (
                  <li key={child.id}>
                    <button
                      type="button"
                      className="plan-item"
                      aria-current={
                        selection?.partId === item.id &&
                        selection?.questId === child.id
                          ? "true"
                          : undefined
                      }
                      onClick={() =>
                        setSelection({ partId: item.id, questId: child.id })
                      }
                    >
                      <span className="plan-quest-id">{child.id}</span>
                      <span hidden={planCollapsed}>
                        <MarkdownNote text={child.title} inline />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
      <div className="reading-center">
        <section
          className={`panel reading-guidance${selection === null ? " plan-overview" : ""}`}
          aria-label={t.readingGuidance}
        >
          {selection === null ? (
            <>
              <div className="eyebrow">{t.overview}</div>
              <h2>{t.mainObjective}</h2>
              <MarkdownNote text={plan.main_objective} />
              <h3>{t.routeSummary}</h3>
              <MarkdownNote text={plan.route_summary} />
              <details className="plan-start">
                <summary>{t.startHere}</summary>
                <MarkdownNote text={plan.start_here.instruction} />
                <dl>
                  <dt>{t.focusQuestion}</dt>
                  <dd>
                    <MarkdownNote text={plan.start_here.focus_question} />
                  </dd>
                  <dt>{t.completion}</dt>
                  <dd>
                    <MarkdownNote text={plan.start_here.completion_condition} />
                  </dd>
                </dl>
              </details>
              <button
                type="button"
                className="quiet"
                onClick={() =>
                  setSelection({
                    partId: plan.start_here.part_id,
                    questId: plan.start_here.quest_id,
                  })
                }
              >
                {formatMessage(language, "goToQuest", {
                  id: plan.start_here.quest_id,
                })}
              </button>
            </>
          ) : (
            <>
              <div className="eyebrow">
                {quest
                  ? formatMessage(language, "questNumber", { id: quest.id })
                  : formatMessage(language, "partNumber", {
                      number: part?.id.slice(1) ?? "",
                    })}
              </div>
              <h2>
                <MarkdownNote
                  text={quest?.title ?? part?.title ?? t.readingGuidance}
                  inline
                />
              </h2>
              <dl>
                <dt>{t.objective}</dt>
                <dd>
                  <MarkdownNote
                    text={quest?.objective ?? part?.objective ?? ""}
                  />
                </dd>
                {quest ? (
                  <>
                    <dt>{t.whereRead}</dt>
                    <dd>
                      {quest.read.length ? (
                        <ul>
                          {quest.read.map((location, index) => (
                            <li key={index}>
                              <MarkdownNote text={location} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        t.noLocation
                      )}
                    </dd>
                    <dt>{t.focusQuestion}</dt>
                    <dd>
                      <MarkdownNote text={quest.focus_question} />
                    </dd>
                    <dt>{t.completion}</dt>
                    <dd>
                      <MarkdownNote text={quest.completion_condition} />
                    </dd>
                  </>
                ) : part?.checkpoint?.question ? (
                  <>
                    <dt>{t.checkpoint}</dt>
                    <dd>
                      <MarkdownNote text={part.checkpoint.question} />
                    </dd>
                  </>
                ) : null}
              </dl>
              <div className="quest-navigation">
                <button
                  type="button"
                  className="quiet"
                  disabled={!previousQuest}
                  onClick={() => previousQuest && setSelection(previousQuest)}
                >
                  {t.previousQuest}
                </button>

                <button
                  type="button"
                  className="quiet"
                  disabled={!nextQuest}
                  onClick={() => nextQuest && setSelection(nextQuest)}
                >
                  {t.nextQuest}
                </button>
              </div>
            </>
          )}
        </section>
        <WorkingNotes
          language={language}
          state={workspaceState}
          onChange={onWorkspaceChange}
          part={part}
          quest={quest}
        />
      </div>
      <section className="panel parking-lot" aria-labelledby="parking-title">
        <div className="panel-heading">
          <h2 id="parking-title">{t.parking}</h2>
          <button
            type="button"
            className="quiet fold-toggle"
            aria-label={parkingCollapsed ? t.expandParking : t.collapseParking}
            aria-expanded={!parkingCollapsed}
            aria-controls="parking-content"
            onClick={() => setParkingCollapsed(!parkingCollapsed)}
          >
            <span className="fold-icon" aria-hidden="true" />
          </button>
        </div>
        <div id="parking-content" hidden={parkingCollapsed}>
          <p className="muted">{t.parkingHelp}</p>
          <p className="muted small">{t.parkingSaved}</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const text = parkingDraft.trim();
              if (!text) return;
              onParkingChange([
                ...parkingItems,
                { id: crypto.randomUUID(), text },
              ]);
              setParkingDraft("");
            }}
          >
            <label htmlFor="parking-draft">{t.questionConcept}</label>
            <input
              id="parking-draft"
              value={parkingDraft}
              onChange={(event) => setParkingDraft(event.target.value)}
            />
            <button type="submit" disabled={!parkingDraft.trim()}>
              {t.add}
            </button>
          </form>
          <ul className="parking-items">
            {parkingItems.map((item) => (
              <li key={item.id}>
                <p>{item.text}</p>
                <button
                  type="button"
                  className="quiet"
                  aria-label={formatMessage(language, "removeItem", {
                    text: item.text,
                  })}
                  onClick={() =>
                    onParkingChange(
                      parkingItems.filter((entry) => entry.id !== item.id),
                    )
                  }
                >
                  {t.remove}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}
