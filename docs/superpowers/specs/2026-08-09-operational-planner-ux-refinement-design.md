# Operational planner UX refinement design

**Date:** 2026-08-09
**Status:** Approved for implementation planning

## Purpose

Improve Field Notes for the real conditions of festival planning: a user needs
to know whether the planner is safe offline, reach a useful programme result
quickly on a phone, return to an unfinished search without losing context, and
make or reverse small plan changes confidently.

This is an operational refinement, not a new visual identity. The existing
original Field Notes palette, editorial hierarchy, card language, local-only
storage model, PWA update lifecycle, and static Schedule Snapshot remain in
place.

## Scope and release shape

Implement the work in two stages in the same repository and chat. Stage 1 is
the festival-critical interaction release; Stage 2 reduces planning friction
and improves recovery and polish. Each stage must pass its focused tests, the
full suite, the production/PWA build, and desktop/phone browser QA before it
is integrated.

Out of scope:

- Accounts, sync, analytics, runtime programme fetching, or new dependencies.
- A visual rebrand, copied official assets, or a separate Family planner.
- Automatic reminders, push notifications, map/routing features, or batch
  plan editing.

## Stage 1 — festival-critical flow

### Offline readiness

Place a compact status surface directly below the planner navigation. It must
be visible before the user reaches the footer:

- Before caching succeeds: explain that one connected visit is still required
  before relying on Field Notes offline.
- Once ready: confirm that the planner is saved for offline use.
- While a waiting update exists: preserve the existing top-level update notice
  and its controlled **Use update next time** action.

The detailed, dismissible Home Screen guidance remains secondary content. It
must continue to say that iPhone/iPad Home Screen storage is separate from
Safari and users should add Field Notes before building a plan there.

### Persistent Browse context

Browse state belongs to the planner shell, not to a component that is
destroyed when My plan is selected. Preserve, for the life of the open app:

- query;
- Programme Day, venue, and category filters;
- Family Programme quick-filter state;
- list/timetable-or-Day-schedule mode.

No new URL routing or browser-storage persistence for filters is required.
Returning to Browse restores the exact in-session context; a page reload uses
the current default behaviour.

### Phone operation and Day schedule

On phone layouts, retain the existing visual identity but compact the header
on operational Browse and non-empty My plan views. The compact treatment keeps
the Field Notes wordmark/context and GitHub link, but removes the long intro
and playlist from the first operational viewport; those links remain available
in the footer. The full hero stays for the empty-plan discovery experience.

The Day schedule remains a time-first, vertical view with no timeline chart.
It must:

- respect **All days** exactly, grouping rows by Programme Day in official
  Thursday-to-Sunday order;
- retain a selected-day schedule when a specific day is chosen;
- show time, title, venue, category text/icon, saved state, and clash context;
- provide an inline **Save** or **Saved** control on each row; and
- open event details when the row body is tapped, without the inline control
  also opening the dialog.

Saving/removing from a row uses the same itinerary store as cards and details.
Notes remain details-only. The desktop visual timetable retains its existing
behaviour.

## Stage 2 — planning efficiency and confidence

### Progressive Browse filters

Keep search, Programme Day, and the Family Programme quick filter visible.
Move venue and category filters behind a clearly labelled **More filters**
disclosure. When any secondary filter is active, show its visible summary and
a **Clear all filters** action. Search continues to work across the full
weekend as documented; clearing it restores the chosen Programme Day results.

Venue display values must be canonicalised for filtering so source spelling
variants such as **Love Serve Bar** and **Love-Serve Bar** do not create two
choices. The raw source snapshot remains unchanged; only the planner-facing
filter value and label are canonicalised through a small, explicit mapping.

### Feedback and recovery

- After Event Note persistence, provide a polite, non-disruptive local-save
  confirmation. It must not claim persistence when browser storage has failed.
- Removing a saved event should offer a short-lived Undo action that restores
  the event and its previous note. Clearing the whole plan retains its existing
  confirmation flow and does not need Undo.
- Calendar export should acknowledge success immediately after the browser
  download is triggered, naming `we-out-here-2026-plan.ics` without claiming
  that an external calendar application imported it.

### Desktop timetable and footer

Keep the time axis available while vertically comparing venue lanes in the
desktop timetable. It may be sticky within the timetable’s own scrolling
region; it must not overlap controls or event blocks. Short event blocks remain
accessible through their existing details controls.

Consolidate the footer’s three trust/privacy statements into one concise,
accurate statement followed by the existing resource links. Preserve the
unofficial attribution, local-only/no-runtime-fetch claim, and link targets.

## Accessibility and responsive constraints

- All new controls use native buttons or appropriate semantic controls, have
  visible `:focus-visible` treatment, keyboard operation, and accessible names.
- The inline Day schedule control has a minimum 44 by 44 CSS-pixel target and
  does not create nested interactive controls.
- On a 390 by 844 phone viewport, the initial Browse operational screen shows
  the search/day controls and the beginning of either the results count or the
  first programme result without horizontal overflow.
- The desktop timetable remains available at 1440 by 900 and phone layouts
  never mount the horizontal timetable chart.
- Screen-reader status messages distinguish offline state, note-save state,
  undo availability, and export initiation without repeatedly announcing
  unrelated content.

## Quality and documentation

Tests cover retained Browse state, All-days grouping, inline schedule saves and
dialog isolation, compact-header breakpoints, filter disclosure/clear-all,
venue canonicalisation, persistence-aware feedback/Undo, calendar confirmation,
and sticky timetable/time-axis structure. Browser QA covers desktop 1440 by
900 and mobile 390 by 844, including keyboard focus, overflow, no-results,
offline-unavailable/ready fixture states, details, and navigation restoration.

Update the README and affected design documentation so the public description
matches the final filters, Day schedule actions, offline-status placement, and
recovery behaviour.
