# We Out Here Festival Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy an offline-capable, personal-first festival planner for the complete We Out Here 2026 music and wider programmes.

**Architecture:** A React/TypeScript Vite PWA bundles a manually verified, versioned Schedule Snapshot as local data and persists one shared itinerary with Event Notes in `localStorage`. Pure schedule, change-mapping, conflict, storage, and calendar modules sit beneath small UI components; `vite-plugin-pwa` precaches the built application for offline use and offers a user-controlled update, while GitHub Actions publishes the static build to GitHub Pages.

**Tech Stack:** Node.js 22.12+, npm, React 19, TypeScript 5, Vite 5, Vitest, Testing Library, `lucide-react`, `vite-plugin-pwa`, GitHub Actions, GitHub Pages.

## Global Constraints

- Use Node.js `>=22.12.0` and npm.
- Use two-space indentation, double quotes, semicolons, named exports for reusable modules, and colocated `.test.ts`/`.test.tsx` tests.
- The production app must make no runtime request to the festival website or another external service.
- Persist only one shared itinerary in browser `localStorage`, including at most one 140-character Event Note per saved event; do not add accounts, telemetry, sync, or a backend.
- Include the music and wider programmes for Thursday 20 through Sunday 23 August 2026, using the `Europe/London` timezone.
- Model Programme Day separately from Calendar Timestamps: Programme Day groups the official schedule and itinerary; timestamps drive current/next status, clashes, and calendar export.
- Use original branding and UI assets. Do not use or recreate We Out Here logos, wordmarks, illustrations, photography, or distinctive display type; state that the public site is unofficial and not affiliated with or endorsed by the festival.
- Design for a phone outdoors: category icons must have text labels, all controls must work by keyboard, and colour must not be the only carrier of meaning.
- Service-worker caching must make the complete downloaded application and Schedule Snapshot available offline after one successful online load. A detected update never reloads an open planner; the browser may still activate a waiting version after all controlled planner clients close.
- Calendar export includes Event Notes but no automatic alarm; browser push notifications are out of scope.
- Publish manually verified Schedule Snapshots from the repository with a visible last-checked date. Do not scrape or fetch the official site at runtime, use automatic schedule import, or fuzzy-match renamed events.

---

## Planned File Structure

```text
.github/workflows/deploy-pages.yml     Build, test, and deploy the Vite output to GitHub Pages
public/icons/                          Original PWA icons
src/domain/festival.ts                 Shared event, category, venue, and saved-plan types
src/data/schedule.ts                   Manually verified, versioned complete Schedule Snapshot
src/data/scheduleValidator.ts          Pure validation for the shipped schedule
src/data/scheduleValidator.test.ts     Data validation tests
src/data/scheduleChanges.ts            Explicit confirmed old-ID to new-ID change mappings
src/planner/time.ts                    Time parsing and ordering helpers
src/planner/itinerary.ts               Filtering, upcoming-event, and clash calculations
src/planner/itinerary.test.ts          Planner-logic tests
src/storage/itineraryStore.ts          Safe versioned localStorage adapter
src/storage/itineraryStore.test.ts     Persistence and unavailable-storage tests
src/calendar/ics.ts                    Standards-compliant calendar text generator
src/calendar/ics.test.ts               Calendar serialization tests
src/config/site.ts                     Project URL/base-path constants
src/config/site.test.ts                Deployment configuration tests
src/pwa/useOfflineStatus.ts            Service-worker/cache status exposed to React
src/pwa/OfflineStatus.tsx              Accessible offline/download status component
src/pwa/OfflineStatus.test.tsx         Status UI tests
src/components/EventCard.tsx           Accessible event summary and save control
src/components/EventDetailsDialog.tsx  Accessible full event detail surface
src/components/Filters.tsx             Search/day/venue/category controls
src/components/BrowseView.tsx          Searchable programme list and timetable switch
src/components/PlanView.tsx            Empty plan, Current Programme Day, notes, clashes, and export
src/components/EventCard.test.tsx      Event-card interaction and semantics tests
src/components/EventDetailsDialog.test.tsx Full event-detail semantics tests
src/components/BrowseView.test.tsx     Search/filter/timetable behaviour tests
src/components/PlanView.test.tsx       Plan and clash presentation tests
src/App.tsx                            Page state, itinerary hydration, and app composition
src/App.test.tsx                       End-to-end component-level behaviour tests
src/styles.css                         Original responsive visual system
src/main.tsx                           React and PWA entry point
src/test/setup.ts                      Testing Library matcher setup
vite.config.ts                         GitHub Pages base path and PWA configuration
package.json                           Scripts and dependencies
README.md                              Local setup, offline use, data update, and attribution rules
docs/content-sources.md                Official source URLs and curation/update procedure
index.html                             Manifest-aware HTML entry point
```

### Task 1: Bootstrap the local-first React PWA and repeatable test environment

