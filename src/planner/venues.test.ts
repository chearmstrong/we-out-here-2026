import { expect, it } from "vitest";
import type { FestivalEvent } from "../domain/festival";
import {
  canonicalVenueValue,
  getVenueOptions,
} from "./venues";

const eventsWithLoveServeVariants: FestivalEvent[] = [
  {
    id: "thursday:love-serve-bar:hyphenated",
    title: "Hyphenated venue",
    programmeDay: "thursday",
    venue: "Love-Serve Bar",
    startsAt: "2026-08-20T13:00:00+01:00",
    endsAt: "2026-08-20T14:00:00+01:00",
    category: "music",
    source: "music-programme",
  },
  {
    id: "thursday:love-serve-bar:canonical",
    title: "Canonical venue",
    programmeDay: "thursday",
    venue: "Love Serve Bar",
    startsAt: "2026-08-20T14:00:00+01:00",
    endsAt: "2026-08-20T15:00:00+01:00",
    category: "family",
    source: "wider-programme",
  },
];

it("presents source spelling variants as one canonical venue choice", () => {
  expect(getVenueOptions(eventsWithLoveServeVariants)).toEqual([
    { label: "Love Serve Bar", value: "Love Serve Bar" },
  ]);
});

it("leaves unlisted source venue values unchanged", () => {
  expect(canonicalVenueValue("The Grove")).toBe("The Grove");
});

it("orders canonical venue choices alphabetically without mutating events", () => {
  const mainStageEvent = {
    ...eventsWithLoveServeVariants[0],
    id: "thursday:main-stage:fixture",
    venue: "Main Stage",
  };
  const input = [eventsWithLoveServeVariants[0], mainStageEvent];

  expect(getVenueOptions(input)).toEqual([
    { label: "Love Serve Bar", value: "Love Serve Bar" },
    { label: "Main Stage", value: "Main Stage" },
  ]);
  expect(input.map(({ venue }) => venue)).toEqual([
    "Love-Serve Bar",
    "Main Stage",
  ]);
});
