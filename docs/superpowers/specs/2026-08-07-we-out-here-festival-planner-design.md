# We Out Here festival planner — design

**Date:** 2026-08-07
**Status:** Approved for implementation planning

## Purpose

Create a personal-first, publicly shareable planner for We Out Here 2026. It helps a festival-goer build one shared family itinerary from the complete music and wider programmes, then use that plan with unreliable or no phone signal.

The app has no account, backend, tracking, or runtime API dependency. Each visitor's saved plan belongs only to their browser.

## Scope

The first release includes:

- The four-day music and wider-programme schedule.
- Event records with a stable ID, Programme Day, title, venue/stage, timezone-aware start/end timestamps, category, and source reference.
- Search plus day, venue, and category filters.
- One shared favourites itinerary, persisted in local storage, with one optional 140-character note per saved event.
- A plan-first home screen: empty-state discovery before any saves; otherwise the current or next Programme Day’s chronological plan. Before the festival it foregrounds the next saved event and the complete itinerary.
- A browse view with a searchable list and an optional timetable view.
- Event details with save/remove, schedule details, category, and clash context.
- Clear category indicators that do not rely on colour alone: music, talk, workshop, family, and other.
- Overlap indicators for saved events; the app flags a conflict but does not choose for the user.
- Offline use after one successful online load/installation.
- Calendar export of the saved itinerary as an `.ics` file, including any Event Note but no automatic alarm.
- A visible last-checked date for the local Schedule Snapshot and an explicit connected-user update prompt; cached snapshots remain usable offline until the user updates.

Out of scope for the first release:

- Accounts, cross-device sync, social sharing of plans, and a backend.
- Runtime scraping or fetching from the official festival website, automatic schedule importing, and forced application refreshes.
- Browser-push reminders. They may be explored later, but calendar export is the reliable reminder path.
- Route planning, maps, and estimated stage-to-stage walking times.

## Architecture

The site is a React and TypeScript app built with Vite and deployed to GitHub Pages. It follows the useful baseline in `ai-architect-learning`: React, TypeScript, Vite, Vitest, and a project-relative Vite `base` value. This repository will add its own GitHub Pages workflow.

All festival content is bundled as a manually verified, versioned local Schedule Snapshot with a last-checked date. The production app reads only that snapshot and the browser's local storage. It makes no request to the festival site or any other external service at runtime.

A service worker precaches the built app shell, its bundled schedule, and icons. After the first successful connected load, the application opens from cache when offline. A visible status makes this capability clear. When a connected browser detects a newer snapshot, it offers an action to allow the waiting update while the open planner and browser-local itinerary remain available. The action does not reload the current screen or create a lasting version preference.

```text
Official set-times source
          │ (curated before deployment)
          ▼
Versioned schedule data ──► Vite build ──► GitHub Pages
                                  │
                                  ▼
                         Service-worker cache
                                  │
                                  ▼
                    Browser UI ◄──► Local storage itinerary and Event Notes
                                  │
                                  ▼
                         Optional calendar export
```

## Data model and updates

Each event has a stable ID designed to survive a time change, plus title, Programme Day, venue, `Europe/London` start/end timestamps, category, and source metadata. Programme Day is the official Thursday–Sunday grouping and can differ from the calendar date after midnight. Categories are controlled values: `music`, `talk`, `workshop`, `family`, and `other`; `family` is assigned only where the official programme clearly supports it, otherwise the event is `other`.

Before a release, the schedule data is manually curated from the official music and wider-programme set-times pages, verified, and published as a new Schedule Snapshot. Build-time validation checks required values, unique IDs, recognised categories, valid Programme Days/times, and that an event does not end before it starts.

When set times change, manually update and redeploy the snapshot at the same Pages URL. Stable IDs never include the start time. A confirmed rename or venue move uses an explicit curator mapping; the app never performs fuzzy matching. Existing recognised IDs remain saved, confirmed mappings preserve the saved event and note, and unavailable IDs are shown as changed or removed rather than silently discarded. Reconciled IDs and mapped notes are written back through the itinerary store. Removal notices remain across reloads until dismissed; a failed browser-storage write keeps the reconciled or dismissed state for the current visit and reports that it could not persist.

