import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OfflineStatus } from "./OfflineStatus";

const HOME_SCREEN_GUIDANCE_DISMISSED_KEY =
  "field-notes:home-screen-guidance-dismissed";

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

beforeEach(() => {
  vi.stubGlobal("localStorage", new MemoryStorage());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("confirms that the planner is available offline after caching", () => {
  render(<OfflineStatus state="ready" onRefresh={() => undefined} />);

  expect(screen.getByText("Saved for offline use")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Keep Field Notes handy" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "For optional one-tap access, add Field Notes to your Home Screen before you build your plan there.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      (_, element) =>
        element?.textContent ===
        "iPhone/iPad: Home Screen apps keep a separate plan from Safari. Plans saved in Safari will not appear there.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "How to add it" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Not now" })).toBeInTheDocument();
});

it("does not claim offline use is ready before caching succeeds", () => {
  render(<OfflineStatus state="offline-unavailable" onRefresh={() => undefined} />);

  expect(screen.getByText(/Connect once to save this planner offline/i)).toBeInTheDocument();
  expect(screen.queryByText("Saved for offline use")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Keep Field Notes handy" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(
      (_, element) =>
        element?.textContent ===
        "iPhone/iPad: Home Screen apps keep a separate plan from Safari. Plans saved in Safari will not appear there.",
    ),
  ).not.toBeInTheDocument();
});

it("reveals platform-specific Home Screen instructions on request", async () => {
  const user = userEvent.setup();
  render(<OfflineStatus state="ready" onRefresh={() => undefined} />);

  expect(
    screen.queryByText(/open Share, then choose Add to Home Screen\./),
  ).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "How to add it" }));

  expect(
    screen.getByText(/open Share, then choose Add to Home Screen\./),
  ).toBeInTheDocument();
  expect(screen.getByText(/Android:/)).toBeInTheDocument();
  expect(
    screen.getByText(/choose Install app or Add to Home screen, if offered\./),
  ).toBeInTheDocument();
});

it("dismisses Home Screen guidance persistently and lets help reopen it", async () => {
  const user = userEvent.setup();
  render(<OfflineStatus state="ready" onRefresh={() => undefined} />);

  await user.click(screen.getByRole("button", { name: "Not now" }));

  expect(
    screen.queryByRole("heading", { name: "Keep Field Notes handy" }),
  ).not.toBeInTheDocument();
  expect(window.localStorage.getItem(HOME_SCREEN_GUIDANCE_DISMISSED_KEY)).toBe(
    "1",
  );

  await user.click(screen.getByRole("button", { name: "Home Screen help" }));

  expect(
    screen.getByRole("heading", { name: "Keep Field Notes handy" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      (_, element) =>
        element?.textContent ===
        "iPhone/iPad: Home Screen apps keep a separate plan from Safari. Plans saved in Safari will not appear there.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/open Share, then choose Add to Home Screen\./),
  ).toBeInTheDocument();
  expect(screen.getByText(/Android:/)).toBeInTheDocument();
});

it("moves keyboard focus to Home Screen help after dismissing guidance", async () => {
  const user = userEvent.setup();
  render(<OfflineStatus state="ready" onRefresh={() => undefined} />);

  await user.tab();
  await user.tab();
  expect(screen.getByRole("button", { name: "Not now" })).toHaveFocus();

  await user.keyboard("{Enter}");

  expect(
    screen.getByRole("button", { name: "Home Screen help" }),
  ).toHaveFocus();
});

it("moves keyboard focus into guidance after reopening Home Screen help", async () => {
  window.localStorage.setItem(HOME_SCREEN_GUIDANCE_DISMISSED_KEY, "1");
  const user = userEvent.setup();
  render(<OfflineStatus state="ready" onRefresh={() => undefined} />);

  await user.tab();
  expect(
    screen.getByRole("button", { name: "Home Screen help" }),
  ).toHaveFocus();

  await user.keyboard("{Enter}");

  expect(
    screen.getByRole("button", { name: "How to add it" }),
  ).toHaveFocus();
});

it("starts dismissed ready guidance as Home Screen help", () => {
  window.localStorage.setItem(HOME_SCREEN_GUIDANCE_DISMISSED_KEY, "1");

  render(<OfflineStatus state="ready" onRefresh={() => undefined} />);

  expect(
    screen.queryByRole("heading", { name: "Keep Field Notes handy" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Home Screen help" }),
  ).toBeInTheDocument();
});

it.each(["getter", "setter"] as const)(
  "dismisses Home Screen guidance for the session when the storage %s throws",
  async (failure) => {
    if (failure === "getter") {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new DOMException("Blocked", "SecurityError");
        },
      });
    } else {
      vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
        throw new DOMException("Blocked", "SecurityError");
      });
    }
    const user = userEvent.setup();

    render(<OfflineStatus state="ready" onRefresh={() => undefined} />);
    await expect(
      user.click(screen.getByRole("button", { name: "Not now" })),
    ).resolves.toBeUndefined();

    expect(
      screen.queryByRole("heading", { name: "Keep Field Notes handy" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Home Screen help" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        /storage unavailable|could not persist|failed to save/i,
      ),
    ).not.toBeInTheDocument();
  },
);

it("keeps lower offline status free of update actions while an update waits", () => {
  render(<OfflineStatus state="updating" onRefresh={() => undefined} />);

  expect(
    screen.queryByRole("button", { name: "Allow update" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Use update next time" }),
  ).not.toBeInTheDocument();
});

it("keeps the current Schedule Snapshot date visible while an update waits", () => {
  render(<OfflineStatus state="updating" onRefresh={() => undefined} />);

  expect(screen.getByText("Schedule checked 7 August 2026")).toBeInTheDocument();
});