**Files:**
- Create: `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `vite.config.ts`
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `src/test/setup.ts`, `src/App.test.tsx`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Node.js `>=22.12.0`.
- Produces: `npm run dev`, `npm test`, `npm run build`, and a React root that renders `App`.

- [ ] **Step 1: Write the failing app-scaffold test.**

```tsx
// src/App.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the planner heading and programme navigation", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Field Notes" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Planner views" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused test to prove the initial state fails.**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because the package, test configuration, or `App` does not yet exist.

- [ ] **Step 3: Create the smallest working Vite/React setup.**

Copy the compatible React 19, TypeScript, Vite 5, Vitest, Testing Library, and `lucide-react` baseline from `ai-architect-learning`; add `vite-plugin-pwa` as a development dependency. Configure these scripts exactly:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "preview": "vite preview"
  },
  "engines": { "node": ">=22.12.0" }
}
```

Use this initial root and ensure the navigation has buttons for `plan` and `browse`:

```tsx
export default function App() {
  return (
    <main>
      <header>
        <p>WE OUT HERE · 20–23 AUG 2026</p>
        <h1>Field Notes</h1>
      </header>
      <nav aria-label="Planner views">
        <button type="button">My plan</button>
        <button type="button">Browse</button>
      </nav>
    </main>
  );
}
```

Configure Vitest for `jsdom`, globals, and `src/test/setup.ts`; import `@testing-library/jest-dom/vitest` there. Add `node_modules/` and `dist/` to `.gitignore` if they are not already ignored.

- [ ] **Step 4: Run the focused test, full test suite, and production build.**

Run: `npm test -- src/App.test.tsx && npm test && npm run build`

Expected: all tests pass and Vite creates `dist/`.

- [ ] **Step 5: Commit the independently working scaffold.**

```bash
git add .gitignore index.html package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts src
git commit -m "feat: scaffold festival planner"
```

### Task 2: Model, curate, and validate the complete local programme

**Files:**
- Create: `src/domain/festival.ts`, `src/data/schedule.ts`, `src/data/scheduleChanges.ts`, `src/data/scheduleValidator.ts`, `src/data/scheduleValidator.test.ts`, `docs/content-sources.md`

**Interfaces:**
- Consumes: the official [set-times page](https://weoutherefestival.com/set-times/) and official festival dates (20–23 August 2026).
- Produces: `schedule`, `SCHEDULE_VERSION`, `SCHEDULE_LAST_CHECKED`, `scheduleChanges`, `validateSchedule(events)`, and `FestivalEvent` for every later task.

- [ ] **Step 1: Write failing validator tests before creating programme data.**

```ts
import { describe, expect, it } from "vitest";
import type { FestivalEvent } from "../domain/festival";
import { validateSchedule } from "./scheduleValidator";

const validEvent: FestivalEvent = {
  id: "thursday:main-stage:kotoa",
  title: "Kotoa",
  programmeDay: "thursday",
  venue: "Main Stage",
  startsAt: "2026-08-20T13:20:00+01:00",
  endsAt: "2026-08-20T14:00:00+01:00",
  category: "music",
  source: "music-programme",
};

describe("validateSchedule", () => {
  it("accepts a complete valid event", () => expect(validateSchedule([validEvent])).toEqual([]));
  it("rejects duplicate IDs and end times before start times", () => {
    expect(validateSchedule([{ ...validEvent }, { ...validEvent, endsAt: "2026-08-20T12:00:00+01:00" }])).toEqual(
      expect.arrayContaining([expect.stringMatching(/duplicate/i), expect.stringMatching(/end/i)]),
    );
  });
});
```

- [ ] **Step 2: Run the focused test to prove it fails.**

Run: `npm test -- src/data/scheduleValidator.test.ts`

Expected: FAIL because the domain types and validator do not exist.

- [ ] **Step 3: Define the domain, validator, source rules, and complete curated schedule.**

```ts
// src/domain/festival.ts
export const EVENT_CATEGORIES = ["music", "talk", "workshop", "family", "other"] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type ProgrammeSource = "music-programme" | "wider-programme";
export type ProgrammeDay = "thursday" | "friday" | "saturday" | "sunday";
export type FestivalEvent = {
  id: string;
  title: string;
  programmeDay: ProgrammeDay;
  venue: string;
  startsAt: string;
  endsAt: string;
  category: EventCategory;
  source: ProgrammeSource;
};
```

Implement `validateSchedule(events: readonly FestivalEvent[]): string[]` to report blank required fields, duplicate IDs, unknown categories, invalid Programme Days, non-ISO timestamps, non-positive durations, and schedule-change targets that do not exist in the new snapshot. Add `SCHEDULE_VERSION = "2026-08-07"`, `SCHEDULE_LAST_CHECKED = "2026-08-07"`, a fully populated `schedule` array in `src/data/schedule.ts`, and `scheduleChanges: ReadonlyMap<string, string>` in `src/data/scheduleChanges.ts`.

Manually curate and verify every displayed event from both official programme tabs. Convert each displayed local time to an ISO timestamp with `+01:00`; for a post-midnight end time, use the next calendar date while retaining the official Programme Day. Generate initial IDs from Programme Day, lower-kebab-case venue, and lower-kebab-case event identity—never start time. On a verified later time change, retain the ID. On a confirmed rename or venue move, add an exact old-ID/new-ID mapping in `scheduleChanges.ts`; do not create fuzzy matching. Categorise music-stage performances as `music`; use the official wider-programme description to distinguish `talk`, `workshop`, `family`, and `other`, assigning `family` only when the source clearly supports it. Do not ship a partial demonstration schedule.

Record the music and wider-programme URLs, the snapshot last-checked date, public-only nature of the source, and the manual update procedure in `docs/content-sources.md`. The update procedure is: check the official source, edit the local snapshot and any confirmed mapping, run validation/tests, deploy to the same Pages URL, and verify the update prompt. The data is factual programme metadata; all app copy and UI assets remain original.

- [ ] **Step 4: Run validator tests and a build-time validation assertion.**

Add this test and run it with the focused suite:

```ts
import { schedule } from "./schedule";

