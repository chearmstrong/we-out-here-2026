# Operational Planner UX Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Field Notes safer and faster to use in festival conditions by surfacing offline readiness, preserving Browse context, improving the phone Day schedule, reducing Browse filter friction, and adding local-action feedback/recovery.

**Architecture:** Keep all data local and the current React/Vite composition. Introduce planner-owned Browse state so switching view does not reset Browse, a small schedule model that accepts a concrete Programme Day or `all`, and small focused UI components for readiness, progressive filtering, and action feedback. Existing itinerary storage remains the authority for saved events and notes; feedback is driven only by its reported persistence result.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, existing browser/PWA configuration, CSS custom properties and responsive media queries.

## Global Constraints

- Preserve the local-only itinerary, browser-storage behaviour, PWA update lifecycle, static Schedule Snapshot, and zero runtime programme fetches.
- Add no dependencies, accounts, analytics, sync, official assets, or copied WOH branding.
- Retain the existing Field Notes colour, type, card, and focus-visible language; this is an operational refinement, not a rebrand.
- Preserve the separate iPhone/iPad Home Screen storage warning and do not claim offline readiness before the worker reports it.
- All new buttons must be keyboard-operable, have visible focus, have an accessible name, and meet a 44 by 44 CSS-pixel target on phone layouts.
- Phone layouts use the existing `PHONE_LAYOUT_QUERY`; they must never mount the horizontal timetable chart.
- Do not alter raw event snapshot venue values. Canonicalisation is planner-facing and uses explicit mappings only.
- Preserve unrelated working-tree changes (`package-lock.json` and `docs/research/`) and do not stage them.

---

## Stage 1 — festival-critical flow

### Task 1: Promote offline readiness into the planner shell

**Files:**

- Modify: `src/pwa/OfflineStatus.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/pwa/OfflineStatus.test.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.test.ts`

**Interfaces:**

- Create and export `OfflineReadiness({ state }: { state: OfflineStatusState })` from `src/pwa/OfflineStatus.tsx`.
- `OfflineReadiness` renders only the concise status. `OfflineStatus` retains the detailed Home Screen guidance and snapshot date.
- `App` renders `OfflineReadiness` immediately after `Planner views` and after the existing `UpdateNotice` when an update is waiting.

- [ ] **Step 1: Write the failing readiness-placement tests**

  Add to `src/App.test.tsx`:

  ```tsx
  it.each([
    ["offline-unavailable", "Connect once to save this planner offline."],
    ["ready", "Saved for offline use"],
  ] as const)("places %s readiness directly beneath planner navigation", (state, text) => {
    render(<App offlineState={state} onRefresh={() => undefined} />);

    const navigation = screen.getByRole("navigation", { name: "Planner views" });
    expect(navigation.nextElementSibling).toHaveTextContent(text);
  });
  ```

  Add a separate updating-state test asserting the update notice remains first and readiness is immediately after it. In `OfflineStatus.test.tsx`, assert `OfflineStatus` no longer duplicates the concise status text.

- [ ] **Step 2: Run the focused tests and verify RED**

  Run:

  ```sh
  npm test -- src/App.test.tsx src/pwa/OfflineStatus.test.tsx
  ```

  Expected: FAIL because `OfflineReadiness` is absent and status remains at the bottom of `OfflineStatus`.

- [ ] **Step 3: Implement the split status surfaces**

  In `OfflineStatus.tsx`, add:

  ```tsx
  export function OfflineReadiness({ state }: { state: OfflineStatusState }) {
    if (state === "ready") {
      return <p className="offline-readiness" role="status">Saved for offline use</p>;
    }
    if (state === "offline-unavailable") {
      return <p className="offline-readiness offline-readiness--pending" role="status">Connect once to save this planner offline.</p>;
    }
    return null;
  }
  ```

  Remove only the concise state text from the lower `OfflineStatus`; keep Home Screen guidance, `Home Screen help`, and the snapshot date. In `App.tsx`, render `OfflineReadiness` directly after the conditionally rendered `UpdateNotice`. Add CSS for an in-flow, high-contrast compact panel with the same shell width and safe-area treatment as planner content; do not make it a toast or a dismissible alert.

