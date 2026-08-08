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
