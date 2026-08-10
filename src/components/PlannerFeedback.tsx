export type PlannerFeedbackMessage =
  | { kind: "note-saved"; text: "Note saved locally." }
  | { kind: "undo-remove"; eventId: string; text: string }
  | {
      kind: "calendar-exported";
      text: "Calendar download started: we-out-here-2026-plan.ics";
    };

export type PlannerFeedbackProps = {
  message: PlannerFeedbackMessage | null;
  onUndoRemove?: () => void;
  storageUnavailable?: boolean;
};

const REMOVAL_MESSAGE_ENDING = " removed from your plan.";

const removedEventTitle = (text: string) =>
  text.endsWith(REMOVAL_MESSAGE_ENDING)
    ? text.slice(0, -REMOVAL_MESSAGE_ENDING.length)
    : text;

export function PlannerFeedback({
  message,
  onUndoRemove,
  storageUnavailable = false,
}: PlannerFeedbackProps) {
  if (!message && !storageUnavailable) {
    return null;
  }

  return (
    <div
      aria-label={!message && storageUnavailable ? "Storage unavailable" : undefined}
      className={`planner-feedback${storageUnavailable ? " planner-feedback--warning" : ""}`}
      role="status"
    >
      {message ? <span>{message.text}</span> : null}
      {storageUnavailable ? (
        <span>
          Browser storage is unavailable. Your plan and Event Notes work for
          this visit, but cannot persist after you close or reload the page.
        </span>
      ) : null}
      {message?.kind === "undo-remove" && onUndoRemove ? (
        <button
          aria-label={`Undo remove ${removedEventTitle(message.text)}`}
          className="planner-feedback__undo"
          type="button"
          onClick={onUndoRemove}
        >
          Undo
        </button>
      ) : null}
    </div>
  );
}