- [ ] **Step 4: Add CSS structure checks**

  Add to `src/styles.test.ts` assertions that `.offline-readiness` has an explicit background, border/contrast treatment, `min-height: 44px`, and is not positioned after `.app-footer`.

- [ ] **Step 5: Run focused verification**

  Run:

  ```sh
  npm test -- src/App.test.tsx src/pwa/OfflineStatus.test.tsx src/styles.test.ts
  ```

  Expected: PASS.

- [ ] **Step 6: Browser-check both status states**

  Use the existing local dev script and render test fixtures or the normal app state. At 390×844 and 1440×900 verify the pending status is visible before footer content; verify an update fixture keeps **Use update next time** above the readiness surface and focus order remains navigation → update action → readiness/help.

- [ ] **Step 7: Commit the isolated task**

  ```sh
  git add src/App.tsx src/App.test.tsx src/pwa/OfflineStatus.tsx src/pwa/OfflineStatus.test.tsx src/styles.css src/styles.test.ts
  git commit -m "feat: surface planner offline readiness"
  ```

### Task 2: Preserve Browse context in the planner shell

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/components/BrowseView.tsx`
- Modify: `src/components/BrowseView.test.tsx`
- Modify: `src/planner/itinerary.ts`

**Interfaces:**

- Export `BrowseMode = "list" | "timetable"` and `createInitialBrowseFilters(now: Date): BrowseFilters` from `src/components/BrowseView.tsx`, or move both into `src/planner/itinerary.ts` if needed to avoid UI-only state construction in `App`.
- Add props to `BrowseView`:

  ```ts
  filters: BrowseFilters;
  mode: BrowseMode;
  onFiltersChange: (filters: BrowseFilters) => void;
  onModeChange: (mode: BrowseMode) => void;
  ```

- `App` owns these values through `useState`, initialized once from the planner clock/current date. They remain in memory only for the open page lifecycle.

- [ ] **Step 1: Write the failing navigation-context regression**

  Add to `src/App.test.tsx`:

  ```tsx
  it("restores Browse query, filters, and mode after visiting My plan", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Browse", exact: true }));
    await user.type(screen.getByRole("searchbox", { name: "Search programme" }), "Kotoa");
    await user.selectOptions(screen.getByRole("combobox", { name: "Venue" }), "Main Stage");
    await user.click(screen.getByRole("button", { name: "Show timetable" }));
    await user.click(screen.getByRole("button", { name: "My plan" }));
    await user.click(screen.getByRole("button", { name: "Browse", exact: true }));

    expect(screen.getByRole("searchbox", { name: "Search programme" })).toHaveValue("Kotoa");
    expect(screen.getByRole("combobox", { name: "Venue" })).toHaveValue("Main Stage");
    expect(screen.getByRole("button", { name: "Show list" })).toBeVisible();
  });
  ```

  Add a mobile test that preserves the selected Day schedule day and Saved only state only for the mounted schedule session; Saved only may reset on leaving Schedule because it is a view-local transient choice.

- [ ] **Step 2: Run the focused tests and verify RED**

  Run:

  ```sh
  npm test -- src/App.test.tsx src/components/BrowseView.test.tsx
  ```

  Expected: FAIL because `BrowseView` owns and loses the query/filter/mode state after it unmounts.

- [ ] **Step 3: Hoist the persistent state without persisting it to storage**

  Create and retain one initial value in `App`:

  ```tsx
  const [initialBrowseFilters] = useState<BrowseFilters>(() =>
    createInitialBrowseFilters(new Date()),
  );
  const [browseFilters, setBrowseFilters] = useState(initialBrowseFilters);
  const [browseMode, setBrowseMode] = useState<BrowseMode>("list");
  ```

  Pass values and setters into `BrowseView`, including an `onClearFilters={() => setBrowseFilters(initialBrowseFilters)}` callback. Replace its local `filters` and `mode` states with props. Do not write filters to `localStorage`, URL parameters, or the itinerary store. Retain the existing focus fallback when responsive rendering swaps the visual timetable and phone schedule.

- [ ] **Step 4: Run focused verification**

  Run:

  ```sh
  npm test -- src/App.test.tsx src/components/BrowseView.test.tsx
  ```

  Expected: PASS, including the existing responsive remount/focus tests.

- [ ] **Step 5: Browser-check interrupted planning**

  At 1440×900: set a search, venue, and timetable, visit My plan, then return to Browse and verify every value/view is restored. At 390×844: select a day in Day schedule, visit My plan, return, and verify the Day schedule remains selected.

- [ ] **Step 6: Commit the isolated task**

  ```sh
  git add src/App.tsx src/App.test.tsx src/components/BrowseView.tsx src/components/BrowseView.test.tsx src/planner/itinerary.ts
  git commit -m "fix: preserve browse context between planner views"
  ```

### Task 3: Make phone Day schedule honest for All days and quick saves

**Files:**

- Modify: `src/planner/daySchedule.ts`
- Modify: `src/planner/daySchedule.test.ts`
- Modify: `src/components/BrowseView.tsx`
- Modify: `src/components/BrowseView.test.tsx`
- Modify: `src/styles.css`
- Modify: `src/styles.test.ts`

**Interfaces:**

- Change `getDayScheduleModel` to accept `programmeDay: ProgrammeDay | "all"`.
- Add `DayScheduleProgrammeGroup`:

  ```ts
  export type DayScheduleProgrammeGroup = {
    programmeDay: ProgrammeDay;
    groups: readonly DayScheduleGroup[];
  };
  ```

- Return `programmeGroups: readonly DayScheduleProgrammeGroup[]` in official day order. A concrete day returns exactly one group; `all` returns only days containing matching events.
- Extend `PhoneDayScheduleRowsProps` with `onToggleFavourite(eventId: string): void`; schedule row body remains a button and the sibling save button is not nested inside it.

- [ ] **Step 1: Write failing All-days model tests**

  Add to `src/planner/daySchedule.test.ts`:

  ```ts
  it("keeps an explicit All days schedule grouped in official Programme Day order", () => {
    const model = getDayScheduleModel(eventsAcrossThursdayAndFriday, "all", beforeFestival);

    expect(model.programmeGroups.map((group) => group.programmeDay)).toEqual([
      "thursday", "friday",
    ]);
    expect(model.programmeGroups[0].groups[0].events.map((event) => event.title)).toEqual(["Thursday set"]);
    expect(model.programmeGroups[1].groups[0].events.map((event) => event.title)).toEqual(["Friday set"]);
  });
  ```

  Add an existing-day regression asserting a selected Sunday still returns only Sunday.

- [ ] **Step 2: Write failing phone interaction tests**

  In `BrowseView.test.tsx`, add a phone-layout test that:

  ```tsx
  await user.selectOptions(screen.getByRole("combobox", { name: "Programme Day" }), "all");
  expect(screen.getByRole("heading", { name: "Thursday" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Friday" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Save Kotoa from day schedule" }));
  expect(toggle).toHaveBeenCalledWith("thursday:main-stage:kotoa");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  ```

  Add a separate test clicking the row’s details button/body opens the dialog, and a keyboard test tabs to the inline Save button with a visible accessible name.

- [ ] **Step 3: Run the focused tests and verify RED**

  Run:

  ```sh
  npm test -- src/planner/daySchedule.test.ts src/components/BrowseView.test.tsx
  ```

  Expected: FAIL because `all` is coerced to Thursday and rows expose no direct Save control.

- [ ] **Step 4: Implement the grouped model and remove coercion**

  Remove both branches that set `programmeDay: "thursday"` when Schedule opens or a desktop timetable rotates to phone. Update `PhoneProgrammeDaySelector` to include an `All days` option. Build `programmeGroups` using `PROGRAMME_DAYS.filter(...)` and reuse the current time grouping for each day.

  In `PhoneDayScheduleRows`, render a non-interactive wrapper per event with two sibling buttons:

  ```tsx
  <article className="phone-day-schedule__event">
    <button className="phone-day-schedule__row" type="button" onClick={...}>...</button>
    <button
      className="phone-day-schedule__save"
      type="button"
      aria-pressed={isFavourite}
      aria-label={`${isFavourite ? "Remove" : "Save"} ${event.title} from day schedule`}
      onClick={() => onToggleFavourite(event.id)}
    >
      {isFavourite ? "Saved" : "Save"}
    </button>
  </article>
  ```

  The now/next summary appears only for a concrete current Programme Day; All days uses day headings and chronological groups without pretending one day is current. Pass the existing `onToggleFavourite` from `BrowseView` into `PhoneDaySchedule` and rows.

- [ ] **Step 5: Implement responsive structure and target sizing**

  Update `.phone-day-schedule__event` to keep the body and save control aligned without horizontal overflow. Ensure `.phone-day-schedule__save` is at least `2.75rem` in both dimensions, has the same focus-visible contrast language, and wraps beneath the row on the narrowest layout rather than compressing title/venue text. Retain visible saved/clash state on the row.

- [ ] **Step 6: Run focused verification**

  Run:

  ```sh
  npm test -- src/planner/daySchedule.test.ts src/components/BrowseView.test.tsx src/styles.test.ts
  ```

  Expected: PASS.

- [ ] **Step 7: Browser-check the complete phone schedule journey**

  At 390×844, open Browse → Show schedule → All days. Verify Thursday-to-Sunday headings, compact chronological rows, no horizontal overflow, inline Save changes state without opening details, and row body opens details. Confirm Escape returns focus to the row body and tab focus reaches the Save control. At 1440×900, verify timetable remains the desktop mode.

- [ ] **Step 8: Commit the isolated task**

  ```sh
  git add src/planner/daySchedule.ts src/planner/daySchedule.test.ts src/components/BrowseView.tsx src/components/BrowseView.test.tsx src/styles.css src/styles.test.ts
  git commit -m "feat: improve phone day schedule actions"
  ```

### Task 4: Compact the phone operational header

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.test.ts`

