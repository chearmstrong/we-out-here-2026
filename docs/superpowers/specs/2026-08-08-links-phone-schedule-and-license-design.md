# Links, phone schedule, and licence design

## Purpose

Polish Field Notes as a shareable open-source planner: make its source code and companion playlist easy to find, keep programme browsing understandable on phones in either orientation, and state clear reuse terms for the original project.

## Header and resources

- Add a compact GitHub icon button to the header’s top-right. Its accessible name is **View source on GitHub**; it opens the existing repository URL in a new tab with `rel="noreferrer"`.
- Keep the existing textual GitHub resource link in the footer for discoverability and clarity.
- Add an unobtrusive **Listen to the festival playlist** text link immediately under the hero introduction. It opens the supplied Spotify playlist in a new tab with `rel="noreferrer"`.
- Use ordinary external anchors only—no Spotify embed, runtime request, SDK, player, tracking, or copied Spotify/WOH assets.

## Programme browsing on phones

- Phones use the readable chronological agenda in both portrait and landscape. Rotating a phone must not switch the programme presentation to the dense desktop venue timeline.
- In the phone layout, the list/schedule control says **Show schedule** and **Show list**. The schedule remains the same agenda, grouped by Programme Day when All days is selected.
- The desktop-style visual venue timeline remains available only on larger, sufficiently tall screens, keeping its **Show timetable** / **Show list** wording. This preserves its use for comparing simultaneous sets without recreating the cramped phone experience.
- Keep a single active programme view mounted at a time. The responsive state used by React and CSS must agree so content, controls, and accessibility semantics do not diverge.

## Open-source licence

- Add a root `LICENSE` containing the standard MIT licence with 2026 copyright for Ché Armstrong.
- Set `"license": "MIT"` in `package.json` and add a short README licence section.
- The README must make clear that MIT covers Field Notes’ original code and documentation only. It does not license the We Out Here name, marks, logo, illustrations, official map artwork, external Spotify content, or any rights belonging to third parties.

## Quality boundaries

- Preserve the existing local-first storage, offline/PWA operation, update lifecycle, no-runtime-fetch policy, unofficial attribution, and accessible modal/focus behaviour.
- Add tests for exact external destinations and safe attributes, phone landscape responsive policy and control labels, and licence metadata/content.
- Browser QA covers a narrow portrait phone, narrow landscape phone, and a desktop-size viewport: check resource links, active programme mode, no page overflow, and zero console errors.
