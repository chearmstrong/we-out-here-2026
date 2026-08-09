import {
  EVENT_CATEGORIES,
  PROGRAMME_SOURCES,
  type FestivalEvent,
  type ProgrammeDay,
} from "../domain/festival";

const PROGRAMME_DAYS = new Set<ProgrammeDay>([
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
const EVENT_CATEGORY_SET = new Set<string>(EVENT_CATEGORIES);
const PROGRAMME_SOURCE_SET = new Set<string>(PROGRAMME_SOURCES);
const ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const EMPTY_SCHEDULE_CHANGES: ReadonlyMap<string, string> = new Map();

const isIsoTimestamp = (value: string): boolean =>
  ISO_TIMESTAMP.test(value) && !Number.isNaN(Date.parse(value));

export function validateSchedule(
  events: readonly FestivalEvent[],
  scheduleChanges: ReadonlyMap<string, string> = EMPTY_SCHEDULE_CHANGES,
): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const event of events) {
    for (const field of [
      "id",
      "title",
      "programmeDay",
      "venue",
      "startsAt",
      "endsAt",
      "category",
      "source",
    ] as const) {
      if (event[field].trim() === "") {
        errors.push(`Event ${field} must not be blank`);
      }
    }

    if (seenIds.has(event.id)) {
      errors.push(`Duplicate event ID: ${event.id}`);
    }
    seenIds.add(event.id);

    if (!EVENT_CATEGORY_SET.has(event.category)) {
      errors.push(`Unknown event category: ${event.category}`);
    }

    if (!PROGRAMME_SOURCE_SET.has(event.source)) {
      errors.push(`Unknown programme source: ${event.source}`);
    }

    if (
      event.locationStatus !== undefined &&
      event.locationStatus !== "check-on-site"
    ) {
      errors.push(`Unknown event location status: ${event.locationStatus}`);
    }

    if (!PROGRAMME_DAYS.has(event.programmeDay)) {
      errors.push(`Invalid Programme Day: ${event.programmeDay}`);
    }

    const startsAtIsValid = isIsoTimestamp(event.startsAt);
    const endsAtIsValid = isIsoTimestamp(event.endsAt);
    if (!startsAtIsValid) {
      errors.push(`Event start must be an ISO timestamp: ${event.id}`);
    }
    if (!endsAtIsValid) {
      errors.push(`Event end must be an ISO timestamp: ${event.id}`);
    }

    if (
      startsAtIsValid &&
      endsAtIsValid &&
      Date.parse(event.endsAt) <= Date.parse(event.startsAt)
    ) {
      errors.push(
        `Event must have a positive duration (end after start): ${event.id}`,
      );
    }
  }

  for (const [oldId, newId] of scheduleChanges) {
    if (!seenIds.has(newId)) {
      errors.push(`Schedule change target does not exist: ${oldId} -> ${newId}`);
    }
  }

  return errors;
}