**Interfaces:**

- Add `data-planner-view={view}` and `data-plan-empty={savedEvents.length === 0}` to `.app-shell`.
- The full hero remains for the empty plan. On phone, Browse and a non-empty plan receive `.app-header--compact` via these data attributes/CSS only; desktop remains unchanged.

- [ ] **Step 1: Write failing structure and style tests**

  In `App.test.tsx`, render an empty plan and assert the intro and playlist are present. Seed one favourite, render, and assert the same header has the compact data state while its heading and GitHub source link remain accessible. In `styles.test.ts`, assert the phone media block contains compact header rules that hide `.app-header__intro` and `.header-playlist-link` only under operational data states, not globally.

- [ ] **Step 2: Run focused tests and verify RED**

  Run:

  ```sh
  npm test -- src/App.test.tsx src/styles.test.ts
  ```

  Expected: FAIL because the app shell has no operational-state data attributes or compact-header CSS.

- [ ] **Step 3: Implement the contextual compact header**

  Add the data attributes in `App.tsx`. In the existing phone media query, reduce header block height/padding, keep the wordmark/kicker/GitHub source control visible, and hide the long intro/playlist only when `data-planner-view="browse"` or `data-plan-empty="false"`. Do not hide the playlist from the footer/resources or remove any external link.

