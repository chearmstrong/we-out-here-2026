# Mobile planner UX refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the live Field Notes planner calmer on phones with a relevant Programme Day default, reliable weekend-wide search, a readable phone agenda, and safe-area-correct layout.

**Architecture:** Keep filter/date policy in `src/planner/itinerary.ts`, where it can be tested without React. `BrowseView` consumes that policy to derive its initial selection and query-visible events, then mounts either a desktop venue timeline or a phone time-sorted agenda from the responsive viewport state. Styling fixes remain in the existing global stylesheet; no data source, storage schema, network behavior, or dependencies change.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Vite PWA, CSS media queries.

## Global Constraints

- Preserve the verified 723-event local schedule snapshot; make no runtime fetches or backend calls.
- Pin festival-date decisions to `Europe/London`; Programme Day remains distinct from timestamp calendar dates.
- Before the festival Browse defaults to Thursday; during it defaults to the active Programme Day; after it defaults to All days.
- A non-empty search query searches the entire weekend despite the selected Programme Day and displays a day label with each result.
- Preserve desktop’s time-and-venue chart; at `max-width: 42rem`, use a time-sorted agenda with full event titles instead of squeezed chart blocks.
- Maintain current modal, save/remove, clash, note, offline, and keyboard semantics. Do not add dependencies.
- Ensure app content respects iPhone safe areas, has no page-level horizontal overflow at 390px wide, and the hero decoration never covers text.

---

### Task 1: Date-aware browse policy and global search

**Files:**
- Modify: `src/planner/itinerary.ts:12-42`
- Modify: `src/planner/itinerary.test.ts`
- Modify: `src/components/BrowseView.tsx:1-20,255-290`
- Modify: `src/components/BrowseView.test.tsx`

**Interfaces:**
- Produces: `getDefaultBrowseProgrammeDay(at: Date): ProgrammeDay | "all"`.
- Produces: `filterBrowseEvents(events, filters): FestivalEvent[]`, retaining venue/category filters but treating a non-empty query as weekend-wide.
- Consumes: `BrowseFilters`, `ProgrammeDay`, and the existing London-offset timestamps in `FestivalEvent`.

- [ ] **Step 1: Write failing policy tests**

  Add table-driven tests demonstrating the date boundary and query behavior:

  ```ts
  expect(getDefaultBrowseProgrammeDay(new Date("2026-08-19T23:00:00+01:00"))).toBe("thursday");
  expect(getDefaultBrowseProgrammeDay(new Date("2026-08-21T10:00:00+01:00"))).toBe("friday");
  expect(getDefaultBrowseProgrammeDay(new Date("2026-08-24T00:00:00+01:00"))).toBe("all");
  expect(filterBrowseEvents(events, {
    query: "Leaf",
    programmeDay: "thursday",
    venue: "all",
    category: "all",
  })).toEqual([fridayLeafPrinting]);
  ```

- [ ] **Step 2: Run the policy test to verify it fails**

  Run: `npm test -- src/planner/itinerary.test.ts`

  Expected: FAIL because the default-day helper and weekend-wide query semantics do not exist.

- [ ] **Step 3: Implement the minimal planner policy**

  Add a pure festival-date helper using London-pinned local date parts and split query filtering from selected-day filtering:

  ```ts
  export function getDefaultBrowseProgrammeDay(at: Date): ProgrammeDay | "all" {
    const londonDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/London",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(at);
    if (londonDate < "2026-08-20") return "thursday";
    if (londonDate > "2026-08-23") return "all";
    return ({ "2026-08-20": "thursday", "2026-08-21": "friday", "2026-08-22": "saturday", "2026-08-23": "sunday" } as const)[londonDate];
  }
  ```

  Update `filterBrowseEvents` so title query matching ignores `programmeDay` only when `query.trim()` is non-empty; venue/category filtering always remains active.

- [ ] **Step 4: Connect BrowseView to the policy and expose days on global results**

  Initialise `filters.programmeDay` through the helper’s lazy `useState` call. Use `filterBrowseEvents`. When `filters.query.trim()` is non-empty, pass a `showProgrammeDay` boolean to `EventCard` so each result includes `programmeDayLabel(event.programmeDay)` alongside its time/venue.

- [ ] **Step 5: Run focused tests to verify green**

  Run: `npm test -- src/planner/itinerary.test.ts src/components/BrowseView.test.tsx`

  Expected: PASS; BrowseView tests assert Thursday’s default before festival, a Friday match found while Thursday is selected, its visible Friday label, and day-filtered results after the query is cleared.

- [ ] **Step 6: Commit the policy slice**

  ```bash
  git add src/planner/itinerary.ts src/planner/itinerary.test.ts src/components/BrowseView.tsx src/components/BrowseView.test.tsx src/components/EventCard.tsx
  git commit -m "feat: make programme browsing day-first"
  ```

