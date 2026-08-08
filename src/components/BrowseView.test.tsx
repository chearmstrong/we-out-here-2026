import { StrictMode, act } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FestivalEvent } from "../domain/festival";
import { BrowseView, PHONE_LAYOUT_QUERY } from "./BrowseView";

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

function mockPhoneLayout(initialMatches: boolean) {
  const listeners = new Set<EventListener>();
  const requestedQueries: string[] = [];
  const mediaQueryList = {
    matches: initialMatches,
    media: PHONE_LAYOUT_QUERY,
    onchange: null,
    addEventListener: (_type: string, listener: EventListener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: EventListener) => {
      listeners.delete(listener);
    },
  } as unknown as MediaQueryList;

  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      requestedQueries.push(query);
      return mediaQueryList;
    }),
  );

  return {
    requestedQueries,
    setMatches(matches: boolean) {
      Object.defineProperty(mediaQueryList, "matches", {
        configurable: true,
        value: matches,
      });
      const changeEvent = {
        matches,
        media: mediaQueryList.media,
      } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(changeEvent));
    },
  };
}

function mockViewportLayout(width: number, height: number) {
  const requestedQueries: string[] = [];
  const mediaQueryLists = new Map<string, MediaQueryList>();

  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      requestedQueries.push(query);
      const existingMediaQueryList = mediaQueryLists.get(query);
      if (existingMediaQueryList) {
        return existingMediaQueryList;
      }

      const matches = query.split(",").some((branch) =>
        branch.trim().split("and").every((condition) => {
          const match = condition
            .trim()
            .match(/^\(max-(width|height): (\d+)rem\)$/);
          if (!match) {
            return false;
          }

          const value = match[1] === "width" ? width : height;
          return value <= Number(match[2]) * 16;
        }),
      );
      const mediaQueryList = {
        matches,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      } as unknown as MediaQueryList;
      mediaQueryLists.set(query, mediaQueryList);
      return mediaQueryList;
    }),
  );

  return { requestedQueries };
}

