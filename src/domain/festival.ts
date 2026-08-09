export const EVENT_CATEGORIES = [
  "music",
  "talk",
  "workshop",
  "family",
  "other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export const PROGRAMME_SOURCES = [
  "music-programme",
  "wider-programme",
  "family-programme",
] as const;

export type ProgrammeSource = (typeof PROGRAMME_SOURCES)[number];
export type ProgrammeDay = "thursday" | "friday" | "saturday" | "sunday";
export type EventLocationStatus = "check-on-site";

export type FestivalEvent = {
  id: string;
  title: string;
  programmeDay: ProgrammeDay;
  venue: string;
  startsAt: string;
  endsAt: string;
  category: EventCategory;
  source: ProgrammeSource;
  locationStatus?: EventLocationStatus;
};
