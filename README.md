# LEGACY 3.0 — Typed Domain Event Contracts

**L3-026 accepted — 26/272 tasks complete (October 28, 2026).** Next: **L3-027 — Define state schema version (NOT STARTED)**. LEGACY 3.0 is **not playable** yet. No combat engine, character creator, career saves, or event-processing systems have been added.

## Verified foundation

- **L3-020:** genuine TypeScript 5.8.3 / Vite 6.3.6 strict foundation and mobile Chromium checks.
- **L3-021:** independently mounted Preact menu and PixiJS renderer.
- **L3-022:** six isolated domain module boundaries enforced by TypeScript-AST analysis.
- **L3-023:** immutable, headless typed menu route and navigation history reducer.
- **L3-024:** pure independent game-calendar and fight-simulation clocks.
- **L3-025:** versioned, pure, seedable PRNG with frozen state and pinned golden vectors.
- **L3-026:** compile-time discriminated union of four event records in [`src/domain/core/events.ts`](src/domain/core/events.ts) for fights, training, purchases, and relationships. TypeScript rejects mismatched/invalid event payloads, missing fields, invalid kinds, and mutation attempts. Neutral event references only: no gameplay or side effects.

### Reproduce

```sh
npm ci
npm run typecheck:events
npm run test:events
npm run lint:domains
npm run typecheck:clock
npm run typecheck:random
npm run typecheck
npm run test:types:negative
npm run lint
npm test
npm run build
```

Full cloud acceptance in [GitHub Actions run 40779088803](https://github.com/yoskicreates/Legacy/actions/runs/40779088803) and all L3-020–L3-025 regression workflows: **PASS**. Real Vite dev/preview Chromium checks: **20/20 PASS** at 375, 390, 402, 430, and 1280 CSS px. Physical iPhone Safari: **NOT_RUN**.

See [event contract](docs/L3-026-DOMAIN-EVENTS.md), [acceptance report](docs/L3-026-ACCEPTANCE.json), and [task status](docs/STATUS.md).

**Not implemented:** runtime event validation, dispatchers, queues, transactional purchasing, outcomes, training bonuses, relationship calculations, storage or L3-027 state schema. OPEN design decisions remain OPEN. The original full local Git history and all prior immutable source ZIPs are preserved in ChatGPT Library `/LEGACY_3_0/`. The GitHub repository was initialized independently and does not contain that entire historical Git graph.
