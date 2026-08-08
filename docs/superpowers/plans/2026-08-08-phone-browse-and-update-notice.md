# Phone Browse and Update Notice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify phone Browse to one filtered list and make a waiting planner update visible at the top of the app with a clear one-time action.

**Architecture:** Keep `BrowseView` as the owner of filter and desktop timetable state, but render only `EventCardList` on the existing phone capability. Extract an `UpdateNotice` presentational component from `OfflineStatus`; pass the existing service-worker lifecycle state and refresh callback through `PlannerRoot` into `App`, where the notice can sit immediately below the planner navigation. The lower offline status remains responsible for cache readiness, Home Screen guidance, and snapshot date.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, CSS media queries.

## Global Constraints

- Phone portrait and wide short-landscape use one filtered Browse list, with no Schedule, Show schedule, Show list, agenda, or visual timetable control.
- Larger screens keep the existing list/timetable toggle and visual time-and-venue chart.
- Preserve existing filters, Programme Day defaults, favourites, Event Notes, clashes, event-detail focus semantics, local-only storage, PWA update mechanics, and 44px targets.
- A waiting update notice appears directly below planner navigation only for `updating`; it has a single **Use update next time** button, never reloads the open planner, and creates no preference/dismissal state or checkbox.
- No dependencies, runtime fetches, analytics, embeds, schedule-data changes, or external-link changes.

---

### Task 1: Make phone Browse list-only

**Files:**
- Modify: `src/components/BrowseView.tsx:434-533`
- Modify: `src/components/BrowseView.test.tsx:130-440`
- Modify: `src/styles.css:1274-1360`
- Modify: `src/styles.test.ts:8-33`

**Interfaces:**
- Consumes: existing `PHONE_LAYOUT_QUERY`, `usePhoneLayout()`, `EventCardList`, `Timetable`, and `BrowseMode`.
- Produces: on a matching phone query, no mode-toggle button and an `EventCardList`; on a nonmatching layout, the existing `BrowseMode` toggle and `Timetable` remain.

- [ ] **Step 1: Write failing component regressions**

  Replace the phone Schedule expectation with a parameterised phone case that uses the real dimension-aware `matchMedia` helper at `390×844` and `956×440`. Render `BrowseView`, then assert the event card is visible and all schedule/timetable controls and markup are absent:

  ```tsx
  expect(screen.getByRole("article", {name: "Kotoa"})).toBeVisible();
  expect(screen.queryByRole("button", {name: /Show (schedule|timetable|list)/})).not.toBeInTheDocument();
  expect(screen.queryByRole("region", {name: "Thursday agenda"})).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Programme timetable")).not.toBeInTheDocument();
  ```

  Keep a desktop regression that opens **Show timetable**, sees `Programme timetable`, and can return through **Show list**. Remove phone-only agenda tests that no longer describe the product.

- [ ] **Step 2: Run the focused regression to prove RED**

  Run: `npm test -- src/components/BrowseView.test.tsx`

  Expected: FAIL because current phone Browse still renders **Show schedule** and mounts `PhoneAgenda` after selection.

- [ ] **Step 3: Implement the minimal phone branch**

  In `BrowseView`, derive `const isPhoneLayout = usePhoneLayout()` as today. Render the `view-toggle` only when `!isPhoneLayout`, and make the content branch choose `EventCardList` whenever `isPhoneLayout` is true:

  ```tsx
  {isPhoneLayout ? (
    <EventCardList {...cardListProps} />
  ) : mode === "list" ? (
    <EventCardList {...cardListProps} />
  ) : (
    <Timetable {...cardListProps} />
  )}
  ```

  Update the dialog fallback focus target so it remains a stable Browse element when phone mode has no view-toggle. Remove only CSS that is exclusive to the now-unmounted phone agenda; retain all shared card and safe-area rules.

- [ ] **Step 4: Run focused and full automated verification**

  Run:

  ```sh
  npm test -- src/components/BrowseView.test.tsx src/styles.test.ts
  npm test
  npm run build
  ```

  Expected: phone cases expose filterable cards with their existing detail/save controls and no Schedule control; desktop timetable behaviour is unchanged; all suites and build pass.

- [ ] **Step 5: Browser-check responsive Browse**

  On a production preview, test 390×844 and 956×440: Browse has no mode control, filtering still works, an event can be saved and opened, there is no page overflow, and no console warnings/errors occur. At 1280×900, confirm **Show timetable** and **Show list** remain available and work.

- [ ] **Step 6: Commit Task 1**

  ```sh
  git add src/components/BrowseView.tsx src/components/BrowseView.test.tsx src/styles.css src/styles.test.ts
  git commit -m "fix: simplify phone programme browsing"
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

- [ ] **Step 2: Run the focused tests to prove RED**

  Run: `npm test -- src/App.test.tsx src/pwa/OfflineStatus.test.tsx`

  Expected: FAIL because `App` currently accepts no offline lifecycle props and `OfflineStatus` owns the bottom **Allow update** button.

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

  In a production preview, simulate or expose the waiting-update state using the existing testable lifecycle harness. Confirm the notice appears immediately below navigation on 390×844 and 956×440, button target is at least 44px, content is not covered by safe areas, and no duplicate lower action appears. Confirm desktop alignment and no console errors. Update README Browse wording to say phone Browse is the filtered list and the visual timetable is available on larger screens; add one concise sentence that waiting updates are announced at the top and take effect after close/reopen.

- [ ] **Step 6: Commit Task 2**

  ```sh
  git add src/main.tsx src/App.tsx src/App.test.tsx src/pwa/OfflineStatus.tsx src/pwa/OfflineStatus.test.tsx src/styles.css README.md
  git commit -m "fix: surface waiting planner updates"
  ```

## Plan self-review

- Spec coverage: Task 1 removes the duplicate phone Schedule while retaining phone filters/cards and desktop timetable. Task 2 relocates the update action, preserves controlled update semantics, prevents duplication, adds responsive/accessibility checks, and updates public documentation.
- Placeholder scan: no unresolved markers or deferred implementation instructions remain.
- Type consistency: `OfflineStatusState`, `useOfflineStatus`, `App`, `OfflineStatus`, and `UpdateNotice` use signatures defined in this plan or already exported by the application.