- [ ] **Step 4: Add an overflow/first-content CSS regression**

  In `styles.test.ts`, assert compact phone Browse retains a bounded header and that `.programme-filters` begins after it without using negative offsets. Use structural selectors rather than pixel snapshots.

- [ ] **Step 5: Run focused verification**

  Run:

  ```sh
  npm test -- src/App.test.tsx src/styles.test.ts
  ```

  Expected: PASS.

- [ ] **Step 6: Browser-check first viewport composition**

  At 390×844 verify:

  - empty My plan retains the welcoming full hero and Browse programme CTA;
  - Browse shows the compact identity, search/day controls, and the start of result context without horizontal overflow;
  - a non-empty My plan reaches its next/current content quickly;
  - 1440×900 retains the existing full desktop header.

- [ ] **Step 7: Commit the isolated task**

  ```sh
  git add src/App.tsx src/App.test.tsx src/styles.css src/styles.test.ts
  git commit -m "feat: compact phone planner header"
  ```

## Stage 2 — planning efficiency and confidence

### Task 5: Add progressive filters and canonical venue choices

**Files:**

- Create: `src/planner/venues.ts`
- Create: `src/planner/venues.test.ts`
- Modify: `src/components/Filters.tsx`
- Modify: `src/components/BrowseView.tsx`
- Modify: `src/components/BrowseView.test.tsx`
- Modify: `src/planner/itinerary.ts`
- Modify: `src/planner/itinerary.test.ts`
- Modify: `src/styles.css`
- Modify: `src/styles.test.ts`

