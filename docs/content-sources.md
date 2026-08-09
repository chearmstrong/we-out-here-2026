# Programme content sources

The Schedule Snapshot was last checked on **9 August 2026** and is published as version `2026-08-09`.

## Official sources

- Music Programme: <https://weoutherefestival.com/set-times/>
- Wider Programme: <https://weoutherefestival.com/wider-programme-set-times/>
- Family Programme: official We Out Here Facebook post, published 9 August 2026, transcribed from the seven dated Family Programme cards supplied for this verified snapshot. No post permalink was supplied.
- Official festival dates: Thursday 20 August to Sunday 23 August 2026, as displayed by both programme pages.

The Music and Wider Programme sources are public web pages; the Family Programme source is the official Facebook post above. The local snapshot contains only factual programme metadata: titles, Programme Days, venues or official area labels, displayed start and end times, and classifications derived from the published programme information. It contains no private, authenticated, or attendee data. The app does not embed or fetch Facebook or card artwork at runtime, and all application copy and UI assets remain original.

The `2026-08-09` snapshot contains all 910 displayed events: 564 Music Programme events, 159 Wider Programme events, and 187 Family Programme events. The Family category contains 193 events, including four pre-existing Wider Programme events and the reclassified Big Fish Little Fish [Family Rave] and DJ Competition Final Music Programme events. Displayed local times are stored as ISO timestamps with the August British Summer Time offset (`+01:00`). Events after midnight keep the Programme Day under which the official source publishes them while their Calendar Timestamps use the following calendar date.

## Required snapshot release sequence

Complete this sequence for every schedule deployment:

1. Check all applicable official sources across all four Programme Days and reconcile every displayed Music, Wider, and Family Programme event.
2. Update the local snapshot in `src/data/schedule.ts` and its source modules. Preserve an event ID when only its displayed details or Calendar Timestamps change.
3. Update `src/data/scheduleChanges.ts` for any confirmed rename or venue move by adding the exact old-ID/new-ID mapping. Do not use fuzzy matching.
4. Change `SCHEDULE_VERSION`, `SCHEDULE_LAST_CHECKED`, this document's checked date, and the verified record totals to describe the newly checked snapshot.
5. Run `npm test -- src/data/scheduleValidator.test.ts`, `npm test`, and `npm run build`; do not deploy unless all three commands pass.
6. Commit the snapshot and documentation changes, then push them to `main` (or merge a reviewed pull request). The GitHub Actions workflow builds `dist/` and deploys that generated artifact to the same GitHub Pages project URL; do not commit `dist/`.
7. With the previous version already cached, connect that browser and verify that it receives the update notice without reloading the open planner.
8. Verify both update paths. First choose **Use update next time**, close and reopen Field Notes, and check the new last-checked date and schedule. Then repeat from the previous version without accepting the update, close every Field Notes tab or app window, reopen, and check that the browser may activate the waiting version. Field Notes does not persist an accept/reject preference. In both paths, confirm that the saved itinerary and Event Notes remain intact, and repeat the offline browse, favourite, and Event Note checks.

The production app reads this committed snapshot and browser-local data only. It must not scrape or fetch any official source, or any other external content service, at runtime.
