# Live Phone Day Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the phone Day schedule into a live, time-led festival companion with Now/Next, Earlier, and Saved only, while preserving Browse for discovery.

**Architecture:** Introduce a pure planner helper that derives a selected day’s grouped schedule, past/current/upcoming classification, and Now/Next summaries from event timestamps and a supplied clock. `BrowseView` receives the app’s existing clock, uses the helper only in its phone schedule branch, and owns the local Saved-only and Earlier-expansion controls. Existing details, favourites, notes, storage, desktop timetable, and update notice remain separate.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, CSS.

## Global Constraints

- Browse remains the discovery surface with its existing search, day/venue/category filters, richer cards, and direct save/remove controls.
- Phone Day schedule is one selected day, compact/time-first, with Saved only defaulting off; it has no horizontal timeline or extra row save controls.
- Before the festival, do not show Now/Next or earlier/current states. During the festival, use Europe/London time for current/next/finished classification.
- Finished events are collapsed under an accessible Earlier control; active and future events remain in chronological, start-time groups.
- Rows retain time, title, venue, category, saved/clash state, accessible descriptions, and details-only activation with 44px-or-larger targets.
- Larger screens keep the visual timetable. Preserve Programme Day defaults, global-search policy, local-only storage/privacy, PWA lifecycle/update notice, calendar export, external links, and no-runtime-fetch policy.
- No dependencies, analytics, embeds, schedule-data changes, or persisted Saved-only preference.

---

### Task 1: Derive live Day schedule state in a pure planner helper

**Files:**
- Create: `src/planner/daySchedule.ts`
- Create: `src/planner/daySchedule.test.ts`
- Modify: `src/planner/time.ts:1-2` only if a shared timestamp conversion name is needed

**Interfaces:**
- Consumes: `FestivalEvent`, `ProgrammeDay`, `compareByStartThenTitle`, and supplied `Date now`.
- Produces:

  ```ts
  export type DayScheduleGroup = {
    startsAt: string;
    events: FestivalEvent[];
  };
  export type DayScheduleModel = {
    beforeFestival: boolean;
    currentEvents: FestivalEvent[];
    nextEvent?: FestivalEvent;
    earlierGroups: DayScheduleGroup[];
    visibleGroups: DayScheduleGroup[];
  };
  export function getDayScheduleModel(
    events: readonly FestivalEvent[],
    programmeDay: ProgrammeDay,
    now: Date,
  ): DayScheduleModel;
  ```

- [ ] **Step 1: Write failing model tests**

  In `src/planner/daySchedule.test.ts`, use Thursday fixtures with overlapping current events, an event in a gap, and repeated start times. Assert:

  ```ts
  expect(getDayScheduleModel(events, "thursday", new Date("2026-08-19T12:00:00+01:00"))).toMatchObject({
    beforeFestival: true,
    currentEvents: [],
    nextEvent: undefined,
    earlierGroups: [],
  });
  ```

  Add independent cases for an event active at `2026-08-20T13:30:00+01:00`, the next event in a gap, multiple simultaneous events, events ending exactly at `now` becoming earlier, after the selected day’s final event, exclusion of other Programme Days, and start-time grouping sorted chronologically.

- [ ] **Step 2: Run the model test to prove RED**

  Run: `npm test -- src/planner/daySchedule.test.ts`

  Expected: FAIL because `daySchedule.ts` does not exist.

- [ ] **Step 3: Implement the minimal deterministic model**

  Filter to `programmeDay`, sort once via `compareByStartThenTitle`, and group equal `startsAt` strings. Use `Date.parse(event.startsAt)` / `Date.parse(event.endsAt)` against `now.getTime()`:

  ```ts
  const isBeforeFestival = now.getTime() < Date.parse("2026-08-20T00:00:00+01:00");
  const currentEvents = dayEvents.filter((event) =>
    Date.parse(event.startsAt) <= now.getTime() && now.getTime() < Date.parse(event.endsAt),
  );
  const nextEvent = dayEvents.find((event) => Date.parse(event.startsAt) > now.getTime());
  const earlierEvents = isBeforeFestival ? [] : dayEvents.filter((event) => Date.parse(event.endsAt) <= now.getTime());
  const visibleEvents = isBeforeFestival ? dayEvents : dayEvents.filter((event) => Date.parse(event.endsAt) > now.getTime());
  ```

  Return no current/next state while `beforeFestival` is true. Group `earlierEvents` and `visibleEvents` using one local `groupByStartTime` helper; do not read browser state or persist anything.

- [ ] **Step 4: Run focused model tests to prove GREEN**

  Run: `npm test -- src/planner/daySchedule.test.ts`

  Expected: PASS for all time-boundary and grouping cases.

- [ ] **Step 5: Commit Task 1**

  ```sh
  git add src/planner/daySchedule.ts src/planner/daySchedule.test.ts src/planner/time.ts
  git commit -m "feat: derive live day schedule state"
  ```

### Task 2: Render live phone Day schedule and document its purpose

**Files:**
- Modify: `src/App.tsx:1-17,220-250`
- Modify: `src/App.test.tsx`
- Modify: `src/components/BrowseView.tsx:1-230,434-570`
- Modify: `src/components/BrowseView.test.tsx`
- Modify: `src/styles.css:1027-1176`
- Modify: `src/styles.test.ts`
- Modify: `README.md:13-18`

