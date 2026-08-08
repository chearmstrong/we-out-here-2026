import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { FestivalEvent, ProgrammeDay } from "../domain/festival";
import {
  compareByStartThenTitle,
  filterBrowseEvents,
  getClashingEventIds,
  getDefaultBrowseProgrammeDay,
  type BrowseFilters,
} from "../planner/itinerary";
import {
  CategoryIcon,
  categoryLabel,
  EventCard,
  formatTimeRange,
  programmeDayLabel,
} from "./EventCard";
import { EventDetailsDialog } from "./EventDetailsDialog";
import { Filters } from "./Filters";

const INITIAL_FILTERS: Omit<BrowseFilters, "programmeDay"> = {
  query: "",
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
  showProgrammeDay: boolean;
  onToggleFavourite: (eventId: string) => void;
  onViewDetails: (eventId: string, opener: HTMLButtonElement) => void;
};

const TIMETABLE_PIXELS_PER_MINUTE = 2;
const TIMETABLE_LANE_HEIGHT = 120;
const TIMETABLE_MINIMUM_TARGET_SIZE = 44;
export const PHONE_LAYOUT_QUERY =
  "(max-width: 42rem), (pointer: coarse) and (orientation: landscape) and (max-height: 32rem)";
const hourFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Europe/London",
});

function getPhoneLayoutSnapshot() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(PHONE_LAYOUT_QUERY).matches
  );
}

function subscribeToPhoneLayout(onStoreChange: () => void) {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(PHONE_LAYOUT_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function usePhoneLayout() {
  return useSyncExternalStore(
    subscribeToPhoneLayout,
    getPhoneLayoutSnapshot,
    () => false,
  );
}

type PositionedEvent = {
  event: FestivalEvent;
  lane: number;
  left: number;
  durationWidth: number;
  width: number;
};

function positionVenueEvents(
  events: readonly FestivalEvent[],
  rangeStart: number,
): { events: PositionedEvent[]; laneCount: number } {
  const laneEnds: number[] = [];
  const positioned = events.map((event) => {
    const startsAt = Date.parse(event.startsAt);
    const endsAt = Date.parse(event.endsAt);
    const interactionEndsAt = Math.max(
      endsAt,
      startsAt +
        (TIMETABLE_MINIMUM_TARGET_SIZE / TIMETABLE_PIXELS_PER_MINUTE) *
          60_000,
    );
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= startsAt);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = interactionEndsAt;

    const durationWidth = Math.max(
      ((endsAt - startsAt) / 60_000) * TIMETABLE_PIXELS_PER_MINUTE,
      2,
    );

    return {
      event,
      lane,
      left:
        ((startsAt - rangeStart) / 60_000) *
        TIMETABLE_PIXELS_PER_MINUTE,
      durationWidth,
      width: Math.max(durationWidth, TIMETABLE_MINIMUM_TARGET_SIZE),
    };
  });

  return { events: positioned, laneCount: Math.max(laneEnds.length, 1) };
}

function EventCardList({
  events,
  favouriteIds,
  clashingIds,
  showProgrammeDay,
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
          showProgrammeDay={showProgrammeDay}
          onToggleFavourite={onToggleFavourite}
          onViewDetails={(opener) => onViewDetails(event.id, opener)}
        />
      ))}
    </div>
  );
}

