# Programme content sources

The Schedule Snapshot was last checked on **7 August 2026** and is published as version `2026-08-07`.

## Official sources

- Music Programme: <https://weoutherefestival.com/set-times/>
- Wider Programme: <https://weoutherefestival.com/wider-programme-set-times/>
- Official festival dates: Thursday 20 August to Sunday 23 August 2026, as displayed by both programme pages.

Both sources are public web pages. The local snapshot contains only factual programme metadata: titles, Programme Days, venues, displayed start and end times, and classifications derived from the published wider-programme descriptions. It contains no private, authenticated, or attendee data. All application copy and UI assets remain original.

The `2026-08-07` snapshot contains all 723 displayed events: 564 Music Programme events and 159 Wider Programme events. Displayed local times are stored as ISO timestamps with the August British Summer Time offset (`+01:00`). Events after midnight keep the Programme Day under which the official source publishes them while their Calendar Timestamps use the following calendar date.

## Required snapshot release sequence

Complete this sequence for every schedule deployment:

1. Check both official sources across all four Programme Days and reconcile every displayed music and wider-programme event.
2. Update the local snapshot in `src/data/schedule.ts`. Preserve an event ID when only its displayed details or Calendar Timestamps change.
3. Update `src/data/scheduleChanges.ts` for any confirmed rename or venue move by adding the exact old-ID/new-ID mapping. Do not use fuzzy matching.
4. Change `SCHEDULE_VERSION`, `SCHEDULE_LAST_CHECKED`, this document's checked date, and the verified record totals to describe the newly checked snapshot.
5. Run `npm test -- src/data/scheduleValidator.test.ts`, `npm test`, and `npm run build`; do not deploy unless all three commands pass.
6. Deploy the generated `dist/` artifact to the same GitHub Pages project URL through the GitHub Actions workflow.
7. With the previous version already cached, connect that browser and verify that it receives the update prompt without replacing the current snapshot automatically.
8. Choose **Update now**, then reload or reopen the planner and verify the new last-checked date and schedule. Confirm that the saved itinerary and Event Notes remain intact, and repeat the offline browse, favourite, and Event Note checks.

The production app reads this committed snapshot and browser-local data only. It must not scrape or fetch either official source, or any other external content service, at runtime.
