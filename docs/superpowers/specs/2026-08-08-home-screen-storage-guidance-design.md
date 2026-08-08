# Home Screen storage guidance design

## Purpose

Prevent an avoidable surprise on iPhone and iPad: an installed Home Screen web app has separate browser storage from Safari, so a plan saved in Safari does not appear when the person first opens the Home Screen app. Field Notes remains local-first and does not attempt an automatic transfer.

## Experience

- Show the guidance only after the planner has successfully been saved for offline use, as it is today.
- Keep the existing **Keep Field Notes handy** heading and the optional one-tap-access framing.
- Make the action order explicit in the first guidance paragraph: add Field Notes to the Home Screen before building a plan there.
- Add a short, prominent iPhone/iPad-only explanation immediately below it: the Home Screen app has a separate plan from Safari, so plans saved in Safari will not appear there.
- Keep the platform installation steps behind **How to add it**. The iPhone/iPad step still directs the person to Share then Add to Home Screen; Android retains its existing browser-menu wording without an iOS-storage warning.
- **Not now** continues to dismiss the panel for this browser context, while **Home Screen help** reopens the same warning and instructions later.
- The README adds the same caveat near its Home Screen guidance, so someone who has already built a Safari plan understands that installing later starts a separate local plan.

## Boundaries

- Do not add a server, account, sync, clipboard transfer, import/export flow, cookie mirror, analytics, or dependency.
- Do not claim that the plan transfers automatically between Safari and a Home Screen app.
- Do not alter the local itinerary storage key, PWA caching, update lifecycle, calendar export, Browse, Day schedule, or Android guidance.
- Use plain language rather than browser-storage implementation terms in the user-facing panel.

## Quality checks

- Component tests prove that ready guidance shows the new action order and iPhone/iPad separate-plan warning, that the warning is absent before offline readiness, and that reopening Home Screen help reveals it again.
- Existing dismissal, focus-restoration, storage-failure, update-notice, and Android-instruction tests remain valid.
- README copy is checked for the same promise: Home Screen installation later does not move an existing Safari plan.
- Browser QA at phone width checks readable hierarchy, 44px controls, safe-area fit, no horizontal overflow, and no console errors.