it("ships a valid schedule", () => {
  expect(validateSchedule(schedule)).toEqual([]);
  expect(schedule).toEqual(expect.arrayContaining([expect.objectContaining({ source: "music-programme" })]));
  expect(schedule).toEqual(expect.arrayContaining([expect.objectContaining({ source: "wider-programme" })]));
});
```

Run: `npm test -- src/data/scheduleValidator.test.ts && npm run build`

Expected: validator tests pass and the full source data compiles.

- [ ] **Step 5: Commit the curated local data foundation.**

```bash
git add src/domain/festival.ts src/data docs/content-sources.md
git commit -m "feat(data): add validated festival programme"
```

### Task 3: Implement deterministic itinerary, clash, and favourite-persistence logic

**Files:**
- Create: `src/planner/time.ts`, `src/planner/itinerary.ts`, `src/planner/itinerary.test.ts`, `src/storage/itineraryStore.ts`, `src/storage/itineraryStore.test.ts`

**Interfaces:**
- Consumes: `FestivalEvent` and `schedule` from Task 2; a standard browser `Storage`.
- Produces: `filterEvents`, `getCurrentAndNext`, `getClashingEventIds`, `getCurrentProgrammeDay`, `createFavouritesStore`, and `ItineraryState` for the app UI.

- [ ] **Step 1: Write failing planner and storage tests.**

```ts
import { describe, expect, it } from "vitest";
import { getClashingEventIds, getCurrentAndNext } from "./itinerary";

it("returns the active event and the next saved event in chronological order", () => {
  const result = getCurrentAndNext(events, new Date("2026-08-21T19:00:00+01:00"));
  expect(result.now?.id).toBe("one");
  expect(result.next?.id).toBe("two");
});

it("marks both events in a real overlap", () => {
  expect(getClashingEventIds(events)).toEqual(new Set(["one", "two"]));
});
```

```ts
import { createItineraryStore } from "./itineraryStore";

it("keeps in-memory favourites and reports non-persistence when writes fail", () => {
  const store = createItineraryStore(throwingStorage, new Set(["one"]), new Map());
  expect(store.save({ favouriteIds: ["one"], notesByEventId: {} })).toEqual({ persisted: false });
  expect(store.load()).toEqual({ favouriteIds: ["one"], notesByEventId: {}, removedIds: [], persisted: false });
});
```

- [ ] **Step 2: Run focused tests to prove they fail.**

Run: `npm test -- src/planner/itinerary.test.ts src/storage/itineraryStore.test.ts`

Expected: FAIL because the pure planning and storage modules do not exist.

- [ ] **Step 3: Implement pure date, filtering, conflict, and storage functions.**

```ts
// src/planner/itinerary.ts
export type BrowseFilters = {
  query: string;
  programmeDay: ProgrammeDay | "all";
  venue: string | "all";
  category: EventCategory | "all";
};

export const compareByStartThenTitle = (left: FestivalEvent, right: FestivalEvent) =>
  Date.parse(left.startsAt) - Date.parse(right.startsAt) || left.title.localeCompare(right.title);

export function filterEvents(events: readonly FestivalEvent[], filters: BrowseFilters): FestivalEvent[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return events.filter((event) =>
    (!query || event.title.toLocaleLowerCase().includes(query)) &&
    (filters.programmeDay === "all" || event.programmeDay === filters.programmeDay) &&
    (filters.venue === "all" || event.venue === filters.venue) &&
    (filters.category === "all" || event.category === filters.category),
  ).toSorted(compareByStartThenTitle);
}

export function getClashingEventIds(events: readonly FestivalEvent[]): Set<string> {
  const clashes = new Set<string>();
  const sorted = [...events].toSorted(compareByStartThenTitle);
  for (let index = 0; index < sorted.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < sorted.length; nextIndex += 1) {
      if (Date.parse(sorted[nextIndex].startsAt) >= Date.parse(sorted[index].endsAt)) break;
      if (Date.parse(sorted[index].startsAt) < Date.parse(sorted[nextIndex].endsAt)) {
        clashes.add(sorted[index].id);
        clashes.add(sorted[nextIndex].id);
      }
    }
  }
  return clashes;
}

