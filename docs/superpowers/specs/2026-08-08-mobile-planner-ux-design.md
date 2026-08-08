# Mobile planner UX refinement design

## Purpose

Make Field Notes calmer and faster to use on a phone before and during the festival, without changing its local-only, offline-first architecture.

## Browse defaults and search

- The Browse screen initially selects Thursday before the festival, the current `Europe/London` Programme Day during the festival, and All days afterwards.
- A selected day is a browsing aid, not a restriction on direct lookup. Entering a non-empty search query searches the full weekend and shows each matching event's Programme Day.
- Clearing the query restores the selected-day browse results.
- Existing day, venue, and category controls remain available for deliberate filtering.

## Responsive programme views

- Wider screens retain the visual venue-and-time timeline: its time axis and venue lanes remain the best way to compare simultaneous events and gaps.
- At the phone breakpoint, "Show timetable" becomes an accessible, time-sorted day agenda. Events keep their full title, start/end time, venue, category tag, and save/detail actions; no set is compressed into a narrow timed block.
- The agenda is grouped by Programme Day when All days is explicitly selected and by time within each day. It does not rely on sideways chart scrolling.

## Mobile layout corrections

- The decorative red hero ring is rendered behind the title and copy so it never obscures text.
- The sticky planner navigation honours `env(safe-area-inset-top)` and has an opaque background, avoiding overlap with iPhone browser chrome/Dynamic Island while scrolling.
- The offline-status panel receives the same horizontal inset as the app shell plus bottom safe-area padding, so its text does not sit against the viewport edge.

## Accessibility and performance

- Search result counts and controls retain accessible labels and keyboard behavior.
- The agenda uses semantic time headings and existing event-card interactions instead of duplicated bespoke controls.
- Rendering uses memoised filtered event data; the full visual timeline is not mounted for a phone agenda.

## Testing and acceptance

- Tests cover the date-aware default day, global search despite an active day, restored selected-day results after clearing search, and the phone agenda's full event labels.
- Visual/browser QA covers the screenshots' hero, sticky-navigation safe area, offline-status inset, phone browse flow, and desktop timeline preservation.
- The existing test suite and production/PWA build must pass.
