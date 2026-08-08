/// <reference types="vite/client" />

import { useCallback, useEffect, useRef, useState } from "react";
import { createOfflineWorkerRegistration } from "./offlineWorkerRegistration";
import type { OfflineStatusState } from "./OfflineStatus";

type OfflineWorkerLifecycle = ReturnType<typeof createOfflineWorkerRegistration>;

export function useOfflineStatus() {
  const [state, setState] = useState<OfflineStatusState>("offline-unavailable");
  const lifecycleRef = useRef<OfflineWorkerLifecycle | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const scope = import.meta.env.BASE_URL;
    const lifecycle = createOfflineWorkerRegistration({
      serviceWorkers: navigator.serviceWorker,
      workerUrl: `${scope}sw.js`,
      scope,
      onStateChange: (nextState) => {
        setState((current) =>
          current === "updating" && nextState === "ready" ? current : nextState,
        );
      },
    });

    lifecycleRef.current = lifecycle;
    void lifecycle.start();

    return () => {
      lifecycle.stop();
      if (lifecycleRef.current === lifecycle) lifecycleRef.current = null;
    };
  }, []);

  const refresh = useCallback(() => lifecycleRef.current?.acceptUpdate(), []);

  return { state, refresh };
}
