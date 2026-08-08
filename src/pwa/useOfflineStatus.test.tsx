import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { createOfflineWorkerRegistration } from "./offlineWorkerRegistration";
import { useOfflineStatus } from "./useOfflineStatus";

const workerLifecycle = vi.hoisted(() => ({
  acceptUpdate: vi.fn(),
  onStateChange: undefined as
    | ((state: "ready" | "updating" | "offline-unavailable") => void)
    | undefined,
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
}));

vi.mock("./offlineWorkerRegistration", () => ({
  createOfflineWorkerRegistration: vi.fn((options: {
    onStateChange: typeof workerLifecycle.onStateChange;
  }) => {
    workerLifecycle.onStateChange = options.onStateChange;
    return workerLifecycle;
  }),
}));

beforeEach(() => {
  vi.mocked(createOfflineWorkerRegistration).mockClear();
  workerLifecycle.acceptUpdate.mockClear();
  workerLifecycle.onStateChange = undefined;
  workerLifecycle.start.mockClear();
  workerLifecycle.stop.mockClear();
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {},
  });
});

it("starts the custom registration lifecycle and reflects its status", async () => {
  const { result } = renderHook(() => useOfflineStatus());

  expect(result.current.state).toBe("offline-unavailable");
  await waitFor(() => expect(workerLifecycle.start).toHaveBeenCalledOnce());

  act(() => workerLifecycle.onStateChange?.("ready"));

  expect(result.current.state).toBe("ready");
});

it("accepts an update only through the user-triggered refresh action", async () => {
  const { result } = renderHook(() => useOfflineStatus());
  await waitFor(() => expect(workerLifecycle.start).toHaveBeenCalledOnce());

  expect(workerLifecycle.acceptUpdate).not.toHaveBeenCalled();

  act(() => result.current.refresh());

  expect(workerLifecycle.acceptUpdate).toHaveBeenCalledOnce();
});

it("does not let a later ready signal hide a waiting update", async () => {
  const { result } = renderHook(() => useOfflineStatus());
  await waitFor(() => expect(workerLifecycle.start).toHaveBeenCalledOnce());

  act(() => workerLifecycle.onStateChange?.("updating"));
  act(() => workerLifecycle.onStateChange?.("ready"));

  expect(result.current.state).toBe("updating");
});

it("stops watching the service-worker lifecycle when the hook unmounts", async () => {
  const { unmount } = renderHook(() => useOfflineStatus());
  await waitFor(() => expect(workerLifecycle.start).toHaveBeenCalledOnce());

  unmount();

  expect(workerLifecycle.stop).toHaveBeenCalledOnce();
});
