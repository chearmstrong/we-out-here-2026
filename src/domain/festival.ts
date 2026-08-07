export const EVENT_CATEGORIES = [
  "music",
  "talk",
  "workshop",
  "family",
  "other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type ProgrammeSource = "music-programme" | "wider-programme";
export type ProgrammeDay = "thursday" | "friday" | "saturday" | "sunday";

export type FestivalEvent = {
  id: string;
  title: string;
  programmeDay: ProgrammeDay;
  venue: string;
  startsAt: string;
  endsAt: string;
  category: EventCategory;
  source: ProgrammeSource;
};
