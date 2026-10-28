# LEGACY 3.0 — Independent Game Clock Foundation

**L3-024 accepted — 24/272 tasks complete (October 28, 2026).** Next: **L3-025 — Seed deterministic random source (NOT STARTED)**. LEGACY 3.0 is **not playable**; no fighter simulation, career save or real game screens exist yet.

## Current architecture

- **L3-020**: genuine TypeScript 5.8.3 + Vite 6.3.6 pipeline, strict checks and mobile Chromium QA.
- **L3-021**: independently mounted Preact menu and PixiJS renderer.
- **L3-022**: six domain boundaries enforced by AST-based import rules.
- **L3-023**: headless, typed immutable menu-route history (no UI route integration).
- **L3-024**: separate pure game-calendar and simulated-fight clocks in [`src/domain/core/clock.ts`](src/domain/core/clock.ts). Calendar days and fight milliseconds advance **only through distinct explicit reducer actions**. No ambient time, timers, automatic ticks, RNG, DOM, gameplay or persisted state.

Read the [game-clock contract and acceptance requirements](docs/L3-024-GAME-CLOCK.md) and [machine-readable acceptance report](docs/L3-024-ACCEPTANCE.json). The day index is an abstract counter, not a selected calendar/career progression UX. Detailed fight-round timing, playback speed, and seedable random events remain future tasks.

## Reproduce checks

```sh
npm ci
npm run test:clock
npm run typecheck:clock
npm run lint:domains
npm run typecheck
npm run test:types:negative
npm run lint
npm test
npm run build
```

Cloud [L3-024 GitHub Actions acceptance run 40774948813](https://github.com/yoskicreates/Legacy/actions/runs/40774948813) passed, as did independent prior L3-020–L3-023 regressions. Genuine Vite dev/preview Chromium browser checks passed **20/20** at 375, 390, 402, 430 and 1280 CSS pixels; physical iPhone Safari remains **NOT_RUN**. No new user-facing UI was implemented.

Source, original complete local Git history, verification reports and unchanged prior checkpoints are preserved in ChatGPT Library `/LEGACY_3_0/`. GitHub `yoskicreates/Legacy` maintains a separately initialized import history; it is not the archived local Git graph.
