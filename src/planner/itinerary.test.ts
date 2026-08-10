import { describe, expect, it } from "vitest";
import type { FestivalEvent } from "../domain/festival";
import {
  filterBrowseEvents,
  filterEvents,
  getClashingEventIds,
  getCurrentAndNext,
  getCurrentProgrammeDay,
  getDefaultBrowseProgrammeDay,
  getNextProgrammeDay,
} from "./itinerary";

const event = (
  overrides: Partial<FestivalEvent> & Pick<FestivalEvent, "id" | "title">,
): FestivalEvent => ({
  programmeDay: "friday",
  venue: "Main Stage",
  startsAt: "2026-08-21T18:30:00+01:00",
  endsAt: "2026-08-21T20:00:00+01:00",
  category: "music",
  source: "music-programme",
  ...overrides,
});

const events = [
  event({ id: "two", title: "Beta", startsAt: "2026-08-21T19:30:00+01:00", endsAt: "2026-08-21T21:00:00+01:00" }),
  event({ id: "one", title: "Alpha" }),
  event({ id: "three", title: "Gamma", startsAt: "2026-08-21T21:00:00+01:00", endsAt: "2026-08-21T22:00:00+01:00" }),
] as const;

const fridayLeafPrinting = event({
  id: "friday:woodland-workshop:leaf-printing",
  title: "Leaf Printing",
  programmeDay: "friday",
  venue: "Woodland Workshop",
  startsAt: "2026-08-21T10:00:00+01:00",
  endsAt: "2026-08-21T11:00:00+01:00",
  category: "family",
  source: "wider-programme",
});

describe("getDefaultBrowseProgrammeDay", () => {
  it.each([
    ["before the festival", "2026-08-19T23:00:00+01:00", "thursday"],
    ["during Friday", "2026-08-21T10:00:00+01:00", "friday"],
    ["after the festival", "2026-08-24T00:00:00+01:00", "all"],
  ] as const)("uses the London Programme Day %s", (_, at, expectedDay) => {
    expect(getDefaultBrowseProgrammeDay(new Date(at))).toBe(expectedDay);
  });
});

describe("filterBrowseEvents", () => {
  it("searches the whole weekend despite a selected Programme Day", () => {
    expect(
      filterBrowseEvents([events[0], fridayLeafPrinting], {
        query: "Leaf",
        programmeDay: "thursday",
        venue: "all",
        category: "all",
      }),
    ).toEqual([fridayLeafPrinting]);
  });

  it("keeps venue and category filters active during a global search", () => {
    expect(
      filterBrowseEvents([events[0], fridayLeafPrinting], {
        query: "Leaf",
        programmeDay: "thursday",
        venue: "Main Stage",
        category: "all",
      }),
    ).toEqual([]);
  });

  it("matches every raw spelling of a canonical venue filter", () => {
    const hyphenatedVenue = event({
      id: "love-serve-hyphenated",
      title: "Hyphenated venue",
      venue: "Love-Serve Bar",
    });
    const canonicalVenue = event({
      id: "love-serve-canonical",
      title: "Canonical venue",
      venue: "Love Serve Bar",
      startsAt: "2026-08-21T20:00:00+01:00",
      endsAt: "2026-08-21T21:00:00+01:00",
    });

    expect(
      filterBrowseEvents([canonicalVenue, hyphenatedVenue], {
        query: "",
        programmeDay: "friday",
        venue: "Love Serve Bar",
        category: "all",
      }),
    ).toEqual([hyphenatedVenue, canonicalVenue]);
  });
});

