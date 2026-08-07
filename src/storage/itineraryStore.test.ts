import { describe, expect, it } from "vitest";
import {
  createItineraryStore,
  ITINERARY_STORAGE_KEY,
} from "./itineraryStore";

class MemoryStorage implements Storage {
  readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

class UnavailableStorage extends MemoryStorage {
  constructor(
    private readonly failures: ReadonlySet<"read" | "write" | "remove">,
  ) {
    super();
  }

  override getItem(key: string): string | null {
    if (this.failures.has("read")) throw new DOMException("Storage unavailable");
    return super.getItem(key);
  }

  override removeItem(key: string): void {
    if (this.failures.has("remove")) throw new DOMException("Storage unavailable");
    super.removeItem(key);
  }

  override setItem(key: string, value: string): void {
    if (this.failures.has("write")) throw new DOMException("Storage unavailable");
    super.setItem(key, value);
  }
}

const validIds = new Set(["one", "two", "new"]);
const noReplacements = new Map<string, string>();

describe("createItineraryStore", () => {
  it("round-trips favourites and Event Notes through browser storage", () => {
    const storage = new MemoryStorage();
    const first = createItineraryStore(storage, validIds, noReplacements);

    expect(first.save({ favouriteIds: ["two", "one", "one"], notesByEventId: { one: "Meet by the sound desk" } })).toEqual({ persisted: true });
    expect(JSON.parse(storage.getItem(ITINERARY_STORAGE_KEY) ?? "null")).toEqual({ favouriteIds: ["two", "one"], notesByEventId: { one: "Meet by the sound desk" } });
    expect(createItineraryStore(storage, validIds, noReplacements).load()).toEqual({ favouriteIds: ["two", "one"], notesByEventId: { one: "Meet by the sound desk" }, removedIds: [], persisted: true });
  });

  it("rejects overlong notes and notes for events that are not saved", () => {
    const store = createItineraryStore(new MemoryStorage(), validIds, noReplacements);

    store.save({ favouriteIds: ["one"], notesByEventId: { one: "x".repeat(141), two: "Not saved", unknown: "Unknown" } });

    expect(store.load().notesByEventId).toEqual({});
  });

  it("retains a note of exactly 140 characters", () => {
    const store = createItineraryStore(new MemoryStorage(), validIds, noReplacements);
    const note = "x".repeat(140);

    store.save({ favouriteIds: ["one"], notesByEventId: { one: note } });

    expect(store.load().notesByEventId).toEqual({ one: note });
  });

  it("drops an Event Note when its event is no longer saved", () => {
    const store = createItineraryStore(new MemoryStorage(), validIds, noReplacements);
    store.save({ favouriteIds: ["one"], notesByEventId: { one: "A note" } });

    store.save({ favouriteIds: [], notesByEventId: { one: "A note" } });

    expect(store.load()).toEqual({ favouriteIds: [], notesByEventId: {}, removedIds: [], persisted: true });
  });

  it("migrates only explicitly mapped IDs and preserves their Event Notes", () => {
    const storage = new MemoryStorage();
    storage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify({
      favouriteIds: ["old", "one", "unknown"],
      notesByEventId: { old: "Migrated note", one: "Existing note", unknown: "Removed note" },
    }));
    const store = createItineraryStore(storage, validIds, new Map([["old", "new"]]));

    expect(store.load()).toEqual({
      favouriteIds: ["new", "one"],
      notesByEventId: { new: "Migrated note", one: "Existing note" },
      removedIds: ["unknown"],
      persisted: true,
    });
    expect(JSON.parse(storage.getItem(ITINERARY_STORAGE_KEY) ?? "null")).toEqual({
      favouriteIds: ["new", "one"],
      notesByEventId: { new: "Migrated note", one: "Existing note" },
      removedIds: ["unknown"],
    });
  });

  it("keeps removal notices dismissed after a reload", () => {
    const storage = new MemoryStorage();
    storage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify({
      favouriteIds: ["one", "missing"],
      notesByEventId: {},
    }));
    const first = createItineraryStore(storage, validIds, noReplacements);
    expect(first.load().removedIds).toEqual(["missing"]);

    expect(first.dismissRemoved()).toEqual({ persisted: true });

    expect(createItineraryStore(storage, validIds, noReplacements).load()).toEqual({
      favouriteIds: ["one"],
      notesByEventId: {},
      removedIds: [],
      persisted: true,
    });
  });

