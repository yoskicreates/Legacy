# LEGACY 3.0 — Deterministic Random Source Foundation

**L3-025 accepted — 25/272 tasks complete (October 28, 2026).** Next: **L3-026 — Define domain events (NOT STARTED)**. LEGACY 3.0 remains **not playable**. No character creator, combat simulation, career saves or game-event systems exist yet.

## Verified architecture

- **L3-020:** genuine pinned TypeScript 5.8.3 / Vite 6.3.6, strict compiler and mobile Chromium QA.
- **L3-021:** independently mounted Preact menu and PixiJS renderer. No gameplay.
- **L3-022:** six isolated domains, imports enforced by a TypeScript-AST checker.
- **L3-023:** headless immutable menu route and navigation history reducer.
- **L3-024:** pure independent simulated calendar-day and fight-millisecond clocks; no ambient time.
- **L3-025:** versioned pure seeded **Mulberry32** PRNG in [`src/domain/core/random.ts`](src/domain/core/random.ts), with explicit uint32 seeds, frozen snapshots, deterministic uint32 and `[0,1)` draws, 15 dedicated unit tests and pinned known-output vectors.

The PRNG is intended **only for reproducible simulation**. It provides no cryptographic security. No random event probabilities, career-event behavior, gameplay or persistent seed format have been selected. DEC-035 (dangerous events/scandals) remains OPEN. See [L3-025 random-source contract](docs/L3-025-RANDOM-SOURCE.md) and [acceptance report](docs/L3-025-ACCEPTANCE.json).

## Reproduce checks

```sh
npm ci
npm run test:random
npm run typecheck:random
npm run lint:domains
npm run typecheck:clock
npm run typecheck
npm run test:types:negative
npm run lint
npm test
npm run build
```

[Cloud L3-025 CI acceptance run](https://github.com/yoskicreates/Legacy/actions/runs/40777352852) and L3-020–L3-024 regression workflows passed. Real Vite dev/preview Chromium checks passed at 375, 390, 402, 430 and 1280 CSS pixels: **20/20 PASS**. Physical iPhone Safari **NOT_RUN**. No new user-facing interfaces were implemented.

All original source files, original local Git history, review evidence and immutable numbered checkpoints are preserved in ChatGPT Library `/LEGACY_3_0/`. This GitHub repo is a separate, freshly initialized import history, not a mirror of that original Git graph.
