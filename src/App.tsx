import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import * as calendar from "./calendar/ics";
import { BrowseView } from "./components/BrowseView";
import { PlanView } from "./components/PlanView";
import {
  PlannerFeedback,
  type PlannerFeedbackMessage,
} from "./components/PlannerFeedback";
import {
  FESTIVAL_PLAYLIST_URL,
  OFFICIAL_FESTIVAL_MAP_URL,
  OFFICIAL_SET_TIMES_URL,
  PROJECT_README_URL,
  PROJECT_REPOSITORY_URL,
} from "./config/site";
import { schedule } from "./data/schedule";
import { scheduleChanges } from "./data/scheduleChanges";
import {
  OfflineReadiness,
  UpdateNotice,
  type OfflineStatusState,
} from "./pwa/OfflineStatus";
import {
  createInitialBrowseFilters,
  type BrowseFilters,
  type BrowseMode,
} from "./planner/itinerary";
import { createItineraryStore } from "./storage/itineraryStore";

type PlannerView = "plan" | "browse";
type AppProps = {
  offlineState?: OfflineStatusState;
  onRefresh?: () => void;
};
const PLANNER_CLOCK_INTERVAL_MS = 60_000;
const CALENDAR_EXPORTED_MESSAGE: PlannerFeedbackMessage = {
  kind: "calendar-exported",
  text: "Calendar download started: we-out-here-2026-plan.ics",
};

type PendingUndo = {
  eventId: string;
  note?: string;
  focusKind?: string;
};

function activePlannerFocusKind(eventId: string): string | undefined {
  const activeElement = document.activeElement;
  if (
    activeElement instanceof HTMLElement &&
    activeElement.dataset.plannerEventId === eventId
  ) {
    return activeElement.dataset.plannerFocusKind;
  }
  return undefined;
}

function restorePlannerFocus(eventId: string, focusKind?: string) {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>("[data-planner-event-id]"),
  ).filter(
    (element) =>
      element.dataset.plannerEventId === eventId &&
      element.isConnected &&
      !element.closest("[inert]"),
  );
  const target =
    candidates.find(
      (element) => element.dataset.plannerFocusKind === focusKind,
    ) ??
    candidates[0] ??
    document.querySelector<HTMLElement>('.planner-nav [aria-current="page"]');

  target?.focus();
}

class SessionMemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

function getBrowserStorage(): { storage: Storage; persistent: boolean } {
  try {
    return { storage: window.localStorage, persistent: true };
  } catch {
    return { storage: new SessionMemoryStorage(), persistent: false };
  }
}

function usePlannerClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    const intervalId = window.setInterval(
      refresh,
      PLANNER_CLOCK_INTERVAL_MS,
    );

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  return now;
}

