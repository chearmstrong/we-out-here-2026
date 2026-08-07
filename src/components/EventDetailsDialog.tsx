import { useEffect, useId, useRef, useState } from "react";
import type { FestivalEvent } from "../domain/festival";
import {
  CategoryIcon,
  categoryLabel,
  formatFullTimeRange,
} from "./EventCard";

const MAX_NOTE_LENGTH = 140;

export type EventDetailsDialogProps = {
  event: FestivalEvent;
  isFavourite: boolean;
  isClashing: boolean;
  note?: string;
  onClose: () => void;
  onToggleFavourite: (eventId: string) => void;
  onSaveNote?: (eventId: string, note: string) => void;
};

export function EventDetailsDialog({
  event,
  isFavourite,
  isClashing,
  note = "",
  onClose,
  onToggleFavourite,
  onSaveNote,
}: EventDetailsDialogProps) {
  const titleId = useId();
  const noteHelpId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [draftNote, setDraftNote] = useState(note.slice(0, MAX_NOTE_LENGTH));

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    return () => {
      if (
        previouslyFocused instanceof HTMLElement &&
        previouslyFocused.isConnected
      ) {
        previouslyFocused.focus();
        window.requestAnimationFrame(() => {
          if (
            previouslyFocused.isConnected &&
            document.activeElement !== previouslyFocused
          ) {
            previouslyFocused.focus();
          }
        });
      }
    };
  }, []);

  useEffect(() => {
    setDraftNote(note.slice(0, MAX_NOTE_LENGTH));
  }, [event.id, note]);

  useEffect(() => {
    const closeOnEscape = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="dialog-backdrop">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="event-dialog"
        role="dialog"
      >
        <button
          aria-label={`Close ${event.title} details`}
          className="dialog-close"
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
        <p className="event-dialog__eyebrow">Event details</p>
        <h2 id={titleId}>{event.title} details</h2>
        <p className="category-tag">
          <CategoryIcon category={event.category} aria-hidden="true" />
          <span>{categoryLabel(event.category)}</span>
        </p>
        <dl className="event-facts">
          <div>
            <dt>When</dt>
            <dd>
              <time dateTime={event.startsAt}>{formatFullTimeRange(event)}</time>
            </dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>{event.venue}</dd>
          </div>
        </dl>
        {isClashing ? (
          <p className="clash-note" role="status">
            Clashes with another saved event
          </p>
        ) : null}
        <button
          className={`save-button save-button--wide${isFavourite ? " save-button--saved" : ""}`}
          type="button"
          aria-pressed={isFavourite}
          aria-label={`${isFavourite ? "Remove" : "Save"} ${event.title}`}
          onClick={() => onToggleFavourite(event.id)}
        >
          <span aria-hidden="true">{isFavourite ? "−" : "+"}</span>
          {isFavourite ? "Remove from my plan" : "Save to my plan"}
        </button>
        {isFavourite ? (
          <div className="event-note">
            <label htmlFor={`event-note-${event.id}`}>Note for {event.title}</label>
            <textarea
              aria-describedby={noteHelpId}
              id={`event-note-${event.id}`}
              maxLength={MAX_NOTE_LENGTH}
              rows={4}
              value={draftNote}
              onChange={(changeEvent) => {
                const nextNote = changeEvent.currentTarget.value.slice(
                  0,
                  MAX_NOTE_LENGTH,
                );
                setDraftNote(nextNote);
                onSaveNote?.(event.id, nextNote);
              }}
            />
            <p className="note-help" id={noteHelpId}>
              <span>140 characters maximum</span>
              <span>{MAX_NOTE_LENGTH - draftNote.length} remaining</span>
            </p>
          </div>
        ) : (
          <p className="event-note-prompt">Save this event to add a local note.</p>
        )}
      </section>
    </div>
  );
}
