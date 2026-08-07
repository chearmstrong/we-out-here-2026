import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { OfflineStatus } from "./OfflineStatus";
import { useOfflineStatus } from "./useOfflineStatus";

const pwaRegistration = vi.hoisted(() => ({
  options: undefined as
    | {
        onNeedRefresh?: () => void;
        onOfflineReady?: () => void;
        onRegisteredSW?: (
          swUrl: string,
          registration: ServiceWorkerRegistration | undefined,
        ) => void;
        onRegisterError?: () => void;
      }
    | undefined,
  updateServiceWorker: vi.fn(),
}));

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: (options: typeof pwaRegistration.options) => {
    pwaRegistration.options = options;
    return {
      needRefresh: [false, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker: pwaRegistration.updateServiceWorker,
    };
  },
}));

beforeEach(() => {
  pwaRegistration.options = undefined;
  pwaRegistration.updateServiceWorker.mockReset();
});

it("confirms that the planner is available offline after caching", () => {
  render(<OfflineStatus state="ready" onRefresh={() => undefined} />);

  expect(screen.getByText("Saved for offline use")).toBeInTheDocument();
});

it("does not claim offline use is ready before caching succeeds", () => {
  render(<OfflineStatus state="offline-unavailable" onRefresh={() => undefined} />);

  expect(screen.getByText(/Connect once to save this planner offline/i)).toBeInTheDocument();
  expect(screen.queryByText("Saved for offline use")).not.toBeInTheDocument();
});

it("leaves the cached planner running until the user accepts an update", async () => {
  const user = userEvent.setup();
  const refresh = vi.fn();
  render(<OfflineStatus state="updating" onRefresh={refresh} />);

  expect(screen.getByText("A planner update is available")).toBeInTheDocument();
  expect(refresh).not.toHaveBeenCalled();

  await user.click(screen.getByRole("button", { name: "Update now" }));

  expect(refresh).toHaveBeenCalledOnce();
});

it("keeps the current Schedule Snapshot date visible while an update waits", () => {
  render(<OfflineStatus state="updating" onRefresh={() => undefined} />);

  expect(screen.getByText("Schedule checked 7 August 2026")).toBeInTheDocument();
});

it("starts unavailable and becomes ready only after the worker has cached the app", () => {
  const { result } = renderHook(() => useOfflineStatus());

  expect(result.current.state).toBe("offline-unavailable");

  act(() => pwaRegistration.options?.onOfflineReady?.());

  expect(result.current.state).toBe("ready");
});

it("recognises an already active worker as an offline-ready registration", () => {
  const { result } = renderHook(() => useOfflineStatus());
  const registration = { active: {} } as ServiceWorkerRegistration;

  act(() => pwaRegistration.options?.onRegisteredSW?.("sw.js", registration));

  expect(result.current.state).toBe("ready");
});

it("offers a detected update without applying it until requested", async () => {
  const { result } = renderHook(() => useOfflineStatus());

  act(() => pwaRegistration.options?.onNeedRefresh?.());

  expect(result.current.state).toBe("updating");
  expect(pwaRegistration.updateServiceWorker).not.toHaveBeenCalled();

  await act(() => result.current.refresh());

  expect(pwaRegistration.updateServiceWorker).toHaveBeenCalledOnce();
});

it("does not claim offline readiness when registration fails", () => {
  const { result } = renderHook(() => useOfflineStatus());

  act(() => pwaRegistration.options?.onOfflineReady?.());
  expect(result.current.state).toBe("ready");

  act(() => pwaRegistration.options?.onRegisterError?.());

  expect(result.current.state).toBe("offline-unavailable");
});
