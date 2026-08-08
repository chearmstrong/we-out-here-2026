import { describe, expect, it, vi } from "vitest";
import type { FestivalEvent } from "../domain/festival";
import { createCalendar, downloadCalendar } from "./ics";

const event = (
  overrides: Partial<FestivalEvent> & Pick<FestivalEvent, "id" | "title">,
): FestivalEvent => ({
  programmeDay: "thursday",
  venue: "Main Stage",
  startsAt: "2026-08-20T13:20:00+01:00",
  endsAt: "2026-08-20T14:20:00+01:00",
  category: "music",
  source: "music-programme",
  ...overrides,
});

describe("createCalendar", () => {
  it("serializes saved events in an iCalendar calendar", () => {
    const ics = createCalendar([event({ id: "thursday:main-stage:kotoa", title: "Kotoa" })]);

    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("UID:thursday:main-stage:kotoa@field-notes.local");
    expect(ics).toContain("DTSTAMP:20260820T122000Z");
    expect(ics).toContain("DTSTART:20260820T132000");
    expect(ics).toContain("LOCATION:Main Stage");
    expect(ics).toContain("END:VCALENDAR\r\n");
  });

  it("derives a stable UTC DTSTAMP from each event timestamp", () => {
    const savedEvent = event({ id: "one", title: "Kotoa" });

    expect(createCalendar([savedEvent])).toContain("DTSTAMP:20260820T122000Z");
    expect(createCalendar([savedEvent])).toBe(createCalendar([savedEvent]));
  });

  it("escapes event fields and adds Event Notes as the description", () => {
    const ics = createCalendar(
      [event({ id: "one", title: "A, B; C\\D", venue: "Stage, One" })],
      { one: "Meet at 5; bring snacks, please\\now\nAfter the set" },
    );

    expect(ics).toContain("SUMMARY:A\\, B\\; C\\\\D");
    expect(ics).toContain("LOCATION:Stage\\, One");
    expect(ics).toContain(
      "DESCRIPTION:Meet at 5\\; bring snacks\\, please\\\\now\\nAfter the set",
    );
  });

  it("keeps cross-midnight events on their UK local wall times", () => {
    const ics = createCalendar([
      event({
        id: "overnight",
        title: "Late set",
        startsAt: "2026-08-20T23:45:00+01:00",
        endsAt: "2026-08-21T01:15:00+01:00",
      }),
    ]);

    expect(ics).toContain("DTSTART:20260820T234500");
    expect(ics).toContain("DTEND:20260821T011500");
  });

  it("sorts events chronologically before serializing them", () => {
    const later = event({ id: "later", title: "Later", startsAt: "2026-08-20T15:00:00+01:00" });
    const first = event({ id: "first", title: "First", startsAt: "2026-08-20T12:00:00+01:00" });

    const ics = createCalendar([later, first]);

    expect(ics.indexOf("UID:first@field-notes.local")).toBeLessThan(
      ics.indexOf("UID:later@field-notes.local"),
    );
  });

  it("creates a valid empty calendar without automatic alarms", () => {
    const ics = createCalendar([]);

    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).not.toContain("BEGIN:VEVENT");
    expect(ics).not.toContain("VALARM");
    expect(ics).toContain("END:VCALENDAR\r\n");
  });

  it("folds a long title into RFC 5545 content lines of at most 75 octets", () => {
    const title = "A very long festival title ".repeat(5).trim();
    const ics = createCalendar([event({ id: "long-title", title })]);
    const physicalLines = ics.split("\r\n").filter(Boolean);

    expect(physicalLines.some((line) => line.startsWith(" "))).toBe(true);
    expect(
      physicalLines.every((line) => new TextEncoder().encode(line).length <= 75),
    ).toBe(true);
    expect(ics.replace(/\r\n[ \t]/g, "")).toContain(`SUMMARY:${title}`);
  });

  it("folds a long multibyte Event Note without splitting UTF-8 characters", () => {
    const note = "Meet by the café 🎺 after the set — ".repeat(5).trim();
    const ics = createCalendar(
      [event({ id: "long-note", title: "Kotoa" })],
      { "long-note": note },
    );
    const physicalLines = ics.split("\r\n").filter(Boolean);

    expect(
      physicalLines.every((line) => new TextEncoder().encode(line).length <= 75),
    ).toBe(true);
    expect(ics.replace(/\r\n[ \t]/g, "")).toContain(`DESCRIPTION:${note}`);
    expect(ics).not.toContain("�");
  });
});

describe("downloadCalendar", () => {
  it("does nothing when the saved plan is empty", () => {
    const createObjectURL = vi.fn();
    const createElement = vi.spyOn(document, "createElement");
    vi.stubGlobal("URL", { createObjectURL });

    downloadCalendar([]);

    expect(createObjectURL).not.toHaveBeenCalled();
    expect(createElement).not.toHaveBeenCalled();

    createElement.mockRestore();
    vi.unstubAllGlobals();
  });
});
