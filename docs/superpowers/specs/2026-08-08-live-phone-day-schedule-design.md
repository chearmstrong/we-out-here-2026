# Live phone Day schedule design

## Purpose

Make Day schedule the useful in-the-moment companion during the festival, rather than a smaller rendering of Browse. Browse remains the place to discover and curate the programme; Day schedule answers “what is on now, and what is next?”.

## Experience

- **Browse** remains the discovery surface: search, Programme Day, venue, and category filters; richer event cards; and direct save/remove controls.
- **Day schedule** remains one selected Programme Day at a time and keeps its compact time-first rows. It adds an optional **Saved only** switch, off by default.
- Before the festival, Day schedule starts at the day’s first event. It does not claim that an event is current or next.
- During the festival, Day schedule has an at-a-glance **Now / next** section: an active-event summary when something is running and the next upcoming event. It uses Europe/London time.
- The chronological list is grouped by start time. Finished events are visually quieter and placed in a collapsed **Earlier** section; the person can expand it when needed. Current and future events remain in the main list.
- Rows retain their existing time, title, venue, category, saved state, clash cue, accessible description, and details-only interaction. Saving/removing and Event Notes remain in existing details.
- The Day schedule’s simple controls are the selected day and **Saved only**. It does not replicate Browse search, venue, or category filtering in its primary interface.
- The current top waiting-update notice and larger-screen visual timetable are unchanged.

## Technical design

- Pass the app’s existing clock into `BrowseView`; use the same Europe/London event timestamp parsing used elsewhere to derive `past`, `current`, and `next` schedule events.
- Keep date/time classification in a small pure planner helper. It accepts the complete programme collection, the selected Programme Day, and `now`, then returns grouped visible events plus optional current/next and earlier event IDs. Browse query, venue, and category filters must not affect Day schedule. It must not read storage or use browser APIs.
- `PhoneDaySchedule` consumes that view model. Saved only filters its own selected-day schedule rows without changing Browse filters or persistence.
- A local React state value owns the Saved-only control. It resets only when the component remounts; it does not write localStorage.
- Use semantic headings, buttons, `time` elements, and an accessible expanded/collapsed Earlier control. Keep the 44px target and existing dialog-focus fallback semantics.

## Quality boundaries

- Unit tests cover London time boundaries: before festival, active event, gaps, overlapping events, after day end, and stable chronological grouping.
- Component tests cover Saved only, Now/next visibility only during festival, Earlier collapse/expand, row details/clash/saved semantics, and no regression to Browse filtering or desktop timetable.
- Browser QA covers pre-festival and simulated during-festival phone views at portrait and wide landscape, plus desktop timetable smoke checks, no overflow, and console health.
- No schedule data, storage/privacy model, PWA lifecycle/update notice, dependencies, runtime fetches, analytics, calendar export, or external links change.
