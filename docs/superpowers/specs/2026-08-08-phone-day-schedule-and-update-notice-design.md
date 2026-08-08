# Phone Day schedule and update notice design

## Purpose

Keep Browse focused on programme discovery while giving phone users a compact, useful answer to “what’s on next?”. The phone Schedule must be materially different from Browse cards: time-first, one day at a time, and quick to scan.

## Experience

- **Browse** remains the filterable discovery view. Search and day, venue, and category filters continue to work as they do now.
- On phone-sized screens, **Schedule** switches to a compact **Day schedule** for the selected Programme Day. It never shows more than one day at a time.
- Each chronological row shows start/end time, title, venue, category indicator, and saved state. A row is a 44px-or-larger button: tapping it opens existing event details, where the person can save/remove it and edit a note.
- Rows are not full Browse-style cards: no large repeated headings, card actions, or second save button in each row. There is no horizontal timeline.
- The selected Programme Day continues to default to Thursday before the festival and the current day during it. Changing the day updates both Browse and Day schedule; a non-empty search still follows the existing whole-weekend search policy.
- Phone portrait and landscape use the same Day schedule. Rotation never reveals the desktop timetable.
- On larger screens, the existing **Show timetable** / **Show list** control and visual time-and-venue chart remain.
- When a planner update waits, a compact notice appears directly below **My plan** / **Browse** navigation. It explains that saved plans stay in this browser and the newer version is used after closing and reopening Field Notes. It has one **Use update next time** button; there is no checkbox, dismissal state, or permanent preference.

## Technical design

- Keep the existing pointer-independent `PHONE_LAYOUT_QUERY` as the shared React/CSS definition of a phone-sized display.
- Retain `BrowseView` as the owner of filters and view state. Replace the existing card-like `PhoneAgenda` with a `PhoneDaySchedule` that consumes `visibleEvents`, filters to the selected Programme Day, sorts via `compareByStartThenTitle`, and exposes a single details opener per row. It does not create a new persistence or scheduling model.
- On phone layouts, the toggle labels are **Show schedule** and **Show browse**. When schedule is active, render only `PhoneDaySchedule`; when browse is active, render only `EventCardList`. Desktop keeps its current list/timetable branch.
- Preserve event-dialog opener and fallback-focus behaviour across a rotation or a schedule/browse switch.
- Extract `UpdateNotice` from the lower offline-status area. `PlannerRoot` passes the existing lifecycle state and explicit refresh callback to `App`; `App` renders the notice after navigation only for `updating`. `OfflineStatus` keeps offline readiness, Home Screen guidance, and schedule-check date without a duplicate update action.
- Update README to explain the phone Day schedule, desktop timetable, and top waiting-update notice accurately.

## Quality boundaries

- Component tests cover single-day rendering, chronological row order, row time/title/venue/category/saved semantics, details opening, and phone-only exclusive Browse/Day-schedule rendering at 390×844 and 956×440.
- Existing filter/default, favourite, note, clash, and dialog focus coverage remains valid; desktop timetable tests remain.
- Tests cover the top update notice’s exact action/copy, explicit one-call acceptance, absence outside `updating`, and absence of a duplicate lower action.
- Browser QA covers phone portrait, wide landscape, and desktop: scanability, 44px controls, no overflow, save/details flow, top update notice placement, and no console errors.
- No schedule data, PWA update mechanics, local-only storage/privacy, dependencies, runtime fetches, analytics, external links, or calendar/export behaviour changes.
