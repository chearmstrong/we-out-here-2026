# Home Screen storage guidance implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Home Screen prompt clearly prevent Safari-to-installed-app plan-transfer confusion, while keeping Field Notes local-first.

**Architecture:** Extend the existing ready-only `OfflineStatus` Home Screen guidance panel with static iPhone/iPad storage-copy. It remains browser-context-local: no itinerary, storage, PWA, or update-flow code changes are needed. Cover the new visible warning and re-opened help with existing component tests, and keep the README’s user-facing promise aligned.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, CSS, Markdown.

## Global Constraints

- The guidance appears only after the planner is **Saved for offline use**.
- The panel must say people should add Field Notes to the Home Screen before building a plan there.
- State plainly that, on iPhone/iPad, the Home Screen app has a separate plan from Safari and plans saved in Safari will not appear there.
- The warning is visible in the ready guidance panel, not hidden behind **How to add it**; the later **Home Screen help** route reopens the same warning and instructions.
- Preserve existing iPhone/iPad installation steps and the Android browser-menu wording without an iOS-storage warning.
- Do not add a server, account, sync, transfer/import/export, cookie mirror, analytics, dependency, storage-key change, PWA/update change, calendar change, or Browse/Day schedule change.

---

### Task 1: Clarify Home Screen storage separation and document it

**Files:**
- Modify: `src/pwa/OfflineStatus.tsx:85-123`
- Modify: `src/pwa/OfflineStatus.test.tsx:45-153`
- Modify: `README.md:7-11`

**Interfaces:**
- Consumes: existing `OfflineStatus` ready state, `guidanceDismissed`, `instructionsVisible`, **How to add it**, **Not now**, and **Home Screen help** controls.
- Produces: the same panel lifecycle with new static explanatory copy; no new props, state, storage key, callback, or dependency.

- [ ] **Step 1: Write the failing component and README assertions**

  In `src/pwa/OfflineStatus.test.tsx`, extend the ready-state test to require both visible paragraphs before any click:

  ```tsx
  expect(
    screen.getByText(
      "For optional one-tap access, add Field Notes to your Home Screen before you build your plan there.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "iPhone/iPad: Home Screen apps keep a separate plan from Safari. Plans saved in Safari will not appear there.",
    ),
  ).toBeInTheDocument();
  ```

  In the existing offline-unavailable test, assert the separate-plan sentence is absent. In the existing **Home Screen help** reopening test, assert the separate-plan sentence is visible after reopening. Keep the existing Android assertion and add a README assertion only if the repository uses an existing Markdown-content test pattern; otherwise verify the exact README sentence in the final review.

- [ ] **Step 2: Run the focused test to prove RED**

  Run:

  ```sh
  npm test -- src/pwa/OfflineStatus.test.tsx
  ```

  Expected: FAIL because the ready guidance has only the current optional one-tap-access sentence and no visible Safari/Home Screen separation warning.

- [ ] **Step 3: Implement the minimal ready-panel and README copy**

  Replace the current ready-panel introduction with these two visible paragraphs, in this order, directly beneath **Keep Field Notes handy**:

  ```tsx
  <p>
    For optional one-tap access, add Field Notes to your Home Screen before
    you build your plan there.
  </p>
  <p>
    <strong>iPhone/iPad:</strong> Home Screen apps keep a separate plan from
    Safari. Plans saved in Safari will not appear there.
  </p>
  ```

  Leave the **How to add it** conditional content unchanged, including its existing iPhone/iPad and Android steps. Do not alter dismissal/focus logic, styles, `localStorage`, service-worker registration, or the update notice.

  In `README.md`, replace the current Home Screen sentence with:

  ```md
  After **Saved for offline use** appears, optional Home Screen guidance can make Field Notes quicker to launch. On iPhone and iPad, add it before building a plan there: the Home Screen app keeps a separate plan from Safari, so an existing Safari plan will not appear in it. Browser menu labels and available Home Screen options vary.
  ```

- [ ] **Step 4: Run focused tests to prove GREEN**

  Run:

  ```sh
  npm test -- src/pwa/OfflineStatus.test.tsx
  ```

  Expected: PASS, including ready, offline-unavailable, dismissed/help-reopened, platform-instruction, focus, and storage-failure coverage.

- [ ] **Step 5: Run full verification and browser QA**

  Run:

  ```sh
  npm test
  npm run build
  git diff --check
  ```

  In a production preview using the in-app browser at 390 × 844, wait for **Saved for offline use** and verify: both new paragraphs are visible before selecting **How to add it**; the panel has no horizontal overflow; **How to add it** reveals the unchanged platform steps; **Not now** replaces the panel with **Home Screen help**; reopening help shows the warning and instructions; and there are no console errors. If the in-app browser is unavailable, record that exact limitation and do not substitute another browser tool without approval.

- [ ] **Step 6: Commit the completed guidance**

  ```sh
  git add src/pwa/OfflineStatus.tsx src/pwa/OfflineStatus.test.tsx README.md
  git commit -m "feat: clarify Home Screen plan storage"
  ```

## Plan self-review

- Spec coverage: the single task implements the ready-only, visible iPhone/iPad warning; preserves help/dismissal and Android paths; updates the README; and verifies both automated and rendered behaviour.
- Placeholder scan: no deferred implementation, vague validation, or unresolved copy remains.
- Interface consistency: this plan adds no public API and relies only on the existing `OfflineStatus` lifecycle, so no new cross-task names or types can drift.