**Interfaces:**

- Export from `src/planner/venues.ts`:

  ```ts
  export type VenueOption = { label: string; value: string };
  export function canonicalVenueValue(venue: string): string;
  export function getVenueOptions(events: readonly FestivalEvent[]): readonly VenueOption[];
  ```

- Start `CANONICAL_VENUE_VALUES` with the explicit mapping `"Love-Serve Bar" → "Love Serve Bar"`; unlisted values map to themselves.
- Update `BrowseFilters.venue` to store the canonical display value. `filterBrowseEvents` compares `canonicalVenueValue(event.venue)` rather than raw venue text.
- Update `FiltersProps` to accept `venues: readonly VenueOption[]` and render `aria-expanded`/`aria-controls` on a **More filters** button.
- Add `onClear: () => void` to `FiltersProps`; `BrowseView` supplies a callback that resets query to `""`, venue/category to `"all"`, and Programme Day to its existing planner-owned initial value.

- [ ] **Step 1: Write failing canonical-venue tests**

  Add `src/planner/venues.test.ts`:

  ```ts
  it("presents source spelling variants as one canonical venue choice", () => {
    expect(getVenueOptions(eventsWithLoveServeVariants)).toEqual([
      { label: "Love Serve Bar", value: "Love Serve Bar" },
    ]);
  });
  ```

  Add `filterBrowseEvents` coverage proving `venue: "Love Serve Bar"` returns events whose raw venue is either spelling.

- [ ] **Step 2: Write failing progressive-filter interaction tests**

  Add to `BrowseView.test.tsx`:

  ```tsx
  expect(screen.getByRole("button", { name: "More filters" })).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("combobox", { name: "Venue" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "More filters" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Venue" }), "Love Serve Bar");
  expect(screen.getByText("Venue: Love Serve Bar")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Clear all filters" }));
  expect(screen.queryByText("Venue: Love Serve Bar")).not.toBeInTheDocument();
  ```

  Include a Family Programme test proving its quick filter remains visible and continues to combine with Day/search controls.

- [ ] **Step 3: Run the focused tests and verify RED**

  Run:

  ```sh
  npm test -- src/planner/venues.test.ts src/planner/itinerary.test.ts src/components/BrowseView.test.tsx
  ```

  Expected: FAIL because raw venue values are deduplicated only by exact spelling and all filters are always visible.

- [ ] **Step 4: Implement canonical filtering and disclosure**

  Create `venues.ts` with only explicit mappings and stable alphabetical options. Modify `filterBrowseEvents` to canonicalise both candidate and selected value. In `Filters.tsx`, keep Search, Family Programme, and Programme Day in the always-visible group. Add local `secondaryOpen` state for the disclosure; its state can reset on a full page reload. Render Venue/Category in the controlled disclosure and provide active secondary-filter summary chips plus a `Clear all filters` button that calls the parent-owned reset callback. That callback restores `query: ""`, `venue: "all"`, `category: "all"`, and the original App-initialised Programme Day.

  Keep the Family quick-filter an explicit category state; `Clear all filters` clears it. Do not add a custom combobox or third-party search component.

- [ ] **Step 5: Implement responsive filter layout**

  Preserve the dark filter surface. On phone, the primary group must fit before result context; secondary controls expand below it. On desktop, the disclosure may start collapsed to keep the first event list visible. Ensure summary chips and Clear all wrap without horizontal overflow.

- [ ] **Step 6: Run focused verification**

  Run:

  ```sh
  npm test -- src/planner/venues.test.ts src/planner/itinerary.test.ts src/components/BrowseView.test.tsx src/styles.test.ts
  ```

  Expected: PASS.

- [ ] **Step 7: Browser-check discovery paths**

  At 390×844 and 1440×900 verify default Browse displays results quickly, More filters opens and closes by mouse/touch/keyboard, canonical Love Serve Bar finds both source spellings, active summaries are visible, Clear all restores default results, and Family Programme still works with search/day filtering.

