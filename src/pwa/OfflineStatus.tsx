import { schedule, SCHEDULE_LAST_CHECKED } from "../data/schedule";

export type OfflineStatusState = "ready" | "updating" | "offline-unavailable";

type OfflineStatusProps = {
  state: OfflineStatusState;
  onRefresh: () => void;
};

const checkedDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${SCHEDULE_LAST_CHECKED}T00:00:00Z`));

export function OfflineStatus({ state, onRefresh }: OfflineStatusProps) {
  return (
    <aside aria-label={`Offline status for ${schedule.length} programme events`}>
      {state === "ready" ? <p role="status">Saved for offline use</p> : null}
      {state === "offline-unavailable" ? (
        <p role="status">Connect once to save this planner offline.</p>
      ) : null}
      {state === "updating" ? (
        <div>
          <p role="status">A planner update is available</p>
          <p>
            This open planner will not reload. Allow the update, then close and
            reopen Field Notes to use it.
          </p>
          <p>
            If you leave it waiting, your browser may activate it after every
            Field Notes tab or app window is closed.
          </p>
          <button type="button" onClick={onRefresh}>
            Allow update
          </button>
        </div>
      ) : null}
      <p>Schedule checked {checkedDate}</p>
    </aside>
  );
}
