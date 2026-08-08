# Phone browse simplification design

## Purpose

Remove the low-value Schedule duplicate from phone-sized screens. At festival scale, a full-programme agenda made of large cards repeats Browse without making the programme easier to scan.

## Experience

- On phone-sized screens, Browse is one filterable event-card list. There is no **Schedule**, **Show schedule**, **Show list**, or visual timetable control.
- Programme Day continues to default to Thursday before the festival and the current day during it. Search, venue, and category filters work exactly as they do now.
- The card list retains category labels, times, venues, saved state, clashes, details, and save/remove controls.
- Phone portrait and landscape behave the same way. Rotation neither reveals a chart nor changes the primary Browse interaction.
- On larger screens, users keep the existing list/timetable toggle and visual time-and-venue chart.
- When a planner update is waiting, show a compact notice directly below the **My plan** / **Browse** navigation so it appears in the first screen. It says an update is ready, confirms that saved plans remain in this browser, and explains that the new version is used after Field Notes is closed and reopened.
- The notice has one action button, **Use update next time**. It performs the existing explicit update acceptance without reloading the open planner. There is no checkbox, dismissal state, or lasting update preference.

## Technical design

- Retain the shared, pointer-independent `PHONE_LAYOUT_QUERY` so React and CSS make the same phone-versus-larger-screen decision.
- In `BrowseView`, hide the mode toggle and always mount `EventCardList` whenever the phone query matches. The desktop `BrowseMode`, `Timetable`, and `PhoneAgenda` implementation may remain for larger-screen use and to avoid unrelated refactoring; the agenda does not mount on phones.
- Preserve the existing detail-dialog fallback focus by ensuring a phone opener can return focus to a stable Browse control, rather than the hidden mode toggle.
- Extract the waiting-update presentation from the bottom offline-status region into a small reusable notice. `PlannerRoot` passes the existing lifecycle state and explicit refresh callback to `App`, which renders that notice directly after the planner navigation only for the `updating` state. The existing bottom status continues to report offline readiness and the schedule-check date without a duplicate update action.
- Update README guidance to describe phone Browse as the filtered list and the timetable as a larger-screen option.

## Quality boundaries

- Tests cover the absence of Schedule controls and timetable/agenda markup at 390×844 and wide short-landscape phone dimensions; Browse cards and their actions remain available.
- Desktop tests retain the existing timetable toggle and exclusive timetable rendering.
- Tests cover the top-level waiting-update notice, its exact action and explanatory copy, a single call to the existing refresh callback, absence outside the waiting state, and no duplicate bottom update control.
- Browser QA covers phone portrait, wide landscape, and desktop, with no page overflow or console errors.
- No schedule data, PWA/update behaviour, storage, privacy, external links, dependencies, runtime fetches, or analytics change.