- [ ] **Step 8: Commit the isolated task**

  ```sh
  git add src/planner/venues.ts src/planner/venues.test.ts src/planner/itinerary.ts src/planner/itinerary.test.ts src/components/Filters.tsx src/components/BrowseView.tsx src/components/BrowseView.test.tsx src/styles.css src/styles.test.ts
  git commit -m "feat: streamline programme filters"
  ```

### Task 6: Add persistence-aware feedback, undo, and export acknowledgement

**Files:**

- Create: `src/components/PlannerFeedback.tsx`
- Create: `src/components/PlannerFeedback.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/components/EventDetailsDialog.tsx`
- Modify: `src/components/EventDetailsDialog.test.tsx`
- Modify: `src/calendar/ics.ts`
- Modify: `src/calendar/ics.test.ts`
- Modify: `src/styles.css`
- Modify: `src/styles.test.ts`

**Interfaces:**

- Export:

  ```ts
  export type PlannerFeedbackMessage =
    | { kind: "note-saved"; text: "Note saved locally." }
    | { kind: "undo-remove"; eventId: string; text: string }
    | { kind: "calendar-exported"; text: "Calendar download started: we-out-here-2026-plan.ics" };
  ```

- `PlannerFeedback` renders a single polite `role="status"` message and optional Undo button. It takes `onUndoRemove?: () => void`.
- Change `downloadCalendar(...)` to return `boolean`: `false` for no events and `true` after clicking the download link.
- Change `EventDetailsDialogProps.onSaveNote` to `(eventId: string, note: string) => { persisted: boolean } | undefined` and add `onNotePersisted?: (persisted: boolean) => void`; `App.saveNote` returns the itinerary-store result.

- [ ] **Step 1: Write failing calendar-result and feedback tests**

  Add to `ics.test.ts`:

  ```ts
  expect(downloadCalendar([])).toBe(false);
  expect(downloadCalendar([event])).toBe(true);
  ```

  In `PlannerFeedback.test.tsx`, assert each message has `role="status"`, Undo invokes its callback, and no feedback surface renders when `message` is `null`.

- [ ] **Step 2: Write failing App recovery tests**

  Add to `App.test.tsx`:

  ```tsx
  await user.click(screen.getByRole("button", { name: "Remove Kotoa" }));
  expect(screen.getByRole("status")).toHaveTextContent("Kotoa removed from your plan");
  await user.click(screen.getByRole("button", { name: "Undo remove Kotoa" }));
  expect(screen.getByRole("button", { name: "Remove Kotoa" })).toBeInTheDocument();
  ```

  Seed a note, remove and Undo, then assert the note is retained. Add one test where the store reports `persisted: false`: it must not announce “Note saved locally”; the existing storage warning remains the truthful feedback. Add a calendar-export test stubbing `downloadCalendar` to `true` and asserting the exact filename acknowledgement.

- [ ] **Step 3: Run focused tests and verify RED**

  Run:

  ```sh
  npm test -- src/calendar/ics.test.ts src/components/PlannerFeedback.test.tsx src/components/EventDetailsDialog.test.tsx src/App.test.tsx
  ```

  Expected: FAIL because download has no return value, no feedback component exists, and removal is irreversible.

- [ ] **Step 4: Implement a single feedback surface and bounded undo state**

  In `App`, replace void `saveNote` with a function that returns the store result. Set `note-saved` feedback only when `result.persisted` is true. Before an event is removed, capture:

  ```ts
  { eventId, note: notesByEventId[eventId] }
  ```

  then remove it as today and set the `undo-remove` message. Undo restores the ID and captured note through `saveItinerary`; it clears the pending undo message. Do not add timers that silently remove the undo opportunity during an active festival interaction; replace it only when the next planner mutation occurs or the user dismisses it.

  Render `PlannerFeedback` immediately under planner readiness. Keep only one status/live region at a time to avoid competing announcements.

- [ ] **Step 5: Implement notes and calendar acknowledgement**

  In `EventDetailsDialog`, invoke `onNotePersisted` after `onSaveNote` returns. Render no success copy in the dialog itself; the global feedback surface owns announcements. Make `downloadCalendar` return the specified boolean. In `App`, show the calendar-exported message only when it returns true. It must say only that the download started, not that it was imported.

- [ ] **Step 6: Implement recovery styling and focus**

  Give feedback a high-contrast but secondary visual treatment. The Undo button must have a 44px target and focus-visible outline. After Undo, restore focus to the Undo button if still mounted; do not steal focus when a note auto-saves while typing.