describe("BrowseView", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("defaults to Thursday and searches across days until the query is cleared", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T23:00:00+01:00"));

    render(
      <BrowseView
        events={events}
        favouriteIds={new Set()}
        onToggleFavourite={() => undefined}
      />,
    );
    vi.useRealTimers();
    const user = userEvent.setup();

    expect(screen.getByLabelText("Programme Day")).toHaveValue("thursday");
    expect(screen.getByRole("article", { name: "Kotoa" })).toBeVisible();
    expect(
      screen.queryByRole("article", { name: "Leaf Printing" }),
    ).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Search programme"), "Leaf");

    const leafPrinting = screen.getByRole("article", {
      name: "Leaf Printing",
    });
    expect(leafPrinting).toBeVisible();
    expect(within(leafPrinting).getByText("Friday")).toBeVisible();

    await user.clear(screen.getByLabelText("Search programme"));

    expect(screen.getByRole("article", { name: "Kotoa" })).toBeVisible();
    expect(
      screen.queryByRole("article", { name: "Leaf Printing" }),
    ).not.toBeInTheDocument();
  });

  it("filters by text, day, venue, and category without hiding saved controls", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T23:00:00+01:00"));

    render(
      <BrowseView
        events={events}
        favouriteIds={new Set([events[0].id])}
        onToggleFavourite={() => undefined}
      />,
    );
    vi.useRealTimers();
    const user = userEvent.setup();

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

  it("shows the timetable exclusively when desktop layout opens the timetable", async () => {
    mockPhoneLayout(false);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-19T23:00:00+01:00"));

    render(
      <BrowseView
        events={[events[1], events[0]]}
        favouriteIds={new Set()}
        onToggleFavourite={() => undefined}
      />,
    );
    vi.useRealTimers();
    const user = userEvent.setup();

    const cards = screen.getAllByRole("article");
    expect(within(cards[0]).getByRole("heading", { name: "Kotoa" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Show timetable" }));
    const timetable = screen.getByLabelText("Programme timetable");
    expect(
      within(timetable).getByRole("heading", { name: "Thursday" }),
    ).toBeVisible();
    expect(
      within(timetable).getByRole("heading", { name: "Main Stage" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Kotoa day schedule event" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show list" })).toBeVisible();
  });

  it("shows only selected-day phone schedule rows in chronological order", async () => {
    mockViewportLayout(390, 844);
    const user = userEvent.setup();
    const earlySet = {
      ...events[0],
      id: "thursday:main-stage:early-set",
      title: "Early Set",
      startsAt: "2026-08-20T12:00:00+01:00",
      endsAt: "2026-08-20T12:30:00+01:00",
    };

    render(
      <BrowseView
        events={[events[1], events[0], earlySet]}
        favouriteIds={new Set([events[0].id])}
        onToggleFavourite={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Show schedule" }));

    const rows = screen.getAllByRole("button", { name: /day schedule event$/ });
    expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual([
      "Early Set day schedule event",
      "Kotoa day schedule event",
    ]);
    expect(screen.getByRole("heading", { name: "Thursday" })).toBeVisible();
    expect(rows[0]).toHaveTextContent("12:00–12:30");
    expect(rows[0]).toHaveTextContent("Early Set");
    expect(rows[0]).toHaveTextContent("Main Stage");
    expect(rows[0]).toHaveTextContent("Music");
    expect(rows[1]).toHaveTextContent("13:20–14:00");
    expect(rows[1]).toHaveTextContent("Saved");
    expect(rows[0]).toHaveAccessibleDescription(
      "12:00–12:30, Main Stage, Music, Not saved",
    );
    expect(rows[1]).toHaveAccessibleDescription(
      "13:20–14:00, Main Stage, Music, Saved",
    );
    expect(screen.queryByText("Leaf Printing")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Kotoa day schedule event" }),
    );
    expect(screen.getByRole("dialog", { name: "Kotoa details" })).toBeVisible();
  });

  it("keeps the compact phone schedule at wide landscape sizes", async () => {
    mockViewportLayout(956, 440);
    const user = userEvent.setup();
    Object.defineProperties(document.documentElement, {
      clientWidth: { configurable: true, value: 956 },
      scrollWidth: { configurable: true, value: 956 },
    });

    render(
      <BrowseView
        events={[events[0]]}
        favouriteIds={new Set()}
        onToggleFavourite={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Show schedule" }));

    expect(
      screen.getByRole("button", { name: "Kotoa day schedule event" }),
    ).toBeVisible();
    expect(screen.queryByLabelText("Programme timetable")).not.toBeInTheDocument();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
    expect(screen.getByRole("button", { name: "Show browse" })).toBeVisible();
  });

  it("describes saved clashes from compact phone schedule rows", async () => {
    mockViewportLayout(390, 844);
    const user = userEvent.setup();
    const overlapping = {
      ...events[0],
      id: "thursday:main-stage:overlapping-phone-schedule",
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

    await user.click(screen.getByRole("button", { name: "Show schedule" }));

    for (const title of ["Kotoa", "Overlapping Set"]) {
      const row = screen.getByRole("button", {
        name: `${title} day schedule event`,
      });
      expect(row).toHaveClass("phone-day-schedule__row--clashing");
      expect(row).toHaveAccessibleDescription(
        /13:(20|30).*Main Stage.*Music.*Saved.*Clashes with another saved event/,
      );
    }
  });

  it("selects Thursday before opening a phone schedule from All days", async () => {
    mockViewportLayout(390, 844);
    const user = userEvent.setup();

    render(
      <BrowseView
        events={events}
        favouriteIds={new Set()}
        onToggleFavourite={() => undefined}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Programme Day"), "all");
    await user.click(screen.getByRole("button", { name: "Show schedule" }));

    expect(screen.getByLabelText("Programme Day")).toHaveValue("thursday");
    expect(
      screen.getByRole("region", { name: "Thursday day schedule" }),
    ).toBeVisible();
    expect(screen.queryByText("Leaf Printing")).not.toBeInTheDocument();
  });

  it("uses Thursday when the post-festival default opens a phone schedule", async () => {
    mockViewportLayout(390, 844);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T12:00:00+01:00"));

    render(
      <BrowseView
        events={events}
        favouriteIds={new Set()}
        onToggleFavourite={() => undefined}
      />,
    );
    vi.useRealTimers();
    const user = userEvent.setup();

    expect(screen.getByLabelText("Programme Day")).toHaveValue("all");
    await user.click(screen.getByRole("button", { name: "Show schedule" }));

    expect(screen.getByLabelText("Programme Day")).toHaveValue("thursday");
    expect(
      screen.getByRole("button", { name: "Kotoa day schedule event" }),
    ).toBeVisible();
  });

  it("keeps a concrete day selected when All days is chosen during phone schedule", async () => {
    mockViewportLayout(390, 844);
    const user = userEvent.setup();

    render(
      <BrowseView
        events={events}
        favouriteIds={new Set()}
        onToggleFavourite={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Show schedule" }));
    await user.selectOptions(screen.getByLabelText("Programme Day"), "all");

    await waitFor(() =>
      expect(screen.getByLabelText("Programme Day")).toHaveValue("thursday"),
    );
    expect(
      screen.getByRole("region", { name: "Thursday day schedule" }),
    ).toBeVisible();
  });

  it("keeps a concrete day selected when an All-days desktop timetable becomes phone schedule", async () => {
    const viewport = mockPhoneLayout(false);
    const user = userEvent.setup();

    render(
      <BrowseView
        events={events}
        favouriteIds={new Set()}
        onToggleFavourite={() => undefined}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Programme Day"), "all");
    await user.click(screen.getByRole("button", { name: "Show timetable" }));
    expect(screen.getByLabelText("Programme Day")).toHaveValue("all");
    expect(screen.getByLabelText("Programme timetable")).toBeVisible();

    act(() => viewport.setMatches(true));

    await waitFor(() =>
      expect(screen.getByLabelText("Programme Day")).toHaveValue("thursday"),
    );
    expect(
      screen.getByRole("region", { name: "Thursday day schedule" }),
    ).toBeVisible();
  });

  it.each([
    ["phone portrait", 390, 844, true],
    ["phone landscape", 844, 390, true],
    ["wide phone landscape", 932, 430, true],
    ["widest phone landscape", 956, 440, true],
    ["desktop", 1280, 900, false],
  ])(
    "mounts the correct schedule presentation on %s",
    async (_name, width, height, isPhone) => {
      const viewport = mockViewportLayout(width, height);
      const user = userEvent.setup();

      render(
        <BrowseView
          events={[events[0]]}
          favouriteIds={new Set()}
          onToggleFavourite={() => undefined}
        />,
      );

      await user.click(
        screen.getByRole("button", {
          name: isPhone ? "Show schedule" : "Show timetable",
        }),
      );

      expect(viewport.requestedQueries).toContain(PHONE_LAYOUT_QUERY);

      if (isPhone) {
        expect(
          screen.getByRole("button", { name: "Kotoa day schedule event" }),
        ).toBeVisible();
        expect(screen.queryByLabelText("Programme timetable")).not.toBeInTheDocument();
      } else {
        expect(screen.getByLabelText("Programme timetable")).toBeVisible();
        expect(
          screen.queryByRole("button", { name: "Kotoa day schedule event" }),
        ).not.toBeInTheDocument();
      }
    },
  );

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

  it("mounts only the responsive timetable presentation", async () => {
    const viewport = mockPhoneLayout(false);
    const user = userEvent.setup();

    render(
      <BrowseView
        events={[events[0]]}
        favouriteIds={new Set()}
        onToggleFavourite={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Show timetable" }));

    expect(screen.getByLabelText("Programme timetable")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Kotoa day schedule event" }),
    ).not.toBeInTheDocument();

    act(() => viewport.setMatches(true));

    expect(
      screen.getByRole("button", { name: "Kotoa day schedule event" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Programme timetable"),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["desktop timeline", false, true, "View Kotoa details from timetable"],
    ["phone schedule", true, false, "Kotoa day schedule event"],
  ])(
    "returns focus to the view toggle when a %s opener unmounts during resize",
    async (_surface, startsOnPhone, resizeToPhone, openerName) => {
      const viewport = mockPhoneLayout(startsOnPhone);
      const user = userEvent.setup();

      render(
        <BrowseView
          events={[events[0]]}
          favouriteIds={new Set()}
          onToggleFavourite={() => undefined}
        />,
      );

      await user.click(
        screen.getByRole("button", {
          name: startsOnPhone ? "Show schedule" : "Show timetable",
        }),
      );
      const fallback = screen.getByRole("button", {
        name: startsOnPhone ? "Show browse" : "Show list",
      });
      const opener = screen.getByRole("button", { name: openerName });
      await user.click(opener);

      act(() => viewport.setMatches(resizeToPhone));
      expect(opener.isConnected).toBe(false);

      await user.click(
        screen.getByRole("button", { name: "Close Kotoa details" }),
      );

      await waitFor(() => expect(fallback).toHaveFocus());
    },
  );

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
