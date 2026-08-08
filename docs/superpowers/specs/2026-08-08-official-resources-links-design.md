# Official resources links design

## Purpose

Make Field Notes easier to trust and inspect without turning it into an official festival app: link to the open-source repository and the official We Out Here set-times page.

## Experience

- Add a compact **Official resources** group in the existing footer after the privacy and unofficial-planner copy.
- It contains two clearly external links: **View source on GitHub** and **Official set times**.
- Links open in a new tab with safe external-link attributes. They remain ordinary hyperlinks, so a user can follow them when connected while the planner itself remains fully usable offline.
- Do not add a map placeholder. A 2026 official map has not been verified at a stable public URL. When one is available, a later change may add a third outbound **Official festival map** link.

## Technical design

- Keep URLs in `src/config/site.ts` alongside the existing Pages configuration rather than scattering string literals across UI code.
- `App.tsx` remains responsible for static footer content; no new component, state, storage schema, runtime request, dependency, or PWA change is needed.
- Add focused UI and configuration tests for visible link names, destinations, and external-link behaviour.

## Boundaries

- The app must not scrape, fetch, proxy, cache, or embed official content at runtime.
- Do not reuse official logos, illustrations, map artwork, or visual identity.
- Preserve the existing prominent statement that Field Notes is unofficial and unaffiliated.
