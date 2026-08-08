import type {
  EventCategory,
  FestivalEvent,
  ProgrammeDay,
} from "../domain/festival";
import { parseCalendarTimestamp } from "./time";

export type BrowseFilters = {
  query: string;
  programmeDay: ProgrammeDay | "all";
  venue: string | "all";
  category: EventCategory | "all";
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

export function filterEvents(
  events: readonly FestivalEvent[],
  filters: BrowseFilters,
): FestivalEvent[] {
  const query = filters.query.trim().toLocaleLowerCase();

  return events
    .filter(
      (event) =>
        (!query || event.title.toLocaleLowerCase().includes(query)) &&
        (filters.programmeDay === "all" ||
          event.programmeDay === filters.programmeDay) &&
        (filters.venue === "all" || event.venue === filters.venue) &&
        (filters.category === "all" || event.category === filters.category),
    )
    .sort(compareByStartThenTitle);
}

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
