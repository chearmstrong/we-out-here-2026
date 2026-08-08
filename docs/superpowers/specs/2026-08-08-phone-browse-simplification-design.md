# Phone browse simplification design

## Purpose

Remove the low-value Schedule duplicate from phone-sized screens. At festival scale, a full-programme agenda made of large cards repeats Browse without making the programme easier to scan.

## Experience

- On phone-sized screens, Browse is one filterable event-card list. There is no **Schedule**, **Show schedule**, **Show list**, or visual timetable control.
- Programme Day continues to default to Thursday before the festival and the current day during it. Search, venue, and category filters work exactly as they do now.
- The card list retains category labels, times, venues, saved state, clashes, details, and save/remove controls.
- Phone portrait and landscape behave the same way. Rotation neither reveals a chart nor changes the primary Browse interaction.
- On larger screens, users keep the existing list/timetable toggle and visual time-and-venue chart.

## Technical design

- Retain the shared, pointer-independent `PHONE_LAYOUT_QUERY` so React and CSS make the same phone-versus-larger-screen decision.
- In `BrowseView`, hide the mode toggle and always mount `EventCardList` whenever the phone query matches. The desktop `BrowseMode`, `Timetable`, and `PhoneAgenda` implementation may remain for larger-screen use and to avoid unrelated refactoring; the agenda does not mount on phones.
- Preserve the existing detail-dialog fallback focus by ensuring a phone opener can return focus to a stable Browse control, rather than the hidden mode toggle.
- Update README guidance to describe phone Browse as the filtered list and the timetable as a larger-screen option.

## Quality boundaries

- Tests cover the absence of Schedule controls and timetable/agenda markup at 390×844 and wide short-landscape phone dimensions; Browse cards and their actions remain available.
- Desktop tests retain the existing timetable toggle and exclusive timetable rendering.
- Browser QA covers phone portrait, wide landscape, and desktop, with no page overflow or console errors.
- No schedule data, PWA/update behaviour, storage, privacy, external links, dependencies, runtime fetches, or analytics change.
