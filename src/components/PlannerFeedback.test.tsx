import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  PlannerFeedback,
  type PlannerFeedbackMessage,
} from "./PlannerFeedback";

const messages: PlannerFeedbackMessage[] = [
  { kind: "note-saved", text: "Note saved locally." },
  {
    kind: "undo-remove",
    eventId: "thursday:main-stage:kotoa",
    text: "Kotoa removed from your plan.",
  },
  {
    kind: "calendar-exported",
    text: "Calendar download started: we-out-here-2026-plan.ics",
  },
];

describe("PlannerFeedback", () => {
  it.each(messages)("renders $kind as one polite status message", (message) => {
    render(<PlannerFeedback message={message} />);

    expect(screen.getByRole("status")).toHaveTextContent(message.text);
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("offers an accessible Undo action for a removed event", async () => {
    const user = userEvent.setup();
    const undoRemove = vi.fn();
    render(
      <PlannerFeedback message={messages[1]} onUndoRemove={undoRemove} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Undo remove Kotoa" }),
    );

    expect(undoRemove).toHaveBeenCalledOnce();
  });

  it("leaves focus restoration to the integrated Undo callback", async () => {
    const otherButton = document.createElement("button");
    document.body.append(otherButton);
    const user = userEvent.setup();
    render(
      <PlannerFeedback
        message={messages[1]}
        onUndoRemove={() => otherButton.focus()}
      />,
    );

    const undoButton = screen.getByRole("button", {
      name: "Undo remove Kotoa",
    });
    await user.click(undoButton);
    expect(otherButton).toHaveFocus();

    otherButton.remove();
  });

  it("renders no feedback surface without a message", () => {
    const { container } = render(<PlannerFeedback message={null} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps storage failure and action feedback in one live region", () => {
    const { rerender } = render(
      <PlannerFeedback message={null} storageUnavailable={true} />,
    );

    expect(screen.getByRole("status", { name: "Storage unavailable" }))
      .toHaveTextContent(/cannot persist after you close or reload/i);
    expect(screen.getAllByRole("status")).toHaveLength(1);

    rerender(
      <PlannerFeedback
        message={messages[1]}
        onUndoRemove={() => undefined}
        storageUnavailable={true}
      />,
    );

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Kotoa removed from your plan.",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      /cannot persist after you close or reload/i,
    );
  });
});
