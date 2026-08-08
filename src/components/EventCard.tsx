import {
  Hammer,
  MessageCircle,
  Music2,
  Shapes,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type {
  EventCategory,
  FestivalEvent,
  ProgrammeDay,
} from "../domain/festival";

const LONDON_TIME_ZONE = "Europe/London";

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: LONDON_TIME_ZONE,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: LONDON_TIME_ZONE,
});

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: LONDON_TIME_ZONE,
});

const weekdayFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  timeZone: LONDON_TIME_ZONE,
});

const categoryIcons: Record<EventCategory, LucideIcon> = {
  music: Music2,
  talk: MessageCircle,
  workshop: Hammer,
  family: Shapes,
  other: Sparkles,
};

const categoryLabels: Record<EventCategory, string> = {
  music: "Music",
  talk: "Talk",
  workshop: "Workshop",
  family: "Family",
  other: "Other",
};

const programmeDayLabels: Record<ProgrammeDay, string> = {
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function categoryLabel(category: EventCategory): string {
  return categoryLabels[category];
}

export function programmeDayLabel(programmeDay: ProgrammeDay): string {
  return programmeDayLabels[programmeDay];
}

export function formatTimeRange(event: FestivalEvent): string {
  return `${timeFormatter.format(new Date(event.startsAt))}–${timeFormatter.format(new Date(event.endsAt))}`;
}

export function formatFullTimeRange(event: FestivalEvent): string {
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);
  const startDate = `${weekdayFormatter.format(startsAt)} ${dateFormatter.format(startsAt)}`;

  if (dateKeyFormatter.format(startsAt) === dateKeyFormatter.format(endsAt)) {
    return `${startDate}, ${formatTimeRange(event)}`;
  }

  const endDay = weekdayFormatter.format(endsAt);

  return `${startDate}, ${timeFormatter.format(startsAt)}–${endDay} ${dateFormatter.format(endsAt)}, ${timeFormatter.format(endsAt)}`;
}

export type CategoryIconProps = {
  category: EventCategory;
  "aria-hidden"?: true | "true";
};

export function CategoryIcon({
  category,
  "aria-hidden": ariaHidden = true,
}: CategoryIconProps) {
  const Icon = categoryIcons[category];

  return (
    <Icon
      aria-hidden={ariaHidden}
      className="category-icon"
      focusable="false"
      size={18}
      strokeWidth={2.4}
    />
  );
}

export type EventCardProps = {
  event: FestivalEvent;
  isFavourite: boolean;
  isClashing: boolean;
  showProgrammeDay?: boolean;
  onToggleFavourite: (eventId: string) => void;
  onViewDetails?: (opener: HTMLButtonElement) => void;
};

export function EventCard({
  event,
  isFavourite,
  isClashing,
  showProgrammeDay = false,
  onToggleFavourite,
  onViewDetails,
}: EventCardProps) {
  return (
    <article
      aria-label={event.title}
      className={`event-card event-card--${event.category}`}
    >
      <p className="category-tag">
        <CategoryIcon category={event.category} aria-hidden="true" />
        <span>{categoryLabel(event.category)}</span>
      </p>
      <h3>{event.title}</h3>
      <p className="event-card__when">
        <time dateTime={event.startsAt}>{formatTimeRange(event)}</time>
        <span aria-hidden="true"> · </span>
        <span>{event.venue}</span>
        {showProgrammeDay ? (
          <>
            <span aria-hidden="true"> · </span>
            <span>{programmeDayLabel(event.programmeDay)}</span>
          </>
        ) : null}
      </p>
      {isClashing ? (
        <p className="clash-note" role="status">
          Clashes with another saved event
        </p>
      ) : null}
      <div className="event-card__actions">
        {onViewDetails ? (
          <button
            className="text-button"
            type="button"
            aria-label={`View ${event.title} details`}
            onClick={(clickEvent) =>
              onViewDetails(clickEvent.currentTarget)
            }
          >
            View details
          </button>
        ) : null}
        <button
          className={`save-button${isFavourite ? " save-button--saved" : ""}`}
          type="button"
          aria-pressed={isFavourite}
          aria-label={`${isFavourite ? "Remove" : "Save"} ${event.title}`}
          onClick={() => onToggleFavourite(event.id)}
        >
          <span aria-hidden="true">{isFavourite ? "−" : "+"}</span>
          {isFavourite ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  );
}