**Interfaces:**
- Consumes: `getDayScheduleModel(events, programmeDay, now)`, `DayScheduleGroup`, existing `usePlannerClock()`, `PhoneDaySchedule` row details callback, favourites, and clashes.
- Produces: `BrowseViewProps` gains `now: Date`; `PhoneDaySchedule` gains `now` and renders Saved only / Now / Next / Earlier controls and grouped rows.

- [ ] **Step 1: Write failing Day-schedule component and App-clock tests**

  Add a test that passes `now={new Date("2026-08-20T13:30:00+01:00")}` into a phone `BrowseView`, opens **Show schedule**, and expects:

  ```tsx
  expect(screen.getByRole("heading", {name: "Now / next"})).toBeVisible();
  expect(screen.getByText("On now")).toBeVisible();
  expect(screen.getByText("Next up")).toBeVisible();
  expect(screen.getByRole("button", {name: "Saved only"})).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("button", {name: "Earlier"})).toHaveAttribute("aria-expanded", "false");
  ```

  Confirm a before-festival clock shows neither Now/Next nor Earlier, but still shows chronological grouped rows. Toggle Saved only and assert unsaved rows disappear without changing the Browse search/venue/category controls. Expand Earlier and assert finished events appear. Add an App test proving its `now` value is passed to Browse only; no new clock or storage is created there.

- [ ] **Step 2: Run focused tests to prove RED**

  Run: `npm test -- src/components/BrowseView.test.tsx src/App.test.tsx`

  Expected: FAIL because `BrowseView` accepts no clock and the current schedule has no Now/Next, Earlier, Saved-only, or time groups.

- [ ] **Step 3: Integrate the model and compact live controls**

  Pass App’s existing `now` to `BrowseView`. Add `now: Date` to `BrowseViewProps`; do not create another interval. In `PhoneDaySchedule`, maintain only:

  ```ts
  const [savedOnly, setSavedOnly] = useState(false);
  const [earlierExpanded, setEarlierExpanded] = useState(false);
  ```

  Apply Saved only before calling `getDayScheduleModel`, so summaries and rows remain consistent. Render:

  - a `Now / next` section only when `!model.beforeFestival` and at least one current or next event exists;
  - one `On now` summary for `currentEvents`, and one `Next up` summary for `nextEvent` when present;
  - `visibleGroups`, each with an accessible start-time heading and compact existing detail rows;
  - an **Earlier** button only when `earlierGroups.length > 0`, with `aria-expanded`, followed by earlier groups only when expanded;
  - a clear saved-only empty message when the chosen view has no rows.

  Preserve row name, description, clash cue, detail focus restoration, and no direct row save action. CSS must make summaries and groups visually distinct without reverting to Browse cards; retain 44px buttons and avoid horizontal overflow. Update `styles.test.ts` to assert the essential schedule-control and row target styles.

- [ ] **Step 4: Update the README**

  Replace the Browse guidance sentence with copy that distinguishes discovery from the live schedule:

  ```md
  Browse the programme with search and day, venue, and category filters, then save events to **My plan**. On a phone, **Day schedule** is a compact, selected-day view for what is on now and next during the festival, with an optional **Saved only** view; the visual time-and-venue timetable is available on larger screens.
  ```

  Leave Event Notes, offline, and update-notice guidance intact.

- [ ] **Step 5: Run focused, full, and build verification**

  Run:

  ```sh
  npm test -- src/planner/daySchedule.test.ts src/components/BrowseView.test.tsx src/App.test.tsx src/styles.test.ts
  npm test
  npm run build
  git diff --check
  ```

  Expected: deterministic live-state tests, compact phone interaction tests, existing desktop tests, and full build all pass.

- [ ] **Step 6: Browser-check before-festival, live phone, and desktop states**

  Use a production preview and the in-app browser. At 390×844 and 956×440, verify the before-festival schedule begins at the first event without Now/Next; then use the existing testable component harness or controlled app clock to verify Now/Next, Earlier expansion, Saved only, detail save/remove, no overflow, and no console errors. At 1280×900, verify the desktop timetable and list switch still work. Confirm `Now / next` language is not visible before the festival.

- [ ] **Step 7: Commit Task 2**

  ```sh
  git add src/App.tsx src/App.test.tsx src/components/BrowseView.tsx src/components/BrowseView.test.tsx src/styles.css src/styles.test.ts README.md
  git commit -m "feat: add live phone day schedule"
  ```

## Plan self-review

- Spec coverage: Task 1 defines deterministic, London-offset-aware time classification and grouping; Task 2 makes it a compact phone experience with Now/Next, Earlier, Saved only, browser verification, and accurate documentation while preserving Browse and desktop timetable.
- Placeholder scan: no unresolved markers or deferred implementation instructions remain.
- Type consistency: `DayScheduleGroup`, `DayScheduleModel`, `getDayScheduleModel`, `BrowseViewProps.now`, and `PhoneDaySchedule` are defined in Task 1 or Task 2 with matching names and signatures.
