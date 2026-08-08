# Phone schedule agenda design

## Purpose

Keep the festival programme usable on a phone without asking people to pan around a dense visual timetable. The visual timetable remains useful on a larger display; the phone experience should instead prioritise a readable, chronological schedule.

## Experience

- On phone-sized screens, **Browse** remains the discovery view: filterable event cards for finding and saving acts, talks, workshops, and family events.
- A **Schedule** control switches the same filtered programme to a chronological agenda. It groups events by programme day when more than one day is in scope and presents each event's time, venue, category, save state, and clash state.
- The selected Programme Day governs the schedule. Before the festival it opens on Thursday; during the festival it opens on the current Programme Day. Search can still span the whole weekend, as it does today.
- Phone portrait and landscape use the same Browse/Schedule interaction. Rotation must not reveal a different chart or make the schedule harder to use.
- The visual time-and-venue chart is not offered on phone-sized screens. On larger screens, the existing **Show timetable** / **Show list** control remains available.

## Technical design

- Keep filtering, favourites, notes, clashes, event-detail dialogs, and local-only storage unchanged.
- Use one responsive capability to choose the presentation, shared by the control label and rendered content. It must not depend on pointer-type media features, which can vary across installed web apps and browsers.
- Keep the desktop timetable implementation isolated from the phone agenda; only one presentation mounts at a time.
- Retain the existing safe-area, sticky-navigation, focus-return, and 44px minimum interactive target safeguards.

## Quality boundaries

- Unit and component coverage verifies the current-day default, filters, agenda ordering/grouping, save/detail/clash actions, and exclusive phone-versus-desktop rendering at portrait and landscape dimensions.
- Browser QA covers a narrow portrait phone and a short landscape phone, confirming that Schedule remains an agenda with no page overflow or console errors. Desktop QA confirms the visual timetable remains available.
- No programme data, PWA update behaviour, external links, runtime fetches, or privacy/storage contracts change.
