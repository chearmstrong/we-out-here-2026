# Family Programme snapshot and quick-filter implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the verified We Out Here 2026 Family Programme as bundled offline data, and make its full set of Family events easy to browse without hiding them by default.

**Architecture:** Add a small optional location-status field to `FestivalEvent` and render a transparent check-on-site hint only for Family rows whose cards name an area/partner rather than a physical location. Keep the Family snapshot in its own local data module and combine it with the existing snapshot. The Family quick filter is a stateless projection of the existing `category` filter, so it composes with existing search, day, and venue filtering without persistence or a new filter model.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, CSS, Markdown.

## Global Constraints

- The complete programme remains the default Browse view; **Family programme** is a selected/unselected quick-filter chip, not a checkbox or source multi-select.
- The Family quick filter returns all `family` events, including existing BookLove entries and the newly transcribed Family Programme sessions, while existing day/venue/search filters still apply.
- Add every explicitly timed Family Programme activity from the seven dated official cards: Thursday; Friday parts 1–2; Saturday parts 1–2; Sunday parts 1–2.
- Add new Family rows as `category: "family"` and `source: "family-programme"`; reconcile an exact pre-existing event rather than duplicating it.
- Preserve exact official title spelling and the official area/partner label. Use an explicit physical venue when printed; otherwise show **Location: check on site** and never invent directions.
- No runtime fetches, Facebook embed/artwork, map data, server, account, sync, analytics, dependencies, or separate Family screen.
- Preserve local-only itinerary storage, PWA lifecycle, calendar export, external links, current desktop/phone schedule behaviour, and existing categories.
- Before the Family snapshot task can commit, an independent subagent must reconcile every transcribed row against all seven supplied official cards and return an explicit verdict covering row count, title, day, area/venue, start/end time, location status, and repeated-session count. Fix every factual mismatch and re-check the amended module before committing.

---

### Task 1: Model Family source and transparent location status

**Files:**
- Modify: `src/domain/festival.ts:1-22`
- Modify: `src/data/scheduleValidator.ts:1-71`
- Modify: `src/data/scheduleValidator.test.ts:1-110`
- Modify: `src/components/EventCard.tsx:1-150`
- Modify: `src/components/EventCard.test.tsx`
- Modify: `src/components/EventDetailsDialog.tsx:130-155`
- Modify: `src/components/EventDetailsDialog.test.tsx`

**Interfaces:**
- Consumes: existing `FestivalEvent`, `ProgrammeSource`, `EventCard`, and `EventDetailsDialog` contracts.
- Produces:

  ```ts
  export const PROGRAMME_SOURCES = [
    "music-programme",
    "wider-programme",
    "family-programme",
  ] as const;
  export type ProgrammeSource = (typeof PROGRAMME_SOURCES)[number];
  export type EventLocationStatus = "check-on-site";

  export type FestivalEvent = {
    // existing required fields unchanged
    locationStatus?: EventLocationStatus;
  };
  ```

- [ ] **Step 1: Write failing domain and rendering tests**

  Add a valid fixture with `source: "family-programme"` and `locationStatus: "check-on-site"`. Assert the validator accepts it; assert it rejects `source: "family-feed"` and `locationStatus: "confirmed"` with clear errors.

  In `EventCard.test.tsx` and `EventDetailsDialog.test.tsx`, render a Family fixture:

  ```ts
  const familyAreaEvent: FestivalEvent = {
    ...validEvent,
    id: "thursday:scorcha-skate-school:skateboarding-workshops",
    title: "SKATEBOARDING WORKSHOPS",
    venue: "Scorcha Skate School",
    category: "family",
    source: "family-programme",
    locationStatus: "check-on-site",
  };
  ```

  Assert cards retain the official label and render `Location: check on site`; assert details show `Where` as the official label plus the same hint. Render an ordinary Music fixture and assert that hint is absent.

