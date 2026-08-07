import { useMemo, useRef, useState } from "react";
import type { FestivalEvent, ProgrammeDay } from "../domain/festival";
import {
  filterEvents,
  getClashingEventIds,
  type BrowseFilters,
} from "../planner/itinerary";
import { EventCard, programmeDayLabel } from "./EventCard";
import { EventDetailsDialog } from "./EventDetailsDialog";
import { Filters } from "./Filters";

const INITIAL_FILTERS: BrowseFilters = {
  query: "",
  programmeDay: "all",
  venue: "all",
  category: "all",
};

const PROGRAMME_DAYS: ProgrammeDay[] = [
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

type BrowseMode = "list" | "timetable";

export type BrowseViewProps = {
  events: readonly FestivalEvent[];
  favouriteIds: ReadonlySet<string>;
  notesByEventId?: Readonly<Record<string, string>>;
  onToggleFavourite: (eventId: string) => void;
  onSaveNote?: (eventId: string, note: string) => void;
};

type EventCardListProps = {
  events: readonly FestivalEvent[];
  favouriteIds: ReadonlySet<string>;
  clashingIds: ReadonlySet<string>;
  onToggleFavourite: (eventId: string) => void;
  onViewDetails: (eventId: string, opener: HTMLButtonElement) => void;
};

function EventCardList({
  events,
  favouriteIds,
  clashingIds,
  onToggleFavourite,
  onViewDetails,
}: EventCardListProps) {
  return (
    <div className="event-list">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isFavourite={favouriteIds.has(event.id)}
          isClashing={clashingIds.has(event.id)}
          onToggleFavourite={onToggleFavourite}
          onViewDetails={(opener) => onViewDetails(event.id, opener)}
        />
      ))}
    </div>
  );
}

function Timetable({
  events,
  favouriteIds,
  clashingIds,
  onToggleFavourite,
  onViewDetails,
}: EventCardListProps) {
  const visibleDays = PROGRAMME_DAYS.filter((programmeDay) =>
    events.some((event) => event.programmeDay === programmeDay),
  );

  return (
    <div className="timetable" aria-label="Programme timetable">
      {visibleDays.map((programmeDay) => {
        const dayEvents = events.filter(
          (event) => event.programmeDay === programmeDay,
        );
        const venues = [...new Set(dayEvents.map((event) => event.venue))].sort(
          (left, right) => left.localeCompare(right),
        );

        return (
          <section className="timetable-day" key={programmeDay}>
            <h3>{programmeDayLabel(programmeDay)}</h3>
            <div className="timetable-grid">
              {venues.map((venue) => {
                const venueEvents = dayEvents.filter(
                  (event) => event.venue === venue,
                );

                return (
                  <section className="timetable-venue" key={venue}>
                    <h4>{venue}</h4>
                    <EventCardList
                      events={venueEvents}
                      favouriteIds={favouriteIds}
                      clashingIds={clashingIds}
                      onToggleFavourite={onToggleFavourite}
                      onViewDetails={onViewDetails}
                    />
                  </section>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function BrowseView({
  events,
  favouriteIds,
  notesByEventId = {},
  onToggleFavourite,
  onSaveNote,
}: BrowseViewProps) {
  const [filters, setFilters] = useState<BrowseFilters>(INITIAL_FILTERS);
  const [mode, setMode] = useState<BrowseMode>("list");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const detailsOpenerRef = useRef<HTMLButtonElement | null>(null);

  const venues = useMemo(
    () =>
      [...new Set(events.map((event) => event.venue))].sort((left, right) =>
        left.localeCompare(right),
      ),
    [events],
  );
  const visibleEvents = useMemo(
    () => filterEvents(events, filters),
    [events, filters],
  );
  const clashingIds = useMemo(
    () =>
      getClashingEventIds(
        events.filter((event) => favouriteIds.has(event.id)),
      ),
    [events, favouriteIds],
  );
  const selectedEvent = selectedEventId
    ? events.find((event) => event.id === selectedEventId)
    : undefined;

  const openDetails = (eventId: string, opener: HTMLButtonElement) => {
    detailsOpenerRef.current = opener;
    setSelectedEventId(eventId);
  };

  const cardListProps: EventCardListProps = {
    events: visibleEvents,
    favouriteIds,
    clashingIds,
    onToggleFavourite,
    onViewDetails: openDetails,
  };

  return (
    <section className="browse-view" aria-labelledby="browse-heading">
      <div className="browse-view__content">
        <header className="browse-view__header">
          <div>
            <p className="section-kicker">Make your weekend</p>
            <h2 id="browse-heading">Browse the programme</h2>
          </div>
          <button
            className="view-toggle"
            type="button"
            aria-pressed={mode === "timetable"}
            onClick={() =>
              setMode((currentMode) =>
                currentMode === "list" ? "timetable" : "list",
              )
            }
          >
            {mode === "list" ? "Show timetable" : "Show list"}
          </button>
        </header>

        <Filters filters={filters} venues={venues} onChange={setFilters} />

        <p className="results-count" role="status" aria-live="polite">
          {visibleEvents.length}{" "}
          {visibleEvents.length === 1 ? "event" : "events"}
        </p>

        {visibleEvents.length === 0 ? (
          <div className="programme-empty">
            <h3>No events found</h3>
            <p>Try another search or clear one of the filters.</p>
          </div>
        ) : mode === "list" ? (
          <EventCardList {...cardListProps} />
        ) : (
          <Timetable {...cardListProps} />
        )}
      </div>

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
