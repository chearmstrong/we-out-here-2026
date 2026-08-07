/// <reference types="vite-plugin-pwa/react" />

import { useCallback, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import type { OfflineStatusState } from "./OfflineStatus";

export function useOfflineStatus() {
  const [state, setState] = useState<OfflineStatusState>("offline-unavailable");
  const { updateServiceWorker } = useRegisterSW({
    onOfflineReady: () => setState("ready"),
    onNeedRefresh: () => setState("updating"),
    onRegisteredSW: (_swUrl, registration) => {
      if (registration?.active) setState("ready");
    },
    onRegisterError: () => setState("offline-unavailable"),
  });

  const refresh = useCallback(
    () => updateServiceWorker(true),
    [updateServiceWorker],
  );

  return { state, refresh };
}
