import {
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { FestivalEvent, ProgrammeDay } from "../domain/festival";
import {
  filterBrowseEvents,
  getClashingEventIds,
  type BrowseFilters,
  type BrowseMode,
} from "../planner/itinerary";
import {
  getDayScheduleModel,
  type DayScheduleGroup,
} from "../planner/daySchedule";
import { getVenueOptions } from "../planner/venues";
import {
  CategoryIcon,
  categoryLabel,
  EventCard,
  formatTimeRange,
  programmeDayLabel,
} from "./EventCard";
import { EventDetailsDialog } from "./EventDetailsDialog";
import { Filters } from "./Filters";

const PROGRAMME_DAYS: ProgrammeDay[] = [
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export type { BrowseFilters, BrowseMode } from "../planner/itinerary";

export type BrowseViewProps = {
  events: readonly FestivalEvent[];
  favouriteIds: ReadonlySet<string>;
  now: Date;
  filters: BrowseFilters;
  mode: BrowseMode;
  notesByEventId?: Readonly<Record<string, string>>;
  onToggleFavourite: (eventId: string) => void;
  onSaveNote?: (
    eventId: string,
    note: string,
  ) => { persisted: boolean } | undefined;
  onFiltersChange: (filters: BrowseFilters) => void;
  onModeChange: (mode: BrowseMode) => void;
  onClearFilters: () => void;
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
  "(max-width: 48rem), (max-width: 60rem) and (max-height: 32rem)";
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

type PhoneDayScheduleProps = Pick<
  EventCardListProps,
  | "events"
  | "favouriteIds"
  | "clashingIds"
  | "onToggleFavourite"
  | "onViewDetails"
> & {
  programmeDay: ProgrammeDay | "all";
  now: Date;
};

type PhoneProgrammeDaySelectorProps = {
  programmeDay: ProgrammeDay | "all";
  onChange: (programmeDay: ProgrammeDay | "all") => void;
};

function PhoneProgrammeDaySelector({
  programmeDay,
  onChange,
}: PhoneProgrammeDaySelectorProps) {
  return (
    <label className="phone-day-schedule__day-selector">
      <span>Programme Day</span>
      <select
        value={programmeDay}
        onChange={(changeEvent) =>
          onChange(changeEvent.currentTarget.value as ProgrammeDay | "all")
        }
      >
        <option value="all">All days</option>
        {PROGRAMME_DAYS.map((day) => (
          <option key={day} value={day}>
            {programmeDayLabel(day)}
          </option>
        ))}
      </select>
    </label>
  );
}

type PhoneDayScheduleRowsProps = Pick<
  EventCardListProps,
  | "favouriteIds"
  | "clashingIds"
  | "onToggleFavourite"
  | "onViewDetails"
> & {
  groups: readonly DayScheduleGroup[];
  className?: string;
};

function PhoneDayScheduleRows({
  groups,
  favouriteIds,
  clashingIds,
  onToggleFavourite,
  onViewDetails,
  className,
}: PhoneDayScheduleRowsProps) {
  return (
    <div
      className={`phone-day-schedule__groups${className ? ` ${className}` : ""}`}
    >
      {groups.map((group) => (
        <section className="phone-day-schedule__group" key={group.startsAt}>
          <h4>
            <time dateTime={group.startsAt}>
              {hourFormatter.format(new Date(group.startsAt))}
            </time>
          </h4>
          <div className="phone-day-schedule__rows">
            {group.events.map((event) => {
              const isFavourite = favouriteIds.has(event.id);
              const isClashing = clashingIds.has(event.id);
              const eventDescriptionId = `phone-schedule-event-${event.id}`;
              const clashDescriptionId = `phone-schedule-clash-${event.id}`;

              return (
                <article className="phone-day-schedule__event" key={event.id}>
                  <button
                    aria-label={`${event.title} day schedule event`}
                    aria-describedby={`${eventDescriptionId}${isClashing ? ` ${clashDescriptionId}` : ""}`}
                    className={`phone-day-schedule__row${isFavourite ? " phone-day-schedule__row--saved" : ""}${isClashing ? " phone-day-schedule__row--clashing" : ""}`}
                    onClick={(clickEvent) =>
                      onViewDetails(event.id, clickEvent.currentTarget)
                    }
                    type="button"
                  >
                    <time dateTime={event.startsAt}>{formatTimeRange(event)}</time>
                    <span className="phone-day-schedule__category">
                      <CategoryIcon category={event.category} />
                      {categoryLabel(event.category)}
                    </span>
                    <strong>{event.title}</strong>
                    <span className="phone-day-schedule__venue">{event.venue}</span>
                    {isFavourite ? (
                      <span className="phone-day-schedule__saved">Saved</span>
                    ) : null}
                    <span className="visually-hidden" id={eventDescriptionId}>
                      {formatTimeRange(event)}, {event.venue},{" "}
                      {categoryLabel(event.category)}, {isFavourite ? "Saved" : "Not saved"}
                    </span>
                    {isClashing ? (
                      <span className="visually-hidden" id={clashDescriptionId}>
                        Clashes with another saved event
                      </span>
                    ) : null}
                  </button>
                  <button
                    aria-label={`${isFavourite ? "Remove" : "Save"} ${event.title} from day schedule`}
                    aria-pressed={isFavourite}
                    className="phone-day-schedule__save"
                    data-planner-event-id={event.id}
                    data-planner-focus-kind="phone-schedule-save"
                    onClick={() => onToggleFavourite(event.id)}
                    type="button"
                  >
                    {isFavourite ? "Saved" : "Save"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function PhoneDaySchedule({
  events,
  favouriteIds,
  clashingIds,
  onToggleFavourite,
  onViewDetails,
  programmeDay,
  now,
}: PhoneDayScheduleProps) {
  const [savedOnly, setSavedOnly] = useState(false);
  const [earlierExpanded, setEarlierExpanded] = useState(false);
  const model = getDayScheduleModel(
    savedOnly ? events.filter((event) => favouriteIds.has(event.id)) : events,
    programmeDay,
    now,
  );
  const isAllDays = programmeDay === "all";
  const programmeDayHeading = isAllDays
    ? "All days"
    : programmeDayLabel(programmeDay);
  const hasVisibleRows = isAllDays
    ? model.programmeGroups.length > 0
    : model.visibleGroups.length > 0;
  const hasEarlierRows = !isAllDays && model.earlierGroups.length > 0;
  const hasLiveSummary =
    !isAllDays &&
    !model.beforeFestival &&
    (model.currentEvents.length > 0 || model.nextEvent !== undefined);

  return (
    <section
      aria-label={`${programmeDayHeading}${isAllDays ? "" : " day"} schedule`}
      className="phone-day-schedule"
    >
      <h3>{programmeDayHeading}</h3>
      <button
        aria-pressed={savedOnly}
        className="phone-day-schedule__control"
        onClick={() => setSavedOnly((currentSavedOnly) => !currentSavedOnly)}
        type="button"
      >
        Saved only
      </button>
      {hasLiveSummary ? (
        <section className="phone-day-schedule__live" aria-labelledby="now-next-heading">
          <h4 id="now-next-heading">Now / next</h4>
          {model.currentEvents.length > 0 ? (
            <p>
              <strong>On now</strong>{" "}
              {model.currentEvents.map((event) => event.title).join(", ")}
            </p>
          ) : null}
          {model.nextEvent ? (
            <p>
              <strong>Next up</strong> {model.nextEvent.title} at{" "}
              {hourFormatter.format(new Date(model.nextEvent.startsAt))}
            </p>
          ) : null}
        </section>
      ) : null}
      {isAllDays && hasVisibleRows ? (
        <div className="phone-day-schedule__programme-days">
          {model.programmeGroups.map((programmeGroup) => (
            <section
              className="phone-day-schedule__programme-day"
              key={programmeGroup.programmeDay}
            >
              <h4>{programmeDayLabel(programmeGroup.programmeDay)}</h4>
              <PhoneDayScheduleRows
                groups={programmeGroup.groups}
                favouriteIds={favouriteIds}
                clashingIds={clashingIds}
                onToggleFavourite={onToggleFavourite}
                onViewDetails={onViewDetails}
              />
            </section>
          ))}
        </div>
      ) : hasVisibleRows ? (
        <PhoneDayScheduleRows
          groups={model.visibleGroups}
          favouriteIds={favouriteIds}
          clashingIds={clashingIds}
          onToggleFavourite={onToggleFavourite}
          onViewDetails={onViewDetails}
        />
      ) : null}
      {hasEarlierRows ? (
        <>
          <button
            aria-expanded={earlierExpanded}
            className="phone-day-schedule__control"
            onClick={() => setEarlierExpanded((expanded) => !expanded)}
            type="button"
          >
            Earlier
          </button>
          {earlierExpanded ? (
            <PhoneDayScheduleRows
              groups={model.earlierGroups}
              favouriteIds={favouriteIds}
              clashingIds={clashingIds}
              onToggleFavourite={onToggleFavourite}
              onViewDetails={onViewDetails}
              className="phone-day-schedule__groups--earlier"
            />
          ) : null}
        </>
      ) : null}
      {!hasVisibleRows && !hasEarlierRows ? (
        <p className="phone-day-schedule__empty">
          {savedOnly
            ? "No saved events match this schedule view."
            : `No matches for ${programmeDayHeading}.`}
        </p>
      ) : null}
    </section>
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
            <div
              aria-label={`${programmeDayLabel(programmeDay)} timetable scroll region`}
              className="timetable-scroll"
              role="group"
            >
              <div
                className="timetable-chart"
                style={{ width: `${trackWidth + 144}px` }}
              >
                <div className="timetable-scroll__axis">
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
                </div>

                <div className="timetable-scroll__lanes">
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
                                  data-planner-event-id={event.id}
                                  data-planner-focus-kind="timetable-save"
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
  now,
  filters,
  mode,
  notesByEventId = {},
  onToggleFavourite,
  onSaveNote,
  onFiltersChange,
  onModeChange,
  onClearFilters,
}: BrowseViewProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const isPhoneLayout = usePhoneLayout();
  const detailsOpenerRef = useRef<HTMLButtonElement | null>(null);
  const viewToggleRef = useRef<HTMLButtonElement | null>(null);

  const venues = useMemo(() => getVenueOptions(events), [events]);
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
  const isPhoneSchedule = isPhoneLayout && mode === "timetable";

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
            onClick={() => {
              onModeChange(mode === "list" ? "timetable" : "list");
            }}
          >
            {mode === "list"
              ? isPhoneLayout
                ? "Show schedule"
                : "Show timetable"
              : isPhoneLayout
                ? "Show browse"
                : "Show list"}
          </button>
        </header>

        {isPhoneSchedule ? (
          <PhoneProgrammeDaySelector
            programmeDay={filters.programmeDay}
            onChange={(programmeDay) =>
              onFiltersChange({ ...filters, programmeDay })
            }
          />
        ) : (
          <>
            <Filters
              filters={filters}
              venues={venues}
              onChange={onFiltersChange}
              onClear={onClearFilters}
            />
            <p className="results-count" role="status" aria-live="polite">
              {visibleEvents.length}{" "}
              {visibleEvents.length === 1 ? "event" : "events"}
            </p>
          </>
        )}

        {isPhoneSchedule ? (
          <PhoneDaySchedule
            events={events}
            favouriteIds={favouriteIds}
            clashingIds={clashingIds}
            programmeDay={filters.programmeDay}
            now={now}
            onToggleFavourite={onToggleFavourite}
            onViewDetails={openDetails}
          />
        ) : visibleEvents.length === 0 ? (
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
          fallbackFocusTo={viewToggleRef.current}
        />
      ) : null}
    </section>
  );
}
