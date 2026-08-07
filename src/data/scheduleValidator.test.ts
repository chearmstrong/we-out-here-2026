import { describe, expect, it } from "vitest";
import type { FestivalEvent } from "../domain/festival";
import { schedule } from "./schedule";
import { scheduleChanges } from "./scheduleChanges";
import { validateSchedule } from "./scheduleValidator";

const validEvent: FestivalEvent = {
  id: "thursday:main-stage:kotoa",
  title: "Kotoa",
  programmeDay: "thursday",
  venue: "Main Stage",
  startsAt: "2026-08-20T13:20:00+01:00",
  endsAt: "2026-08-20T14:00:00+01:00",
  category: "music",
  source: "music-programme",
};

describe("validateSchedule", () => {
  it("accepts a complete valid event", () => {
    expect(validateSchedule([validEvent])).toEqual([]);
  });

  it("rejects duplicate IDs and end times before start times", () => {
    expect(
      validateSchedule([
        { ...validEvent },
        { ...validEvent, endsAt: "2026-08-20T12:00:00+01:00" },
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/duplicate/i),
        expect.stringMatching(/end/i),
      ]),
    );
  });

  it("rejects blank required fields", () => {
    const blankEvent = {
      ...validEvent,
      id: " ",
      title: "",
      programmeDay: "",
      venue: "\t",
      startsAt: "",
      endsAt: "",
      category: "",
      source: "",
    } as unknown as FestivalEvent;

    expect(validateSchedule([blankEvent])).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/id.*blank/i),
        expect.stringMatching(/title.*blank/i),
        expect.stringMatching(/programmeDay.*blank/i),
        expect.stringMatching(/venue.*blank/i),
        expect.stringMatching(/startsAt.*blank/i),
        expect.stringMatching(/endsAt.*blank/i),
        expect.stringMatching(/category.*blank/i),
        expect.stringMatching(/source.*blank/i),
      ]),
    );
  });

  it("rejects unknown categories and Programme Days", () => {
    const invalidEvent = {
      ...validEvent,
      category: "screening",
      programmeDay: "monday",
    } as unknown as FestivalEvent;

    expect(validateSchedule([invalidEvent])).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/category/i),
        expect.stringMatching(/programme day/i),
      ]),
    );
  });

  it("rejects non-ISO timestamps", () => {
    expect(
      validateSchedule([
        {
          ...validEvent,
          startsAt: "20 August 2026 13:20",
          endsAt: "tomorrow",
        },
      ]),
    ).toEqual([
      expect.stringMatching(/start.*ISO/i),
      expect.stringMatching(/end.*ISO/i),
    ]);
  });

  it("rejects zero-duration events", () => {
    expect(
      validateSchedule([{ ...validEvent, endsAt: validEvent.startsAt }]),
    ).toEqual([expect.stringMatching(/positive duration/i)]);
  });

  it("rejects schedule-change targets absent from the new snapshot", () => {
    const scheduleChanges = new Map([
      ["thursday:old-stage:kotoa", "thursday:new-stage:kotoa"],
    ]);

    expect(validateSchedule([validEvent], scheduleChanges)).toEqual([
      expect.stringMatching(/change target.*does not exist/i),
    ]);
  });

  it("accepts schedule-change targets present in the new snapshot", () => {
    const scheduleChanges = new Map([
      ["thursday:old-stage:kotoa", validEvent.id],
    ]);

    expect(validateSchedule([validEvent], scheduleChanges)).toEqual([]);
  });

  it("ships the complete valid schedule from both official programme tabs", () => {
    expect(validateSchedule(schedule, scheduleChanges)).toEqual([]);
    expect(schedule).toHaveLength(723);
    expect(schedule).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "music-programme" }),
        expect.objectContaining({ source: "wider-programme" }),
      ]),
    );
    expect(
      schedule.some(({ title, venue }) =>
        /&(?:#\d+|[a-z]+);/i.test(`${title}${venue}`),
      ),
    ).toBe(false);
  });
});