### Task 2: Responsive phone agenda and safe-area layout

**Files:**
- Modify: `src/components/BrowseView.tsx:86-254`
- Modify: `src/components/BrowseView.test.tsx`
- Modify: `src/styles.css:70-145,663-900,1010-1064`

**Interfaces:**
- Consumes: `EventCardListProps`, `programmeDayLabel`, `formatTimeRange`, and the already filtered events.
- Produces: semantic `.phone-agenda` markup mounted only at the phone breakpoint; the existing `.timetable` is mounted only on wider screens.

- [ ] **Step 1: Write failing component tests for the phone agenda**

  Add a test that switches to timetable mode and asserts a semantic agenda entry contains its complete title, London time range, venue, category, and working detail/save buttons:

  ```ts
  await user.click(screen.getByRole("button", { name: "Show timetable" }));
  expect(screen.getByRole("region", { name: "Thursday agenda" })).toHaveTextContent("Short Event");
  expect(screen.getByRole("region", { name: "Thursday agenda" })).toHaveTextContent("13:00–13:10");
  expect(screen.getByRole("button", { name: "View Short Event details from agenda" })).toBeVisible();
  ```

  Include an All-days test that finds separate Thursday and Friday agenda sections.

- [ ] **Step 2: Run the component test to verify it fails**

  Run: `npm test -- src/components/BrowseView.test.tsx`

  Expected: FAIL because no agenda region or agenda-specific controls are rendered.

- [ ] **Step 3: Implement `PhoneAgenda` beside `Timetable`**

  Add a focused component that groups `events` by `programmeDay`, sorts each group with `compareByStartThenTitle`, and renders an article for each full-height event. Reuse `CategoryIcon`, `categoryLabel`, `formatTimeRange`, the supplied favourite/clash state, and the existing `onViewDetails`/`onToggleFavourite` callbacks.

  ```tsx
  <section aria-label={`${programmeDayLabel(programmeDay)} agenda`} className="phone-agenda__day">
    <h3>{programmeDayLabel(programmeDay)}</h3>
    {dayEvents.map((event) => (
      <article key={event.id} className={`phone-agenda__event phone-agenda__event--${event.category}`}>
        <time dateTime={event.startsAt}>{formatTimeRange(event)}</time>
        <p>{event.venue}</p>
        <strong>{event.title}</strong>
        {/* existing detail and save semantics, with agenda-specific accessible names */}
      </article>
    ))}
  </section>
  ```

  Mount exactly one programme view inside timetable mode: the time-sorted agenda at the phone breakpoint and the existing venue timeline on wider screens. This avoids rendering the expensive visual timeline on phones while preserving desktop behaviour.

- [ ] **Step 4: Add the responsive CSS and visual corrections**

  In the `max-width: 42rem` block, lay out `.phone-agenda` as full-width cards with 44px actions; retain the timeline layout on wider screens. Add:

  ```css
  .app-header > * { position: relative; z-index: 1; }
  .app-header::after { z-index: 0; pointer-events: none; }

  @media (max-width: 42rem) {
    .planner-nav { position: sticky; top: env(safe-area-inset-top); z-index: 6; background: var(--paper-light); }
    .offline-status { padding-inline: clamp(1rem, 4vw, 2.5rem); padding-bottom: calc(1rem + env(safe-area-inset-bottom)); }
  }
  ```

  Use the project’s actual offline-status selector after checking `OfflineStatus.tsx`; preserve desktop spacing and avoid introducing page-level horizontal overflow.

- [ ] **Step 5: Run focused tests to verify green**

  Run: `npm test -- src/components/BrowseView.test.tsx src/components/EventCard.test.tsx`

  Expected: PASS; agenda semantics/actions and existing desktop timeline tests both pass.

- [ ] **Step 6: Run visual and accessibility browser checks**

  Run the production preview at 390×844 and a desktop viewport. Confirm:
  - hero ring stays behind kicker/title/intro;
  - sticky navigation remains below the mobile safe area after scroll;
  - offline text has app-shell horizontal/bottom inset;
  - Browse defaults to Thursday before festival; a direct search finds a later-day act with its day label;
  - phone timetable mode presents full labels without horizontal chart scrolling;
  - desktop still presents the horizontal venue timeline;
  - no console warnings/errors or page-level overflow.

- [ ] **Step 7: Run final verification and commit**

  Run: `npm test && npm run build && git diff --check`

  Expected: PASS, then commit:

  ```bash
  git add src/components/BrowseView.tsx src/components/BrowseView.test.tsx src/components/EventCard.tsx src/styles.css
  git commit -m "fix: improve mobile programme browsing"
  ```
