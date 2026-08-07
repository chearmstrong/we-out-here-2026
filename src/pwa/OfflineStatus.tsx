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
          <p>Your saved planner stays available until you choose to update.</p>
          <button type="button" onClick={onRefresh}>
            Update now
          </button>
        </div>
      ) : null}
      <p>Schedule checked {checkedDate}</p>
    </aside>
  );
}