- [ ] **Step 2: Prove RED**

  Run:

  ```sh
  npm test -- src/data/scheduleValidator.test.ts src/components/EventCard.test.tsx src/components/EventDetailsDialog.test.tsx
  ```

  Expected: FAIL because the source union, location status validation, and hint rendering do not exist.

- [ ] **Step 3: Implement the smallest compatible contract**

  Export `PROGRAMME_SOURCES`/`ProgrammeSource` and optional `EventLocationStatus` from `src/domain/festival.ts`. In `validateSchedule`, construct a source set from `PROGRAMME_SOURCES`; if `locationStatus` is present and not `"check-on-site"`, append `Unknown event location status: <value>`. Do not require a status for existing events.

  Add a short visual and accessible `Location: check on site` string after `event.venue` in `EventCard` only when `locationStatus === "check-on-site"`. In details, add a `Location` definition-list row with value `Check on site` under the unchanged `Where` row. Do not alter existing event wording when status is absent.

- [ ] **Step 4: Prove GREEN and commit**

  Run the Step 2 command and then:

  ```sh
  git add src/domain/festival.ts src/data/scheduleValidator.ts src/data/scheduleValidator.test.ts src/components/EventCard.tsx src/components/EventCard.test.tsx src/components/EventDetailsDialog.tsx src/components/EventDetailsDialog.test.tsx
  git commit -m "feat: label unconfirmed Family locations"
  ```

### Task 2: Add the Family Programme quick filter

**Files:**
- Modify: `src/components/Filters.tsx:1-83`
- Modify: `src/components/BrowseView.test.tsx`
- Modify: `src/styles.css` (programme-filter section only)
- Modify: `src/styles.test.ts`

**Interfaces:**
- Consumes: `BrowseFilters.category`, `FiltersProps.onChange`, and existing `filterBrowseEvents` category semantics.
- Produces: a `Family programme` button whose `aria-pressed` is `filters.category === "family"`; activating it changes only `category` between `"family"` and `"all"`.

- [ ] **Step 1: Write a failing interaction regression**

  In `BrowseView.test.tsx`, create one existing BookLove Family fixture, one `family-programme` fixture, and one Music fixture. Assert default Browse contains all three. Click `Family programme`, assert `aria-pressed="true"`, assert both Family fixtures remain and the Music fixture is absent. Select Friday and set a query that matches only the Family Programme fixture; assert only that one row remains. Click the chip again, assert `aria-pressed="false"`, category returns to `all`, and the existing query/day selections are unchanged.

- [ ] **Step 2: Prove RED**

  Run:

  ```sh
  npm test -- src/components/BrowseView.test.tsx src/styles.test.ts
  ```

  Expected: FAIL because no `Family programme` control exists.

- [ ] **Step 3: Implement the filter as a category shortcut**

  Add this button before the existing select controls in `Filters`:

  ```tsx
  <button
    className="family-programme-filter"
    type="button"
    aria-pressed={filters.category === "family"}
    onClick={() =>
      onChange({
        ...filters,
        category: filters.category === "family" ? "all" : "family",
      })
    }
  >
    Family programme
  </button>
  ```

  Style it as a compact 44px-or-larger selected/unselected chip that wraps safely at 390px and has visible focus. Do not add state, `localStorage`, a source filter, or a different Day schedule path.

- [ ] **Step 4: Prove GREEN and commit**

  Run the Step 2 command and then:

  ```sh
  git add src/components/Filters.tsx src/components/BrowseView.test.tsx src/styles.css src/styles.test.ts
  git commit -m "feat: add Family Programme quick filter"
  ```

### Task 3: Transcribe, reconcile, and publish the Family Programme snapshot

**Files:**
- Create: `src/data/familyProgramme.ts`
- Modify: `src/data/schedule.ts:1-5, end of event array`
- Modify: `src/data/scheduleValidator.test.ts`
- Modify: `docs/content-sources.md`
- Modify: `README.md:3,42-44`

