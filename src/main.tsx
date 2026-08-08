import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { OfflineStatus } from "./pwa/OfflineStatus";
import { useOfflineStatus } from "./pwa/useOfflineStatus";
import "./styles.css";

function PlannerRoot() {
  const { state, refresh } = useOfflineStatus();

  return (
    <>
      <App offlineState={state} onRefresh={refresh} />
      <OfflineStatus state={state} onRefresh={refresh} />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlannerRoot />
  </StrictMode>,
);
