# LEGACY 3.0 — L3-033 Fixture System (33/272 accepted)

Test-only seeded fighter metadata, deterministic V1 career and independent manual save fixtures plus invalid/boundary helpers are implemented and tested. **Not a playable game**, and fixtures are never automatically injected into production. Next: **L3-034 — build manifest generator, NOT STARTED**. See [L3-033 acceptance](docs/L3-033-ACCEPTANCE.json), [fixture contract](docs/L3-033-FIXTURES.md), and [task status](docs/STATUS.md).

Clean GitHub CI including real npm ci, strict TypeScript, negative tests, 22 fixture unit tests, all earlier regressions, genuine Vite production build and 8 real Chromium browser tests on 4 widths in dev+preview: PASS. Physical iPhone Safari NOT_RUN. Source and original Git history checkpoints are preserved in Library /LEGACY_3_0/.

---

## L3-032 accepted — 32/272 tasks, next L3-033 NOT_STARTED
Pure synthetic V0→V1 conversion with strict version and corrupt-data rejection, original source and Git history preserved. No automatic database migrations or gameplay. See docs/L3-032-MIGRATIONS.md and docs/L3-032-ACCEPTANCE.json.

# LEGACY 3.0 — Verified Career Save Export/Import

**L3-031 accepted — 31/272 tasks complete.** Next: **L3-032 — Migration harness (NOT STARTED)**. Technical storage foundation only, **not a playable game**. Portable, canonical SHA-256 checked V1 career archives support safe restore into separate manual slots and explicit overwrite protection. No UI file controls, migrations, new gameplay, or background automation. All earlier functionality remains preserved.

Acceptance: docs/L3-031-ACCEPTANCE.json; behavior: docs/L3-031-EXPORT-IMPORT.md. Reproduce from clean checkout with `npm ci`, `npm run typecheck:export-import`, `npm run test:export-import:negative`, `npm run test:export-import`, `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`. Browser QA is defined in `.github/workflows/l3-031-export-import.yml`.

---

# LEGACY 3.0 — L3-029 Atomic Autosave Transaction (accepted)

L3-029 accepted (29/272). The transactional, cancellable single-record autosave operation passed full cloud acceptance and rollback/reload tests. **Not a playable game.** No background autosave scheduler, slots or L3-030. See [spec](docs/L3-029-AUTOSAVE.md), [evidence](docs/L3-029-ACCEPTANCE.json) and [status](docs/STATUS.md).

---

# LEGACY 3.0 — Versioned Core State Schema

**L3-028 accepted — 28/272 tasks completed (October 28, 2026).** Next only after acceptance: **L3-029 — Autosave transaction (NOT STARTED)**. LEGACY 3.0 is **not playable** yet. No combat engine, character creator, career saves, or event-processing systems have been added.

## Verified foundation

- **L3-020:** genuine TypeScript 5.8.3 / Vite 6.3.6 strict foundation and mobile Chromium checks.
- **L3-021:** independently mounted Preact menu and PixiJS renderer.
- **L3-022:** six isolated domain module boundaries enforced by TypeScript-AST analysis.
- **L3-023:** immutable, headless typed menu route and navigation history reducer.
- **L3-024:** pure independent game-calendar and fight-simulation clocks.
- **L3-025:** versioned, pure, seedable PRNG with frozen state and pinned golden vectors.
- **L3-026:** compile-time discriminated union of four event records in [`src/domain/core/events.ts`](src/domain/core/events.ts) for fights, training, purchases, and relationships. TypeScript rejects mismatched/invalid event payloads, missing fields, invalid kinds, and mutation attempts. Neutral event references only: no gameplay or side effects.

- **L3-027:** explicit V1 career identifiers, clock and RNG snapshot validated strictly at runtime (no storage), with frozen unmodified copies.

### Reproduce

```sh
npm ci
npm run typecheck:state
npm run test:state
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

**Not implemented:** event dispatch, transactions, outcomes, training bonuses, relationship calculations, saves, storage, migration, or L3-028 IndexedDB. OPEN design decisions remain OPEN. The original full local Git history and all prior immutable source ZIPs are preserved in ChatGPT Library `/LEGACY_3_0/`. The GitHub repository was initialized independently and does not contain that entire historical Git graph.

L3-027 accepted cloud QA: https://github.com/yoskicreates/Legacy/actions/runs/40781460336 (20/20 Chromium and prior regressions PASS). See [L3-027 acceptance evidence](docs/L3-027-ACCEPTANCE.json) and [schema documentation](docs/L3-027-STATE-SCHEMA.md).

### L3-028 — one-record IndexedDB browser wrapper

The persistence module now exposes strict V1 `writeGameState`/`readGameState` for the single fixed `current` record. See [storage contract](docs/L3-028-STORAGE.md). This is not autosave, slot management, import/export, or gameplay. Independent Chromium dev/preview round-trip and full QA passed; 104 storage assertions in eight mobile browser environments, nine GitHub workflows successful.

## L3-030 accepted manual slots

Three strictly typed fixed slot IDs with caller-supplied timestamp, independent career snapshots and transaction-atomic metadata/state in a separate IndexedDB namespace. See [contract](docs/L3-030-MANUAL-SAVE-SLOTS.md) and [acceptance status](docs/L3-030-ACCEPTANCE.json). No player-visible manual save UI, import/export or migration.

**Acceptance:** [GitHub Actions manual slot run](https://github.com/yoskicreates/Legacy/actions/runs/40786473255), all L3-020–L3-029 regression workflows PASS, 208/208 Chromium manual slot assertions at four mobile widths, full Vite production build. Physical iPhone Safari NOT_RUN.

## L3-031 review history (accepted)

Portable SHA-256 validated V1 manual save export/import is under review. It never silently overwrites occupied slots and does not add migration, gameplay, or UI. Acceptance requires all cloud regression and real-browser tests plus immutable source checkpoint. See `docs/L3-031-EXPORT-IMPORT.md`.
