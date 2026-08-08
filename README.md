# Field Notes

Field Notes is an offline-capable, local-first personal festival planner for the published We Out Here 2026 music and wider programmes. It bundles a manually verified Schedule Snapshot, stores one shared plan and its Event Notes only in the current browser, and has no account, backend, telemetry, remote persistence, or runtime content fetch.

## Use the planner

Open the planner online once and wait for **Saved for offline use** before relying on it without a connection. A browser cannot show Field Notes on a first-ever offline visit because it has not downloaded the page or service worker yet. Clearing site data, using private browsing, or browser storage restrictions can remove or prevent browser storage of the plan and Event Notes.

After **Saved for offline use** appears, optional Home Screen guidance can make Field Notes quicker to launch. On iPhone and iPad, add it before building a plan there: the Home Screen app keeps a separate plan from Safari, so an existing Safari plan will not appear in it. Browser menu labels and available Home Screen options vary.

Browse the programme with search and day, venue, and category filters, then save events to **My plan**. On a phone, **Day schedule** is a compact, selected-day view for what is on now and next during the festival, with an optional **Saved only** view; the visual time-and-venue timetable is available on larger screens. Each saved event can have one Event Note of up to 140 characters. Notes and selections stay on that browser and device; there is no cross-device sync.

**Download calendar** exports the saved itinerary as `we-out-here-2026-plan.ics`. Event Notes are included as descriptions and the file contains no automatic alarms. The calendar application importing it may apply its own notification defaults, which Field Notes cannot control.

An open planner is never reloaded automatically when a connected update arrives. A waiting update is announced at the top of the planner and takes effect after Field Notes is closed and reopened. **Use update next time** asks the browser to activate the waiting version, but the open screen keeps running its existing version until it is closed and reopened. Leaving the update waiting is not a permanent rejection: the browser may activate it after every open Field Notes tab or app window is closed. Field Notes does not store a lasting accept/reject preference for app versions.

## Local development

Use Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Run the complete checks and create the production artifact with:

```sh
npm test
npm run build
npm run preview
```

The production build is written to `dist/` and uses the GitHub Pages project path `/we-out-here-2026/`. The Vite preview therefore serves the app at `http://localhost:4173/we-out-here-2026/` by default.

## Publish with GitHub Pages

In the repository's GitHub **Settings → Pages**, set **Source** to **GitHub Actions**. A push to `main`, or a manual workflow run, then uses `.github/workflows/deploy-pages.yml` to install locked dependencies, run all tests, build the static site, upload `dist/`, and deploy it to the `github-pages` environment. The workflow grants read-only repository access plus the `pages: write` and `id-token: write` permissions required by Pages.

After deployment, verify the project-path URL on a phone: load it online, wait for the offline-ready status, save an event and Event Note, reload offline, and confirm that browsing, the saved plan, and the note still work. For an update release, also leave the old version open, deploy the new snapshot, and confirm the connected update notice appears without reloading that screen. Test both browser paths: choose **Use update next time**, then close and reopen; and leave the update waiting, close every Field Notes tab or app window, then reopen. In both cases, verify the new last-checked date while the saved itinerary and notes remain intact.

## Update the Schedule Snapshot

Festival content is committed locally; the production app never scrapes or fetches programme data. Follow the numbered release sequence in [docs/content-sources.md](docs/content-sources.md) for every manual verified schedule snapshot deployment. Stable event IDs do not include start times, and confirmed renames or venue moves use only explicit mappings—never fuzzy matching.

## Resources and attribution

For the full product guide, see [How Field Notes works](https://github.com/chearmstrong/we-out-here-2026#readme), or [view the source on GitHub](https://github.com/chearmstrong/we-out-here-2026). The official [We Out Here set times](https://weoutherefestival.com/set-times/) are an external reference; Field Notes does not retrieve or reproduce them at runtime. The [festival playlist](https://open.spotify.com/playlist/7Am6bwWRhhwy4yjcMo3ASA) is an optional browser link and is never embedded or fetched at runtime.

## Identity and attribution

Field Notes is an original, unofficial personal planner and is not affiliated with or endorsed by We Out Here Festival. It may use factual public programme metadata and broad festival-adjacent atmosphere, but must not use or recreate the festival's logo, wordmark, illustrations, photography, or distinctive display type. Product names, copy, layouts, icons, and other visual assets must remain original, using only licensed or system fonts.

## Licence

MIT covers original Field Notes code and documentation only. It does not cover We Out Here or Spotify names, marks, logos, illustrations, official map artwork, or external content.
