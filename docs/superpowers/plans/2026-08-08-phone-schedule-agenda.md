# Phone Schedule Agenda Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Schedule a readable agenda on every phone-sized viewport and reserve the visual timetable for larger screens.

**Architecture:** `BrowseView` already owns the list/timetable mode and has separate `PhoneAgenda` and `Timetable` renderers. Replace the fragile pointer-dependent responsive policy with a size-based breakpoint shared by React and CSS, so the mode label and mounted renderer always agree. Keep filtering and itinerary state unchanged; document the resulting two-view experience in the README.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, CSS media queries.

## Global Constraints

- Phone portrait and landscape use the same Browse/Schedule interaction; neither mounts the visual timetable.
- Larger screens retain the existing visual timetable and its horizontal scrolling behaviour.
- Preserve programme filters, current-day defaults, favourites, notes, clashes, detail-dialog focus behaviour, offline/PWA lifecycle, and local-only storage.
- Do not add dependencies, runtime fetches, analytics, or external embeds.
- Retain 44px interactive targets and safe-area/sticky-navigation safeguards.

---

### Task 1: Make the responsive schedule policy size-based

**Files:**
- Modify: `src/components/BrowseView.tsx:53-87,441-533`
- Modify: `src/components/BrowseView.test.tsx:31-61,130-182,376-440`
- Modify: `src/styles.css:1206-1210`
- Modify: `src/styles.test.ts:8-33`

**Interfaces:**
- Consumes: `PHONE_LAYOUT_QUERY`, `usePhoneLayout()`, `PhoneAgenda`, `Timetable`, and the existing `BrowseMode` state.
- Produces: one shared, size-based `PHONE_LAYOUT_QUERY` that returns the agenda on phone portrait and landscape; visual timetable rendering only when it returns false.

- [ ] **Step 1: Write the failing responsive-policy tests**

  In `src/components/BrowseView.test.tsx`, extend the `matchMedia` test helper so it records the requested query. Add a parameterised test for phone portrait and short landscape that stubs a matching phone query, opens Schedule, and asserts that `Thursday agenda` is present while `Programme timetable` is absent. Add a desktop case that opens **Show timetable** and asserts the inverse.

  ```tsx
  it.each([
    ["phone portrait", true],
    ["phone landscape", true],
    ["desktop", false],
  ])("mounts the correct schedule presentation on %s", async (_, isPhone) => {
    mockPhoneLayout(isPhone);
    const user = userEvent.setup();
    render(<BrowseView events={[events[0]]} favouriteIds={new Set()} onToggleFavourite={() => undefined} />);

    await user.click(screen.getByRole("button", {
      name: isPhone ? "Show schedule" : "Show timetable",
    }));

    if (isPhone) {
      expect(screen.getByRole("region", {name: "Thursday agenda"})).toBeVisible();
      expect(screen.queryByLabelText("Programme timetable")).not.toBeInTheDocument();
    } else {
      expect(screen.getByLabelText("Programme timetable")).toBeVisible();
      expect(screen.queryByRole("region", {name: "Thursday agenda"})).not.toBeInTheDocument();
    }
  });
  ```

  In `src/styles.test.ts`, change the policy assertion name and expectation to require a size-only query. The CSS media rule must still be found via `PHONE_LAYOUT_QUERY` and still include the sticky `.planner-nav` rule.

- [ ] **Step 2: Run the focused tests to verify they fail**

  Run: `npm test -- src/components/BrowseView.test.tsx src/styles.test.ts`

  Expected: FAIL because `PHONE_LAYOUT_QUERY` currently includes the `(pointer: coarse)` landscape branch, which allows a visual timetable on some small landscape browsers.

- [ ] **Step 3: Implement the shared phone breakpoint**

  In `src/components/BrowseView.tsx`, replace the current query with a width-only threshold that includes ordinary phone portrait and landscape widths but excludes desktop layouts:

  ```ts
  export const PHONE_LAYOUT_QUERY = "(max-width: 48rem)";
  ```

  Keep `getPhoneLayoutSnapshot`, `subscribeToPhoneLayout`, the control labels, and the exclusive `PhoneAgenda`/`Timetable` branch intact. This deliberately makes orientation irrelevant on a phone-sized display.

  In `src/styles.css`, replace the matching media query with `@media (max-width: 48rem)` so CSS and React use exactly the same policy. Do not add a second landscape-only rule.

- [ ] **Step 4: Run focused tests to verify they pass**

  Run: `npm test -- src/components/BrowseView.test.tsx src/styles.test.ts`

  Expected: PASS. The schedule uses the agenda for the phone cases, the desktop retains a timetable, and the CSS policy remains synchronised with React.

- [ ] **Step 5: Verify the behaviour in the browser**

  Run a production preview and use the in-app browser:

  ```sh
  npm run build
  npm run preview -- --host 127.0.0.1
  ```

  At 390×844 and a short landscape viewport, open Browse, select a Programme Day, and choose **Show schedule**. Confirm a chronological agenda is shown, there is no horizontal page overflow, save/details controls work, and the console has no warnings or errors. At 1280×900, confirm **Show timetable** renders the visual chart and **Show list** returns to cards.

- [ ] **Step 6: Commit the responsive schedule change**

  ```sh
  git add src/components/BrowseView.tsx src/components/BrowseView.test.tsx src/styles.css src/styles.test.ts
  git commit -m "fix: use agenda schedule on phone screens"
  ```

### Task 2: Document the responsive browsing experience

**Files:**
- Modify: `README.md:13-15`

**Interfaces:**
- Consumes: the completed phone agenda and desktop timetable behaviour from Task 1.
- Produces: accurate user-facing guidance describing Browse, Schedule, and desktop timetable availability.

- [ ] **Step 1: Write the documentation change**

  Replace the first sentence of the Browse guidance with concise, accurate copy:

  ```md
  Browse the programme with search and day, venue, and category filters, then save events to **My plan**. On a phone, **Schedule** presents the filtered programme as a chronological agenda; the visual time-and-venue timetable is available on larger screens.
  ```

  Keep the following Event Notes sentence unchanged.

- [ ] **Step 2: Verify documentation and the complete quality gate**

  Run:

  ```sh
  npm test
  npm run build
  git diff --check
  ```

  Expected: all tests and production build pass, and no whitespace errors are reported. Confirm the README statement matches the browser checks in Task 1.

- [ ] **Step 3: Commit the documentation update**

  ```sh
  git add README.md
  git commit -m "docs: clarify phone schedule behaviour"
  ```

## Plan self-review

- Spec coverage: Task 1 implements the single phone interaction model, agenda/timetable separation, current filters/default preservation, exclusive mounting, safe-area continuity, and browser validation. Task 2 makes the new behaviour discoverable in repository documentation.
- Placeholder scan: no unresolved markers or deferred implementation instructions remain.
- Type consistency: `PHONE_LAYOUT_QUERY`, `usePhoneLayout`, `PhoneAgenda`, `Timetable`, and existing testing helpers are used with their current exported names and signatures.
