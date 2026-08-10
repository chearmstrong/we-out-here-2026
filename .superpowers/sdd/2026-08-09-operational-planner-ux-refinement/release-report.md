# Operational planner UX refinement — release report

Release verification checklist was recorded before final checks. Results below
cover the local production/PWA preview only; no deployment is authorised by
this report.

## Automated verification

- [x] `npm test` — 17 test files and 214 tests passed. Coverage includes
  retained Browse context; All-days grouping; inline Save/Saved and dialog
  isolation; compact header; More filters/Clear all; canonical venues;
  persistence-aware note feedback/Undo; calendar download acknowledgement;
  sticky desktop timetable; and footer copy.
- [x] `npm run build` — TypeScript and Vite production build passed; 1,604
  modules transformed and the PWA generated 8 precache entries (492.47 KiB).
- [x] `git diff --check` — exited 0 with no whitespace output.

## Browser QA — desktop 1440×900

- [x] At 1440×900 on `http://localhost:4176/we-out-here-2026/`, the empty
  and populated-plan states rendered; **Saved for offline use** appeared
  directly below planner navigation, while the Home Screen guidance remained
  a separate secondary surface.
- [x] Browse retained `Kotoa` after My plan → Browse. **More filters** exposed
  the single canonical Love Serve Bar choice; its active summary, **Clear all
  filters**, Family Programme state, and the **No events found** state worked.
- [x] The desktop timetable mounted with a computed sticky time axis and no
  document overflow (`clientWidth` = `scrollWidth` = 1440).
- [x] The populated-plan view kept the desktop header intro/playlist visible.
- [x] Browser console warning/error log was empty. No controlled
  storage-unavailable or update-ready fixture is included in the production
  preview; their lifecycle/UI branches are covered by the passing automated
  suite.

## Browser QA — phone 390×844

- [x] At 390×844, readiness, separate Home Screen guidance, empty/populated
  states, and the operational phone layout rendered without overflow
  (`clientWidth` = `scrollWidth` = 390).
- [x] The existing Browse context also remained available on phone; desktop
  checks exercised More filters, canonical venue, Clear all, Family Programme,
  and no-results against the same production artifact.
- [x] Schedule **All days** rendered Thursday, Friday, Saturday, and Sunday in
  that order. No `.timetable` mounted. Inline Save for Kotoa left dialog count
  at 0; row-body details opened, Escape returned focus to the row, and Undo
  restored the saved state.
- [x] The preview rendered `Note saved locally.` after a durable note save and
  `Calendar download started: we-out-here-2026-plan.ics` after the browser
  download trigger. Console warning/error log was empty.
- [x] No controlled storage-unavailable or update-ready production fixture is
  shipped. Those browser-only states remain unexercised here and are covered
  by automated tests, not represented as live PWA/update proof.

## Offline/update caveats

- [x] The observed readiness status proves only that this preview/browser
  session reached its cached-ready state. It does not prove a real first-ever
  offline load.
- [x] A real deployed service-worker update and real calendar-application
  import were not exercised. No production URL is recorded because deployment
  was not authorised. Those outcomes require a deployed or controlled browser
  environment.

## Documentation reconciliation

- [x] README now distinguishes Browse discovery from the phone operational Day
  schedule, documents readiness placement and separate Home Screen storage,
  session-only Browse context, progressive/canonical filters, note feedback,
  bounded Undo, and download-start acknowledgement without promising sync,
  first-load offline, calendar import, or indefinite Undo.
- [x] Original and mobile design specs no longer describe Day schedule as
  details-only or venue/category filters as always visible.
- [x] The refinement design status was changed to implemented only after the
  fresh automated and production-preview checks recorded above.
