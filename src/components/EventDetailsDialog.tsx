import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  returnFocusTo?: HTMLElement | null;
  fallbackFocusTo?: HTMLElement | null;
};

type IsolatedElementState = {
  element: HTMLElement;
  inert: boolean;
  ariaHidden: string | null;
};

function isolateDialogFromPlanner(dialog: HTMLDialogElement) {
  const isolatedElements: IsolatedElementState[] = Array.from(
    document.body.children,
  )
    .filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== dialog,
    )
    .map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));

  isolatedElements.forEach(({ element }) => {
    element.inert = true;
    element.setAttribute("aria-hidden", "true");
  });

  return () => {
    isolatedElements.forEach(({ element, inert, ariaHidden }) => {
      element.inert = inert;
      if (ariaHidden === null) {
        element.removeAttribute("aria-hidden");
      } else {
        element.setAttribute("aria-hidden", ariaHidden);
      }
    });
  };
}

export function EventDetailsDialog({
  event,
  isFavourite,
  isClashing,
  note = "",
  onClose,
  onToggleFavourite,
  onSaveNote,
  returnFocusTo,
  fallbackFocusTo,
}: EventDetailsDialogProps) {
  const titleId = useId();
  const noteHelpId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusFrameRef = useRef<number | null>(null);
  const [returnFocusTarget] = useState<HTMLElement | null>(() => {
    if (returnFocusTo) {
      return returnFocusTo;
    }
    return document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  });
  const [fallbackFocusTarget] = useState<HTMLElement | null>(
    () => fallbackFocusTo ?? null,
  );
  const [draftNote, setDraftNote] = useState(note.slice(0, MAX_NOTE_LENGTH));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (restoreFocusFrameRef.current !== null) {
      window.cancelAnimationFrame(restoreFocusFrameRef.current);
      restoreFocusFrameRef.current = null;
    }

    const restorePlanner = isolateDialogFromPlanner(dialog);
    if (!dialog.open && typeof dialog.showModal === "function") {
      dialog.showModal();
    } else if (!dialog.open) {
      dialog.setAttribute("open", "");
    }
    closeButtonRef.current?.focus();

    return () => {
      if (dialog.open && typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
      restorePlanner();
      restoreFocusFrameRef.current = window.requestAnimationFrame(() => {
        restoreFocusFrameRef.current = null;
        if (returnFocusTarget?.isConnected) {
          returnFocusTarget.focus();
        } else if (fallbackFocusTarget?.isConnected) {
          fallbackFocusTarget.focus();
        }
      });
    };
  }, [fallbackFocusTarget, returnFocusTarget]);

  useEffect(() => {
    setDraftNote(note.slice(0, MAX_NOTE_LENGTH));
  }, [event.id, note]);

  const requestClose = () => onClose();

  return createPortal(
    <dialog
      aria-labelledby={titleId}
      aria-modal="true"
      className="dialog-backdrop"
      ref={dialogRef}
      onCancel={(cancelEvent) => {
        cancelEvent.preventDefault();
        requestClose();
      }}
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) {
          requestClose();
        }
      }}
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.key === "Escape") {
          keyboardEvent.preventDefault();
          requestClose();
        }
      }}
    >
      <section
        className="event-dialog"
      >
        <button
          aria-label={`Close ${event.title} details`}
          className="dialog-close"
          ref={closeButtonRef}
          type="button"
          onClick={requestClose}
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
          {event.locationStatus === "check-on-site" ? (
            <div>
              <dt>Location</dt>
              <dd>Check on site</dd>
            </div>
          ) : null}
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
    </dialog>,
    document.body,
  );
}
