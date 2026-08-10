import { describe, expect, it } from "vitest";
import type { FestivalEvent } from "../domain/festival";
import { getDayScheduleModel } from "./daySchedule";

const event = (
  overrides: Partial<FestivalEvent> & Pick<FestivalEvent, "id" | "title">,
): FestivalEvent => ({
  programmeDay: "thursday",
  venue: "The Grove",
  startsAt: "2026-08-20T13:00:00+01:00",
  endsAt: "2026-08-20T14:00:00+01:00",
  category: "music",
  source: "music-programme",
  ...overrides,
});

const thursdayEvents = [
  event({
    id: "late",
    title: "Late Set",
    startsAt: "2026-08-20T15:00:00+01:00",
    endsAt: "2026-08-20T16:00:00+01:00",
  }),
  event({
    id: "active-b",
    title: "Bravo",
    startsAt: "2026-08-20T13:15:00+01:00",
    endsAt: "2026-08-20T13:45:00+01:00",
  }),
  event({
    id: "early",
    title: "Early Set",
    startsAt: "2026-08-20T12:00:00+01:00",
    endsAt: "2026-08-20T13:30:00+01:00",
  }),
  event({
    id: "active-a",
    title: "Alpha",
    startsAt: "2026-08-20T13:00:00+01:00",
    endsAt: "2026-08-20T14:00:00+01:00",
  }),
  event({
    id: "gap-next",
    title: "Gap Next",
    startsAt: "2026-08-20T14:30:00+01:00",
    endsAt: "2026-08-20T15:00:00+01:00",
  }),
  event({
    id: "same-start-beta",
    title: "Beta",
    startsAt: "2026-08-20T16:30:00+01:00",
    endsAt: "2026-08-20T17:00:00+01:00",
  }),
  event({
    id: "same-start-alpha",
    title: "Alpha Again",
    startsAt: "2026-08-20T16:30:00+01:00",
    endsAt: "2026-08-20T17:30:00+01:00",
  }),
  event({
    id: "friday-event",
    title: "Friday Event",
    programmeDay: "friday",
    startsAt: "2026-08-21T12:00:00+01:00",
    endsAt: "2026-08-21T13:00:00+01:00",
  }),
] as const;

const beforeFestival = new Date("2026-08-19T12:00:00+01:00");
const eventsAcrossThursdayAndFriday = [
  event({
    id: "thursday-set",
    title: "Thursday set",
  }),
  event({
    id: "friday-set",
    title: "Friday set",
    programmeDay: "friday",
    startsAt: "2026-08-21T13:00:00+01:00",
    endsAt: "2026-08-21T14:00:00+01:00",
  }),
] as const;

describe("getDayScheduleModel", () => {
  it("keeps an explicit All days schedule grouped in official Programme Day order", () => {
    const model = getDayScheduleModel(
      eventsAcrossThursdayAndFriday,
      "all",
      beforeFestival,
    );

    expect(
      model.programmeGroups.map((group) => group.programmeDay),
    ).toEqual(["thursday", "friday"]);
    expect(
      model.programmeGroups[0].groups[0].events.map((event) => event.title),
    ).toEqual(["Thursday set"]);
    expect(
      model.programmeGroups[1].groups[0].events.map((event) => event.title),
    ).toEqual(["Friday set"]);
  });

  it("keeps a selected Sunday schedule scoped to Sunday", () => {
    const sundayEvent = event({
      id: "sunday-set",
      title: "Sunday set",
      programmeDay: "sunday",
      startsAt: "2026-08-23T13:00:00+01:00",
      endsAt: "2026-08-23T14:00:00+01:00",
    });
    const model = getDayScheduleModel(
      [...eventsAcrossThursdayAndFriday, sundayEvent],
      "sunday",
      beforeFestival,
    );

    expect(model.programmeGroups).toHaveLength(1);
    expect(model.programmeGroups[0].programmeDay).toBe("sunday");
    expect(
      model.programmeGroups[0].groups.flatMap((group) =>
        group.events.map((event) => event.title),
      ),
    ).toEqual(["Sunday set"]);
  });

  it("shows no live state before the festival", () => {
    expect(
      getDayScheduleModel(
        thursdayEvents,
        "thursday",
        new Date("2026-08-19T12:00:00+01:00"),
      ),
    ).toMatchObject({
      beforeFestival: true,
      currentEvents: [],
      nextEvent: undefined,
      earlierGroups: [],
    });
  });

  it("shows all overlapping events that are active at the supplied time", () => {
    const model = getDayScheduleModel(
      thursdayEvents,
      "thursday",
      new Date("2026-08-20T13:30:00+01:00"),
    );

    expect(model.currentEvents.map(({ id }) => id)).toEqual([
      "active-a",
      "active-b",
    ]);
  });

  it("selects the earliest future event during a gap", () => {
    const model = getDayScheduleModel(
      thursdayEvents,
      "thursday",
      new Date("2026-08-20T14:15:00+01:00"),
    );

    expect(model.currentEvents).toEqual([]);
    expect(model.nextEvent?.id).toBe("gap-next");
  });

  it("moves events ending exactly at now into earlier groups", () => {
    const model = getDayScheduleModel(
      thursdayEvents,
      "thursday",
      new Date("2026-08-20T13:30:00+01:00"),
    );

    expect(model.earlierGroups).toEqual([
      {
        startsAt: "2026-08-20T12:00:00+01:00",
        events: [expect.objectContaining({ id: "early" })],
      },
    ]);
    expect(model.visibleGroups.flatMap((group) => group.events).map(({ id }) => id)).not.toContain("early");
  });

  it("has no current, next, or visible events after the selected day ends", () => {
    const model = getDayScheduleModel(
      thursdayEvents,
      "thursday",
      new Date("2026-08-20T18:00:00+01:00"),
    );

    expect(model).toMatchObject({
      beforeFestival: false,
      currentEvents: [],
      nextEvent: undefined,
      visibleGroups: [],
    });
  });

  it("excludes events from other Programme Days", () => {
    const model = getDayScheduleModel(
      thursdayEvents,
      "thursday",
      new Date("2026-08-20T12:30:00+01:00"),
    );

    expect(model.visibleGroups.flatMap((group) => group.events).map(({ id }) => id)).not.toContain("friday-event");
  });

  it("groups visible events by start time in chronological order", () => {
    const model = getDayScheduleModel(
      thursdayEvents,
      "thursday",
      new Date("2026-08-20T16:00:00+01:00"),
    );

    expect(model.visibleGroups.map(({ startsAt, events }) => ({
      startsAt,
      ids: events.map(({ id }) => id),
    }))).toEqual([
      {
        startsAt: "2026-08-20T16:30:00+01:00",
        ids: ["same-start-alpha", "same-start-beta"],
      },
    ]);
  });
});