describe("filterEvents", () => {
  it("matches a trimmed case-insensitive title query", () => {
    expect(filterEvents(events, { query: "  bEt  ", programmeDay: "all", venue: "all", category: "all" }).map(({ id }) => id)).toEqual(["two"]);
  });

  it("filters by the official Programme Day rather than the timestamp date", () => {
    const overnight = event({
      id: "overnight",
      title: "Overnight",
      programmeDay: "friday",
      startsAt: "2026-08-22T01:00:00+01:00",
      endsAt: "2026-08-22T02:00:00+01:00",
    });

    expect(filterEvents([overnight], { query: "", programmeDay: "friday", venue: "all", category: "all" })).toEqual([overnight]);
    expect(filterEvents([overnight], { query: "", programmeDay: "saturday", venue: "all", category: "all" })).toEqual([]);
  });

  it("filters by venue", () => {
    const grove = event({ id: "grove", title: "Grove", venue: "The Grove" });

    expect(filterEvents([...events, grove], { query: "", programmeDay: "all", venue: "The Grove", category: "all" })).toEqual([grove]);
  });

  it("filters by category", () => {
    const talk = event({ id: "talk", title: "A talk", category: "talk", source: "wider-programme" });

    expect(filterEvents([...events, talk], { query: "", programmeDay: "all", venue: "all", category: "talk" })).toEqual([talk]);
  });

  it("sorts by start and then title without mutating the input", () => {
    const beta = event({ id: "beta", title: "Beta" });
    const alpha = event({ id: "alpha", title: "Alpha" });
    const input = [beta, alpha];

    expect(filterEvents(input, { query: "", programmeDay: "all", venue: "all", category: "all" }).map(({ id }) => id)).toEqual(["alpha", "beta"]);
    expect(input).toEqual([beta, alpha]);
  });
});

describe("getCurrentAndNext", () => {
  it("returns the active event and the next saved event in chronological order", () => {
    const result = getCurrentAndNext(events, new Date("2026-08-21T19:00:00+01:00"));

    expect(result.now?.id).toBe("one");
    expect(result.next?.id).toBe("two");
  });

  it("treats starts as inclusive and ends as exclusive", () => {
    expect(getCurrentAndNext(events, new Date("2026-08-21T18:30:00+01:00")).now?.id).toBe("one");
    expect(getCurrentAndNext(events, new Date("2026-08-21T20:00:00+01:00")).now?.id).toBe("two");
  });

  it("returns nulls after the final event", () => {
    expect(getCurrentAndNext(events, new Date("2026-08-21T23:00:00+01:00"))).toEqual({ now: null, next: null });
  });

  it("does not mutate its input", () => {
    const input = [...events];

    getCurrentAndNext(input, new Date("2026-08-21T19:00:00+01:00"));

    expect(input.map(({ id }) => id)).toEqual(["two", "one", "three"]);
  });
});

describe("getClashingEventIds", () => {
  it("marks both events in a real overlap", () => {
    expect(getClashingEventIds(events)).toEqual(new Set(["one", "two"]));
  });

  it("does not mark adjacent events whose boundaries only touch", () => {
    const first = event({ id: "first", title: "First", startsAt: "2026-08-21T20:00:00+01:00", endsAt: "2026-08-21T21:00:00+01:00" });
    const second = event({ id: "second", title: "Second", startsAt: "2026-08-21T21:00:00+01:00", endsAt: "2026-08-21T22:00:00+01:00" });

    expect(getClashingEventIds([second, first])).toEqual(new Set());
  });

  it("detects overlaps across midnight using real timestamps", () => {
    const overnight = event({ id: "overnight", title: "Overnight", startsAt: "2026-08-21T23:30:00+01:00", endsAt: "2026-08-22T01:30:00+01:00" });
    const afterMidnight = event({ id: "after-midnight", title: "After midnight", startsAt: "2026-08-22T01:00:00+01:00", endsAt: "2026-08-22T02:00:00+01:00" });

    expect(getClashingEventIds([afterMidnight, overnight])).toEqual(new Set(["overnight", "after-midnight"]));
  });
});

describe("getCurrentProgrammeDay", () => {
  it("uses the active event's Programme Day even after midnight", () => {
    const overnight = event({ id: "overnight", title: "Overnight", programmeDay: "friday", startsAt: "2026-08-22T00:30:00+01:00", endsAt: "2026-08-22T02:00:00+01:00" });

    expect(getCurrentProgrammeDay([overnight], new Date("2026-08-22T01:00:00+01:00"))).toBe("friday");
  });

  it("does not call an upcoming Programme Day current during a plan gap", () => {
    const at = new Date("2026-08-21T12:00:00+01:00");

    expect(getCurrentProgrammeDay(events, at)).toBeNull();
    expect(getNextProgrammeDay(events, at)).toBe("friday");
  });

  it("returns null when there is no current or next event", () => {
    expect(getCurrentProgrammeDay(events, new Date("2026-08-22T12:00:00+01:00"))).toBeNull();
  });
});
