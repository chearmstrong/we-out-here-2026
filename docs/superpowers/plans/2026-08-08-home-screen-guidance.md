# Home Screen guidance implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tell offline-ready users how to add Field Notes to their Home Screen for quick festival access, without implying installation is necessary or universally available.

**Architecture:** Keep all presentation and small browser-local dismissal logic in `OfflineStatus`. The component continues to receive only offline lifecycle state and the update callback. A dedicated localStorage key suppresses the initial prompt only after **Not now**; an always-available help button opens the same instructions without mutating saved itinerary data or service-worker state.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, CSS, Vite PWA.

## Global Constraints

- Show Home Screen guidance only when offline state is `ready`; never replace or weaken the truthful `Saved for offline use` cache status.
- Exact prominent copy: `Keep Field Notes handy`, `How to add it`, `Not now`, and `Home Screen help`.
- Instruction copy: iPhone/iPad uses **Share** then **Add to Home Screen**; Android uses browser menu **Install app** or **Add to Home screen**, if offered.
- Do not user-agent sniff, use `beforeinstallprompt`, invoke a native install API, add analytics/dependencies/runtime fetches, or create a custom installation flow.
- `Not now` must not change saved events, notes, PWA cache/update state, or emit a storage error; if storage is unavailable it hides only for the current session.
- Preserve local-first storage, PWA update lifecycle, safe-area layout, and no page-level overflow.

---

### Task 1: Offline-ready Home Screen guidance

**Files:**
- Modify: `src/pwa/OfflineStatus.tsx`
- Modify: `src/pwa/OfflineStatus.test.tsx`
- Modify: `src/styles.css`
- Modify: `src/styles.test.ts`
- Modify: `README.md`

**Interfaces:**
- `OfflineStatus` continues to accept `{ state: OfflineStatusState; onRefresh: () => void }`.
- Introduce file-local constant `HOME_SCREEN_GUIDANCE_DISMISSED_KEY = "field-notes:home-screen-guidance-dismissed"`.

- [ ] **Step 1: Write failing component and style tests**

  In `OfflineStatus.test.tsx`, reset `window.localStorage` between tests. Add tests that:

  ```tsx
  it("offers Home Screen guidance only once offline use is ready", () => {
    render(<OfflineStatus state="ready" onRefresh={() => undefined} />);
    expect(screen.getByText("Saved for offline use")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Keep Field Notes handy" })).toBeVisible();
    expect(screen.getByRole("button", { name: "How to add it" })).toBeVisible();
  });
  ```

  Split the non-ready assertion into a separate test rendering `offline-unavailable`, so it specifically proves no Home Screen prompt is shown before cache readiness.

  Add interaction tests: **How to add it** reveals the iPhone/iPad and Android instructions; **Not now** hides the prompt, writes the exact dismissal key, and leaves **Home Screen help** visible; clicking help opens instructions again. Add a localStorage getter/setter-throwing test that confirms **Not now** still hides the prompt without throwing or displaying a persistence error.

  In `styles.test.ts`, CSSOM-assert a `.home-screen-guidance` rule with nonzero bottom safe-area padding and a `.home-screen-guidance__actions` rule that wraps; this protects the phone-bottom layout from the same edge issues already fixed for offline status.

- [ ] **Step 2: Run focused tests and verify RED**

  Run: `npm test -- src/pwa/OfflineStatus.test.tsx src/styles.test.ts`

  Expected: FAIL because no Home Screen prompt, instructions, dismissal behaviour, help control, or guidance styles exist.

- [ ] **Step 3: Implement truthful, storage-safe guidance**

  In `OfflineStatus.tsx`, use component state initialized by a safe `try/catch` read of `HOME_SCREEN_GUIDANCE_DISMISSED_KEY`. Render `Saved for offline use` unchanged when `state === "ready"`.

  When ready and guidance is not dismissed, render a labelled `.home-screen-guidance` section with heading `Keep Field Notes handy`, plain copy that Home Screen access is optional, a `How to add it` button controlling an instruction region, and a `Not now` button. The instruction region contains exactly:

  ```tsx
  <p><strong>iPhone/iPad:</strong> open Share, then choose Add to Home Screen.</p>
  <p><strong>Android:</strong> use your browser menu and choose Install app or Add to Home screen, if offered.</p>
  ```

  `Not now` sets current-session dismissal first, then attempts `localStorage.setItem(HOME_SCREEN_GUIDANCE_DISMISSED_KEY, "1")` in `try/catch` without surfacing failure. When ready and the prompt is dismissed, show a `Home Screen help` button that reopens the same guidance/instructions for the current session; it does not delete the dismissal key.

- [ ] **Step 4: Add responsive, safe-area-correct styles**

  Add an accessible `.home-screen-guidance` card style that is readable against the existing offline aside, has bottom padding incorporating `env(safe-area-inset-bottom)`, and uses `.home-screen-guidance__actions { display: flex; flex-wrap: wrap; gap: ... }`. Controls meet the existing 44px target convention, show focus visibly, and never introduce horizontal page overflow at 390px.

- [ ] **Step 5: Update README guidance**

  In **Use the planner**, add a concise note: after **Saved for offline use**, Home Screen guidance can make the planner quicker to open; installation is optional and browser menu labels vary. Do not claim it affects caching or that every browser supports a native install prompt.

- [ ] **Step 6: Run focused GREEN and browser QA**

  Run: `npm test -- src/pwa/OfflineStatus.test.tsx src/styles.test.ts`

  Expected: PASS; ready-only, instructions, dismissal, session fallback, help, and safe-area/wrapping rules are covered.

  With production preview at 390 × 844, verify: ready status and prompt are readable above the safe area; instructions expand; **Not now** leaves **Home Screen help**; no page overflow or console errors. At desktop width, verify update and schedule-checked copy remain legible.

- [ ] **Step 7: Run full verification and commit**

  Run:

  ```sh
  npm test
  npm run build
  git diff --check
  ```

  Then commit:

  ```sh
  git add src/pwa/OfflineStatus.tsx src/pwa/OfflineStatus.test.tsx src/styles.css src/styles.test.ts README.md
  git commit -m "feat: guide users to Home Screen"
  ```
