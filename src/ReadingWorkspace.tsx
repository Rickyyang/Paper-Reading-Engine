import { useState } from "react";
import type { ParkingItem } from "./exports";
import type { InitialReadingPlan } from "./readingPlan";
import type { NoteWorkspaceState } from "./types";
import { WorkingNotes } from "./WorkingNotes";

type Selection = { partId: string; questId?: string };

export function ReadingWorkspace({
  plan,
  workspaceState,
  onWorkspaceChange,
  onParkingChange,
  parkingItems,
}: {
  plan: InitialReadingPlan;
  workspaceState: NoteWorkspaceState;
  onWorkspaceChange: (state: NoteWorkspaceState) => void;
  onParkingChange: (items: ParkingItem[]) => void;
  parkingItems: ParkingItem[];
}) {
  const [selection, setSelection] = useState<Selection>(() => {
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
  const part = plan.parts.find((item) => item.id === selection.partId);
  const quest = part?.quests.find((item) => item.id === selection.questId);
  const questOrder = plan.parts.flatMap((item) =>
    item.quests.map((child) => ({ partId: item.id, questId: child.id })),
  );
  const currentIndex = questOrder.findIndex(
    (item) =>
      item.partId === selection.partId && item.questId === selection.questId,
  );
  const nextQuest = quest
    ? questOrder[currentIndex + 1]
    : questOrder.find((item) => item.partId === selection.partId);
  const previousQuest =
    questOrder[
      (quest
        ? currentIndex
        : questOrder.findIndex((item) => item.partId === selection.partId)) - 1
    ];
  return (
    <section
      className={`reading-workspace ${planCollapsed ? "plan-collapsed" : ""} ${parkingCollapsed ? "parking-collapsed" : ""}`}
      aria-label="Reading workspace"
    >
      <nav className="panel reading-plan" aria-label="Reading plan">
        <div className="panel-heading">
          <h2>Reading plan</h2>
          <button
            type="button"
            className="quiet fold-toggle"
            aria-label={`${planCollapsed ? "Expand" : "Collapse"} Reading plan`}
            aria-expanded={!planCollapsed}
            aria-controls="plan-outline"
            onClick={() => setPlanCollapsed(!planCollapsed)}
          >
            <span className="fold-icon" aria-hidden="true" />
          </button>
        </div>
        <ul className="plan-parts" id="plan-outline">
          {plan.parts.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="plan-item plan-part"
                aria-current={
                  selection.partId === item.id && !selection.questId
                    ? "true"
                    : undefined
                }
                onClick={() => setSelection({ partId: item.id })}
              >
                <span className="eyebrow">Part {item.id.slice(1)}</span>
                <span hidden={planCollapsed}>{item.title}</span>
              </button>
              <ul className="plan-quests">
                {item.quests.map((child) => (
                  <li key={child.id}>
                    <button
                      type="button"
                      className="plan-item"
                      aria-current={
                        selection.partId === item.id &&
                        selection.questId === child.id
                          ? "true"
                          : undefined
                      }
                      onClick={() =>
                        setSelection({ partId: item.id, questId: child.id })
                      }
                    >
                      <span className="plan-quest-id">{child.id}</span>
                      <span hidden={planCollapsed}>{child.title}</span>
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
          className="panel reading-guidance"
          aria-label="Reading guidance"
        >
          <div className="eyebrow">
            {quest ? `Quest ${quest.id}` : `Part ${part?.id.slice(1) ?? ""}`}
          </div>
          <h2>{quest?.title ?? part?.title ?? "Reading guidance"}</h2>
          <dl>
            <dt>Objective</dt>
            <dd>{quest?.objective ?? part?.objective}</dd>
            {quest ? (
              <>
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
              </>
            ) : part?.checkpoint?.question ? (
              <>
                <dt>Checkpoint question</dt>
                <dd>{part.checkpoint.question}</dd>
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
              Previous Quest
            </button>

            <button
              type="button"
              className="quiet"
              disabled={!nextQuest}
              onClick={() => nextQuest && setSelection(nextQuest)}
            >
              Next Quest
            </button>
          </div>
        </section>
        <WorkingNotes
          state={workspaceState}
          onChange={onWorkspaceChange}
          part={part}
          quest={quest}
        />
      </div>
      <section className="panel parking-lot" aria-labelledby="parking-title">
        <div className="panel-heading">
          <h2 id="parking-title">Parking lot</h2>
          <button
            type="button"
            className="quiet fold-toggle"
            aria-label={`${parkingCollapsed ? "Expand" : "Collapse"} Parking lot`}
            aria-expanded={!parkingCollapsed}
            aria-controls="parking-content"
            onClick={() => setParkingCollapsed(!parkingCollapsed)}
          >
            <span className="fold-icon" aria-hidden="true" />
          </button>
        </div>
        <div id="parking-content" hidden={parkingCollapsed}>
          <p className="muted">
            Record questions or concepts without leaving the current reading
            thread.
          </p>
          <p className="muted small">Saved locally with this paper.</p>
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
            <label htmlFor="parking-draft">Question or concept</label>
            <input
              id="parking-draft"
              value={parkingDraft}
              onChange={(event) => setParkingDraft(event.target.value)}
            />
            <button type="submit" disabled={!parkingDraft.trim()}>
              Add
            </button>
          </form>
          <ul className="parking-items">
            {parkingItems.map((item) => (
              <li key={item.id}>
                <p>{item.text}</p>
                <button
                  type="button"
                  className="quiet"
                  aria-label={`Remove ${item.text}`}
                  onClick={() =>
                    onParkingChange(
                      parkingItems.filter((entry) => entry.id !== item.id),
                    )
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}
