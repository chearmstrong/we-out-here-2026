import { describe, expect, it, vi } from "vitest";
import { createOfflineWorkerRegistration } from "./offlineWorkerRegistration";
import type { OfflineStatusState } from "./OfflineStatus";

type FakeWorker = ServiceWorker & {
  postMessage: ReturnType<typeof vi.fn>;
  setState: (state: ServiceWorkerState) => void;
};

function createWorker(initialState: ServiceWorkerState): FakeWorker {
  const target = new EventTarget();
  let state = initialState;
  const worker = target as FakeWorker;

  Object.defineProperties(worker, {
    state: { get: () => state },
    postMessage: { value: vi.fn() },
    setState: {
      value: (nextState: ServiceWorkerState) => {
        state = nextState;
        worker.dispatchEvent(new Event("statechange"));
      },
    },
  });

  return worker;
}

function createRegistration({
  active = null,
  installing = null,
  waiting = null,
}: {
  active?: ServiceWorker | null;
  installing?: ServiceWorker | null;
  waiting?: ServiceWorker | null;
}) {
  const registration = new EventTarget() as ServiceWorkerRegistration;
  Object.defineProperties(registration, {
    active: { get: () => active },
    installing: { get: () => installing },
    waiting: { get: () => waiting },
  });
  return registration;
}

function createServiceWorkers(registration: ServiceWorkerRegistration) {
  const serviceWorkers = new EventTarget() as ServiceWorkerContainer;
  Object.defineProperties(serviceWorkers, {
    controller: { value: null, writable: true },
    register: { value: vi.fn().mockResolvedValue(registration) },
  });
  return serviceWorkers;
}

function createLifecycle(registration: ServiceWorkerRegistration) {
  const serviceWorkers = createServiceWorkers(registration);
  const states: OfflineStatusState[] = [];
  const lifecycle = createOfflineWorkerRegistration({
    serviceWorkers,
    workerUrl: "/sw.js",
    scope: "/",
    onStateChange: (state) => states.push(state),
  });

  return { lifecycle, serviceWorkers, states };
}

describe("createOfflineWorkerRegistration", () => {
  it("recognises an already active worker as offline-ready", async () => {
    const active = createWorker("activated");
    const { lifecycle, states } = createLifecycle(createRegistration({ active }));

    await lifecycle.start();

    expect(states).toEqual(["ready"]);
  });

  it("surfaces a pre-existing waiting worker instead of the older active worker", async () => {
    const active = createWorker("activated");
    const waiting = createWorker("installed");
    const { lifecycle, states } = createLifecycle(createRegistration({ active, waiting }));

    await lifecycle.start();

    expect(states).toEqual(["updating"]);
  });

  it("sends SKIP_WAITING only after the user accepts without installing a reload listener", async () => {
    const waiting = createWorker("installed");
    const { lifecycle, serviceWorkers } = createLifecycle(createRegistration({ waiting }));
    const addEventListener = vi.spyOn(serviceWorkers, "addEventListener");

    await lifecycle.start();

    expect(waiting.postMessage).not.toHaveBeenCalled();

    lifecycle.acceptUpdate();

    expect(waiting.postMessage).toHaveBeenCalledOnce();
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    expect(addEventListener).not.toHaveBeenCalledWith("controllerchange", expect.anything());
  });

  it("reports a newly installed update while retaining the active cached worker", async () => {
    const active = createWorker("activated");
    const installing = createWorker("installing");
    const { lifecycle, states } = createLifecycle(createRegistration({ active, installing }));

    await lifecycle.start();
    installing.setState("installed");

    expect(states.at(-1)).toBe("updating");
  });

  it("reports ready only after an initial worker finishes installing", async () => {
    const installing = createWorker("installing");
    const { lifecycle, states } = createLifecycle(createRegistration({ installing }));

    await lifecycle.start();
    expect(states).toEqual([]);

    installing.setState("installed");

    expect(states).toEqual(["ready"]);
  });

  it("keeps offline readiness unavailable when registration fails", async () => {
    const serviceWorkers = new EventTarget() as ServiceWorkerContainer;
    Object.defineProperty(serviceWorkers, "register", {
      value: vi.fn().mockRejectedValue(new Error("registration failed")),
    });
    const states: OfflineStatusState[] = [];
    const lifecycle = createOfflineWorkerRegistration({
      serviceWorkers,
      workerUrl: "/sw.js",
      scope: "/",
      onStateChange: (state) => states.push(state),
    });

    await lifecycle.start();

    expect(states).toEqual(["offline-unavailable"]);
  });
});
