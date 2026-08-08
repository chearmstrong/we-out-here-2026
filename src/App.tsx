import { useEffect, useState } from "react";
import { Github } from "lucide-react";
import { downloadCalendar } from "./calendar/ics";
import { BrowseView } from "./components/BrowseView";
import { PlanView } from "./components/PlanView";
import {
  FESTIVAL_PLAYLIST_URL,
  OFFICIAL_SET_TIMES_URL,
  PROJECT_README_URL,
  PROJECT_REPOSITORY_URL,
} from "./config/site";
import { schedule } from "./data/schedule";
import { scheduleChanges } from "./data/scheduleChanges";
import { UpdateNotice, type OfflineStatusState } from "./pwa/OfflineStatus";
import { createItineraryStore } from "./storage/itineraryStore";

type PlannerView = "plan" | "browse";
type AppProps = {
  offlineState?: OfflineStatusState;
  onRefresh?: () => void;
};
const PLANNER_CLOCK_INTERVAL_MS = 60_000;

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
  const [view, setView] = useState<PlannerView>("plan");
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(
    () => new Set(initialItinerary.favouriteIds),
  );
  const [notesByEventId, setNotesByEventId] = useState<Record<string, string>>(
    initialItinerary.notesByEventId,
  );
  const [persisted, setPersisted] = useState(initialItinerary.persisted);
  const [removedIds, setRemovedIds] = useState(initialItinerary.removedIds);
  const now = usePlannerClock();
  const savedEvents = schedule.filter((event) => favouriteIds.has(event.id));

  const saveItinerary = (
    nextFavouriteIds: ReadonlySet<string>,
    nextNotesByEventId: Record<string, string>,
  ) => {
    const result = store.save({
      favouriteIds: [...nextFavouriteIds],
      notesByEventId: nextNotesByEventId,
    });
    setPersisted(storageIsPersistent && result.persisted);
    setFavouriteIds(new Set(nextFavouriteIds));
    setNotesByEventId(nextNotesByEventId);
  };

  const toggleFavourite = (eventId: string) => {
    const nextFavouriteIds = new Set(favouriteIds);
    if (nextFavouriteIds.has(eventId)) {
      nextFavouriteIds.delete(eventId);
    } else {
      nextFavouriteIds.add(eventId);
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
    saveItinerary(favouriteIds, nextNotesByEventId);
  };

  const clearPlan = () => {
    const result = store.clear();
    setFavouriteIds(new Set());
    setNotesByEventId({});
    setRemovedIds([]);
    setPersisted(storageIsPersistent && result.persisted);
  };

  return (
    <main className="app-shell">
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

      {view === "plan" ? (
        <PlanView
          events={savedEvents}
          favouriteIds={favouriteIds}
          notesByEventId={notesByEventId}
          now={now}
          persisted={persisted}
          removedIds={removedIds}
          onToggleFavourite={toggleFavourite}
          onSaveNote={saveNote}
          onBrowse={() => setView("browse")}
          onExport={() => downloadCalendar(savedEvents, notesByEventId)}
          onClear={clearPlan}
          onDismissScheduleChanges={() => {
            const result = store.dismissRemoved();
            setRemovedIds([]);
            setPersisted(storageIsPersistent && result.persisted);
          }}
        />
      ) : (
        <BrowseView
          events={schedule}
          favouriteIds={favouriteIds}
          notesByEventId={notesByEventId}
          onToggleFavourite={toggleFavourite}
          onSaveNote={saveNote}
        />
      )}

      <footer className="app-footer">
        <p>
          Field Notes is an unofficial personal planner and is not affiliated
          with or endorsed by We Out Here Festival.
        </p>
        <p>
          Field Notes is a local-first planner using a verified programme
          snapshot and saves plans and notes in the browser.
        </p>
        <p>Your saved plan and Event Notes stay only in this browser.</p>
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
        </nav>
      </footer>
    </main>
  );
}
