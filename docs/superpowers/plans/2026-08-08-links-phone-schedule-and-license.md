# Links, phone schedule, and licence implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Field Notes more shareable with clear source and playlist links, preserve its readable schedule on phones in either orientation, and publish clear MIT reuse terms for the original project.

**Architecture:** Keep stable external destinations in `src/config/site.ts`, with `App.tsx` rendering ordinary outbound anchors and `BrowseView.tsx` owning a single responsive programme-view policy. A shared phone media-query string marks narrow screens and short coarse-pointer landscape screens as phones; matching CSS applies the same phone layout. Add standard MIT metadata and a root licence file, while README describes the licence boundary.

**Tech Stack:** React 19, TypeScript, Lucide React, Vitest, Testing Library, Vite PWA, CSS media queries, Markdown.

## Global Constraints

- All external links use canonical destination URLs, `target="_blank"`, and `rel="noreferrer"`; do not add embeds, SDKs, players, tracking, or runtime application fetches.
- GitHub source link accessible name: `View source on GitHub`; playlist link text: `Listen to the festival playlist`.
- A phone in portrait or short coarse-pointer landscape uses only the chronological agenda; desktop timetable uses only wider, sufficiently tall screens. React and CSS must share equivalent responsive conditions and mount only one programme view.
- Preserve local-first storage, offline/PWA operation, update lifecycle, no-runtime-fetch policy, unofficial attribution, and accessible modal/focus behaviour.
- MIT covers original Field Notes code and documentation only; it does not license We Out Here or Spotify names, marks, logos, illustrations, official map artwork, or external content.
- Do not add a map link or placeholder.

---

### Task 1: Shareable header/resources and MIT project terms

**Files:**
- Modify: `src/config/site.ts`
- Modify: `src/config/site.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`
- Modify: `src/styles.test.ts`
- Modify: `package.json`
- Modify: `README.md`
- Create: `LICENSE`

**Interfaces:**
- Produces `FESTIVAL_PLAYLIST_URL` from `src/config/site.ts`, equal to `https://open.spotify.com/playlist/7Am6bwWRhhwy4yjcMo3ASA` with no sharing/tracking parameters.
- `App` consumes `PROJECT_REPOSITORY_URL` and `FESTIVAL_PLAYLIST_URL` for two independently accessible outbound anchors.

- [ ] **Step 1: Write failing configuration, UI, style, and licence tests**

  Extend `src/config/site.test.ts` to assert the canonical playlist URL and licence metadata/files:

  ```ts
  import { readFileSync } from "node:fs";
  import { FESTIVAL_PLAYLIST_URL } from "./site";

  it("publishes the canonical festival playlist without tracking parameters", () => {
    expect(FESTIVAL_PLAYLIST_URL).toBe(
      "https://open.spotify.com/playlist/7Am6bwWRhhwy4yjcMo3ASA",
    );
  });

  it("licenses original project work under MIT", () => {
    expect(JSON.parse(readFileSync("package.json", "utf8")).license).toBe("MIT");
    expect(readFileSync("LICENSE", "utf8")).toContain("MIT License");
    expect(readFileSync("LICENSE", "utf8")).toContain("Copyright (c) 2026 Ché Armstrong");
  });
  ```

  In `src/App.test.tsx`, render `<App />` and assert the header source anchor has `aria-label="View source on GitHub"`, points to `PROJECT_REPOSITORY_URL`, and has the safe external attributes. Assert the playlist anchor has its exact visible name, `href={FESTIVAL_PLAYLIST_URL}`, and the same attributes.

  In `src/styles.test.ts`, assert `.header-source-link` has 44px minimum interaction dimensions and `.app-header` remains the positioning container; this catches a visually un-targetable icon.

- [ ] **Step 2: Run focused tests and verify RED**

  Run: `npm test -- src/config/site.test.ts src/App.test.tsx src/styles.test.ts`

  Expected: FAIL because playlist configuration, header/playlist anchors, header styles, and MIT metadata/file are absent.

- [ ] **Step 3: Implement the minimal resource links and MIT terms**

  Add the canonical playlist constant:

  ```ts
  export const FESTIVAL_PLAYLIST_URL =
    "https://open.spotify.com/playlist/7Am6bwWRhhwy4yjcMo3ASA";
  ```

  In the existing `App` header, import Lucide’s `Github` icon and add an anchor using `PROJECT_REPOSITORY_URL`, class `header-source-link`, `aria-label="View source on GitHub"`, `target="_blank"`, and `rel="noreferrer"`. The icon is decorative (`aria-hidden`) because the anchor supplies the accessible name. Add the playlist anchor directly below `.app-header__intro` with exact text `Listen to the festival playlist`, its configuration constant, and safe external attributes.

  Add `.header-source-link` styles with `position: absolute`, a 2.75rem × 2.75rem minimum target, a clearly visible border/background/focus state, and a z-index above the decorative header ring. Give the playlist link visible focus and sufficient contrast without copying Spotify or WOH branding.

  Add a root `LICENSE` containing the unmodified MIT licence with `Copyright (c) 2026 Ché Armstrong`, and add `"license": "MIT"` to `package.json`.