- [ ] **Step 7: Run focused verification**

  Run:

  ```sh
  npm test -- src/calendar/ics.test.ts src/components/PlannerFeedback.test.tsx src/components/EventDetailsDialog.test.tsx src/App.test.tsx src/styles.test.ts
  ```

  Expected: PASS.

- [ ] **Step 8: Browser-check mutation confidence**

  At 390×844, save an event, add a short note, confirm one unobtrusive local-save message, remove the event, Undo it, and confirm the note returns. Export one saved event and confirm the acknowledgement. Repeat a storage-unavailable fixture and confirm it never falsely says the note is persisted.

- [ ] **Step 9: Commit the isolated task**

  ```sh
  git add src/App.tsx src/App.test.tsx src/components/PlannerFeedback.tsx src/components/PlannerFeedback.test.tsx src/components/EventDetailsDialog.tsx src/components/EventDetailsDialog.test.tsx src/calendar/ics.ts src/calendar/ics.test.ts src/styles.css src/styles.test.ts
  git commit -m "feat: add planner action feedback and recovery"
  ```

### Task 7: Keep desktop timetable time context and simplify footer trust copy

**Files:**

- Modify: `src/components/BrowseView.tsx`
- Modify: `src/components/BrowseView.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`
- Modify: `src/styles.test.ts`

**Interfaces:**

- Add a `.timetable-scroll__axis` wrapper or relocate the existing time-axis element so it can remain sticky within `.timetable-scroll` without changing timetable event positioning.
- Replace the three footer paragraphs with one `p` that includes accurate unofficial/local-only/no-runtime-fetch language. Keep `Footer resources` link names and URLs unchanged.

- [ ] **Step 1: Write failing timetable/footer tests**

  In `BrowseView.test.tsx`, assert every timetable day renders a labelled time axis inside its own scroll container:

  ```tsx
  const scroll = screen.getByRole("group", { name: "Thursday timetable scroll region" });
  expect(within(scroll).getByRole("group", { name: "Thursday time axis" })).toBeInTheDocument();
  ```

  Update the markup to give each scroll container that explicit accessible name. In `App.test.tsx`, assert one concise footer trust paragraph contains “unofficial”, “browser”, and “does not fetch programme content at runtime”, while resource links retain their exact names.

- [ ] **Step 2: Run focused tests and verify RED**

  Run:

  ```sh
  npm test -- src/components/BrowseView.test.tsx src/App.test.tsx
  ```

  Expected: FAIL because the scroll container is unnamed and footer copy is spread across three paragraphs.

- [ ] **Step 3: Implement contained sticky context**

  Give `.timetable-scroll` `position: relative`, create/retain a sticky axis row inside it, and use a non-overlapping `z-index`/background so time labels remain readable while vertical venue lanes scroll. Do not make the whole browser page horizontal or alter the chart’s lane calculations. Keep `aria-label` on each time axis and add the named scroll region.

- [ ] **Step 4: Consolidate footer copy**

  Replace the three paragraphs with:

  ```tsx
  <p>
    Field Notes is an unofficial, local-first planner: your plan and Event Notes stay in this browser, and the app does not fetch programme content at runtime.
  </p>
  ```

  Keep the resource navigation immediately afterwards.

- [ ] **Step 5: Add CSS structure tests and run focused verification**

  Add `styles.test.ts` assertions for sticky time-axis positioning within `.timetable-scroll`, an opaque axis background, and no mobile rule mounting/displaying the timetable chart. Run:

  ```sh
  npm test -- src/components/BrowseView.test.tsx src/App.test.tsx src/styles.test.ts
  ```

  Expected: PASS.

- [ ] **Step 6: Browser-check comparison and responsive isolation**

  At 1440×900 open a timetable with enough venues to scroll vertically; verify time labels remain visible and do not cover event controls. At 390×844 confirm only Day schedule is mounted, no horizontal chart exists, and the concise footer wraps cleanly.

- [ ] **Step 7: Commit the isolated task**

  ```sh
  git add src/components/BrowseView.tsx src/components/BrowseView.test.tsx src/App.tsx src/App.test.tsx src/styles.css src/styles.test.ts
  git commit -m "fix: improve timetable context and planner footer"
  ```

