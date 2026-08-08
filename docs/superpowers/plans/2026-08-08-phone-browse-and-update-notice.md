# Phone Day Schedule and Update Notice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make phone Schedule a compact, time-first Day schedule and surface a waiting planner update at the top with a clear one-time action.

**Architecture:** `BrowseView` continues to own filters, event details, saved state, and the desktop timetable. Its phone branch toggles between `EventCardList` for discovery and a new compact `PhoneDaySchedule` for the selected day; both consume the same filtered programme without new storage or data sources. `UpdateNotice` moves the existing explicit service-worker acceptance action from the lower offline status into `App`, directly under navigation.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, CSS media queries.

## Global Constraints

- Phone portrait and wide short-landscape offer Browse and a one-day, compact Day schedule; they never mount the visual timetable.
- A Day schedule row shows time, title, venue, category indicator, and a non-interactive Saved marker; it opens existing details and has no separate in-row save button or Browse-card layout.
- Larger screens retain the existing list/timetable toggle and visual time-and-venue chart.
- Preserve filters, Programme Day defaults, whole-weekend search behaviour, favourites, Event Notes, clashes, dialog focus semantics, local-only storage, PWA update mechanics, and 44px targets.
- A waiting update notice appears directly below navigation only for `updating`; it has a single **Use update next time** button, never reloads the open planner, and creates no preference/dismissal state or checkbox.
- No dependencies, runtime fetches, analytics, embeds, schedule-data changes, calendar/export changes, or external-link changes.

---

### Task 1: Build the compact phone Day schedule

**Files:**
- Modify: `src/components/BrowseView.tsx:125-260,434-533`
- Modify: `src/components/BrowseView.test.tsx:130-440`
- Modify: `src/styles.css:1027-1176,1274-1360`
- Modify: `src/styles.test.ts:8-33`

**Interfaces:**
- Consumes: `visibleEvents`, `filters.programmeDay`, `compareByStartThenTitle`, `CategoryIcon`, `categoryLabel`, `formatTimeRange`, `favouriteIds`, `clashingIds`, and the existing `openDetails(eventId, opener)` callback.
- Produces: `PhoneDaySchedule`, rendering only selected-day rows with `aria-label="<title> day schedule event"`; phone `BrowseMode` labels **Show schedule** / **Show browse**; desktop labels remain **Show timetable** / **Show list**.

- [ ] **Step 1: Write failing Day-schedule tests**

  Add a `PhoneDaySchedule` behaviour test through `BrowseView` using the dimension-aware phone helper at `390×844`. Use an unordered Thursday fixture with two times plus a Friday fixture. Select Thursday, activate **Show schedule**, and assert only the two Thursday rows appear in chronological order. Each row must contain its formatted time, title, venue, category text, and a saved-state marker using `aria-pressed` or text; its sole interactive control opens the existing details dialog.

  ```tsx
  await user.click(screen.getByRole("button", {name: "Show schedule"}));
  const rows = screen.getAllByRole("button", {name: /day schedule event$/});
  expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual([
    "Early Set day schedule event",
    "Kotoa day schedule event",
  ]);
  expect(screen.queryByText("Leaf Printing")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", {name: "Kotoa day schedule event"}));
  expect(screen.getByRole("dialog", {name: "Kotoa"})).toBeVisible();
  ```

  Add a 956×440 case that asserts the same compact schedule, no `Programme timetable`, and no horizontal page-level overflow. Keep desktop tests proving **Show timetable** and **Show list** still work. Remove old phone-agenda card/action assertions that conflict with the compact-row contract.

- [ ] **Step 2: Run focused tests to prove RED**

  Run: `npm test -- src/components/BrowseView.test.tsx`

  Expected: FAIL because the current `PhoneAgenda` renders Browse-style `<article>` cards and details/save controls instead of selected-day compact row buttons.

- [ ] **Step 3: Implement the minimal phone schedule renderer**

  Replace `PhoneAgenda` with `PhoneDaySchedule`. Filter `events` to `programmeDay`, sort via `compareByStartThenTitle`, and map each event to one row button:

  ```tsx
  <button
    aria-label={`${event.title} day schedule event`}
  className={`phone-day-schedule__row${favouriteIds.has(event.id) ? " phone-day-schedule__row--saved" : ""}`}
    onClick={(clickEvent) => onViewDetails(event.id, clickEvent.currentTarget)}
    type="button"
  >
    <time dateTime={event.startsAt}>{formatTimeRange(event)}</time>
    <span><CategoryIcon category={event.category} />{categoryLabel(event.category)}</span>
    <strong>{event.title}</strong>
    <span>{event.venue}</span>
    {favouriteIds.has(event.id) ? <span>Saved</span> : null}
  </button>
  ```

  Render `PhoneDaySchedule` only when `isPhoneLayout && mode === "timetable"`; render `EventCardList` for phone Browse. Set the phone toggle label to **Show schedule** from Browse and **Show browse** from Schedule. Keep desktop mode labels and `Timetable` logic unchanged. Ensure the selected-day title is visible above the rows; if a whole-weekend search has no result on that selected day, show a concise no-matches message rather than another day’s events; retain stable fallback focus for details dialog closure.

  Replace phone-agenda CSS with compact grid rows: a narrow fixed time column, flexible content column, category indicator, clear saved accent, row gap, and minimum height `2.75rem`. Do not use card shadows, per-row action buttons, or horizontal scrolling.

- [ ] **Step 4: Run focused and full automated verification**

  Run:

  ```sh
  npm test -- src/components/BrowseView.test.tsx src/styles.test.ts
  npm test
  npm run build
  ```

  Expected: Day schedule is ordered, one-day-only, compact, accessible, and opens existing details; phone Browse and desktop timetable retain their distinct behaviours; all suites and build pass.

