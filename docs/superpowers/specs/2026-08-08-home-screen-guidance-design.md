# Home Screen guidance design

## Purpose

Make it obvious that Field Notes can be kept one tap away at the festival, without conflating offline caching with Home Screen installation or claiming a browser-specific capability it may not offer.

## Experience

- When Field Notes has confirmed **Saved for offline use**, show a compact, dismissible **Keep Field Notes handy** guidance card near the offline status.
- The card explains that adding the planner to the Home Screen gives one-tap access, then offers **How to add it** and **Not now** actions.
- **How to add it** expands or opens an accessible details panel with clear platform-neutral headings:
  - iPhone/iPad: open the browser Share menu, then choose **Add to Home Screen**.
  - Android: use the browser menu and choose **Install app** or **Add to Home screen**, if offered.
- It never says installation is required for offline use. The existing offline-ready status remains the truthful cache confirmation.
- **Not now** only hides the guidance for this browser; it does not affect saved events, notes, cache state, or app updates. The instruction can still be reached through a small **Home Screen help** control near the offline status.

## Technical design

- Keep the new presentation inside the offline-status component and pass only the existing lifecycle state plus a browser-local dismissal state.
- Store the dismissal under a dedicated localStorage key only after the user chooses **Not now**. If storage is unavailable, hide it for the current session without reporting a persistence failure.
- Do not use browser or user-agent sniffing, `beforeinstallprompt`, a native install API, analytics, new dependencies, runtime fetches, or a custom installation flow.
- Reuse the existing controlled disclosure/modal patterns and focus semantics; no route or PWA service-worker changes are required.

## Quality boundaries

- Tests cover ready-only visibility, non-ready absence, instructions, dismissal persistence/session fallback, help re-opening, labels, and keyboard focus.
- Browser QA checks mobile layout without safe-area or page-overflow regressions, screen-reader-friendly labels, and that offline readiness copy remains distinct from Home Screen guidance.
- Preserve the local-first model, exact controlled update behaviour, and existing no-runtime-fetch policy.