function PhoneAgenda({
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
    <div className="phone-agenda">
      {visibleDays.map((programmeDay) => {
        const dayEvents = events
          .filter((event) => event.programmeDay === programmeDay)
          .sort(compareByStartThenTitle);

        return (
          <section
            aria-label={`${programmeDayLabel(programmeDay)} agenda`}
            className="phone-agenda__day"
            key={programmeDay}
          >
            <h3>{programmeDayLabel(programmeDay)}</h3>
            <div className="phone-agenda__events">
              {dayEvents.map((event) => {
                const isFavourite = favouriteIds.has(event.id);
                const isClashing = clashingIds.has(event.id);
                const clashDescriptionId = `agenda-clash-${event.id}`;

                return (
                  <article
                    aria-label={`${event.title} agenda event`}
                    className={`phone-agenda__event phone-agenda__event--${event.category}${isFavourite ? " phone-agenda__event--saved" : ""}${isClashing ? " phone-agenda__event--clashing" : ""}`}
                    key={event.id}
                  >
                    <div className="phone-agenda__meta">
                      <span className="phone-agenda__category">
                        <CategoryIcon category={event.category} />
                        <span>{categoryLabel(event.category)}</span>
                      </span>
                      <time dateTime={event.startsAt}>
                        {formatTimeRange(event)}
                      </time>
                      <p>{event.venue}</p>
                    </div>
                    <strong>{event.title}</strong>
                    <div className="phone-agenda__actions">
                      <button
                        className="phone-agenda__details"
                        type="button"
                        aria-label={`View ${event.title} details from agenda`}
                        aria-describedby={
                          isClashing ? clashDescriptionId : undefined
                        }
                        onClick={(clickEvent) =>
                          onViewDetails(event.id, clickEvent.currentTarget)
                        }
                      >
                        View details
                      </button>
                      <button
                        className="phone-agenda__save"
                        type="button"
                        aria-pressed={isFavourite}
                        aria-label={`${isFavourite ? "Remove" : "Save"} ${event.title} from agenda`}
                        aria-describedby={
                          isClashing ? clashDescriptionId : undefined
                        }
                        onClick={() => onToggleFavourite(event.id)}
                      >
                        <span aria-hidden="true">{isFavourite ? "−" : "+"}</span>
                      </button>
                    </div>
                    {isClashing ? (
                      <span
                        className="visually-hidden"
                        id={clashDescriptionId}
                      >
                        Clashes with another saved event
                      </span>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
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
        const earliestStart = Math.min(
          ...dayEvents.map((event) => Date.parse(event.startsAt)),
        );
        const latestEnd = Math.max(
          ...dayEvents.map((event) => Date.parse(event.endsAt)),
        );
        const rangeStart = Math.floor(earliestStart / 3_600_000) * 3_600_000;
        const rangeEnd = Math.ceil(latestEnd / 3_600_000) * 3_600_000;
        const rangeMinutes = (rangeEnd - rangeStart) / 60_000;
        const trackWidth = rangeMinutes * TIMETABLE_PIXELS_PER_MINUTE;
        const hourMarks = Array.from(
          { length: rangeMinutes / 60 + 1 },
          (_, index) => rangeStart + index * 3_600_000,
        );
        const venues = [...new Set(dayEvents.map((event) => event.venue))].sort(
          (left, right) => left.localeCompare(right),
        );

        return (
          <section className="timetable-day" key={programmeDay}>
            <h3>{programmeDayLabel(programmeDay)}</h3>
            <p className="timetable-hint">
              Scroll sideways to compare start times and spot open gaps.
            </p>
            <div className="timetable-scroll">
              <div
                className="timetable-chart"
                style={{ width: `${trackWidth + 144}px` }}
              >
                <div className="timetable-axis-label" aria-hidden="true">
                  Venue / time
                </div>
                <div
                  className="timetable-axis"
                  role="group"
                  aria-label={`${programmeDayLabel(programmeDay)} time axis`}
                  style={{ width: `${trackWidth}px` }}
                >
                  {hourMarks.map((mark, index) => (
                    <time
                      className="timetable-hour"
                      dateTime={new Date(mark).toISOString()}
                      key={mark}
                      style={{
                        left: `${index * 60 * TIMETABLE_PIXELS_PER_MINUTE}px`,
                      }}
                    >
                      {hourFormatter.format(new Date(mark))}
                    </time>
                  ))}
                </div>

                {venues.map((venue) => {
                  const venueEvents = dayEvents.filter(
                    (event) => event.venue === venue,
                  );
                  const positioned = positionVenueEvents(
                    venueEvents,
                    rangeStart,
                  );

                  return (
                    <section
                      className="timetable-venue"
                      aria-label={`${venue} timetable`}
                      key={venue}
                    >
                      <h4>{venue}</h4>
                      <div
                        className="timetable-track"
                        style={{
                          width: `${trackWidth}px`,
                          height: `${positioned.laneCount * TIMETABLE_LANE_HEIGHT}px`,
                        }}
                      >
                        {positioned.events.map(
                          ({ event, lane, left, width, durationWidth }) => {
                            const isClashing = clashingIds.has(event.id);
                            const clashDescriptionId = `timetable-clash-${event.id}`;

                            return (
                              <article
                                aria-label={`${event.title} timetable event`}
                                className={`timetable-event timetable-event--${event.category}${favouriteIds.has(event.id) ? " timetable-event--saved" : ""}${isClashing ? " timetable-event--clashing" : ""}`}
                                key={event.id}
                                style={{
                                  left: `${left}px`,
                                  top: `${lane * TIMETABLE_LANE_HEIGHT}px`,
                                  width: `${width}px`,
                                }}
                              >
                                <span
                                  aria-hidden="true"
                                  className="timetable-event__duration"
                                  style={{ width: `${durationWidth}px` }}
                                />
                                <button
                                  className="timetable-event__details"
                                  type="button"
                                  style={{ minWidth: "44px" }}
                                  aria-label={`View ${event.title} details from timetable`}
                                  aria-describedby={
                                    isClashing ? clashDescriptionId : undefined
                                  }
                                  onClick={(clickEvent) =>
                                    onViewDetails(
                                      event.id,
                                      clickEvent.currentTarget,
                                    )
                                  }
                                >
                                  <span className="timetable-event__category">
                                    <CategoryIcon category={event.category} />
                                    <span>{categoryLabel(event.category)}</span>
                                  </span>
                                  <strong>{event.title}</strong>
                                  <time dateTime={event.startsAt}>
                                    {formatTimeRange(event)}
                                  </time>
                                </button>
                                <button
                                  className="timetable-event__save"
                                  type="button"
                                  style={{ width: "44px", height: "44px" }}
                                  aria-pressed={favouriteIds.has(event.id)}
                                  aria-label={`${favouriteIds.has(event.id) ? "Remove" : "Save"} ${event.title}`}
                                  aria-describedby={
                                    isClashing ? clashDescriptionId : undefined
                                  }
                                  onClick={() => onToggleFavourite(event.id)}
                                >
                                  <span aria-hidden="true">
                                    {favouriteIds.has(event.id) ? "−" : "+"}
                                  </span>
                                </button>
                                {isClashing ? (
                                  <span
                                    className="visually-hidden"
                                    id={clashDescriptionId}
                                  >
                                    Clashes with another saved event
                                  </span>
                                ) : null}
                              </article>
                            );
                          },
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
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
  const [filters, setFilters] = useState<BrowseFilters>(() => ({
    ...INITIAL_FILTERS,
    programmeDay: getDefaultBrowseProgrammeDay(new Date()),
  }));
  const [mode, setMode] = useState<BrowseMode>("list");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const isPhoneLayout = usePhoneLayout();
  const detailsOpenerRef = useRef<HTMLButtonElement | null>(null);
  const viewToggleRef = useRef<HTMLButtonElement | null>(null);

  const venues = useMemo(
    () =>
      [...new Set(events.map((event) => event.venue))].sort((left, right) =>
        left.localeCompare(right),
      ),
    [events],
  );
  const visibleEvents = useMemo(
    () => filterBrowseEvents(events, filters),
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
    showProgrammeDay: filters.query.trim().length > 0,
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
            ref={viewToggleRef}
            type="button"
            aria-pressed={mode === "timetable"}
            onClick={() =>
              setMode((currentMode) =>
                currentMode === "list" ? "timetable" : "list",
              )
            }
          >
            {mode === "list"
              ? isPhoneLayout
                ? "Show schedule"
                : "Show timetable"
              : "Show list"}
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
        ) : isPhoneLayout ? (
          <PhoneAgenda {...cardListProps} />
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
          fallbackFocusTo={viewToggleRef.current}
        />
      ) : null}
    </section>
  );
}