- [ ] **Step 5: Browser-check the responsive programme views**

  On a production preview at 390×844 and 956×440, select Thursday and open **Show schedule**. Confirm clear time-first rows, title/venue/category/saved state, detail-dialog save/remove flow, 44px row targets, no horizontal page overflow, and no console warnings/errors. Return via **Show browse** and confirm filterable discovery cards. At 1280×900, confirm **Show timetable** / **Show list** still switch the desktop presentation.

- [ ] **Step 6: Commit Task 1**

  ```sh
  git add src/components/BrowseView.tsx src/components/BrowseView.test.tsx src/styles.css src/styles.test.ts
  git commit -m "feat: add compact phone day schedule"
  ```

### Task 2: Put a waiting update notice in the first screen

**Files:**
- Modify: `src/main.tsx:8-16`
- Modify: `src/App.tsx:13-17,154-205`
- Modify: `src/App.test.tsx`
- Modify: `src/pwa/OfflineStatus.tsx:4-9,21-128`
- Modify: `src/pwa/OfflineStatus.test.tsx:190-208`
- Modify: `src/styles.css:64-79`
- Modify: `README.md:13-15`

**Interfaces:**
- Consumes: `OfflineStatusState`, `useOfflineStatus(): { state, refresh }`, and the existing update acceptance callback.
- Produces: `UpdateNotice({ onRefresh }: { onRefresh: () => void })`, rendered by `App` only when it receives `offlineState === "updating"`; `OfflineStatus` no longer renders a duplicate waiting-update action.

- [ ] **Step 1: Write failing tests for the top update notice**

  Add an `App` integration test that renders `App` with `offlineState="updating"` and a spy refresh callback. It must find the notice immediately after `Planner views`, assert the exact button name **Use update next time**, the copy about closing and reopening, and one refresh call after clicking. Add a non-updating case that asserts the notice is absent.

  In `OfflineStatus.test.tsx`, change the updating-state expectation so the lower status has no `Allow update` or `Use update next time` control while preserving the snapshot date assertion.

  ```tsx
  await user.click(screen.getByRole("button", {name: "Use update next time"}));
  expect(refresh).toHaveBeenCalledOnce();
  expect(screen.getByText(/close and reopen Field Notes/i)).toBeInTheDocument();
  ```

- [ ] **Step 2: Run focused tests to prove RED**

  Run: `npm test -- src/App.test.tsx src/pwa/OfflineStatus.test.tsx`

  Expected: FAIL because `App` currently accepts no offline lifecycle props and `OfflineStatus` owns the lower **Allow update** button.

- [ ] **Step 3: Extract and place the update notice**

  Export a small `UpdateNotice` from `src/pwa/OfflineStatus.tsx` with the approved copy and button:

  ```tsx
  export function UpdateNotice({onRefresh}: {onRefresh: () => void}) {
    return (
      <section className="update-notice" aria-labelledby="update-notice-heading">
        <h2 id="update-notice-heading">A planner update is ready</h2>
        <p>Your saved plan stays in this browser. Close and reopen Field Notes to use the new version.</p>
        <button type="button" onClick={onRefresh}>Use update next time</button>
      </section>
    );
  }
  ```

  Add optional `offlineState?: OfflineStatusState` and `onRefresh?: () => void` props to `App`. Render `UpdateNotice` immediately after `planner-nav` only when the state is `updating` and the callback exists. In `PlannerRoot`, pass the existing `state` and `refresh` values to `App`, while retaining `OfflineStatus` for lower readiness/guidance/snapshot content. Remove the updating block from `OfflineStatus` so the action is present once.

  Add `.update-notice` CSS using the existing paper/ink/border style, a width aligned to the app shell, a top margin below navigation, safe-area-aware inline padding, and a 44px button. It must not be fixed or sticky, and it must wrap safely at phone widths.

- [ ] **Step 4: Run focused and full automated verification**

  Run:

  ```sh
  npm test -- src/App.test.tsx src/pwa/OfflineStatus.test.tsx src/pwa/useOfflineStatus.test.tsx
  npm test
  npm run build
  git diff --check
  ```

  Expected: only the top notice exposes the update action; accepting remains an explicit callback with no reload/persistence side effect; offline/home-screen status behaviour remains covered; all tests/build pass.

- [ ] **Step 5: Browser-check the update notice and documentation**

  In a production preview, simulate or expose the waiting-update state using the existing testable lifecycle harness. Confirm the notice appears immediately below navigation on 390×844 and 956×440, button target is at least 44px, content is not covered by safe areas, and no duplicate lower action appears. Confirm desktop alignment and no console errors. Update README Browse wording to describe the phone Day schedule and larger-screen timetable; add one concise sentence that waiting updates are announced at the top and take effect after close/reopen.

- [ ] **Step 6: Commit Task 2**

  ```sh
  git add src/main.tsx src/App.tsx src/App.test.tsx src/pwa/OfflineStatus.tsx src/pwa/OfflineStatus.test.tsx src/styles.css README.md
  git commit -m "fix: surface waiting planner updates"
  ```

## Plan self-review

- Spec coverage: Task 1 provides a phone-only, selected-day, time-first schedule distinct from Browse and protects desktop timetable behaviour. Task 2 relocates the update action, preserves controlled update semantics, prevents duplication, adds responsive/accessibility checks, and updates public documentation.
- Placeholder scan: no unresolved markers or deferred implementation instructions remain.
- Type consistency: `OfflineStatusState`, `useOfflineStatus`, `App`, `OfflineStatus`, `UpdateNotice`, `PhoneDaySchedule`, and existing `BrowseMode` use signatures defined in this plan or already exported by the application.
