import type {
  EventCategory,
  FestivalEvent,
  ProgrammeDay,
} from "../domain/festival";
import { parseCalendarTimestamp } from "./time";
import { canonicalVenueValue } from "./venues";

export type BrowseFilters = {
  query: string;
  programmeDay: ProgrammeDay | "all";
  venue: string | "all";
  category: EventCategory | "all";
};

export type BrowseMode = "list" | "timetable";

const londonDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const festivalProgrammeDays: Record<string, ProgrammeDay> = {
  "2026-08-20": "thursday",
  "2026-08-21": "friday",
  "2026-08-22": "saturday",
  "2026-08-23": "sunday",
};

export const compareByStartThenTitle = (
  left: FestivalEvent,
  right: FestivalEvent,
): number =>
  parseCalendarTimestamp(left.startsAt) -
    parseCalendarTimestamp(right.startsAt) ||
  left.title.localeCompare(right.title);

const chronologically = (
  events: readonly FestivalEvent[],
): FestivalEvent[] => [...events].sort(compareByStartThenTitle);

export function getDefaultBrowseProgrammeDay(
  at: Date,
): ProgrammeDay | "all" {
  const londonDate = londonDateFormatter.format(at);

  if (londonDate < "2026-08-20") return "thursday";
  if (londonDate > "2026-08-23") return "all";

  return festivalProgrammeDays[londonDate]!;
}

export function createInitialBrowseFilters(now: Date): BrowseFilters {
  return {
    query: "",
    programmeDay: getDefaultBrowseProgrammeDay(now),
    venue: "all",
    category: "all",
  };
}

export function filterBrowseEvents(
  events: readonly FestivalEvent[],
  filters: BrowseFilters,
): FestivalEvent[] {
  const query = filters.query.trim().toLocaleLowerCase();
  const hasQuery = query.length > 0;

  return events
    .filter(
      (event) =>
        (!hasQuery || event.title.toLocaleLowerCase().includes(query)) &&
        (hasQuery ||
          filters.programmeDay === "all" ||
          event.programmeDay === filters.programmeDay) &&
        (filters.venue === "all" ||
          canonicalVenueValue(event.venue) ===
            canonicalVenueValue(filters.venue)) &&
        (filters.category === "all" || event.category === filters.category),
    )
    .sort(compareByStartThenTitle);
}

export const filterEvents = filterBrowseEvents;

export function getClashingEventIds(
  events: readonly FestivalEvent[],
): Set<string> {
  const clashes = new Set<string>();
  const sorted = chronologically(events);

  for (let index = 0; index < sorted.length; index += 1) {
    const event = sorted[index];
    for (let nextIndex = index + 1; nextIndex < sorted.length; nextIndex += 1) {
      const nextEvent = sorted[nextIndex];
      if (
        parseCalendarTimestamp(nextEvent.startsAt) >=
        parseCalendarTimestamp(event.endsAt)
      ) {
        break;
      }
      if (
        parseCalendarTimestamp(event.startsAt) <
        parseCalendarTimestamp(nextEvent.endsAt)
      ) {
        clashes.add(event.id);
        clashes.add(nextEvent.id);
      }
    }
  }

  return clashes;
}

export function getCurrentAndNext(
  events: readonly FestivalEvent[],
  at: Date,
): { now: FestivalEvent | null; next: FestivalEvent | null } {
  const atMillis = at.getTime();
  const sorted = chronologically(events);

  return {
    now:
      sorted.find(
        (event) =>
          parseCalendarTimestamp(event.startsAt) <= atMillis &&
          atMillis < parseCalendarTimestamp(event.endsAt),
      ) ?? null,
    next:
      sorted.find(
        (event) => parseCalendarTimestamp(event.startsAt) > atMillis,
      ) ?? null,
  };
}

export function getCurrentProgrammeDay(
  events: readonly FestivalEvent[],
  at: Date,
): ProgrammeDay | null {
  return getCurrentAndNext(events, at).now?.programmeDay ?? null;
}

export function getNextProgrammeDay(
  events: readonly FestivalEvent[],
  at: Date,
): ProgrammeDay | null {
  return getCurrentAndNext(events, at).next?.programmeDay ?? null;
}
