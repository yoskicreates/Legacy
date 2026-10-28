# L3-021 — UI and Renderer Boundary

The current task register from L3-016 (272 tasks) specifies L3-021: **Set UI and renderer boundary**. Dependencies: completed L3-020. Gate: Foundation. Primary P1 illustration, supporting P5 preservation. Acceptance test: **Prototype proves the layers mount separately.**

## Scope

- `src/ui/menu.ts` is the Preact-only menu owner, independently mounted under `#menu-root`.
- `src/renderer/viewport.ts` is the PixiJS-only canvas owner, independently mounted under `#renderer-root`.
- `src/main.ts` orchestrates lifecycle and transfers only renderer readiness status to the menu; UI code never imports PixiJS, renderer code never imports Preact.
- The Pixi canvas displays a single neutral diagnostic marker, not character art or combat. Renderer failure leaves the UI usable.
- Test-only (`window.__LEGACY3_BOUNDARY__`) lifecycle functions prove independent mount, unmount and remount in actual browser sessions. The probe controls no simulation, saves or network features.

## Acceptance criteria

1. AC-01: Preact and PixiJS both installed as exact pinned npm dependencies, `npm ci` succeeds from committed lockfile.
2. AC-02: Separate UI and renderer hosts, each independently mounted on genuine Vite dev and preview servers.
3. AC-03: Unmount/remount menu leaves Pixi canvas intact; unmount/remount renderer leaves Preact button and status usable.
4. AC-04: Existing L3-020 button behavior preserved: clicking sets `aria-pressed=true` and exact expected status.
5. AC-05: Strict TypeScript, lint, unit tests, negative tests and Vite production build PASS.
6. AC-06: Real Chromium runs at 375, 390, 402, 430 and 1280 widths on dev and preview; no overflow, page errors or HTTP failures; screenshots retained.
7. AC-07: All unchanged parent files retain SHA-256; all changed files listed and justified; package archive CRC/hash valid; independently testable checkpoint saved.

## Decision mapping

APPROVED DEC-001 (clean original project), DEC-002 (one task and verified checkpoint), DEC-003 (mobile-first), DEC-004 (no crude fighter art); REJECTED DEC-012 (no old game rigs). OPEN DEC-028 art/rig choice **is not decided or implemented**. PROPOSED DEC-020 portrait/landscape scope **not treated as approved**.

## Explicit exclusions

No L3-022 domain modules, navigation state or route maps, fight simulation, illustrated fighter or opponent assets, gameplay, persistence, offline mode, player settings, premium features, monetization or creative approvals. This is a technical boundary proof, not a playable game.

## Validation notes

Automated headless Chromium can validate the mount lifecycle but is not physical iPhone Safari testing. Report physical iPhone as NOT_RUN until tested on-device. Renderer GPU availability may vary by browser; UI survives failure but Pixi success is mandatory for full L3-021 acceptance.
