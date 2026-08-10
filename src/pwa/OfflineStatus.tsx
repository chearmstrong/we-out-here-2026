import { useEffect, useRef, useState } from "react";
import { schedule, SCHEDULE_LAST_CHECKED } from "../data/schedule";

export type OfflineStatusState = "ready" | "updating" | "offline-unavailable";

type OfflineStatusProps = {
  state: OfflineStatusState;
  onRefresh: () => void;
};

const HOME_SCREEN_GUIDANCE_DISMISSED_KEY =
  "field-notes:home-screen-guidance-dismissed";

const checkedDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${SCHEDULE_LAST_CHECKED}T00:00:00Z`));

export function UpdateNotice({ onRefresh }: { onRefresh: () => void }) {
  return (
    <section className="update-notice" aria-labelledby="update-notice-heading">
      <h2 id="update-notice-heading">A planner update is ready</h2>
      <p>
        Your saved plan stays in this browser. Close and reopen Field Notes to
        use the new version.
      </p>
      <button type="button" onClick={onRefresh}>
        Use update next time
      </button>
    </section>
  );
}

export function OfflineReadiness({ state }: { state: OfflineStatusState }) {
  if (state === "ready" || state === "updating") {
    return <p className="offline-readiness" role="status">Saved for offline use</p>;
  }
  if (state === "offline-unavailable") {
    return <p className="offline-readiness offline-readiness--pending" role="status">Connect once to save this planner offline.</p>;
  }
  return null;
}

export function OfflineStatus({ state, onRefresh }: OfflineStatusProps) {
  const [guidanceDismissed, setGuidanceDismissed] = useState(() => {
    try {
      return (
        window.localStorage.getItem(HOME_SCREEN_GUIDANCE_DISMISSED_KEY) === "1"
      );
    } catch {
      return false;
    }
  });
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const howToButtonRef = useRef<HTMLButtonElement>(null);
  const pendingFocusRef = useRef<"help" | "guidance" | null>(null);

  useEffect(() => {
    const focusTarget =
      pendingFocusRef.current === "help"
        ? helpButtonRef.current
        : howToButtonRef.current;

    if (!pendingFocusRef.current || !focusTarget) {
      return;
    }

    focusTarget.focus();
    pendingFocusRef.current = null;
  }, [guidanceDismissed]);

  const dismissGuidance = () => {
    pendingFocusRef.current = "help";
    setGuidanceDismissed(true);
    setInstructionsVisible(false);

    try {
      window.localStorage.setItem(HOME_SCREEN_GUIDANCE_DISMISSED_KEY, "1");
    } catch {
      // The prompt remains dismissed for this session when storage is blocked.
    }
  };

  const openGuidanceHelp = () => {
    pendingFocusRef.current = "guidance";
    setGuidanceDismissed(false);
    setInstructionsVisible(true);
  };

  return (
    <aside aria-label={`Offline status for ${schedule.length} programme events`}>
      {state === "ready" && !guidanceDismissed ? (
        <section
          aria-labelledby="home-screen-guidance-heading"
          className="home-screen-guidance"
        >
          <h2 id="home-screen-guidance-heading">Keep Field Notes handy</h2>
          <p>
            For optional one-tap access, add Field Notes to your Home Screen
            before you build your plan there.
          </p>
          <p>
            <strong>iPhone/iPad:</strong> Home Screen apps keep a separate plan from
            Safari. Plans saved in Safari will not appear there.
          </p>
          <div className="home-screen-guidance__actions">
            <button
              aria-controls="home-screen-guidance-instructions"
              aria-expanded={instructionsVisible}
              ref={howToButtonRef}
              type="button"
              onClick={() => setInstructionsVisible(true)}
            >
              How to add it
            </button>
            <button type="button" onClick={dismissGuidance}>
              Not now
            </button>
          </div>
          {instructionsVisible ? (
            <div id="home-screen-guidance-instructions">
              <p>
                <strong>iPhone/iPad:</strong> open Share, then choose Add to Home
                Screen.
              </p>
              <p>
                <strong>Android:</strong> use your browser menu and choose Install
                app or Add to Home screen, if offered.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
      {state === "ready" && guidanceDismissed ? (
        <button
          className="home-screen-guidance__help"
          ref={helpButtonRef}
          type="button"
          onClick={openGuidanceHelp}
        >
          Home Screen help
        </button>
      ) : null}
      <p>Schedule checked {checkedDate}</p>
    </aside>
  );
}