export default function App({ offlineState, onRefresh }: AppProps) {
  const [{ store, initialItinerary, storageIsPersistent }] = useState(() => {
    const validEventIds = new Set(schedule.map((event) => event.id));
    const browserStorage = getBrowserStorage();
    const itineraryStore = createItineraryStore(
      browserStorage.storage,
      validEventIds,
      scheduleChanges,
    );
    const loadedItinerary = itineraryStore.load();

    return {
      store: itineraryStore,
      initialItinerary: {
        ...loadedItinerary,
        persisted: browserStorage.persistent && loadedItinerary.persisted,
      },
      storageIsPersistent: browserStorage.persistent,
    };
  });
  const now = usePlannerClock();
  const [view, setView] = useState<PlannerView>("plan");
  const [initialBrowseFilters] = useState<BrowseFilters>(() =>
    createInitialBrowseFilters(now),
  );
  const [browseFilters, setBrowseFilters] = useState(initialBrowseFilters);
  const [browseMode, setBrowseMode] = useState<BrowseMode>("list");
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(
    () => new Set(initialItinerary.favouriteIds),
  );
  const [notesByEventId, setNotesByEventId] = useState<Record<string, string>>(
    initialItinerary.notesByEventId,
  );
  const [persisted, setPersisted] = useState(initialItinerary.persisted);
  const [removedIds, setRemovedIds] = useState(initialItinerary.removedIds);
  const [feedbackMessage, setFeedbackMessage] =
    useState<PlannerFeedbackMessage | null>(null);
  const [pendingUndo, setPendingUndo] = useState<PendingUndo | null>(null);
  const [focusAfterUndo, setFocusAfterUndo] = useState<{
    eventId: string;
    focusKind?: string;
  } | null>(null);
  const savedEvents = schedule.filter((event) => favouriteIds.has(event.id));

  useEffect(() => {
    if (!focusAfterUndo) {
      return;
    }

    restorePlannerFocus(focusAfterUndo.eventId, focusAfterUndo.focusKind);
    setFocusAfterUndo(null);
  }, [focusAfterUndo]);

  const saveItinerary = (
    nextFavouriteIds: ReadonlySet<string>,
    nextNotesByEventId: Record<string, string>,
  ) => {
    const result = store.save({
      favouriteIds: [...nextFavouriteIds],
      notesByEventId: nextNotesByEventId,
    });
    const effectiveResult = {
      persisted: storageIsPersistent && result.persisted,
    };
    setPersisted(effectiveResult.persisted);
    setFavouriteIds(new Set(nextFavouriteIds));
    setNotesByEventId(nextNotesByEventId);
    return effectiveResult;
  };

  const toggleFavourite = (eventId: string) => {
    const nextFavouriteIds = new Set(favouriteIds);
    if (nextFavouriteIds.has(eventId)) {
      const removedEvent = schedule.find((event) => event.id === eventId);
      const nextPendingUndo = {
        eventId,
        note: notesByEventId[eventId],
        focusKind: activePlannerFocusKind(eventId),
      };
      nextFavouriteIds.delete(eventId);
      setPendingUndo(nextPendingUndo);
      setFeedbackMessage({
        kind: "undo-remove",
        eventId,
        text: `${removedEvent?.title ?? "Event"} removed from your plan.`,
      });
    } else {
      nextFavouriteIds.add(eventId);
      setPendingUndo(null);
      setFeedbackMessage(null);
    }
    const nextNotesByEventId = nextFavouriteIds.has(eventId)
      ? notesByEventId
      : Object.fromEntries(
          Object.entries(notesByEventId).filter(([id]) => id !== eventId),
        );

    saveItinerary(nextFavouriteIds, nextNotesByEventId);
  };

  const saveNote = (eventId: string, note: string) => {
    if (!favouriteIds.has(eventId)) {
      return;
    }

    const nextNotesByEventId = { ...notesByEventId };
    if (note.length === 0) {
      delete nextNotesByEventId[eventId];
    } else {
      nextNotesByEventId[eventId] = note;
    }
    setPendingUndo(null);
    const result = saveItinerary(favouriteIds, nextNotesByEventId);
    setFeedbackMessage(null);
    return result;
  };

  const undoRemove = () => {
    if (!pendingUndo) {
      return;
    }

    const { eventId, focusKind, note } = pendingUndo;
    const nextFavouriteIds = new Set(favouriteIds);
    nextFavouriteIds.add(eventId);
    const nextNotesByEventId = { ...notesByEventId };
    if (note !== undefined) {
      nextNotesByEventId[eventId] = note;
    }
    saveItinerary(nextFavouriteIds, nextNotesByEventId);
    setPendingUndo(null);
    setFeedbackMessage(null);
    setFocusAfterUndo({ eventId, focusKind });
  };

  const clearPlan = () => {
    const result = store.clear();
    setFavouriteIds(new Set());
    setNotesByEventId({});
    setRemovedIds([]);
    setPersisted(storageIsPersistent && result.persisted);
    setPendingUndo(null);
    setFeedbackMessage(null);
  };

  return (
    <main
      className="app-shell"
      data-planner-view={view}
      data-plan-empty={savedEvents.length === 0}
    >
      <header className="app-header">
        <a
          className="header-source-link"
          href={PROJECT_REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="View source on GitHub"
        >
          <Github aria-hidden="true" />
        </a>
        <p className="app-header__kicker">WE OUT HERE · 20–23 AUG 2026</p>
        <h1>Field Notes</h1>
        <p className="app-header__intro">
          A private, local-first place for your festival weekend.
        </p>
        <a
          className="header-playlist-link"
          href={FESTIVAL_PLAYLIST_URL}
          target="_blank"
          rel="noreferrer"
        >
          Listen to the festival playlist
        </a>
      </header>
      <nav className="planner-nav" aria-label="Planner views">
        <button
          type="button"
          aria-current={view === "plan" ? "page" : undefined}
          onClick={() => setView("plan")}
        >
          My plan
        </button>
        <button
          type="button"
          aria-current={view === "browse" ? "page" : undefined}
          onClick={() => setView("browse")}
        >
          Browse
        </button>
      </nav>

      {offlineState === "updating" && onRefresh ? (
        <UpdateNotice onRefresh={onRefresh} />
      ) : null}
      {offlineState ? <OfflineReadiness state={offlineState} /> : null}
      <PlannerFeedback
        message={feedbackMessage}
        onUndoRemove={pendingUndo ? undoRemove : undefined}
        storageUnavailable={!persisted}
      />

      {view === "plan" ? (
        <PlanView
          events={savedEvents}
          favouriteIds={favouriteIds}
          notesByEventId={notesByEventId}
          now={now}
          removedIds={removedIds}
          onToggleFavourite={toggleFavourite}
          onSaveNote={saveNote}
          onBrowse={() => setView("browse")}
          onExport={() => {
            if (calendar.downloadCalendar(savedEvents, notesByEventId)) {
              setPendingUndo(null);
              setFeedbackMessage(CALENDAR_EXPORTED_MESSAGE);
            }
          }}
          onClear={clearPlan}
          onDismissScheduleChanges={() => {
            const result = store.dismissRemoved();
            setRemovedIds([]);
            setPersisted(storageIsPersistent && result.persisted);
            setPendingUndo(null);
            setFeedbackMessage(null);
          }}
        />
      ) : (
        <BrowseView
          events={schedule}
          favouriteIds={favouriteIds}
          now={now}
          filters={browseFilters}
          mode={browseMode}
          notesByEventId={notesByEventId}
          onToggleFavourite={toggleFavourite}
          onSaveNote={saveNote}
          onFiltersChange={setBrowseFilters}
          onModeChange={setBrowseMode}
          onClearFilters={() => setBrowseFilters(initialBrowseFilters)}
        />
      )}

      <footer className="app-footer">
        <p>
          Field Notes is an unofficial, local-first planner: your plan and Event
          Notes stay in this browser, and the app does not fetch programme content
          at runtime.
        </p>
        <nav className="app-footer__resources" aria-label="Footer resources">
          <a href={PROJECT_README_URL} target="_blank" rel="noreferrer">
            How Field Notes works
          </a>
          <a
            href={PROJECT_REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
          >
            View source on GitHub
          </a>
          <a href={OFFICIAL_SET_TIMES_URL} target="_blank" rel="noreferrer">
            Official set times
          </a>
          <a
            href={OFFICIAL_FESTIVAL_MAP_URL}
            target="_blank"
            rel="noreferrer"
          >
            Official festival map
          </a>
        </nav>
      </footer>
    </main>
  );
}