- [ ] **Step 4: Update README resources and licence scope**

  In the resources section, link the canonical playlist as an external companion and explain that Field Notes does not embed or fetch it at runtime. Add a `## Licence` section that says the project’s original code and documentation are available under the MIT License, then explicitly excludes We Out Here and Spotify names, marks, logos, illustrations, official map artwork, and external content. Preserve the existing unofficial attribution.

- [ ] **Step 5: Run focused tests and verify GREEN**

  Run: `npm test -- src/config/site.test.ts src/App.test.tsx src/styles.test.ts`

  Expected: PASS; exact URLs, labels, new-tab protections, icon target style, MIT metadata/file, and no-tracking playlist destination are covered.

- [ ] **Step 6: Commit the completed task**

  ```sh
  git add src/config/site.ts src/config/site.test.ts src/App.tsx src/App.test.tsx src/styles.css src/styles.test.ts package.json README.md LICENSE
  git commit -m "feat: add planner sharing links and licence"
  ```

### Task 2: Orientation-stable phone schedule

**Files:**
- Modify: `src/components/BrowseView.tsx`
- Modify: `src/components/BrowseView.test.tsx`
- Modify: `src/styles.css`
- Modify: `src/styles.test.ts`

**Interfaces:**
- Produces exported `PHONE_LAYOUT_QUERY`, exactly `(max-width: 42rem), (pointer: coarse) and (orientation: landscape) and (max-height: 32rem)`.
- `usePhoneLayout()` consumes that query. In timetable mode, phone layout mounts `PhoneAgenda`; non-phone layout mounts `Timetable`.

- [ ] **Step 1: Write failing responsive behaviour and CSS-equivalence tests**

  Adapt the `mockPhoneLayout` helper in `src/components/BrowseView.test.tsx` so its `media` is `PHONE_LAYOUT_QUERY`. Add two focused tests:

  ```tsx
  it("keeps the agenda and schedule wording on a short coarse-pointer landscape phone", async () => {
    mockPhoneLayout(true);
    const user = userEvent.setup();
    render(<BrowseView events={events} favouriteIds={new Set()} onToggleFavourite={() => undefined} />);

    expect(screen.getByRole("button", { name: "Show schedule" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Show schedule" }));
    expect(screen.getByRole("region", { name: "Thursday agenda" })).toBeVisible();
    expect(screen.queryByLabelText("Programme timetable")).not.toBeInTheDocument();
  });

  it("uses timetable wording and mounts the timeline on a desktop layout", async () => {
    mockPhoneLayout(false);
    const user = userEvent.setup();
    render(<BrowseView events={events} favouriteIds={new Set()} onToggleFavourite={() => undefined} />);

    expect(screen.getByRole("button", { name: "Show timetable" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Show timetable" }));
    expect(screen.getByLabelText("Programme timetable")).toBeVisible();
    expect(screen.queryByRole("region", { name: "Thursday agenda" })).not.toBeInTheDocument();
  });
  ```

  In `src/styles.test.ts`, load the stylesheet as CSSOM and assert a media rule has the exact `PHONE_LAYOUT_QUERY` condition and contains phone layout declarations such as the sticky `.planner-nav`; this ensures CSS shares the React phone policy.

- [ ] **Step 2: Run the focused tests and verify RED**

  Run: `npm test -- src/components/BrowseView.test.tsx src/styles.test.ts`

  Expected: FAIL because the existing `(max-width: 42rem)` policy uses timetable wording on a phone and does not cover short landscape phones.

- [ ] **Step 3: Implement a shared orientation-stable policy**

  In `BrowseView.tsx`, export:

  ```ts
  export const PHONE_LAYOUT_QUERY =
    "(max-width: 42rem), (pointer: coarse) and (orientation: landscape) and (max-height: 32rem)";
  ```

  Replace every `PHONE_LAYOUT_QUERY` consumer with this constant. Keep the existing exclusive conditional mount. Change the toggle’s list-mode label to `Show schedule` when `isPhoneLayout` is true, otherwise `Show timetable`; timetable/schedule mode always returns `Show list`.

  Replace the stylesheet’s `@media (max-width: 42rem)` rule with the equivalent comma-separated condition, so phone navigation, controls, safe-area detail sheet, and agenda remain styled correctly in short landscape phone orientation.

- [ ] **Step 4: Run focused tests and verify GREEN**

  Run: `npm test -- src/components/BrowseView.test.tsx src/styles.test.ts`

  Expected: PASS; short landscape phones use the agenda and schedule wording, desktop uses the timeline and timetable wording, and the equivalent CSS phone rule exists.

- [ ] **Step 5: Browser QA**

  Run the production preview and inspect:

  - 390 × 844: Browse’s control says **Show schedule** and opens a full-title agenda.
  - a coarse-pointer short landscape phone viewport (e.g. 844 × 390): it still says **Show schedule**, shows the agenda, and has no page-level overflow.
  - 1280 × 900: control says **Show timetable** and opens the time-and-venue chart.
  - Header GitHub icon and playlist link have visible focus, resolve externally when connected, and the console has no errors.

- [ ] **Step 6: Run full verification and commit**

  Run:

  ```sh
  npm test
  npm run build
  git diff --check
  ```

  Then commit:

  ```sh
  git add src/components/BrowseView.tsx src/components/BrowseView.test.tsx src/styles.css src/styles.test.ts
  git commit -m "fix: keep phone programme schedule consistent"
  ```
