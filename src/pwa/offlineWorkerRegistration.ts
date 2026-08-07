import type { OfflineStatusState } from "./OfflineStatus";

type OfflineWorkerRegistrationOptions = {
  serviceWorkers: ServiceWorkerContainer;
  workerUrl: string;
  scope: string;
  onStateChange: (state: OfflineStatusState) => void;
};

export function createOfflineWorkerRegistration({
  serviceWorkers,
  workerUrl,
  scope,
  onStateChange,
}: OfflineWorkerRegistrationOptions) {
  let registration: ServiceWorkerRegistration | null = null;
  let installingWorker: ServiceWorker | null = null;
  let waitingWorker: ServiceWorker | null = null;
  let stopped = false;

  const stopWatchingInstallation = () => {
    installingWorker?.removeEventListener("statechange", onInstallingStateChange);
    installingWorker = null;
  };

  const onInstallingStateChange = () => {
    if (installingWorker?.state !== "installed") return;

    if (registration?.active || serviceWorkers.controller) {
      waitingWorker = registration?.waiting ?? installingWorker;
      onStateChange("updating");
    } else {
      onStateChange("ready");
    }
  };

  const watchInstallation = (worker: ServiceWorker) => {
    stopWatchingInstallation();
    installingWorker = worker;
    worker.addEventListener("statechange", onInstallingStateChange);
    onInstallingStateChange();
  };

  const onUpdateFound = () => {
    if (registration?.installing) watchInstallation(registration.installing);
  };

  const start = async () => {
    try {
      const registered = await serviceWorkers.register(workerUrl, { scope });
      if (stopped) return;

      registration = registered;
      registration.addEventListener("updatefound", onUpdateFound);

      if (registration.waiting) {
        waitingWorker = registration.waiting;
        onStateChange("updating");
      } else if (registration.installing) {
        watchInstallation(registration.installing);
      } else if (registration.active) {
        onStateChange("ready");
      }
    } catch {
      if (!stopped) onStateChange("offline-unavailable");
    }
  };

  const acceptUpdate = () => {
    (registration?.waiting ?? waitingWorker)?.postMessage({ type: "SKIP_WAITING" });
  };

  const stop = () => {
    stopped = true;
    registration?.removeEventListener("updatefound", onUpdateFound);
    stopWatchingInstallation();
  };

  return { start, acceptUpdate, stop };
}
