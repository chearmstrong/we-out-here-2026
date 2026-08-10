# Operational planner UX refinement — final fix report

## Status

Complete. The three final-review findings were reproduced with focused RED
tests, fixed minimally, and verified against the full suite and production
build. The pre-existing `package-lock.json` change remains unmodified and is
excluded from this fix commit.

## Fixes

- Note persistence feedback now lives inside the isolated event-details dialog:
  durable writes announce **Note saved locally.**; failed writes say the note is
  available for this visit only. The shell exposes the same storage warning in
  Browse and Plan after the dialog closes, and action/storage copy shares one
  global status region.
- Undo records the originating event-action kind and restores focus to the
  remounted equivalent control, falling back to another event action or the
  active planner navigation control. Regressions cover My plan and a phone
  **Saved only** row that disappears on removal.
- The desktop timetable now uses one contained two-axis scroll region. Its time
  axis remains sticky at the top and venue labels share the horizontal scroll
  ancestor, so they remain pinned while comparing later times.
- README readiness placement now states that a waiting update notice can appear
  before the readiness message.

## TDD evidence

- Initial focused RED: 8 expected failures across modal note status, Browse
  storage feedback, both Undo focus paths, and nested timetable scrolling.
- Self-review RED: stale **Note saved locally.** survived a saved-state toggle.
  The dialog now resets note feedback when its event or saved state changes.
- Focused GREEN: 6 files, 103 tests passed before the final stale-feedback
  regression; the added dialog regression then passed independently.

## Automated verification

- `npm test` — 17 files, 221 tests passed.
- `npm run build` — TypeScript and Vite build passed; 1,604 modules transformed;
  PWA generated 8 precache entries (493.65 KiB).
- `git diff --check` — passed before staging; rerun as a commit gate.

## Browser QA

- In-app browser, production preview:
  `http://127.0.0.1:4178/we-out-here-2026/`, desktop 1440×900.
- Page identity, meaningful DOM, and framework-overlay checks passed; browser
  console warning/error log was empty.
- Timetable metrics: outer region `overflow-x: auto`, `overflow-y: auto`,
  1068×604 viewport over 1824×3922 content; nested lanes computed `visible` on
  both axes; time axis computed `sticky/top: 0`; venue heading computed
  `sticky/left: 0`.
- After a real 650px horizontal scroll, the venue and axis labels remained at
  x=186 while the scroll-region edge was x=184, confirming pinned comparison
  context visually and geometrically.
- A separate phone browser pass was not repeated in this final wave. Phone
  **Saved only** removal/Undo/remount/focus and connected-target behavior are
  covered by the new integrated App regression; the full responsive suite and
  production build passed.

## Concerns / limits

- No controlled storage-unavailable fixture is shipped in the production
  preview, so truthful failure feedback is verified automatically rather than
  by changing browser storage during QA.
- No dependency, URL, runtime fetch, storage backend, service-worker lifecycle,
  or calendar-import behavior changed.
