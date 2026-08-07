import { useState } from "react";
import { downloadCalendar } from "./calendar/ics";
import { BrowseView } from "./components/BrowseView";
import { PlanView } from "./components/PlanView";
import { schedule } from "./data/schedule";
import { scheduleChanges } from "./data/scheduleChanges";
import { createItineraryStore } from "./storage/itineraryStore";

type PlannerView = "plan" | "browse";

export default function App() {
  const [{ store, initialItinerary }] = useState(() => {
    const validEventIds = new Set(schedule.map((event) => event.id));
    const itineraryStore = createItineraryStore(
      window.localStorage,
      validEventIds,
      scheduleChanges,
    );

    return {
      store: itineraryStore,
      initialItinerary: itineraryStore.load(),
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
  const savedEvents = schedule.filter((event) => favouriteIds.has(event.id));

  const saveItinerary = (
    nextFavouriteIds: ReadonlySet<string>,
    nextNotesByEventId: Record<string, string>,
  ) => {
    const result = store.save({
      favouriteIds: [...nextFavouriteIds],
      notesByEventId: nextNotesByEventId,
    });
    setPersisted(result.persisted);
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
    setPersisted(result.persisted);
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="app-header__kicker">WE OUT HERE · 20–23 AUG 2026</p>
        <h1>Field Notes</h1>
        <p className="app-header__intro">
          A private, offline-ready place for your festival weekend.
        </p>
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

      {view === "plan" ? (
        <PlanView
          events={savedEvents}
          favouriteIds={favouriteIds}
          notesByEventId={notesByEventId}
          now={new Date()}
          persisted={persisted}
          removedIds={removedIds}
          onToggleFavourite={toggleFavourite}
          onSaveNote={saveNote}
          onBrowse={() => setView("browse")}
          onExport={() => downloadCalendar(savedEvents, notesByEventId)}
          onClear={clearPlan}
          onDismissScheduleChanges={() => setRemovedIds([])}
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
        <p>Your saved plan and Event Notes stay only in this browser.</p>
      </footer>
    </main>
  );
}
