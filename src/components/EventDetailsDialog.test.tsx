import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FestivalEvent } from "../domain/festival";
import { EventDetailsDialog } from "./EventDetailsDialog";

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

describe("EventDetailsDialog", () => {
  it("shows full time, venue, category, and save state in event details", () => {
    render(
      <EventDetailsDialog
        event={event}
        isFavourite={true}
        isClashing={false}
        onClose={() => undefined}
        onToggleFavourite={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Kotoa details" });
    expect(dialog).toHaveTextContent("Thursday 20 August 2026");
    expect(dialog).toHaveTextContent("13:20–14:00");
    expect(dialog).toHaveTextContent("Main Stage");
    expect(dialog).toHaveTextContent("Music");
    expect(screen.getByRole("button", { name: "Remove Kotoa" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("uses the London calendar date for an after-midnight event", () => {
    render(
      <EventDetailsDialog
        event={{
          ...event,
          programmeDay: "thursday",
          startsAt: "2026-08-21T00:30:00+01:00",
          endsAt: "2026-08-21T01:30:00+01:00",
        }}
        isFavourite={false}
        isClashing={false}
        onClose={() => undefined}
        onToggleFavourite={() => undefined}
      />,
    );

    expect(screen.getByText(/Friday 21 August 2026/)).toBeInTheDocument();
  });

  it("limits an Event Note to 140 characters", async () => {
    const user = userEvent.setup();
    const saveNote = vi.fn();

    render(
      <EventDetailsDialog
        event={event}
        isFavourite={true}
        note=""
        isClashing={false}
        onClose={() => undefined}
        onToggleFavourite={() => undefined}
        onSaveNote={saveNote}
      />,
    );

    await user.type(screen.getByLabelText("Note for Kotoa"), "x".repeat(141));
    expect(screen.getByText("140 characters maximum")).toBeInTheDocument();
    expect(screen.getByLabelText("Note for Kotoa")).toHaveValue("x".repeat(140));
    expect(saveNote).toHaveBeenLastCalledWith(event.id, "x".repeat(140));
  });

  it("does not offer an Event Note until the event is saved", () => {
    render(
      <EventDetailsDialog
        event={event}
        isFavourite={false}
        note="remember this"
        isClashing={false}
        onClose={() => undefined}
        onToggleFavourite={() => undefined}
        onSaveNote={() => undefined}
      />,
    );

    expect(screen.queryByLabelText("Note for Kotoa")).not.toBeInTheDocument();
  });

  it("closes with Escape and the close button", async () => {
    const user = userEvent.setup();
    const close = vi.fn();

    const { rerender } = render(
      <EventDetailsDialog
        event={event}
        isFavourite={false}
        isClashing={false}
        onClose={close}
        onToggleFavourite={() => undefined}
      />,
    );

    await user.keyboard("{Escape}");
    expect(close).toHaveBeenCalledOnce();

    rerender(
      <EventDetailsDialog
        event={event}
        isFavourite={false}
        isClashing={false}
        onClose={close}
        onToggleFavourite={() => undefined}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Close Kotoa details" }),
    );
    expect(close).toHaveBeenCalledTimes(2);
  });

  it("closes when the modal backdrop is clicked", async () => {
    const user = userEvent.setup();
    const close = vi.fn();

    render(
      <EventDetailsDialog
        event={event}
        isFavourite={false}
        isClashing={false}
        onClose={close}
        onToggleFavourite={() => undefined}
      />,
    );

    await user.click(screen.getByRole("dialog", { name: "Kotoa details" }));
    expect(close).toHaveBeenCalledOnce();
  });

  it("moves focus into the dialog and returns it when the dialog closes", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open details";
    document.body.append(trigger);
    trigger.focus();

    const { unmount } = render(
      <EventDetailsDialog
        event={event}
        isFavourite={false}
        isClashing={false}
        onClose={() => undefined}
        onToggleFavourite={() => undefined}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Close Kotoa details" }),
    ).toHaveFocus();

    unmount();
    await waitFor(() => expect(trigger).toHaveFocus());
    trigger.remove();
  });

  it("returns focus after an inert background becomes interactive again", () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    const requestFrame = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        frameCallbacks.push(callback);
        return frameCallbacks.length;
      });
    const background = document.createElement("div");
    const trigger = document.createElement("button");
    const nativeFocus = trigger.focus.bind(trigger);
    trigger.textContent = "Open details";
    trigger.focus = () => {
      if (!background.inert) {
        nativeFocus();
      }
    };
    background.append(trigger);
    document.body.append(background);
    trigger.focus();

    const { unmount } = render(
      <EventDetailsDialog
        event={event}
        isFavourite={false}
        isClashing={false}
        onClose={() => undefined}
        onToggleFavourite={() => undefined}
      />,
    );
    background.inert = true;

    unmount();
    background.inert = false;
    frameCallbacks.forEach((callback) => callback(0));

    expect(trigger).toHaveFocus();

    requestFrame.mockRestore();
    background.remove();
  });
});