**Source cards (read-only verification input; do not copy them into the repository):**

```text
/tmp/codex-remote-attachments/019fdda3-7861-7f13-9178-0673dfab8368/EA5F6853-A0DE-410C-97A9-E047F53E6E29/1-img_2_1786288386361.jpg  Thursday
/tmp/codex-remote-attachments/019fdda3-7861-7f13-9178-0673dfab8368/EA5F6853-A0DE-410C-97A9-E047F53E6E29/7-img_3_1786288392072.jpg  Friday part 1
/tmp/codex-remote-attachments/019fdda3-7861-7f13-9178-0673dfab8368/EA5F6853-A0DE-410C-97A9-E047F53E6E29/2-img_4_1786288397553.jpg  Friday part 2
/tmp/codex-remote-attachments/019fdda3-7861-7f13-9178-0673dfab8368/EA5F6853-A0DE-410C-97A9-E047F53E6E29/6-img_5_1786288402874.jpg  Saturday part 1
/tmp/codex-remote-attachments/019fdda3-7861-7f13-9178-0673dfab8368/EA5F6853-A0DE-410C-97A9-E047F53E6E29/8-img_6_1786288408444.jpg  Saturday part 2
/tmp/codex-remote-attachments/019fdda3-7861-7f13-9178-0673dfab8368/EA5F6853-A0DE-410C-97A9-E047F53E6E29/3-img_7_1786288417267.jpg  Sunday part 1
/tmp/codex-remote-attachments/019fdda3-7861-7f13-9178-0673dfab8368/EA5F6853-A0DE-410C-97A9-E047F53E6E29/5-img_8_1786288423147.jpg  Sunday part 2
```

**Interfaces:**
- Consumes: `FestivalEvent`, `ProgrammeSource`, and the seven dated official cards.
- Produces: `export const familyProgramme: readonly FestivalEvent[]` and the schedule snapshot `schedule: readonly FestivalEvent[]` containing the existing snapshot plus reconciled Family entries.

- [ ] **Step 1: Write the failing snapshot-integrity tests**

  Add tests that require a non-empty `familyProgramme` data module, validate it with `validateSchedule`, require every entry to have `category: "family"` and `source: "family-programme"`, and assert representative exact entries:

  ```ts
  expect(familyProgramme).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        programmeDay: "thursday",
        title: "PIZZA MAKING WITH RUTH'S KITCHEN",
        venue: "Discover",
        startsAt: "2026-08-20T14:00:00+01:00",
        endsAt: "2026-08-20T18:00:00+01:00",
        locationStatus: "check-on-site",
      }),
      expect.objectContaining({
        programmeDay: "saturday",
        title: "FAMILY ROLLERSKATING HOUR",
        venue: "Roller Rink",
        startsAt: "2026-08-22T11:00:00+01:00",
        endsAt: "2026-08-22T12:00:00+01:00",
      }),
      expect.objectContaining({
        programmeDay: "sunday",
        title: "KINETIKA BLOCO PARADE",
        venue: "Parade starts at Family Area",
        startsAt: "2026-08-23T16:00:00+01:00",
        endsAt: "2026-08-23T16:30:00+01:00",
        locationStatus: "check-on-site",
      }),
    ]),
  );
  ```

  Also assert the combined snapshot validates, has unique IDs, includes all three sources, and includes Big Fish Little Fish exactly once with `category: "family"` rather than a duplicate entry.

- [ ] **Step 2: Prove RED**

  Run:

  ```sh
  npm test -- src/data/scheduleValidator.test.ts
  ```

  Expected: FAIL because `familyProgramme.ts`, the third source, representative rows, and reconciliation do not exist.

