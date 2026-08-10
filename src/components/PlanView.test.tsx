import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FestivalEvent } from "../domain/festival";
import { PlanView } from "./PlanView";

const event = (
  overrides: Partial<FestivalEvent> & Pick<FestivalEvent, "id" | "title">,
): FestivalEvent => ({
  programmeDay: "friday",
  venue: "Main Stage",
  startsAt: "2026-08-21T18:30:00+01:00",
  endsAt: "2026-08-21T19:30:00+01:00",
  category: "music",
  source: "music-programme",
  ...overrides,
});

const overlappingSavedEvents = [
  event({ id: "one", title: "Now playing" }),
  event({
    id: "two",
    title: "Next but clashing",
    venue: "The Grove",
    startsAt: "2026-08-21T19:15:00+01:00",
    endsAt: "2026-08-21T20:15:00+01:00",
  }),
];

const baseProps = {
  favouriteIds: new Set<string>(),
  now: new Date("2026-08-20T12:00:00+01:00"),
  onToggleFavourite: () => undefined,
  onBrowse: () => undefined,
  onExport: () => undefined,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PlanView", () => {
  it("shows a discovery state before any events are saved", async () => {
    const user = userEvent.setup();
    const browse = vi.fn();

    render(
      <PlanView
        {...baseProps}
        events={[]}
        onBrowse={browse}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Build your plan" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download calendar" }),
    ).toBeDisabled();
    expect(
      screen.getByText("Schedule checked 9 August 2026"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Browse programme" }));
    expect(browse).toHaveBeenCalledOnce();
  });

  it("shows now, next, the Current Programme Day, and both sides of a clash", () => {
    render(
      <PlanView
        {...baseProps}
        events={overlappingSavedEvents}
        favouriteIds={new Set(["one", "two"])}
        now={new Date("2026-08-21T19:00:00+01:00")}
      />,
    );

    expect(screen.getByRole("heading", { name: "Now" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Next" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Friday · Current Programme Day" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Clashes with another saved event"),
    ).toHaveLength(2);
  });

  it("labels an upcoming day as Next Programme Day during a plan gap", () => {
    render(
      <PlanView
        {...baseProps}
        events={[overlappingSavedEvents[0]]}
        favouriteIds={new Set(["one"])}
        now={new Date("2026-08-21T12:00:00+01:00")}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Friday · Next Programme Day" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Current Programme Day/ }),
    ).not.toBeInTheDocument();
  });

  it("keeps post-midnight events with their official Programme Day and orders each day", () => {
    const overnight = event({
      id: "overnight",
      title: "After midnight",
      programmeDay: "thursday",
      startsAt: "2026-08-21T00:30:00+01:00",
      endsAt: "2026-08-21T01:30:00+01:00",
    });
    const earlier = event({
      id: "earlier",
      title: "Thursday evening",
      programmeDay: "thursday",
      startsAt: "2026-08-20T20:00:00+01:00",
      endsAt: "2026-08-20T21:00:00+01:00",
    });

    render(
      <PlanView
        {...baseProps}
        events={[overnight, earlier]}
        favouriteIds={new Set(["overnight", "earlier"])}
        now={new Date("2026-08-19T12:00:00+01:00")}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Next saved event" }),
    ).toBeInTheDocument();
    const thursday = screen
      .getByRole("heading", { name: "Thursday" })
      .closest("section");
    expect(thursday).not.toBeNull();
    const cards = within(thursday as HTMLElement).getAllByRole("article");
    expect(cards.map((card) => card.getAttribute("aria-label"))).toEqual([
      "Thursday evening",
      "After midnight",
    ]);
  });

  it("edits Event Notes only through saved event details", async () => {
    const user = userEvent.setup();
    const saveNote = vi.fn();
    const savedEvent = event({ id: "one", title: "Now playing" });

    render(
      <PlanView
        {...baseProps}
        events={[savedEvent]}
        favouriteIds={new Set(["one"])}
        notesByEventId={{ one: "Meet by the left speaker" }}
        now={new Date("2026-08-21T19:00:00+01:00")}
        onSaveNote={saveNote}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "View Now playing details" }),
    );
    const note = screen.getByRole("textbox", { name: "Note for Now playing" });
    expect(note).toHaveValue("Meet by the left speaker");
    await user.type(note, " after soundcheck");
    expect(saveNote).toHaveBeenLastCalledWith(
      "one",
      "Meet by the left speaker after soundcheck",
    );
  });

  it("restores focus to My plan when the open event is removed", async () => {
    const user = userEvent.setup();
    const savedEvent = event({ id: "one", title: "Now playing" });
    const view = render(
      <PlanView
        {...baseProps}
        events={[savedEvent]}
        favouriteIds={new Set(["one"])}
        now={new Date("2026-08-21T19:00:00+01:00")}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "View Now playing details" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Remove Now playing" }),
    );
    view.rerender(
      <PlanView
        {...baseProps}
        events={[]}
        favouriteIds={new Set()}
        now={new Date("2026-08-21T19:00:00+01:00")}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "My plan" })).toHaveFocus(),
    );
  });

  it("lets schedule-change notices be dismissed", async () => {
    const user = userEvent.setup();
    const dismiss = vi.fn();

    render(
      <PlanView
        {...baseProps}
        events={[]}
        removedIds={["removed-one", "removed-two"]}
        onDismissScheduleChanges={dismiss}
      />,
    );

    expect(
      screen.getByText(/2 saved events changed or were removed/i),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Dismiss schedule changes" }),
    );
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it("confirms before clearing the complete local plan", async () => {
    const user = userEvent.setup();
    const clear = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <PlanView
        {...baseProps}
        events={[overlappingSavedEvents[0]]}
        favouriteIds={new Set(["one"])}
        onClear={clear}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Clear my plan" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(clear).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Clear my plan" }));
    expect(clear).toHaveBeenCalledOnce();
  });
});
