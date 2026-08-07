export type ItineraryState = {
  favouriteIds: string[];
  notesByEventId: Record<string, string>;
  removedIds: string[];
  persisted: boolean;
};

export type StoredItinerary = Pick<
  ItineraryState,
  "favouriteIds" | "notesByEventId"
>;

export const ITINERARY_STORAGE_KEY = "we-out-here-2026:itinerary:v1";

const unique = (ids: readonly string[]): string[] => [...new Set(ids)];

const parseStoredItinerary = (parsed: unknown): StoredItinerary => {
  const legacyIds = Array.isArray(parsed) ? parsed : [];
  const candidate =
    parsed && typeof parsed === "object"
      ? (parsed as Partial<StoredItinerary>)
      : {};
  const candidateIds = Array.isArray(candidate.favouriteIds)
    ? candidate.favouriteIds
    : legacyIds;
  const candidateNotes =
    candidate.notesByEventId &&
    typeof candidate.notesByEventId === "object" &&
    !Array.isArray(candidate.notesByEventId)
      ? candidate.notesByEventId
      : {};

  return {
    favouriteIds: unique(
      candidateIds.filter(
        (value): value is string => typeof value === "string",
      ),
    ),
    notesByEventId: Object.fromEntries(
      Object.entries(candidateNotes).filter(
        ([, note]) => typeof note === "string" && note.length <= 140,
      ),
    ),
  };
};

export function createItineraryStore(
  storage: Storage,
  validIds: ReadonlySet<string>,
  replacements: ReadonlyMap<string, string>,
) {
  let memory: StoredItinerary = { favouriteIds: [], notesByEventId: {} };
  let memoryIsDirty = false;
  let persisted = true;

  const reconcile = (): Omit<ItineraryState, "persisted"> => {
    const sourceFavouriteIds = unique(memory.favouriteIds);
    const migratedIds = unique(
      sourceFavouriteIds.map((id) => replacements.get(id) ?? id),
    );
    const removedIds = migratedIds.filter((id) => !validIds.has(id));
    const favouriteIds = migratedIds.filter((id) => validIds.has(id));
    const favouriteIdSet = new Set(favouriteIds);
    const migratedNotes = new Map<string, string>();

    // Current-ID notes win; mapped notes fill only otherwise-empty targets.
    for (const sourceId of sourceFavouriteIds) {
      const targetId = replacements.get(sourceId) ?? sourceId;
      const note = memory.notesByEventId[sourceId];
      if (
        targetId === sourceId &&
        favouriteIdSet.has(targetId) &&
        note !== undefined
      ) {
        migratedNotes.set(targetId, note);
      }
    }

    for (const sourceId of sourceFavouriteIds) {
      const targetId = replacements.get(sourceId) ?? sourceId;
      const note = memory.notesByEventId[sourceId];
      if (
        targetId !== sourceId &&
        favouriteIdSet.has(targetId) &&
        !migratedNotes.has(targetId) &&
        note !== undefined
      ) {
        migratedNotes.set(targetId, note);
      }
    }

    const notesByEventId = Object.fromEntries(migratedNotes);

    memory = { favouriteIds, notesByEventId };
    return { ...memory, removedIds };
  };

  return {
    load(): ItineraryState {
      if (!memoryIsDirty) {
        try {
          const stored = storage.getItem(ITINERARY_STORAGE_KEY);
          if (stored !== null) {
            memory = parseStoredItinerary(JSON.parse(stored) as unknown);
          }
        } catch {
          memory = { favouriteIds: [], notesByEventId: {} };
          persisted = false;
        }
      }

      return { ...reconcile(), persisted };
    },

    save(next: StoredItinerary): { persisted: boolean } {
      const favouriteIds = unique(next.favouriteIds).filter((id) =>
        validIds.has(id),
      );
      const favouriteIdSet = new Set(favouriteIds);
      memory = {
        favouriteIds,
        notesByEventId: Object.fromEntries(
          Object.entries(next.notesByEventId).filter(
            ([id, note]) =>
              typeof note === "string" &&
              note.length <= 140 &&
              validIds.has(id) &&
              favouriteIdSet.has(id),
          ),
        ),
      };

      try {
        storage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(memory));
        memoryIsDirty = false;
        persisted = true;
      } catch {
        memoryIsDirty = true;
        persisted = false;
      }

      return { persisted };
    },

    clear(): { persisted: boolean } {
      memory = { favouriteIds: [], notesByEventId: {} };
      try {
        storage.removeItem(ITINERARY_STORAGE_KEY);
        memoryIsDirty = false;
        persisted = true;
      } catch {
        memoryIsDirty = true;
        persisted = false;
      }

      return { persisted };
    },
  };
}