- [ ] **Step 3: Perform the two-pass factual transcription**

  First pass: transcribe each printed timed line into `familyProgramme.ts` exactly as the seven cards show. Use programme dates Thursday `2026-08-20`, Friday `2026-08-21`, Saturday `2026-08-22`, Sunday `2026-08-23`, all with `+01:00`; an end time of `00:00` rolls into the following calendar date. Use the card heading as `venue`; set `locationStatus: "check-on-site"` unless that heading explicitly names a physical venue/location.

  Use one event per printed interval. For example, Friday NYJO’s three Tuba drop-in workshops become three events with stable `session-1`, `session-2`, and `session-3` ID suffixes; Mortimer’s separately printed sessions become separate events. Do not split a printed drop-in range.

  Second pass: use the seven cards again to reconcile every title, heading, start/end, day, session count, and repeated-ID suffix. Resolve one exact existing Music event, `saturday:love-serve-bar:big-fish-little-fish-family-rave`, by retaining its stable ID and changing its category to `family`; do not add a Family Programme duplicate. If any further exact row already exists, apply the same retain-and-reclassify rule and document it in the commit/report.

  Import and spread `familyProgramme` into the exported `schedule`; do not rewrite the existing Music/Wider rows. Keep `SCHEDULE_VERSION`/`SCHEDULE_LAST_CHECKED` as the verified snapshot date selected after the second pass.

- [ ] **Step 4: Update provenance and release documentation**

  In `docs/content-sources.md`, add **Family Programme** as a third source: official We Out Here Facebook post, published 9 August 2026, transcribed from the seven dated cards; add the post permalink if it is available from the user. State that the app bundles factual metadata only and does not embed or fetch Facebook or card artwork at runtime.

  Replace the record totals and checked date/version only with values measured from the final data. In `README.md`, replace “music and wider programmes” with “music, wider, and Family programmes” and retain the existing manual verified snapshot/no-runtime-fetch wording.

- [ ] **Step 5: Prove GREEN and complete data verification**

  Run:

  ```sh
  npm test -- src/data/scheduleValidator.test.ts
  npm test
  npm run build
  git diff --check
  ```

  Record final total events, Family source rows, and combined Family-category rows in the task report. A second reviewer must compare the final module against all seven source cards before this task may commit.

- [ ] **Step 6: Browser-check the released behaviour and commit**

  Use a production preview in the in-app browser. At 390 × 844, verify All programme remains the default, **Family programme** shows BookLove and newly added rows, a check-on-site event exposes its hint in details, a physical-location event does not, saving/removing works, and the phone Day schedule has no overflow. At 1280 × 900, verify the Family filter applies to list and timetable. Verify a cached app remains usable offline after the new snapshot build. If the browser is unavailable, record this exact limitation and do not substitute another browser tool without approval.

  ```sh
  git add src/data/familyProgramme.ts src/data/schedule.ts src/data/scheduleValidator.test.ts docs/content-sources.md README.md
  git commit -m "feat: add Family Programme snapshot"
  ```

  Before the commit, dispatch a dedicated image-reconciliation subagent. It must inspect every one of the seven source-card image paths above and compare them independently against the final uncommitted `src/data/familyProgramme.ts`. It must report the final row count and explicitly reconcile every row's title, programme day, official area/venue label, start/end, location status, and repeated-session count. Resolve every mismatch, then dispatch the same independent check again over the amended module. This data-verification gate is separate from the normal task code review.

## Plan self-review

- Spec coverage: Task 1 introduces only the source/location contract needed to avoid inventing venues; Task 2 implements the requested default-all Family quick filter; Task 3 adds and reconciles all timed Family data, provenance, documentation, validation, and browser verification.
- Placeholder scan: all source cards, example rows, exact UI text, interfaces, and verification commands are specified. Final snapshot totals are deliberately measured after two-pass transcription rather than guessed from the cards.
- Type consistency: `ProgrammeSource`, `EventLocationStatus`, `FestivalEvent.locationStatus`, `familyProgramme`, and the `Family programme` category shortcut are defined once and used consistently across the tasks.
