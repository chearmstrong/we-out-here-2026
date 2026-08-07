import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { OfflineStatus } from "./OfflineStatus";

it("confirms that the planner is available offline after caching", () => {
  render(<OfflineStatus state="ready" onRefresh={() => undefined} />);

  expect(screen.getByText("Saved for offline use")).toBeInTheDocument();
});

it("does not claim offline use is ready before caching succeeds", () => {
  render(<OfflineStatus state="offline-unavailable" onRefresh={() => undefined} />);

  expect(screen.getByText(/Connect once to save this planner offline/i)).toBeInTheDocument();
  expect(screen.queryByText("Saved for offline use")).not.toBeInTheDocument();
});

it("leaves the cached planner running when the user allows an update", async () => {
  const user = userEvent.setup();
  const refresh = vi.fn();
  render(<OfflineStatus state="updating" onRefresh={refresh} />);

  expect(screen.getByText("A planner update is available")).toBeInTheDocument();
  expect(screen.getByText(/open planner will not reload/i)).toBeInTheDocument();
  expect(screen.getByText(/after every Field Notes tab or app window is closed/i)).toBeInTheDocument();
  expect(refresh).not.toHaveBeenCalled();

  await user.click(screen.getByRole("button", { name: "Allow update" }));

  expect(refresh).toHaveBeenCalledOnce();
});

it("keeps the current Schedule Snapshot date visible while an update waits", () => {
  render(<OfflineStatus state="updating" onRefresh={() => undefined} />);

  expect(screen.getByText("Schedule checked 7 August 2026")).toBeInTheDocument();
});
