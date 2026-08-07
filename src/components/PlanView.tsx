import { useEffect, useMemo, useRef, useState } from "react";
import { SCHEDULE_LAST_CHECKED } from "../data/schedule";
import type { FestivalEvent, ProgrammeDay } from "../domain/festival";
import {
  compareByStartThenTitle,
  getClashingEventIds,
  getCurrentAndNext,
  getCurrentProgrammeDay,
  getNextProgrammeDay,
} from "../planner/itinerary";
import { EventCard, programmeDayLabel } from "./EventCard";
import { EventDetailsDialog } from "./EventDetailsDialog";

const FESTIVAL_START = Date.parse("2026-08-20T00:00:00+01:00");
const PROGRAMME_DAYS: ProgrammeDay[] = [
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const checkedDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${SCHEDULE_LAST_CHECKED}T00:00:00Z`));

export type PlanViewProps = {
  events: readonly FestivalEvent[];
  favouriteIds: ReadonlySet<string>;
  notesByEventId?: Readonly<Record<string, string>>;
  now: Date;
  persisted?: boolean;
  removedIds?: readonly string[];
  onToggleFavourite: (eventId: string) => void;
  onSaveNote?: (eventId: string, note: string) => void;
  onBrowse: () => void;
  onExport: () => void;
  onClear?: () => void;
  onDismissScheduleChanges?: () => void;
};

export function PlanView({
  events,
  favouriteIds,
  notesByEventId = {},
  now,
  persisted = true,
  removedIds = [],
  onToggleFavourite,
  onSaveNote,
  onBrowse,
  onExport,
  onClear,
  onDismissScheduleChanges,
}: PlanViewProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const detailsOpenerRef = useRef<HTMLButtonElement | null>(null);
  const planHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const sortedEvents = useMemo(
    () => [...events].sort(compareByStartThenTitle),
    [events],
  );
  const { now: activeEvent, next: nextEvent } = useMemo(
    () => getCurrentAndNext(sortedEvents, now),
    [now, sortedEvents],
  );
  const currentProgrammeDay = useMemo(
    () => getCurrentProgrammeDay(sortedEvents, now),
    [now, sortedEvents],
  );
  const nextProgrammeDay = useMemo(
    () => getNextProgrammeDay(sortedEvents, now),
    [now, sortedEvents],
  );
  const clashingIds = useMemo(
    () => getClashingEventIds(sortedEvents),
    [sortedEvents],
  );
  const isBeforeFestival = now.getTime() < FESTIVAL_START;
  const visibleDays = PROGRAMME_DAYS.filter((programmeDay) =>
    sortedEvents.some((event) => event.programmeDay === programmeDay),
  );
  const selectedEvent = selectedEventId
    ? sortedEvents.find((event) => event.id === selectedEventId)
    : undefined;

  useEffect(() => {
    if (!selectedEventId || selectedEvent) {
      return;
    }

    const restoreFocusFrame = window.requestAnimationFrame(() => {
      planHeadingRef.current?.focus();
      setSelectedEventId(null);
    });

    return () => window.cancelAnimationFrame(restoreFocusFrame);
  }, [selectedEvent, selectedEventId]);

  const openDetails = (eventId: string, opener: HTMLButtonElement) => {
    detailsOpenerRef.current = opener;
    setSelectedEventId(eventId);
  };

  return (
    <section className="plan-view" aria-labelledby="plan-heading">
      <header className="plan-view__header">
        <div>
          <p className="section-kicker">Your weekend at a glance</p>
          <h2 id="plan-heading" ref={planHeadingRef} tabIndex={-1}>
            My plan
          </h2>
        </div>
        <button
          className="download-button"
          type="button"
          disabled={sortedEvents.length === 0}
          onClick={onExport}
        >
          Download calendar
        </button>
      </header>

      <div className="plan-statuses">
        {!persisted ? (
          <p
            className="storage-warning"
            role="status"
            aria-label="Storage unavailable"
          >
            Browser storage is unavailable. Your plan and Event Notes work for
            this visit, but cannot persist after you close or reload the page.
          </p>
        ) : null}

        {removedIds.length > 0 ? (
          <aside className="schedule-change" aria-label="Schedule changes">
            <div>
              <p>
                {removedIds.length} saved{" "}
                {removedIds.length === 1 ? "event" : "events"}{" "}
                {removedIds.length === 1
                  ? "changed or was removed"
                  : "changed or were removed"}{" "}
                from this Schedule Snapshot.
              </p>
              <p>Your remaining saved events and notes are unchanged.</p>
            </div>
            <button
              className="text-button"
              type="button"
              aria-label="Dismiss schedule changes"
              onClick={onDismissScheduleChanges}
            >
              Dismiss
            </button>
          </aside>
        ) : null}

        <p className="snapshot-date">Schedule checked {checkedDate}</p>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="plan-empty">
          <p className="plan-empty__mark" aria-hidden="true">
            +
          </p>
          <h3>Build your plan</h3>
          <p>
            Save the sets, talks, and workshops you do not want to miss. Your
            plan stays private in this browser.
          </p>
          <button className="primary-button" type="button" onClick={onBrowse}>
            Browse programme
          </button>
        </div>
      ) : (
        <div className="plan-days">
          {visibleDays.map((programmeDay) => {
            const dayEvents = sortedEvents.filter(
              (event) => event.programmeDay === programmeDay,
            );
            const isCurrentProgrammeDay =
              !isBeforeFestival && programmeDay === currentProgrammeDay;
            const isNextProgrammeDay =
              !isBeforeFestival &&
              currentProgrammeDay === null &&
              programmeDay === nextProgrammeDay;

            return (
              <section className="plan-day" key={programmeDay}>
                <header className="plan-day__header">
                  <p>Programme Day</p>
                  <h3>
                    {programmeDayLabel(programmeDay)}
                    {isCurrentProgrammeDay ? " · Current Programme Day" : ""}
                    {isNextProgrammeDay ? " · Next Programme Day" : ""}
                  </h3>
                </header>
                <div className="plan-timeline">
                  {dayEvents.map((event) => {
                    const momentLabel =
                      event.id === activeEvent?.id
                        ? "Now"
                        : event.id === nextEvent?.id
                          ? isBeforeFestival
                            ? "Next saved event"
                            : "Next"
                          : null;

                    return (
                      <section
                        className={`plan-timeline__item${momentLabel ? " plan-timeline__item--featured" : ""}`}
                        key={event.id}
                      >
                        {momentLabel ? <h4>{momentLabel}</h4> : null}
                        <EventCard
                          event={event}
                          isFavourite={favouriteIds.has(event.id)}
                          isClashing={clashingIds.has(event.id)}
                          onToggleFavourite={onToggleFavourite}
                          onViewDetails={(opener) =>
                            openDetails(event.id, opener)
                          }
                        />
                      </section>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <div className="plan-actions">
            <button className="text-button" type="button" onClick={onBrowse}>
              Browse programme
            </button>
            {onClear ? (
              <button
                className="danger-button"
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Clear every saved event and Event Note from this browser?",
                    )
                  ) {
                    onClear();
                  }
                }}
              >
                Clear my plan
              </button>
            ) : null}
          </div>
        </div>
      )}

      {selectedEvent ? (
        <EventDetailsDialog
          event={selectedEvent}
          isFavourite={favouriteIds.has(selectedEvent.id)}
          isClashing={clashingIds.has(selectedEvent.id)}
          note={notesByEventId[selectedEvent.id]}
          onClose={() => setSelectedEventId(null)}
          onToggleFavourite={onToggleFavourite}
          onSaveNote={onSaveNote}
          returnFocusTo={detailsOpenerRef.current}
        />
      ) : null}
    </section>
  );
}
