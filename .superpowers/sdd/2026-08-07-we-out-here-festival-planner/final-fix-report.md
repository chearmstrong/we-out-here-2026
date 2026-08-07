# Final review fix report

Date: 8 August 2026
Baseline: `071dc7c`

## Findings addressed

- Narrowed the update contract in the UI, README, release instructions, design, and plan. An open planner is never reloaded automatically; allowing an update still requires closing and reopening, while an ignored waiting worker may activate after every controlled app client closes. No durable version acceptance is claimed.
- Made schedule reconciliation durable in the existing itinerary key. Explicit ID mappings and mapped Event Notes are written back, pending removed-ID notices survive reloads, and dismissing a notice persists. Failed writes retain the reconciled or dismissed state for the current visit and set `persisted: false` without rereading stale storage.
- Replaced grouped timetable cards with a temporal chart. Each Programme Day has a labelled hourly axis, sticky venue rows, events positioned by start and duration, overlap lanes, visible gaps, horizontal mobile scrolling, details/save controls, screen-reader clash descriptions, and 44 px minimum targets. Short events retain an exact-width duration marker inside the larger interaction surface.
- Split active Current Programme Day from upcoming Next Programme Day so a plan gap no longer labels a future day as current.
- Added RFC 5545 content-line folding at 75 UTF-8 octets, including the continuation-space budget, with long title and multibyte Event Note coverage.

## TDD evidence

Each behavior was introduced with a focused failing test before its implementation:

- `src/storage/itineraryStore.test.ts`: canonical write-back, durable dismissal, failed reconciliation write, failed dismissal write.
- `src/planner/itinerary.test.ts` and `src/components/PlanView.test.tsx`: Current/Next Programme Day gap semantics.
- `src/components/BrowseView.test.tsx`: labelled time axis, start/duration positioning, timetable detail/save path, screen-reader clash descriptions, and 44 px targets for ten-minute events.
- `src/calendar/ics.test.ts`: long ASCII title and multibyte Event Note folding.
- `src/pwa/OfflineStatus.test.tsx`: browser-accurate update guidance and action label.

## Verification

- `npm test`: 13 files, 108 tests passed.
- `npm run build`: TypeScript and Vite production build passed; Workbox generated the service worker and precached 8 entries.
- `git diff --check`: passed.
- In-app browser QA on a clean local origin:
  - Page identity and main content loaded with no framework overlay or console warnings/errors.
  - The unfiltered timetable rendered all 723 events in approximately 294 ms in the QA browser.
  - Thursday / Main Stage rendered six time-positioned events; Kotoa was at 40 px with an 80 px duration width, followed by later events at increasing offsets.
  - Opening Kotoa from the timetable showed the accessible details dialog and save action while isolating background navigation.
  - At 390 × 844, the page had no horizontal overflow; the timetable scroller was 354 px wide with 1,344 px scrollable content; the inline save target measured 44 × 44 px.
  - The shortest real event retained its exact 20 px duration marker while its event container, details control, and save control each measured at least 44 px; no console warnings/errors were emitted.

The common preview origins initially returned an older app from a previously installed service worker. Browser QA therefore used `http://localhost:4174/we-out-here-2026/`, a clean origin, after the production build itself had passed.

## Remaining manual release check

The deployed update release should still be exercised with two real browser clients: allow the waiting update in one run, and leave it waiting until all Field Notes clients close in another. The documented release sequence now calls out both paths.
