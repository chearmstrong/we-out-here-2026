# Family Programme snapshot and quick-filter design

## Purpose

Add the newly released 2026 We Out Here Family Programme to Field Notes as a verified, offline-capable local Schedule Snapshot. Make it easy to switch from the complete programme to a family-only view without hiding Family activities by default.

## Experience

- The complete programme remains the default Browse view.
- A **Family programme** quick filter shows all events categorised `family`, including the existing BookLove entries and the newly transcribed Family Programme sessions.
- The quick filter combines with the existing Programme Day, venue, and search controls. It is a selected/unselected button or chip, not a checkbox or a source multi-select.
- Every explicitly timed Family Programme activity is included, including repeated workshops and separately printed sessions.
- The app preserves the official area or partner label for every Family activity.
- Where WOH publishes an explicit physical location, show it normally (for example Roller Rink, Family Campsites, The Sanctuary, Love Serve Bar, Boutique Campsite, or Youth Led Stage).
- Where the graphics provide only an area, partner, or activity heading rather than a confirmed physical location, show the official area label plus **Location: check on site** in event details. Do not exclude the activity or invent a venue.
- Direct save/remove, clashes, Day schedule, calendar export, and offline use apply to Family events without a separate family screen.

## Data and provenance

- Treat the official Family Programme graphics supplied from We Out Here’s Facebook post of 9 August 2026 as a third manually verified programme source. Record the post date and, if available, its permalink in `docs/content-sources.md`; do not embed or ship the graphics.
- Extend `ProgrammeSource` with `family-programme`. Add all new rows with `category: "family"` and this source value.
- Add a narrowly scoped optional event location-status/area representation so the UI can distinguish an exact venue from an official area label that requires checking on site. Existing Music and Wider Programme rows retain their present display and filtering behaviour.
- Use stable IDs based on Programme Day, official area/venue label, and normalised title. IDs do not include start time; repeated same-day/same-area titles receive a deterministic `session-N` suffix in printed order.
- For one printed drop-in interval, create one event. For separate printed intervals, create one event per interval. Do not fabricate session boundaries.
- Update snapshot version, checked date, counts, validator expectations, and source documentation only after an independent second pass has reconciled the final transcription against all seven dated schedule cards.

## Boundaries

- Do not introduce runtime fetching, Facebook embedding, copied official artwork, map data, accounts, sync, analytics, dependencies, or a separate Family mini-app.
- Do not claim an unconfirmed area is a physical venue or give directions. The Family filter must not remove events from the default all-programme Browse view.
- Preserve the current local-only itinerary, PWA update lifecycle, external links, calendar export, existing categories, and desktop/phone schedule behaviour.

## Quality checks

- Snapshot tests cover accepted `family-programme` source values, stable IDs, counts by source/day, valid London timestamps, and no ID collisions.
- Filtering tests prove the default Browse view includes Family events and the **Family programme** quick filter shows only `family` events, including existing BookLove events, while day/venue/search filters still apply.
- Event-detail tests prove unconfirmed Family locations expose the official area and **Location: check on site** without affecting explicit venue display.
- Browser QA covers Family filtering, a location-confirmed row, a check-on-site row, saving/removing, Day schedule, mobile overflow, desktop timetable, and offline use after the update.