### Task 8: Update public documentation and perform release verification

**Files:**

- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-08-07-we-out-here-festival-planner-design.md`
- Modify: `docs/superpowers/specs/2026-08-08-mobile-planner-ux-design.md`
- Modify: `docs/superpowers/specs/2026-08-09-operational-planner-ux-refinement-design.md`
- Create: `.superpowers/sdd/2026-08-09-operational-planner-ux-refinement/release-report.md`

**Interfaces:**

- README must describe: visible offline readiness, session-only Browse context, All-days grouped phone Schedule, inline schedule Save/Saved action, More filters/clear-all, venue canonicalisation, and feedback/Undo/export acknowledgement.
- Do not promise cross-device data sharing, offline availability before caching, calendar import success, or permanent Undo retention.

- [ ] **Step 1: Write a documentation acceptance checklist in the release report**

  Create headings:

  ```markdown
  ## Automated verification
  ## Browser QA — desktop 1440×900
  ## Browser QA — phone 390×844
  ## Offline/update caveats
  ## Documentation reconciliation
  ```

  List each stage acceptance criterion under the relevant heading before verifying it.

- [ ] **Step 2: Update README and specifications**

  Make the README’s Browse paragraph explicitly distinguish Browse discovery from Day schedule’s chronological all-days/selected-day operational view. Add the first-online/readiness placement explanation and the separate Home Screen storage caveat. Document that Undo is available after a single event removal until the next planner action, and that export feedback means a download started only.

  Update the original and mobile design specs where their previous descriptions say the Day schedule is details-only or imply all filters remain visible by default. Mark the refinement design as implemented only after final verification.

- [ ] **Step 3: Run all automated gates**

  Run:

  ```sh
  npm test
  npm run build
  git diff --check
  ```

  Expected: full suite PASS, production/PWA build PASS, and no whitespace errors.

- [ ] **Step 4: Run final browser acceptance**

  Start the production build with the existing preview script. At 1440×900 and 390×844 verify:

  - readiness placement and Home Screen guidance fixture;
  - empty plan, populated plan, no-results, storage-unavailable, and update-ready fixture states;
  - Browse context restoration, More filters, canonical venue selection, Clear all, and Family filter;
  - selected-day and All-days schedule, inline Save/Saved, dialog focus/Escape, and no overflow;
  - note persistence feedback, removal Undo, and calendar download acknowledgement;
  - sticky desktop time axis and no phone timetable chart;
  - zero browser console warnings/errors.

  Do not claim a real offline first-load, real service-worker update, or calendar-import result unless each is verified in a deployed/controlled browser environment.

- [ ] **Step 5: Complete the release report**

  Record commands and exact results, browser dimensions, tested fixtures, unresolved external-state limits, and the production URL if deployment is authorised. Do not include user browser storage contents or private data.

- [ ] **Step 6: Commit documentation and report**

  ```sh
  git add README.md docs/superpowers/specs/2026-08-07-we-out-here-festival-planner-design.md docs/superpowers/specs/2026-08-08-mobile-planner-ux-design.md docs/superpowers/specs/2026-08-09-operational-planner-ux-refinement-design.md .superpowers/sdd/2026-08-09-operational-planner-ux-refinement/release-report.md
  git commit -m "docs: explain refined planner experience"
  ```

## Plan self-review

- **Spec coverage:** Tasks 1–4 cover all Stage 1 requirements; Tasks 5–7 cover filters, venue variants, feedback/recovery, timetable, and footer; Task 8 covers documentation and release QA.
- **Scope:** The work remains inside the existing React, CSS, planner, calendar, and documentation boundaries. It does not introduce a backend, dependency, map, sync, or runtime content service.
- **Type consistency:** `BrowseMode` and `BrowseFilters` are parent-owned only; `getDayScheduleModel` accepts `ProgrammeDay | "all"`; inline schedule saving reuses `onToggleFavourite`; calendar export produces an explicit boolean; persistent confirmations derive from itinerary save results.
- **Quality gates:** Every functional task starts with a named RED test, ends with focused PASS verification, browser QA, and a scoped Conventional Commit. The final task requires full tests, build, and diff check.