export function getCurrentAndNext(events: readonly FestivalEvent[], at: Date): { now: FestivalEvent | null; next: FestivalEvent | null } {
  const atMillis = at.getTime();
  const sorted = [...events].toSorted(compareByStartThenTitle);
  return {
    now: sorted.find((event) => Date.parse(event.startsAt) <= atMillis && atMillis < Date.parse(event.endsAt)) ?? null,
    next: sorted.find((event) => Date.parse(event.startsAt) > atMillis) ?? null,
  };
}

export function getCurrentProgrammeDay(events: readonly FestivalEvent[], at: Date): ProgrammeDay | null {
  return getCurrentAndNext(events, at).now?.programmeDay ?? null;
}

export function getNextProgrammeDay(events: readonly FestivalEvent[], at: Date): ProgrammeDay | null {
  return getCurrentAndNext(events, at).next?.programmeDay ?? null;
}
```

```ts
// src/storage/itineraryStore.ts
export type ItineraryState = { favouriteIds: string[]; notesByEventId: Record<string, string>; removedIds: string[]; persisted: boolean };
export type StoredItinerary = Pick<ItineraryState, "favouriteIds" | "notesByEventId">;
export const ITINERARY_STORAGE_KEY = "we-out-here-2026:itinerary:v1";
export function createItineraryStore(storage: Storage, validIds: ReadonlySet<string>, replacements: ReadonlyMap<string, string>) {
  let memory: StoredItinerary = { favouriteIds: [], notesByEventId: {} };
  let persisted = true;
  return {
    load(): ItineraryState {
      try {
        const parsed: unknown = JSON.parse(storage.getItem(ITINERARY_STORAGE_KEY) ?? "{}");
        const legacyIds = Array.isArray(parsed) ? parsed : [];
        const candidate = parsed && typeof parsed === "object" ? parsed as Partial<StoredItinerary> : {};
        const candidateIds = Array.isArray(candidate.favouriteIds) ? candidate.favouriteIds : legacyIds;
        const candidateNotes = candidate.notesByEventId && typeof candidate.notesByEventId === "object" && !Array.isArray(candidate.notesByEventId) ? candidate.notesByEventId : {};
        memory = {
          favouriteIds: [...new Set(candidateIds.filter((value): value is string => typeof value === "string"))],
          notesByEventId: Object.fromEntries(Object.entries(candidateNotes).filter(([, note]) => typeof note === "string" && note.length <= 140)),
        };
      } catch { memory = { favouriteIds: [], notesByEventId: {} }; persisted = false; }
      const migratedIds = memory.favouriteIds.map((id) => replacements.get(id) ?? id);
      const removedIds = migratedIds.filter((id) => !validIds.has(id));
      memory.favouriteIds = migratedIds.filter((id) => validIds.has(id));
      memory.notesByEventId = Object.fromEntries(Object.entries(memory.notesByEventId).map(([id, note]) => [replacements.get(id) ?? id, note]).filter(([id]) => memory.favouriteIds.includes(id)));
      return { ...memory, removedIds, persisted };
    },
    save(next: StoredItinerary): { persisted: boolean } {
      memory = {
        favouriteIds: [...new Set(next.favouriteIds)].filter((id) => validIds.has(id)),
        notesByEventId: Object.fromEntries(Object.entries(next.notesByEventId).filter(([id, note]) => typeof note === "string" && note.length <= 140 && validIds.has(id) && next.favouriteIds.includes(id))),
      };
      try { storage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(memory)); persisted = true; } catch { persisted = false; }
      return { persisted };
    },
    clear(): { persisted: boolean } {
      memory = { favouriteIds: [], notesByEventId: {} };
      try { storage.removeItem(ITINERARY_STORAGE_KEY); persisted = true; } catch { persisted = false; }
      return { persisted };
    },
  };
}
```

Do not mutate the input arrays. Sort by `startsAt`, then title, to give stable display and export order. Storage must migrate only IDs present in the explicit `scheduleChanges` mapping, remove favourite IDs that are not in the current `schedule`, preserve mapped Event Notes, and return a `removedIds` list for the UI to explain schedule changes. Persist the reconciled payload and pending removal notices; persist dismissal through the same store. If either write fails, retain the newer state for the current visit and report non-persistence without rereading stale storage. `save` rejects notes longer than 140 characters and drops a note whenever its event is no longer saved.

- [ ] **Step 4: Run focused tests and the full suite.**

Run: `npm test -- src/planner/itinerary.test.ts src/storage/itineraryStore.test.ts && npm test`

Expected: tests cover query, Programme Day, venue, and category filters; boundaries where sets only touch; overnight timestamps; corrupt storage; read/write failures; explicit-ID migrations with notes; and unknown saved IDs.

- [ ] **Step 5: Commit the business-logic layer.**

```bash
git add src/planner src/storage
git commit -m "feat: add local itinerary planning logic"
```

### Task 4: Add calendar export as the reliable reminder mechanism

**Files:**
- Create: `src/calendar/ics.ts`, `src/calendar/ics.test.ts`

**Interfaces:**
- Consumes: saved `FestivalEvent` records and their Event Notes from Task 3.
- Produces: `createCalendar(events): string` and `downloadCalendar(events): void` for PlanView.

- [ ] **Step 1: Write the failing ICS serialization tests.**

```ts
import { describe, expect, it } from "vitest";
import { createCalendar } from "./ics";

