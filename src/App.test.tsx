import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
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

    render(<App />);

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

    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      /unofficial personal planner/i,
    );
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      /not affiliated with or endorsed by We Out Here Festival/i,
    );
  });
});
