import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as calendar from "./calendar/ics";
import App from "./App";
import {
  FESTIVAL_PLAYLIST_URL,
  OFFICIAL_SET_TIMES_URL,
  PROJECT_README_URL,
  PROJECT_REPOSITORY_URL,
} from "./config/site";
import { ITINERARY_STORAGE_KEY } from "./storage/itineraryStore";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new MemoryStorage());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("opens on My plan and provides labelled navigation to Browse", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Field Notes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Planner views" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "My plan" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("heading", { name: "Build your plan" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Browse" }));
    expect(
      screen.getByRole("heading", { name: "Browse the programme" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Browse" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("keeps the full header for an empty plan and exposes compact operational state for a saved plan", () => {
    const emptyPlan = render(<App />);
    const emptyShell = screen
      .getByRole("heading", { name: "Field Notes" })
      .closest("main");

    expect(emptyShell).toHaveAttribute("data-planner-view", "plan");
    expect(emptyShell).toHaveAttribute("data-plan-empty", "true");
    expect(
      within(emptyShell as HTMLElement).getByText(
        "A private, local-first place for your festival weekend.",
      ),
    ).toBeVisible();
    expect(
      within(emptyShell as HTMLElement).getByRole("link", {
        name: "Listen to the festival playlist",
      }),
    ).toBeVisible();

    emptyPlan.unmount();
    window.localStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        favouriteIds: ["thursday:main-stage:kotoa"],
        notesByEventId: {},
      }),
    );
    render(<App />);

    const savedShell = screen
      .getByRole("heading", { name: "Field Notes" })
      .closest("main");
    const savedHeader = screen
      .getByRole("heading", { name: "Field Notes" })
      .closest("header");

    expect(savedShell).toHaveAttribute("data-planner-view", "plan");
    expect(savedShell).toHaveAttribute("data-plan-empty", "false");
    expect(
      within(savedHeader as HTMLElement).getByRole("heading", {
        name: "Field Notes",
      }),
    ).toBeVisible();
    expect(
      within(savedHeader as HTMLElement).getByRole("link", {
        name: "View source on GitHub",
      }),
    ).toHaveAttribute("href", PROJECT_REPOSITORY_URL);
  });

  it("restores Browse query, filters, and mode after visiting My plan", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /^Browse$/ }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search programme" }),
      "Kotoa",
    );
    await user.click(screen.getByRole("button", { name: "More filters" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Venue" }),
      "Main Stage",
    );
    await user.click(screen.getByRole("button", { name: "Show timetable" }));
    await user.click(screen.getByRole("button", { name: "My plan" }));
    await user.click(screen.getByRole("button", { name: /^Browse$/ }));

    expect(
      screen.getByRole("searchbox", { name: "Search programme" }),
    ).toHaveValue("Kotoa");
    await user.click(screen.getByRole("button", { name: "More filters" }));
    expect(screen.getByRole("combobox", { name: "Venue" })).toHaveValue(
      "Main Stage",
    );
    expect(screen.getByRole("button", { name: "Show list" })).toBeVisible();
  });

  it("restores the selected phone Schedule day but resets Saved only after leaving Browse", async () => {
    vi.stubGlobal(
      "matchMedia",
      () =>
        ({
          matches: true,
          media: "(max-width: 48rem)",
          onchange: null,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /^Browse$/ }));
    await user.click(screen.getByRole("button", { name: "Show schedule" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Programme Day" }),
      "friday",
    );
    await user.click(screen.getByRole("button", { name: "Saved only" }));
    expect(screen.getByRole("button", { name: "Saved only" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "My plan" }));
    await user.click(screen.getByRole("button", { name: /^Browse$/ }));

    expect(screen.getByRole("button", { name: "Show browse" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Programme Day" })).toHaveValue(
      "friday",
    );
    expect(screen.getByRole("button", { name: "Saved only" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("places a waiting update notice directly after planner navigation and delegates acceptance", async () => {
    const user = userEvent.setup();
    const refresh = vi.fn();
    render(<App offlineState="updating" onRefresh={refresh} />);

    const plannerNav = screen.getByRole("navigation", {
      name: "Planner views",
    });
    expect(plannerNav.nextElementSibling).toHaveClass("update-notice");
    expect(
      screen.getByRole("button", { name: "Use update next time" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/close and reopen Field Notes to use the new version/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Use update next time" }),
    );

    expect(refresh).toHaveBeenCalledOnce();
  });

  it.each([
    ["offline-unavailable", "Connect once to save this planner offline."],
    ["ready", "Saved for offline use"],
  ] as const)("places %s readiness directly beneath planner navigation", (state, text) => {
    render(<App offlineState={state} onRefresh={() => undefined} />);

    const navigation = screen.getByRole("navigation", { name: "Planner views" });
    expect(navigation.nextElementSibling).toHaveTextContent(text);
  });

  it("keeps updating readiness immediately after the update notice", () => {
    render(<App offlineState="updating" onRefresh={() => undefined} />);

    const navigation = screen.getByRole("navigation", { name: "Planner views" });
    const updateNotice = navigation.nextElementSibling;
    expect(updateNotice).toHaveClass("update-notice");
    expect(updateNotice?.nextElementSibling).toHaveTextContent(
      "Saved for offline use",
    );
  });

  it("does not show an update notice when no update is waiting", () => {
    render(<App offlineState="ready" onRefresh={() => undefined} />);

    expect(
      screen.queryByRole("heading", { name: "A planner update is ready" }),
    ).not.toBeInTheDocument();
  });

  it("does not claim offline readiness before the cache status is known", () => {
    render(<App />);

    const appHeader = screen
      .getByRole("heading", { name: "Field Notes" })
      .closest("header");
    expect(appHeader).not.toBeNull();
    expect(appHeader).not.toHaveTextContent(/offline-ready/i);
  });

  it("provides safe optional exits to the source and festival playlist from the header", () => {
    render(<App />);

    const header = screen
      .getByRole("heading", { name: "Field Notes" })
      .closest("header");
    expect(header).not.toBeNull();

    const sourceLink = within(header as HTMLElement).getByRole("link", {
      name: "View source on GitHub",
    });
    expect(sourceLink).toHaveAttribute("href", PROJECT_REPOSITORY_URL);
    expect(sourceLink).toHaveAttribute("target", "_blank");
    expect(sourceLink).toHaveAttribute("rel", "noreferrer");

    const playlistLink = within(header as HTMLElement).getByRole("link", {
      name: "Listen to the festival playlist",
    });
    expect(playlistLink).toHaveAttribute("href", FESTIVAL_PLAYLIST_URL);
    expect(playlistLink).toHaveAttribute("target", "_blank");
    expect(playlistLink).toHaveAttribute("rel", "noreferrer");
  });

  it("continues with an in-memory plan when localStorage access throws", () => {
    vi.unstubAllGlobals();
    const localStorageDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "localStorage",
    );
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });

    try {
      render(<App />);

      expect(
        screen.getByRole("heading", { name: "Build your plan" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("status", { name: "Storage unavailable" }),
      ).toHaveTextContent(/cannot persist/i);
    } finally {
      if (localStorageDescriptor) {
        Object.defineProperty(window, "localStorage", localStorageDescriptor);
      } else {
        Reflect.deleteProperty(window, "localStorage");
      }
    }
  });

  it("refreshes the current plan moment on a periodic clock", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T13:19:30+01:00"));
    window.localStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        favouriteIds: ["thursday:main-stage:kotoa"],
        notesByEventId: {},
      }),
    );
    render(<App />);

    expect(screen.getByRole("heading", { name: "Next" })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(60_000));

    expect(screen.getByRole("heading", { name: "Now" })).toBeInTheDocument();
  });

  it("reuses its planner clock when Browse opens without creating another interval", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T13:30:00+01:00"));
    const setIntervalSpy = vi.spyOn(window, "setInterval");
    const getItemSpy = vi.spyOn(window.localStorage, "getItem");
    const mediaQueryList = {
      matches: true,
      media: "(max-width: 48rem)",
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    } as unknown as MediaQueryList;
    vi.stubGlobal("matchMedia", () => mediaQueryList);
    render(<App />);
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    const initialStorageReads = getItemSpy.mock.calls.length;

    act(() => screen.getByRole("button", { name: "Browse" }).click());
    act(() => screen.getByRole("button", { name: "Show schedule" }).click());

    expect(screen.getByRole("heading", { name: "Now / next" })).toBeVisible();
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(getItemSpy).toHaveBeenCalledTimes(initialStorageReads);
  });

  it("refreshes the current plan moment immediately on visibility and focus", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T13:19:30+01:00"));
    window.localStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        favouriteIds: ["thursday:main-stage:kotoa"],
        notesByEventId: {},
      }),
    );
    const visibilityDescriptor = Object.getOwnPropertyDescriptor(
      document,
      "visibilityState",
    );
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    try {
      render(<App />);
      expect(screen.getByRole("heading", { name: "Next" })).toBeInTheDocument();

      vi.setSystemTime(new Date("2026-08-20T13:20:30+01:00"));
      act(() => document.dispatchEvent(new Event("visibilitychange")));
      expect(screen.getByRole("heading", { name: "Now" })).toBeInTheDocument();

      vi.setSystemTime(new Date("2026-08-20T14:01:00+01:00"));
      act(() => window.dispatchEvent(new Event("focus")));
      expect(
        screen.queryByRole("heading", { name: "Now" }),
      ).not.toBeInTheDocument();
    } finally {
      if (visibilityDescriptor) {
        Object.defineProperty(
          document,
          "visibilityState",
          visibilityDescriptor,
        );
      } else {
        Reflect.deleteProperty(document, "visibilityState");
      }
    }
  });

  it("shares saved events and Event Notes between Browse and My plan", async () => {
    const user = userEvent.setup();
    const firstVisit = render(<App />);

    await user.click(screen.getByRole("button", { name: "Browse programme" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search programme" }),
      "Kotoa",
    );
    await user.click(screen.getByRole("button", { name: "Save Kotoa" }));
    await user.click(
      screen.getByRole("button", { name: "View Kotoa details" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Note for Kotoa" }),
      "Meet at the sound desk",
    );
    expect(screen.getByText("Note saved locally.")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Close Kotoa details" }),
    );
    await user.click(screen.getByRole("button", { name: "My plan" }));

    expect(screen.getByRole("article", { name: "Kotoa" })).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(ITINERARY_STORAGE_KEY) ?? "{}"))
      .toEqual({
        favouriteIds: ["thursday:main-stage:kotoa"],
        notesByEventId: {
          "thursday:main-stage:kotoa": "Meet at the sound desk",
        },
      });

    firstVisit.unmount();
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "View Kotoa details" }),
    );
    expect(
      screen.getByRole("textbox", { name: "Note for Kotoa" }),
    ).toHaveValue("Meet at the sound desk");
  });

  it("keeps the in-memory plan usable while warning that writes cannot persist", async () => {
    const user = userEvent.setup();
    const storage = window.localStorage;
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Browse programme" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search programme" }),
      "Kotoa",
    );
    await user.click(screen.getByRole("button", { name: "Save Kotoa" }));
    await user.click(screen.getByRole("button", { name: "My plan" }));

    expect(screen.getByRole("article", { name: "Kotoa" })).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Storage unavailable" }),
    ).toHaveTextContent(/cannot persist/i);
  });

  it("offers Undo after removing a saved event", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        favouriteIds: ["thursday:main-stage:kotoa"],
        notesByEventId: {},
      }),
    );
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Remove Kotoa" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Kotoa removed from your plan",
    );

    await user.click(
      screen.getByRole("button", { name: "Undo remove Kotoa" }),
    );
    expect(
      screen.getByRole("button", { name: "Remove Kotoa" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("restores focus to the removed plan control after Undo", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        favouriteIds: ["thursday:main-stage:kotoa"],
        notesByEventId: {},
      }),
    );
    render(<App />);

    const remove = screen.getByRole("button", { name: "Remove Kotoa" });
    remove.focus();
    await user.keyboard("{Enter}");
    const undo = screen.getByRole("button", { name: "Undo remove Kotoa" });
    undo.focus();
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Remove Kotoa" })).toHaveFocus(),
    );
    expect(document.activeElement?.isConnected).toBe(true);
  });

  it("restores focus after Undo remounts a phone Saved-only row", async () => {
    vi.stubGlobal(
      "matchMedia",
      () =>
        ({
          matches: true,
          media: "(max-width: 48rem)",
          onchange: null,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
    const user = userEvent.setup();
    window.localStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        favouriteIds: ["thursday:main-stage:kotoa"],
        notesByEventId: {},
      }),
    );
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Browse" }));
    await user.click(screen.getByRole("button", { name: "Show schedule" }));
    await user.click(screen.getByRole("button", { name: "Saved only" }));
    const remove = screen.getByRole("button", {
      name: "Remove Kotoa from day schedule",
    });
    remove.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.queryByRole("button", {
        name: "Remove Kotoa from day schedule",
      }),
    ).not.toBeInTheDocument();

    const undo = screen.getByRole("button", { name: "Undo remove Kotoa" });
    undo.focus();
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: "Remove Kotoa from day schedule",
        }),
      ).toHaveFocus(),
    );
    expect(document.activeElement?.isConnected).toBe(true);
  });

  it("restores an Event Note when removal is undone", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        favouriteIds: ["thursday:main-stage:kotoa"],
        notesByEventId: {
          "thursday:main-stage:kotoa": "Meet at the sound desk",
        },
      }),
    );
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Remove Kotoa" }));
    await user.click(
      screen.getByRole("button", { name: "Undo remove Kotoa" }),
    );
    await user.click(
      screen.getByRole("button", { name: "View Kotoa details" }),
    );

    expect(screen.getByLabelText("Note for Kotoa")).toHaveValue(
      "Meet at the sound desk",
    );
  });

  it("does not announce a local note save when persistence fails", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        favouriteIds: ["thursday:main-stage:kotoa"],
        notesByEventId: {},
      }),
    );
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "View Kotoa details" }),
    );
    await user.type(screen.getByLabelText("Note for Kotoa"), "Meet there");

    expect(screen.queryByText("Note saved locally.")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("dialog", { name: "Kotoa details" }))
        .getByRole("status"),
    ).toHaveTextContent(
      "Note saved for this visit only. Browser storage is unavailable.",
    );
    await user.click(
      screen.getByRole("button", { name: "Close Kotoa details" }),
    );
    expect(
      screen.getByRole("status", { name: "Storage unavailable" }),
    ).toHaveTextContent(/cannot persist/i);
  });

  it("keeps failed note persistence feedback available from Browse", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        favouriteIds: ["thursday:main-stage:kotoa"],
        notesByEventId: {},
      }),
    );
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Browse" }));
    await user.click(
      screen.getByRole("button", { name: "View Kotoa details" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Kotoa details" });
    await user.type(within(dialog).getByLabelText("Note for Kotoa"), "Meet there");

    expect(within(dialog).getByRole("status")).toHaveTextContent(
      "Note saved for this visit only. Browser storage is unavailable.",
    );
    expect(within(dialog).queryByText("Note saved locally.")).not.toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "Close Kotoa details" }),
    );
    expect(
      screen.getByRole("status", { name: "Storage unavailable" }),
    ).toHaveTextContent(/cannot persist/i);
    expect(
      screen.getByRole("heading", { name: "Browse the programme" }),
    ).toBeVisible();
  });

  it("hydrates only current schedule events and reports removed saved IDs", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        favouriteIds: ["thursday:main-stage:kotoa", "missing:event"],
        notesByEventId: {
          "thursday:main-stage:kotoa": "Current note",
          "missing:event": "Old note",
        },
      }),
    );

    const visit = render(<App />);

    expect(screen.getByRole("article", { name: "Kotoa" })).toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: "Old note" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/1 saved event changed or was removed/i),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Dismiss schedule changes" }),
    );
    expect(screen.queryByText(/changed or was removed/i)).not.toBeInTheDocument();

    visit.unmount();
    render(<App />);
    expect(screen.queryByText(/changed or was removed/i)).not.toBeInTheDocument();
  });

  it("downloads the saved plan with its Event Note", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        favouriteIds: ["thursday:main-stage:kotoa"],
        notesByEventId: {
          "thursday:main-stage:kotoa": "Meet at the sound desk",
        },
      }),
    );
    let exportedBlob: Blob | undefined;
    vi.stubGlobal("URL", {
      createObjectURL: (blob: Blob) => {
        exportedBlob = blob;
        return "blob:field-notes-calendar";
      },
      revokeObjectURL: () => undefined,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Download calendar" }),
    );

    expect(exportedBlob).toBeInstanceOf(Blob);
    const calendarBlob = exportedBlob;
    if (!calendarBlob) {
      throw new Error("Calendar Blob was not created");
    }
    const calendarText = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result)));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsText(calendarBlob);
    });
    expect(calendarText).toContain("UID:thursday:main-stage:kotoa@field-notes.local");
    expect(calendarText).toContain("DESCRIPTION:Meet at the sound desk");
    expect(calendarText).not.toContain("VALARM");
  });

  it("acknowledges the exact calendar filename after download starts", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        favouriteIds: ["thursday:main-stage:kotoa"],
        notesByEventId: {},
      }),
    );
    vi.spyOn(calendar, "downloadCalendar").mockReturnValue(true);
    render(<App />);

    await user.click(
      screen.getByRole("button", { name: "Download calendar" }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Calendar download started: we-out-here-2026-plan.ics",
    );
    expect(screen.getByRole("status")).not.toHaveTextContent(/imported/i);
  });

  it("clears every saved event and Event Note after confirmation", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      ITINERARY_STORAGE_KEY,
      JSON.stringify({
        favouriteIds: ["thursday:main-stage:kotoa"],
        notesByEventId: {
          "thursday:main-stage:kotoa": "Meet at the sound desk",
        },
      }),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Clear my plan" }));

    expect(
      screen.getByRole("heading", { name: "Build your plan" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(ITINERARY_STORAGE_KEY)).toBeNull();
  });

  it("states that the local planner is unofficial and unaffiliated", () => {
    render(<App />);

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getAllByText(/unofficial/i)).toHaveLength(1);
    expect(within(footer).getByText(/unofficial/i)).toHaveTextContent(/browser/i);
    expect(within(footer).getByText(/unofficial/i)).toHaveTextContent(
      /does not fetch programme content at runtime/i,
    );
  });

  it("provides safe new-tab links to its public resources", () => {
    render(<App />);

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent(/does not fetch programme content at runtime/i);
    expect(within(footer).getByRole("link", { name: "How Field Notes works" }))
      .toHaveAttribute("href", PROJECT_README_URL);
    expect(within(footer).getByRole("link", { name: "View source on GitHub" }))
      .toHaveAttribute("href", PROJECT_REPOSITORY_URL);
    expect(within(footer).getByRole("link", { name: "Official set times" }))
      .toHaveAttribute("href", OFFICIAL_SET_TIMES_URL);
    for (const link of within(footer).getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noreferrer");
    }
  });
});