  it("keeps reconciled state in memory when its durable write fails", () => {
    const failures = new Set<"read" | "write" | "remove">();
    const storage = new UnavailableStorage(failures);
    storage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify({
      favouriteIds: ["old", "missing"],
      notesByEventId: { old: "Mapped note" },
    }));
    failures.add("write");
    const store = createItineraryStore(storage, validIds, new Map([["old", "new"]]));

    expect(store.load()).toEqual({
      favouriteIds: ["new"],
      notesByEventId: { new: "Mapped note" },
      removedIds: ["missing"],
      persisted: false,
    });
    expect(store.load()).toEqual({
      favouriteIds: ["new"],
      notesByEventId: { new: "Mapped note" },
      removedIds: ["missing"],
      persisted: false,
    });
  });

  it("keeps a failed removal-notice dismissal for this visit without claiming persistence", () => {
    const failures = new Set<"read" | "write" | "remove">();
    const storage = new UnavailableStorage(failures);
    storage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify({
      favouriteIds: ["one", "missing"],
      notesByEventId: {},
    }));
    const store = createItineraryStore(storage, validIds, noReplacements);
    expect(store.load().removedIds).toEqual(["missing"]);
    failures.add("write");

    expect(store.dismissRemoved()).toEqual({ persisted: false });
    expect(store.load()).toEqual({
      favouriteIds: ["one"],
      notesByEventId: {},
      removedIds: [],
      persisted: false,
    });
  });

  it("deduplicates favourites after explicit-ID migration", () => {
    const storage = new MemoryStorage();
    storage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify({ favouriteIds: ["old", "new"], notesByEventId: {} }));

    expect(createItineraryStore(storage, validIds, new Map([["old", "new"]])).load().favouriteIds).toEqual(["new"]);
  });

  it("does not migrate an orphan note whose source event was not saved", () => {
    const storage = new MemoryStorage();
    storage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify({
      favouriteIds: ["new"],
      notesByEventId: { old: "Orphan note" },
    }));

    expect(createItineraryStore(storage, validIds, new Map([["old", "new"]])).load().notesByEventId).toEqual({});
  });

  it("keeps the current-event note when a mapped note collides", () => {
    const storage = new MemoryStorage();
    storage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify({
      favouriteIds: ["old", "new"],
      notesByEventId: {
        new: "Current-event note",
        old: "Migrated note",
      },
    }));

    expect(createItineraryStore(storage, validIds, new Map([["old", "new"]])).load().notesByEventId).toEqual({
      new: "Current-event note",
    });
  });

  it("loads a legacy favourite-ID array and reports unknown saved IDs", () => {
    const storage = new MemoryStorage();
    storage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(["one", "missing", "one", 123]));

    expect(createItineraryStore(storage, validIds, noReplacements).load()).toEqual({ favouriteIds: ["one"], notesByEventId: {}, removedIds: ["missing"], persisted: true });
  });

  it("fails safely for malformed persisted fields", () => {
    const storage = new MemoryStorage();
    storage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify({
      favouriteIds: ["one", 123, null],
      notesByEventId: { one: 123, two: "Not saved", missing: "Unknown" },
    }));

    expect(createItineraryStore(storage, validIds, noReplacements).load()).toEqual({ favouriteIds: ["one"], notesByEventId: {}, removedIds: [], persisted: true });
  });

  it("fails safely when persisted JSON is corrupt", () => {
    const storage = new MemoryStorage();
    storage.setItem(ITINERARY_STORAGE_KEY, "{not-json");

    expect(createItineraryStore(storage, validIds, noReplacements).load()).toEqual({ favouriteIds: [], notesByEventId: {}, removedIds: [], persisted: false });
  });

  it("reports non-persistence when reads fail", () => {
    const store = createItineraryStore(new UnavailableStorage(new Set(["read"])), validIds, noReplacements);

    expect(store.load()).toEqual({ favouriteIds: [], notesByEventId: {}, removedIds: [], persisted: false });
  });

  it("keeps in-memory favourites and reports non-persistence when writes fail", () => {
    const store = createItineraryStore(new UnavailableStorage(new Set(["write"])), validIds, noReplacements);

    expect(store.save({ favouriteIds: ["one"], notesByEventId: {} })).toEqual({ persisted: false });
    expect(store.load()).toEqual({ favouriteIds: ["one"], notesByEventId: {}, removedIds: [], persisted: false });
  });

  it("does not resurrect older persisted state after a failed save", () => {
    const failures = new Set<"read" | "write" | "remove">();
    const storage = new UnavailableStorage(failures);
    storage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify({
      favouriteIds: ["one"],
      notesByEventId: { one: "Old note" },
    }));
    const store = createItineraryStore(storage, validIds, noReplacements);
    expect(store.load().favouriteIds).toEqual(["one"]);
    failures.add("write");

    expect(store.save({ favouriteIds: ["two"], notesByEventId: { two: "New note" } })).toEqual({ persisted: false });
    expect(store.load()).toEqual({
      favouriteIds: ["two"],
      notesByEventId: { two: "New note" },
      removedIds: [],
      persisted: false,
    });
  });

  it("clears in-memory state and reports a failed persistent removal", () => {
    const storage = new UnavailableStorage(new Set(["remove"]));
    const store = createItineraryStore(storage, validIds, noReplacements);
    store.save({ favouriteIds: ["one"], notesByEventId: { one: "A note" } });

    expect(store.clear()).toEqual({ persisted: false });
  });

  it("does not resurrect persisted state after a failed clear", () => {
    const failures = new Set<"read" | "write" | "remove">();
    const storage = new UnavailableStorage(failures);
    storage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify({
      favouriteIds: ["one"],
      notesByEventId: { one: "A note" },
    }));
    const store = createItineraryStore(storage, validIds, noReplacements);
    expect(store.load().favouriteIds).toEqual(["one"]);
    failures.add("remove");

    expect(store.clear()).toEqual({ persisted: false });
    expect(store.load()).toEqual({
      favouriteIds: [],
      notesByEventId: {},
      removedIds: [],
      persisted: false,
    });
  });
});
