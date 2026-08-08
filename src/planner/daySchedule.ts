import type { FestivalEvent, ProgrammeDay } from "../domain/festival";
import { compareByStartThenTitle } from "./itinerary";
import { parseCalendarTimestamp } from "./time";

export type DayScheduleGroup = {
  startsAt: string;
  events: FestivalEvent[];
};

export type DayScheduleModel = {
  beforeFestival: boolean;
  currentEvents: FestivalEvent[];
  nextEvent?: FestivalEvent;
  earlierGroups: DayScheduleGroup[];
  visibleGroups: DayScheduleGroup[];
};

const groupByStartTime = (
  events: readonly FestivalEvent[],
): DayScheduleGroup[] => {
  const groups: DayScheduleGroup[] = [];

  for (const event of events) {
    const previousGroup = groups.at(-1);
    if (previousGroup?.startsAt === event.startsAt) {
      previousGroup.events.push(event);
    } else {
      groups.push({ startsAt: event.startsAt, events: [event] });
    }
  }

  return groups;
};

export function getDayScheduleModel(
  events: readonly FestivalEvent[],
  programmeDay: ProgrammeDay,
  now: Date,
): DayScheduleModel {
  const nowMillis = now.getTime();
  const dayEvents = events
    .filter((event) => event.programmeDay === programmeDay)
    .sort(compareByStartThenTitle);
  const beforeFestival =
    nowMillis < parseCalendarTimestamp("2026-08-20T00:00:00+01:00");
  const currentEvents = beforeFestival
    ? []
    : dayEvents.filter(
        (event) =>
          parseCalendarTimestamp(event.startsAt) <= nowMillis &&
          nowMillis < parseCalendarTimestamp(event.endsAt),
      );
  const nextEvent = beforeFestival
    ? undefined
    : dayEvents.find(
        (event) => parseCalendarTimestamp(event.startsAt) > nowMillis,
      );
  const earlierEvents = beforeFestival
    ? []
    : dayEvents.filter(
        (event) => parseCalendarTimestamp(event.endsAt) <= nowMillis,
      );
  const visibleEvents = beforeFestival
    ? dayEvents
    : dayEvents.filter(
        (event) => parseCalendarTimestamp(event.endsAt) > nowMillis,
      );

  return {
    beforeFestival,
    currentEvents,
    nextEvent,
    earlierGroups: groupByStartTime(earlierEvents),
    visibleGroups: groupByStartTime(visibleEvents),
  };
}