it("serializes saved events in an iCalendar calendar", () => {
  const ics = createCalendar([event]);
  expect(ics).toContain("BEGIN:VCALENDAR\r\n");
  expect(ics).toContain("UID:thursday:main-stage:kotoa@field-notes.local");
  expect(ics).toContain("DTSTART:20260820T132000");
  expect(ics).toContain("LOCATION:Main Stage");
  expect(ics).toContain("END:VCALENDAR\r\n");
});
```

- [ ] **Step 2: Run the focused test to prove it fails.**

Run: `npm test -- src/calendar/ics.test.ts`

Expected: FAIL because the calendar module does not exist.

- [ ] **Step 3: Implement RFC-compatible local-calendar text and download.**

```ts
export const toIcsLocal = (iso: string) => iso.replace(/[-:]/g, "").replace("+0100", "").slice(0, 15);
export const escapeIcs = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function createCalendar(events: readonly FestivalEvent[], notesByEventId: Readonly<Record<string, string>>): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Field Notes//We Out Here Planner//EN", "CALSCALE:GREGORIAN"];
  for (const event of [...events].sort(compareByStartThenTitle)) {
    lines.push("BEGIN:VEVENT", `UID:${event.id}@field-notes.local`, `DTSTART:${toIcsLocal(event.startsAt)}`, `DTEND:${toIcsLocal(event.endsAt)}`, `SUMMARY:${escapeIcs(event.title)}`, `LOCATION:${escapeIcs(event.venue)}`, `DESCRIPTION:${escapeIcs(notesByEventId[event.id] ?? "")}`, "END:VEVENT");
  }
  return `${lines.join("\r\n")}\r\nEND:VCALENDAR\r\n`;
}
```

The `toIcsLocal` helper preserves the UK local programme wall time embedded in the ISO value and creates a floating calendar event, avoiding a UTC date shift. `escapeIcs` escapes backslash, comma, semicolon, and newline. Fold generated content lines at 75 UTF-8 octets without splitting a multibyte character; continuation lines begin with one space included in their 75-octet budget. `downloadCalendar` creates a `text/calendar;charset=utf-8` Blob and downloads `we-out-here-2026-plan.ics`; it includes each Event Note as the calendar description, adds no `VALARM`, and returns immediately for an empty plan.

- [ ] **Step 4: Run focused tests and type/build validation.**

Run: `npm test -- src/calendar/ics.test.ts && npm run build`

Expected: serialization tests cover escaping, cross-midnight events, stable sorting, Event Notes, no automatic alarm, and empty calendars; production build passes.

- [ ] **Step 5: Commit the reminder/export capability.**

```bash
git add src/calendar
git commit -m "feat: export saved festival plan to calendar"
```

### Task 5: Make the built app installable and truthfully offline-ready

**Files:**
- Modify: `vite.config.ts`, `src/main.tsx`, `index.html`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `src/pwa/useOfflineStatus.ts`, `src/pwa/OfflineStatus.tsx`, `src/pwa/OfflineStatus.test.tsx`

**Interfaces:**
- Consumes: Vite build output and the `vite-plugin-pwa` registration API.
- Produces: installed-app manifest, precached schedule/assets, `OfflineStatus` state (`"ready" | "updating" | "offline-unavailable"`), and a user-triggered update action.

- [ ] **Step 1: Write the failing visible-status tests.**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { OfflineStatus } from "./OfflineStatus";

it("confirms that the planner is available offline after caching", () => {
  render(<OfflineStatus state="ready" onRefresh={() => undefined} />);
  expect(screen.getByText("Saved for offline use")).toBeInTheDocument();
});

it("does not claim offline use is ready before caching succeeds", () => {
  render(<OfflineStatus state="offline-unavailable" onRefresh={() => undefined} />);
  expect(screen.getByText(/Connect once to save this planner offline/i)).toBeInTheDocument();
});

it("leaves the cached planner running when the user allows an update", async () => {
  const user = userEvent.setup();
  const refresh = vi.fn();
  render(<OfflineStatus state="updating" onRefresh={refresh} />);
  await user.click(screen.getByRole("button", { name: "Allow update" }));
  expect(refresh).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run the focused test to prove it fails.**

Run: `npm test -- src/pwa/OfflineStatus.test.tsx`

Expected: FAIL because the PWA status component does not exist.

- [ ] **Step 3: Configure `vite-plugin-pwa` with generated manifest and precache.**

Use original square icon artwork (a simple colour-field/map-pin motif is sufficient) and this configuration shape:

```ts
VitePWA({
  registerType: "prompt",
  includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
  manifest: {
    name: "Field Notes: We Out Here 2026",
    short_name: "Field Notes",
    start_url: "./",
    display: "standalone",
    background_color: "#192522",
    theme_color: "#192522",
    icons: [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  workbox: { globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"] },
})
```

Register the worker with the React virtual module. `useOfflineStatus` starts at `offline-unavailable`, switches to `ready` only after registration success, exposes `updating` during a new worker installation, and calls the registration update callback only after the user chooses `Allow update`. The existing snapshot’s last-checked date remains visible; the update prompt is generic until the new snapshot is loaded. It never reloads the open planner. The prompt explains that allowing an update still requires closing and reopening to see it, and that a waiting update may activate after every controlled app client closes even when the user does not choose the action. No durable accept/reject preference is claimed. Include the schedule in the generated build and confirm it matches the Workbox glob. Add an `<meta name="theme-color" content="#192522">` fallback in `index.html`.

- [ ] **Step 4: Run unit/build checks and manually prove offline fallback.**

Run: `npm test -- src/pwa/OfflineStatus.test.tsx && npm run build && npm run preview`

Expected: unit/build commands pass. In a browser, load the preview once online, verify the service worker is active and the status reads “Saved for offline use”, disable network, reload, then search and change a favourite successfully. Verify a first-ever offline visit instead shows the initial-download explanation.

- [ ] **Step 5: Commit the offline foundation.**

```bash
git add vite.config.ts index.html public/icons src/main.tsx src/pwa
git commit -m "feat: make festival planner available offline"
```

### Task 6: Build accessible event cards and programme browsing

**Files:**
- Create: `src/components/EventCard.tsx`, `src/components/EventCard.test.tsx`, `src/components/EventDetailsDialog.tsx`, `src/components/EventDetailsDialog.test.tsx`, `src/components/Filters.tsx`, `src/components/BrowseView.tsx`, `src/components/BrowseView.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `FestivalEvent`, `EventCategory`, `BrowseFilters`, and `filterEvents`.
- Produces: `EventCard`, `BrowseView`, and `onToggleFavourite(eventId)` handlers for Task 8.

- [ ] **Step 1: Write failing card and browse interaction tests.**

```tsx
it("announces an event type in text and toggles a favourite", async () => {
  const user = userEvent.setup();
  const toggle = vi.fn();
  render(<EventCard event={{ ...event, category: "family" }} isFavourite={false} isClashing={false} onToggleFavourite={toggle} />);
  expect(screen.getByText("Family")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Save Kotoa" }));
  expect(toggle).toHaveBeenCalledWith(event.id);
});

it("filters by text, day, venue, and category without hiding saved controls", async () => {
  const user = userEvent.setup();
  render(<BrowseView events={events} favouriteIds={new Set()} onToggleFavourite={() => undefined} />);
  await user.type(screen.getByLabelText("Search programme"), "Kotoa");
  await user.selectOptions(screen.getByLabelText("Category"), "music");
  expect(screen.getByRole("article", { name: /Kotoa/i })).toBeInTheDocument();
});

it("shows full time, venue, category, and save state in event details", () => {
  render(<EventDetailsDialog event={event} isFavourite={true} isClashing={false} onClose={() => undefined} onToggleFavourite={() => undefined} />);
  expect(screen.getByRole("dialog", { name: "Kotoa details" })).toHaveTextContent("Main Stage");
  expect(screen.getByRole("button", { name: "Remove Kotoa" })).toHaveAttribute("aria-pressed", "true");
});

it("limits an Event Note to 140 characters", async () => {
  const user = userEvent.setup();
  render(<EventDetailsDialog event={event} isFavourite={true} note="" isClashing={false} onClose={() => undefined} onToggleFavourite={() => undefined} onSaveNote={() => undefined} />);
  await user.type(screen.getByLabelText("Note for Kotoa"), "x".repeat(141));
  expect(screen.getByText("140 characters maximum")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused tests to prove they fail.**

Run: `npm test -- src/components/EventCard.test.tsx src/components/BrowseView.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement reusable event, filtering, list, and timetable components.**

```tsx
export type EventCardProps = {
  event: FestivalEvent;
  isFavourite: boolean;
  isClashing: boolean;
  onToggleFavourite: (eventId: string) => void;
};

export function EventCard({ event, isFavourite, isClashing, onToggleFavourite }: EventCardProps) {
  return (
    <article aria-label={event.title}>
      <p><CategoryIcon category={event.category} aria-hidden="true" /> <span>{categoryLabel(event.category)}</span></p>
      <h3>{event.title}</h3>
      <p>{formatTimeRange(event)} · {event.venue}</p>
      {isClashing ? <p role="status">Clashes with another saved event</p> : null}
      <button type="button" aria-pressed={isFavourite} aria-label={`${isFavourite ? "Remove" : "Save"} ${event.title}`} onClick={() => onToggleFavourite(event.id)} />
    </article>
  );
}
```

Add a controlled `EventDetailsDialog` opened by a card’s `View details` button. It renders a labelled `role="dialog"` with title, complete formatted date/time range, venue, visible category icon/text, clash status, save/remove action, and close button; Escape and the close button call `onClose`. For a saved event it also renders a labelled text area, `Note for {title}`, capped at 140 characters; it saves locally through `onSaveNote(eventId, note)` and is unavailable while the event is not saved. Define `categoryLabel(category)` as the exact mapping `music → Music`, `talk → Talk`, `workshop → Workshop`, `family → Family`, and `other → Other`. `CategoryIcon` selects a matching Lucide icon but is always paired with that visible text. `Filters` owns controlled query/Programme Day/venue/category controls and uses labels, not placeholder-only input. `BrowseView` initializes to a chronological list and offers an explicitly labelled `Show timetable` / `Show list` toggle. The timetable is a responsive, horizontally scrollable temporal chart with labelled hourly axes, visible Programme Day/venue headers, and events positioned by start and duration so gaps remain apparent; it must not be the only way to browse. Use semantic buttons and cards throughout.

- [ ] **Step 4: Run focused tests, the full suite, and manually test touch/keyboard use.**

Run: `npm test -- src/components/EventCard.test.tsx src/components/EventDetailsDialog.test.tsx src/components/BrowseView.test.tsx && npm test && npm run build`

Expected: all tests pass. At 320px wide, verify filtering, both view modes, and save/remove controls remain reachable; with keyboard only, verify filter controls and every favourite action have visible focus.

- [ ] **Step 5: Commit programme discovery.**

```bash
git add src/components/EventCard.tsx src/components/EventCard.test.tsx src/components/EventDetailsDialog.tsx src/components/EventDetailsDialog.test.tsx src/components/Filters.tsx src/components/BrowseView.tsx src/components/BrowseView.test.tsx src/styles.css
git commit -m "feat: add programme search and browsing"
```

### Task 7: Build the plan-first dashboard, clashes, and calendar-export action

**Files:**
- Create: `src/components/PlanView.tsx`, `src/components/PlanView.test.tsx`
- Modify: `src/App.tsx`, `src/App.test.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `schedule`, planner functions, favourites store, `createCalendar`, `OfflineStatus`, and `EventCard`.
- Produces: a default My Plan dashboard with a no-favourites discovery state, Current Programme Day timeline, Event Notes, conflict notices, clear reset, and export action.

- [ ] **Step 1: Write failing plan/dashboard tests.**

```tsx
it("shows a discovery state before any events are saved", () => {
  render(<PlanView events={[]} favouriteIds={new Set()} now={new Date("2026-08-20T12:00:00+01:00")} onToggleFavourite={() => undefined} onBrowse={() => undefined} onExport={() => undefined} />);
  expect(screen.getByRole("heading", { name: "Build your plan" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Browse programme" })).toBeInTheDocument();
});

it("shows now, next, and a clash for saved events", () => {
  render(<PlanView events={overlappingSavedEvents} favouriteIds={new Set(["one", "two"])} now={new Date("2026-08-21T19:00:00+01:00")} onToggleFavourite={() => undefined} onBrowse={() => undefined} onExport={() => undefined} />);
  expect(screen.getByRole("heading", { name: "Now" })).toBeInTheDocument();
  expect(screen.getByText("Clashes with another saved event")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run focused tests to prove they fail.**

Run: `npm test -- src/components/PlanView.test.tsx src/App.test.tsx`

Expected: FAIL because PlanView and its application state do not exist.

- [ ] **Step 3: Compose the shared local plan in `App` and implement PlanView.**

```tsx
const validEventIds = new Set(schedule.map((event) => event.id));
const itineraryStore = createItineraryStore(window.localStorage, validEventIds, scheduleChanges);
const initialItinerary = itineraryStore.load();
const [favouriteIds, setFavouriteIds] = useState<Set<string>>(() => new Set(initialItinerary.favouriteIds));
const [notesByEventId, setNotesByEventId] = useState<Record<string, string>>(initialItinerary.notesByEventId);
const toggleFavourite = (id: string) => {
  const next = new Set(favouriteIds);
  next.has(id) ? next.delete(id) : next.add(id);
  const nextNotes = next.has(id) ? notesByEventId : Object.fromEntries(Object.entries(notesByEventId).filter(([eventId]) => eventId !== id));
  itineraryStore.save({ favouriteIds: [...next], notesByEventId: nextNotes });
  setFavouriteIds(next);
  setNotesByEventId(nextNotes);
};
```

The app’s default view is `"plan"`; it changes only through the labelled planner navigation or the empty-state `onBrowse`. Derive `savedEvents` from `schedule`, not a copied storage payload. PlanView groups saved events by Programme Day and sorts each group. It uses `getCurrentAndNext`, `getCurrentProgrammeDay`, `getNextProgrammeDay`, and `getClashingEventIds` for the active event, next event, active-versus-upcoming Programme Day context, grouping, and every rendered card. Before the festival, foreground the next saved event and render the complete itinerary. Include a visible inline warning if storage cannot persist, a durably dismissible schedule-change notice for removed IDs, a visible snapshot last-checked date, a “Download calendar” button that is disabled for an empty plan, and a confirmation before “Clear my plan”. Event Note edits save through the store and do not exist for unsaved events.

Use the approved original visual system: dark green, coral, sun yellow, warm off-white, high contrast, editorial hierarchy, no copied festival assets. Place the required unofficial/non-affiliation statement in the app footer.

- [ ] **Step 4: Run focused, full, and manual user-journey tests.**

Run: `npm test -- src/components/PlanView.test.tsx src/App.test.tsx && npm test && npm run build`

Expected: all tests pass. Manually save events from Browse, add a note, return to My Plan, confirm persistence after reload, induce a clash, export the ICS file and inspect the note in its description, clear the plan and verify its note is removed, then verify the footer disclaimer and local-storage warning in a storage-write-failure simulation.

- [ ] **Step 5: Commit the primary festival-day experience.**

```bash
git add src/App.tsx src/App.test.tsx src/components/PlanView.tsx src/components/PlanView.test.tsx src/styles.css
git commit -m "feat: add shared festival itinerary"
```

### Task 8: Publish through GitHub Pages and document operation/update procedures

**Files:**
- Create: `.github/workflows/deploy-pages.yml`, `README.md`, `src/config/site.ts`, `src/config/site.test.ts`
- Modify: `vite.config.ts`, `docs/content-sources.md`

**Interfaces:**
- Consumes: a passing `npm test`/`npm run build` and the `dist/` Vite artifact.
- Produces: a deployment workflow that publishes the static app and documentation for developers/users.

- [ ] **Step 1: Write an intentionally failing Pages-base build assertion.**

```ts
import { expect, it } from "vitest";
import { PAGES_BASE } from "./site";

it("uses the repository Pages path", () => {
  expect(PAGES_BASE).toBe("/we-out-here-2026/");
});
```

- [ ] **Step 2: Run the focused test to prove the default root-base configuration fails.**

Run: `npm test -- src/config/site.test.ts`

Expected: FAIL because the repository Pages-base constant does not exist yet.

- [ ] **Step 3: Add the repository Pages base, GitHub Actions workflow, and user documentation.**

Create `src/config/site.ts` with `export const PAGES_BASE = "/we-out-here-2026/";`, then import it into `vite.config.ts` and set `base: PAGES_BASE`. Keep this exact value aligned with the repository name. Use a two-job workflow: the build job checks out code, sets up Node 22, runs `npm ci`, `npm test`, and `npm run build`, then uploads `./dist` with `actions/upload-pages-artifact@v4`; the deploy job needs `pages: write` and `id-token: write`, depends on build, uses the `github-pages` environment, and deploys with `actions/deploy-pages@v4`.

```yaml
permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false
```

Document local installation, development, test, build, Pages setup (“Source: GitHub Actions”), the first-online-load requirement, calendar export without alarms, Event Notes, data-update procedure, and the complete original/unofficial branding rule. Update `docs/content-sources.md` with the exact manual snapshot-update sequence (check source, update data and confirmed mapping, change last-checked date, run validation/tests, deploy, verify the prompt, and test both allowed and browser-promoted update paths) required before each schedule deployment.

- [ ] **Step 4: Verify the deployment artifact and Pages behaviour.**

Run: `npm test && npm run build && find dist -maxdepth 2 -type f | sort`

Expected: all tests/build pass; `dist/index.html`, manifest, service-worker assets, and hashed JS/CSS files are present and their references use `/we-out-here-2026/`. Push the workflow, confirm both build and deploy jobs succeed, then open the published URL on a phone and repeat the offline check from Task 5.

- [ ] **Step 5: Commit deployment and operational documentation.**

```bash
git add .github/workflows/deploy-pages.yml README.md vite.config.ts docs/content-sources.md src/config/site.ts src/config/site.test.ts
git commit -m "ci: deploy festival planner to GitHub Pages"
```

## Final Acceptance Checklist

- [ ] Every music and wider-programme event visible in the official set-times source is represented in valid local data with correct Programme Day, stage/venue, Calendar Timestamps, and conservative category.
- [ ] Search and day/venue/category filters work in the accessible list; the timetable is available as a secondary view.
- [ ] One browser-local shared plan persists after reload; no account, remote persistence, telemetry, or runtime content fetch exists.
- [ ] The default home screen shows a discovery state when empty, then the current or next Programme Day, chronological saved events, Event Notes, and unambiguous clash notices; before the festival it foregrounds the next saved event.
- [ ] The visual system is original, accessible, festival-adjacent in atmosphere, and visibly unofficial/non-affiliated.
- [ ] Calendar download produces a usable `.ics` file for the selected itinerary, includes Event Notes, and adds no automatic alarm.
- [ ] The snapshot displays a last-checked date. After an initial online visit, the deployed app works offline, including the schedule, itinerary, and Event Note changes; a connected update never reloads an open planner, and guidance explains both explicit allowance and activation after all clients close.
- [ ] `npm test` and `npm run build` pass, and the GitHub Pages workflow has successfully deployed the project-path build.
