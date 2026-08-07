# We Out Here festival planner — design

**Date:** 2026-08-07
**Status:** Approved for implementation planning

## Purpose

Create a personal-first, publicly shareable planner for We Out Here 2026. It helps a festival-goer build one shared family itinerary from the complete music and wider programmes, then use that plan with unreliable or no phone signal.

The app has no account, backend, tracking, or runtime API dependency. Each visitor's saved plan belongs only to their browser.

## Scope

The first release includes:

- The four-day music and wider-programme schedule.
- Event records with a stable ID, title, day, venue/stage, start/end time, category, and source reference.
- Search plus day, venue, and category filters.
- One shared favourites list, persisted in local storage.
- A plan-first home screen: empty-state discovery before any saves; otherwise now, up next, and today's chronological plan.
- A browse view with a searchable list and an optional timetable view.
- Event details with save/remove, schedule details, category, and clash context.
- Clear category indicators that do not rely on colour alone: music, talk, workshop, family, and other.
- Overlap indicators for saved events; the app flags a conflict but does not choose for the user.
- Offline use after one successful online load/installation.
- Calendar export of the saved itinerary as an `.ics` file.

Out of scope for the first release:

- Accounts, cross-device sync, social sharing of plans, and a backend.
- Runtime scraping or fetching from the official festival website.
- Browser-push reminders. They may be explored later, but calendar export is the reliable reminder path.
- Route planning, maps, and estimated stage-to-stage walking times.

## Architecture

The site is a React and TypeScript app built with Vite and deployed to GitHub Pages. It follows the useful baseline in `ai-architect-learning`: React, TypeScript, Vite, Vitest, and a project-relative Vite `base` value. This repository will add its own GitHub Pages workflow.

All festival content is bundled as a versioned local data file. The production app reads only that file and the browser's local storage. It makes no request to the festival site or any other external service at runtime.

A service worker precaches the built app shell, the schedule, fonts, and icons. After the first successful connected load, the application opens from cache when offline. A visible status makes this capability clear.

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
                    Browser UI ◄──► Local storage favourites
                                  │
                                  ▼
                         Optional calendar export
```

## Data model and updates

Each event has a stable ID designed to survive ordinary display edits, plus title, festival day, venue, start/end timestamps, category, and source metadata. Categories are controlled values: `music`, `talk`, `workshop`, `family`, and `other`.

Before a release, the schedule data is curated from the official music and wider-programme set-times pages. Build-time validation checks required values, unique IDs, recognised categories, valid times, and that an event does not end before it starts.

When set times change, update and deploy the local data deliberately. Local favourites are keyed by event ID. On an update, existing recognised IDs remain saved; unavailable IDs are shown as changed or removed rather than being silently discarded.

## User experience

### My Plan

This is the default home screen. With no saved events it is a friendly discovery state with search and a path into browse. With a plan, it prioritises what is currently playing, what starts next, and today’s saved events in time order. It is designed for a quick, one-handed check in bright outdoor conditions.

### Browse

Browse is for advance planning and ad-hoc discovery. A searchable list is the primary browsing tool; day, venue, and category filters refine it. A timetable view provides broader context and helps explore schedule gaps. Saving and removing an event is available from every relevant screen and immediately changes My Plan.

### Event card and details

Cards show title, time, venue, event-category icon plus text label, and saved state. Details add the full time range, clash context, and save/remove control. One shared favourites set represents the family plan; people are not modelled separately.

### Clashes

If two saved events overlap, both display an accessible clash indicator. The planner does not rank events or automatically resolve the clash.

## Visual identity

The planner takes broad atmospheric cues from the festival: a warm, energetic night-time palette, high-contrast editorial hierarchy, playful content blocks, and human, concise copy. Its visual expression remains original: it uses a distinct app name and wordmark, licensed or system fonts, a custom icon system, and original layouts.

It must not use or recreate the We Out Here logo, wordmark, illustrations, photography, or distinctive display type. If published publicly, it states clearly that it is an unofficial personal planner and is not affiliated with or endorsed by the festival.

The base palette uses dark green, coral, sun yellow, and warm off-white. Category icons and text labels continue to carry meaning independently of colour, and all text and controls meet accessible contrast requirements.

## Offline and failure behaviour

- On a device that has loaded the site while online, the complete app and its schedule remain available offline.
- If first opened without a network, show a concise message that an initial online visit is required to download the planner.
- If storage is unavailable or unreadable, continue to show the schedule and explain that saved plans cannot persist until browser storage is available.
- Do not claim the app is offline-ready until the service worker has cached its assets successfully.

## Quality strategy

Automated tests cover schedule-data validation, favourite persistence and migration, search/filter behaviour, chronological plan ordering, overlap detection, and empty/storage-unavailable states. Build verification includes a GitHub Pages sub-path check so deployed assets resolve correctly. Before release, test the built site at phone dimensions, load it online, disable connectivity, and confirm that browsing and favourites still work.

## Deployment

GitHub Actions builds the Vite application and publishes the generated static files to GitHub Pages. The Vite base path is configured for this repository’s Pages URL. The site can be linked publicly, while every visitor retains a private, device-local plan.

## Success criteria

- A user can find any included programme event by name and understand its time, venue, and type.
- A user can create, change, and retain a shared favourites itinerary without a network or account after the first load.
- The home screen answers “what is on now, and what is next?” within a few seconds.
- Saved-event clashes are obvious.
- The complete schedule works offline at the festival.
