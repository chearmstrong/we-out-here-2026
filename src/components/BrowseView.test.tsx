import { StrictMode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FestivalEvent } from "../domain/festival";
import { BrowseView } from "./BrowseView";

const events: FestivalEvent[] = [
  {
    id: "thursday:main-stage:kotoa",
    title: "Kotoa",
    programmeDay: "thursday",
    venue: "Main Stage",
    startsAt: "2026-08-20T13:20:00+01:00",
    endsAt: "2026-08-20T14:00:00+01:00",
    category: "music",
    source: "music-programme",
  },
  {
    id: "friday:woodland-workshop:leaf-printing",
    title: "Leaf Printing",
    programmeDay: "friday",
    venue: "Woodland Workshop",
    startsAt: "2026-08-21T10:00:00+01:00",
    endsAt: "2026-08-21T11:00:00+01:00",
    category: "family",
    source: "wider-programme",
  },
];

describe("BrowseView", () => {
  it("filters by text, day, venue, and category without hiding saved controls", async () => {
    const user = userEvent.setup();

    render(
      <BrowseView
        events={events}
        favouriteIds={new Set([events[0].id])}
        onToggleFavourite={() => undefined}
      />,
    );

    await user.type(screen.getByLabelText("Search programme"), "Kotoa");
    await user.selectOptions(screen.getByLabelText("Programme Day"), "thursday");
    await user.selectOptions(screen.getByLabelText("Venue"), "Main Stage");
    await user.selectOptions(screen.getByLabelText("Category"), "music");

    expect(screen.getByRole("article", { name: /Kotoa/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Kotoa" })).toBeVisible();
    expect(
      screen.queryByRole("article", { name: /Leaf Printing/i }),
    ).not.toBeInTheDocument();
  });

  it("starts chronologically and offers list and timetable modes", async () => {
    const user = userEvent.setup();

    render(
      <BrowseView
        events={[events[1], events[0]]}
        favouriteIds={new Set()}
        onToggleFavourite={() => undefined}
      />,
    );

    const cards = screen.getAllByRole("article");
    expect(within(cards[0]).getByRole("heading", { name: "Kotoa" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Show timetable" }));
    expect(screen.getByRole("heading", { name: "Thursday" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Main Stage" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Show list" })).toBeVisible();
  });

  it("positions events against a labelled time axis so timetable gaps stay visible", async () => {
    const user = userEvent.setup();
    const lateEvent = {
      ...events[0],
      id: "thursday:main-stage:late-set",
      title: "Late Set",
      startsAt: "2026-08-20T15:00:00+01:00",
      endsAt: "2026-08-20T16:00:00+01:00",
    };
    const shortEvent = {
      ...events[0],
      id: "thursday:main-stage:short-event",
      title: "Short Event",
      startsAt: "2026-08-20T13:00:00+01:00",
      endsAt: "2026-08-20T13:10:00+01:00",
    };

    render(
      <BrowseView
        events={[lateEvent, events[0], shortEvent]}
        favouriteIds={new Set()}
        onToggleFavourite={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Show timetable" }));

    expect(
      screen.getByRole("group", { name: "Thursday time axis" }),
    ).toHaveTextContent("13:00");
    expect(
      screen.getByRole("group", { name: "Thursday time axis" }),
    ).toHaveTextContent("16:00");
    const kotoa = screen.getByRole("article", { name: "Kotoa timetable event" });
    const late = screen.getByRole("article", { name: "Late Set timetable event" });
    const short = screen.getByRole("article", {
      name: "Short Event timetable event",
    });
    expect(kotoa).toHaveStyle({ left: "40px", width: "80px" });
    expect(late).toHaveStyle({ left: "240px", width: "120px" });
    expect(short).toHaveStyle({ left: "0px", width: "44px" });
    const durationMarker = short.querySelector(".timetable-event__duration");
    expect(durationMarker).not.toBeNull();
    expect(durationMarker).toHaveStyle({ width: "20px" });
    expect(
      within(short).getByRole("button", {
        name: "View Short Event details from timetable",
      }),
    ).toHaveStyle({ minWidth: "44px" });
    expect(screen.getByRole("button", { name: "Save Kotoa" })).toHaveStyle({
      width: "44px",
      height: "44px",
    });
  });

  it("announces timetable clashes as text for both saved events", async () => {
    const user = userEvent.setup();
    const overlapping = {
      ...events[0],
      id: "thursday:main-stage:overlapping",
      title: "Overlapping Set",
      startsAt: "2026-08-20T13:30:00+01:00",
      endsAt: "2026-08-20T14:10:00+01:00",
    };
    render(
      <BrowseView
        events={[events[0], overlapping]}
        favouriteIds={new Set([events[0].id, overlapping.id])}
        onToggleFavourite={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Show timetable" }));

    for (const title of ["Kotoa", "Overlapping Set"]) {
      expect(
        within(
          screen.getByRole("article", { name: `${title} timetable event` }),
        ).getByText("Clashes with another saved event"),
      ).toBeInTheDocument();
    }
  });

  it("opens details from the temporal timetable and exposes the save action", async () => {
    const user = userEvent.setup();
    const toggle = vi.fn();
    render(
      <BrowseView
        events={[events[0]]}
        favouriteIds={new Set()}
        onToggleFavourite={toggle}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Show timetable" }));
    await user.click(
      screen.getByRole("button", { name: "View Kotoa details from timetable" }),
    );
    await user.click(screen.getByRole("button", { name: "Save Kotoa" }));

    expect(toggle).toHaveBeenCalledWith(events[0].id);
  });

  it("opens details from a card and keeps save actions working there", async () => {
    const user = userEvent.setup();
    const toggle = vi.fn();

    render(
      <BrowseView
        events={[events[0]]}
        favouriteIds={new Set()}
        onToggleFavourite={toggle}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "View Kotoa details" }),
    );
    expect(screen.getByRole("dialog", { name: "Kotoa details" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Save Kotoa" }));
    expect(toggle).toHaveBeenCalledWith(events[0].id);
  });

  it("isolates the complete planner composition while details are open", async () => {
    const user = userEvent.setup();

    render(
      <>
        <nav aria-label="Planner views">
          <button type="button">My plan</button>
        </nav>
        <BrowseView
          events={[events[0]]}
          favouriteIds={new Set()}
          onToggleFavourite={() => undefined}
        />
        <aside aria-label="Offline status">
          <button type="button">Allow update</button>
        </aside>
      </>,
    );

    await user.click(
      screen.getByRole("button", { name: "View Kotoa details" }),
    );

    expect(screen.getByRole("dialog", { name: "Kotoa details" })).toBeVisible();
    expect(
      screen.queryByRole("navigation", { name: "Planner views" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("complementary", { name: "Offline status" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Close Kotoa details" }),
    );

    expect(
      screen.getByRole("navigation", { name: "Planner views" }),
    ).toBeVisible();
    expect(
      screen.getByRole("complementary", { name: "Offline status" }),
    ).toBeVisible();
  });

  it("restores the original card opener when StrictMode replays effects", async () => {
    const user = userEvent.setup();

    render(
      <StrictMode>
        <BrowseView
          events={[events[0]]}
          favouriteIds={new Set()}
          onToggleFavourite={() => undefined}
        />
      </StrictMode>,
    );

    const opener = screen.getByRole("button", {
      name: "View Kotoa details",
    });
    const nativeFocus = opener.focus.bind(opener);
    opener.focus = () => {
      if (!opener.closest("[inert]")) {
        nativeFocus();
      }
    };

    await user.click(opener);
    expect(
      screen.getByRole("button", { name: "Close Kotoa details" }),
    ).toHaveFocus();
    await new Promise<void>((resolve) =>
      window.requestAnimationFrame(() => resolve()),
    );

    await user.click(
      screen.getByRole("button", { name: "Close Kotoa details" }),
    );

    await waitFor(() => expect(opener).toHaveFocus());
  });
});