The browser controls service-worker version promotion. Field Notes never reloads an open planner to apply an update. Its update action can ask the browser to activate a waiting worker, after which the user closes and reopens the app to see the new version. Ignoring a waiting update is not a persistent rejection: the browser may activate it after every controlled Field Notes tab or app window closes. The app stores no durable version-acceptance preference.

## User experience

### My Plan

This is the default home screen. With no saved events it is a friendly discovery state with search and a path into browse. With a plan, it prioritises the active event, the next event, and Programme Day context in time order. A day containing an active saved event is the Current Programme Day; when no saved event is active, the upcoming event belongs to the Next Programme Day instead. Before the festival it prioritises the next saved event and the full itinerary; an overnight event stays with its official Programme Day. It is designed for a quick, one-handed check in bright outdoor conditions.

### Browse

Browse is for advance planning and ad-hoc discovery. A searchable list is the primary browsing tool; day, venue, and category filters refine it. A secondary, horizontally scrollable timetable has a labelled hourly axis, venue rows, and event blocks positioned by start time and duration so schedule gaps are visible. Saving and removing an event is available from every relevant screen and immediately changes My Plan.

### Event card and details

Cards show title, time, venue, event-category icon plus text label, and saved state. Details add the full time range, clash context, save/remove control, and an optional Event Note editor limited to 140 characters. Notes are local only, are removed with the saved event, and are included in its calendar export. One shared favourites set represents the family plan; people are not modelled separately.

### Clashes

If two saved events overlap, both display an accessible clash indicator. The planner does not rank events or automatically resolve the clash.

## Visual identity

The planner takes broad atmospheric cues from the festival: a warm, energetic night-time palette, high-contrast editorial hierarchy, playful content blocks, and human, concise copy. Its visual expression remains original: it uses a distinct app name and wordmark, licensed or system fonts, a custom icon system, and original layouts.

It must not use or recreate the We Out Here logo, wordmark, illustrations, photography, or distinctive display type. If published publicly, it states clearly that it is an unofficial personal planner and is not affiliated with or endorsed by the festival.

The base palette uses dark green, coral, sun yellow, and warm off-white. Category icons and text labels continue to carry meaning independently of colour, and all text and controls meet accessible contrast requirements.

## Offline and failure behaviour

- On a device that has loaded the site while online, the complete app and its schedule remain available offline.
- If first opened without a network, show a concise message that an initial online visit is required to download the planner.
- If storage is unavailable or unreadable, continue to show the schedule and explain that saved plans, Event Notes, reconciled schedule changes, and dismissed change notices cannot persist until browser storage is available.
- Do not claim the app is offline-ready until the service worker has cached its assets successfully.

## Quality strategy

Automated tests cover schedule-data validation, durable stable-ID migrations and notice dismissal, favourite/note persistence, search/filter behaviour, Current and Next Programme Day selection, chronological plan ordering, overlap detection, temporal timetable positioning, UTF-8-safe calendar line folding and note export, update-prompt behaviour, and empty/storage-unavailable states. Build verification includes a GitHub Pages sub-path check so deployed assets resolve correctly. Before release, test the built site at phone dimensions, load it online, disable connectivity, and confirm that browsing, notes, and favourites still work.

## Deployment

GitHub Actions builds the Vite application and publishes the generated static files to GitHub Pages. The Vite base path is configured for this repository’s Pages URL. The site can be linked publicly, while every visitor retains a private, device-local plan.

## Success criteria

- A user can find any included programme event by name and understand its time, venue, and type.
- A user can create, change, note, and retain a shared favourites itinerary without a network or account after the first load.
- The home screen answers “what is on now, what is next, and which Programme Day does it belong to?” within a few seconds.
- Saved-event clashes are obvious.
- The complete schedule works offline at the festival.
