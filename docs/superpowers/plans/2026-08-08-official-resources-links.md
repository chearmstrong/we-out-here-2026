# Official resources links implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the planner’s local-first model and source of truth clearer, with outbound links to its documentation, open-source repository, and official set times.

**Architecture:** Define the three stable external destinations in `src/config/site.ts`. Keep the footer in `App.tsx` as the single visible home for concise explanation and resource links; no route, data request, storage, dependency, or PWA behaviour changes. Maintain `README.md` as the detailed project guide, with `docs/content-sources.md` as the exact schedule-update runbook.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Vite PWA, Markdown.

## Global Constraints

- External links must use `target="_blank"` and `rel="noreferrer"`; they are optional connected-browser exits, not runtime application fetches.
- Keep the planner local-first: no runtime request, embedding, caching, scraping, proxying, or copying of official content.
- Do not add a map link or placeholder until a 2026 official map has a verified stable public URL.
- Preserve the existing unofficial/non-affiliation statement and avoid official logos, illustrations, map artwork, and distinctive visual identity.
- Keep the README accurate about offline first load, browser-local data, updates, calendar export, Pages deployment, and the schedule-snapshot update workflow.

---

### Task 1: Footer resources, configuration, and documentation

**Files:**
- Modify: `src/config/site.ts`
- Modify: `src/config/site.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `README.md`

**Interfaces:**
- Produces `PROJECT_REPOSITORY_URL`, `PROJECT_README_URL`, and `OFFICIAL_SET_TIMES_URL` as exported string constants.
- Consumes those constants from `App.tsx` to render the footer’s external hyperlinks.

- [ ] **Step 1: Write the failing configuration and footer tests**

  In `src/config/site.test.ts`, require the exact destinations:

  ```ts
  import {
    OFFICIAL_SET_TIMES_URL,
    PROJECT_README_URL,
    PROJECT_REPOSITORY_URL,
  } from "./site";

  it("publishes stable public resource destinations", () => {
    expect(PROJECT_REPOSITORY_URL).toBe(
      "https://github.com/chearmstrong/we-out-here-2026",
    );
    expect(PROJECT_README_URL).toBe(`${PROJECT_REPOSITORY_URL}#readme`);
    expect(OFFICIAL_SET_TIMES_URL).toBe(
      "https://weoutherefestival.com/set-times/",
    );
  });
  ```

  In `src/App.test.tsx`, add a footer test that renders `<App />`, obtains each link by accessible name, and asserts its `href`, `target`, and `rel`:

  ```ts
  expect(screen.getByRole("contentinfo")).toHaveTextContent(
    /local-first planner using a verified programme snapshot/i,
  );
  expect(screen.getByRole("link", { name: "How Field Notes works" }))
    .toHaveAttribute("href", PROJECT_README_URL);
  expect(screen.getByRole("link", { name: "View source on GitHub" }))
    .toHaveAttribute("href", PROJECT_REPOSITORY_URL);
  expect(screen.getByRole("link", { name: "Official set times" }))
    .toHaveAttribute("href", OFFICIAL_SET_TIMES_URL);
  for (const link of screen.getAllByRole("link")) {
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  }
  ```

- [ ] **Step 2: Run the focused tests and verify RED**

  Run: `npm test -- src/config/site.test.ts src/App.test.tsx`

  Expected: FAIL because the resource constants and visible footer links do not exist.

- [ ] **Step 3: Add the minimal configuration and footer implementation**

  In `src/config/site.ts`, add:

  ```ts
  export const PROJECT_REPOSITORY_URL =
    "https://github.com/chearmstrong/we-out-here-2026";
  export const PROJECT_README_URL = `${PROJECT_REPOSITORY_URL}#readme`;
  export const OFFICIAL_SET_TIMES_URL =
    "https://weoutherefestival.com/set-times/";
  ```

  Import them into `App.tsx`. In the existing footer, retain both current paragraphs, add the local-first explanatory sentence, then add a labelled `nav` or paragraph group containing exactly the three named anchors with `target="_blank"` and `rel="noreferrer"`. Do not add a map control, request, image, or placeholder.

- [ ] **Step 4: Refresh the README’s user and maintainer guidance**

  Keep the existing sections but make the content easy to scan. It must explicitly cover:

  - how to load the PWA before travelling offline and what browser storage does;
  - saved events, 140-character notes, and local-only data;
  - search/day filters and calendar export without alarms;
  - controlled update behaviour, including closing/reopening after **Allow update**;
  - Node/npm commands, Pages workflow, and post-deploy phone/offline checks;
  - the manual verified-snapshot process, linking to `docs/content-sources.md` for its numbered procedure;
  - the official set-times URL and the project’s unofficial attribution boundary.

- [ ] **Step 5: Run focused tests and verify GREEN**

  Run: `npm test -- src/config/site.test.ts src/App.test.tsx`

  Expected: PASS; resource constants, explanatory text, destinations, and safe new-tab attributes are all covered.

- [ ] **Step 6: Run the full gate and inspect the diff**

  Run:

  ```sh
  npm test
  npm run build
  git diff --check
  ```

  Expected: all tests and production build pass; diff check reports nothing.

- [ ] **Step 7: Commit the completed feature**

  ```sh
  git add src/config/site.ts src/config/site.test.ts src/App.tsx src/App.test.tsx README.md
  git commit -m "feat: add planner resource links"
  ```
