# Programme content sources

The Schedule Snapshot was last checked on **7 August 2026** and is published as version `2026-08-07`.

## Official sources

- Music Programme: <https://weoutherefestival.com/set-times/>
- Wider Programme: <https://weoutherefestival.com/wider-programme-set-times/>
- Official festival dates: Thursday 20 August to Sunday 23 August 2026, as displayed by both programme pages.

Both sources are public web pages. The local snapshot contains only factual programme metadata: titles, Programme Days, venues, displayed start and end times, and classifications derived from the published wider-programme descriptions. It contains no private, authenticated, or attendee data. All application copy and UI assets remain original.

The `2026-08-07` snapshot contains all 723 displayed events: 564 Music Programme events and 159 Wider Programme events. Displayed local times are stored as ISO timestamps with the August British Summer Time offset (`+01:00`). Events after midnight keep the Programme Day under which the official source publishes them while their Calendar Timestamps use the following calendar date.

## Manual update procedure

1. Check both official sources across all four Programme Days.
2. Edit the local snapshot in `src/data/schedule.ts`. Preserve an event ID when only its displayed details or Calendar Timestamps change.
3. For a confirmed rename or venue move, add the exact old-ID/new-ID mapping to `src/data/scheduleChanges.ts`. Do not use fuzzy matching.
4. Update `SCHEDULE_VERSION`, `SCHEDULE_LAST_CHECKED`, this document's checked date, and the verified record totals.
5. Run schedule validation, the full test suite, and the production build.
6. Deploy to the same Pages URL.
7. Verify that an existing connected installation receives the update prompt while its cached snapshot and itinerary remain usable until the update is accepted.
