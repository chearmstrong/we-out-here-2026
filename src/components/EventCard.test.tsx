import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FestivalEvent } from "../domain/festival";
import { EventCard } from "./EventCard";

const event: FestivalEvent = {
  id: "thursday:main-stage:kotoa",
  title: "Kotoa",
  programmeDay: "thursday",
  venue: "Main Stage",
  startsAt: "2026-08-20T13:20:00+01:00",
  endsAt: "2026-08-20T14:00:00+01:00",
  category: "music",
  source: "music-programme",
};

const familyAreaEvent: FestivalEvent = {
  ...event,
  id: "thursday:scorcha-skate-school:skateboarding-workshops",
  title: "SKATEBOARDING WORKSHOPS",
  venue: "Scorcha Skate School",
  category: "family",
  source: "family-programme",
  locationStatus: "check-on-site",
};

describe("EventCard", () => {
  it("announces an event type in text and toggles a favourite", async () => {
    const user = userEvent.setup();
    const toggle = vi.fn();

    render(
      <EventCard
        event={{ ...event, category: "family" }}
        isFavourite={false}
        isClashing={false}
        onToggleFavourite={toggle}
      />,
    );

    expect(screen.getByText("Family")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save Kotoa" }));
    expect(toggle).toHaveBeenCalledWith(event.id);
  });

  it("keeps the official Family venue label and shows its location hint", () => {
    render(
      <EventCard
        event={familyAreaEvent}
        isFavourite={false}
        isClashing={false}
        onToggleFavourite={() => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "SKATEBOARDING WORKSHOPS" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Scorcha Skate School")).toBeInTheDocument();
    expect(screen.getByText("Location: check on site")).toBeInTheDocument();
  });

  it("does not show a location hint for an ordinary Music event", () => {
    render(
      <EventCard
        event={event}
        isFavourite={false}
        isClashing={false}
        onToggleFavourite={() => undefined}
      />,
    );

    expect(screen.queryByText("Location: check on site")).not.toBeInTheDocument();
  });

  it("shows a text clash warning and opens event details", async () => {
    const user = userEvent.setup();
    const viewDetails = vi.fn();

    render(
      <EventCard
        event={event}
        isFavourite={true}
        isClashing={true}
        onToggleFavourite={() => undefined}
        onViewDetails={viewDetails}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Clashes with another saved event",
    );
    await user.click(
      screen.getByRole("button", { name: "View Kotoa details" }),
    );
    expect(viewDetails).toHaveBeenCalledOnce();
  });
});
