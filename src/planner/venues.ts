import type { FestivalEvent } from "../domain/festival";

export type VenueOption = { label: string; value: string };

const CANONICAL_VENUE_VALUES: Readonly<Record<string, string>> = {
  "Love-Serve Bar": "Love Serve Bar",
};

export function canonicalVenueValue(venue: string): string {
  return CANONICAL_VENUE_VALUES[venue] ?? venue;
}

export function getVenueOptions(
  events: readonly FestivalEvent[],
): readonly VenueOption[] {
  return [...new Set(events.map((event) => canonicalVenueValue(event.venue)))]
    .sort((left, right) => left.localeCompare(right))
    .map((venue) => ({ label: venue, value: venue }));
}
