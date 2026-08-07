import type { FestivalEvent } from "../domain/festival";
import { compareByStartThenTitle } from "../planner/itinerary";

export const toIcsLocal = (iso: string): string =>
  iso.replace(/[-:]/g, "").replace(/[+-]\d{4}$/, "").slice(0, 15);

export const toIcsUtc = (iso: string): string =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

export const escapeIcs = (value: string): string =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

export function createCalendar(
  events: readonly FestivalEvent[],
  notesByEventId: Readonly<Record<string, string>> = {},
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Field Notes//We Out Here Planner//EN",
    "CALSCALE:GREGORIAN",
  ];

  for (const event of [...events].sort(compareByStartThenTitle)) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@field-notes.local`,
      `DTSTAMP:${toIcsUtc(event.startsAt)}`,
      `DTSTART:${toIcsLocal(event.startsAt)}`,
      `DTEND:${toIcsLocal(event.endsAt)}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `LOCATION:${escapeIcs(event.venue)}`,
      `DESCRIPTION:${escapeIcs(notesByEventId[event.id] ?? "")}`,
      "END:VEVENT",
    );
  }

  return `${lines.join("\r\n")}\r\nEND:VCALENDAR\r\n`;
}

export function downloadCalendar(
  events: readonly FestivalEvent[],
  notesByEventId: Readonly<Record<string, string>> = {},
): void {
  if (events.length === 0) {
    return;
  }

  const calendar = new Blob([createCalendar(events, notesByEventId)], {
    type: "text/calendar;charset=utf-8",
  });
  const downloadUrl = URL.createObjectURL(calendar);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "we-out-here-2026-plan.ics";
  link.click();
  URL.revokeObjectURL(downloadUrl);
}
