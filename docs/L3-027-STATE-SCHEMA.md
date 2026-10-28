# L3-027 — State schema version (core snapshot V1)

**Scope:** implement only the approved blueprint's foundation schema and corrupted/unsupported-input rejection. The schema is a strict **minimal career-state envelope**, not the final MMA career model or a save implementation.

## Versioned contract

- `schemaVersion`: literal integer `1`, no implicit defaults and no migration.
- `career`: required `{careerId: string, fighterId: string}` (nonempty identifiers only). These are neutral references, not a character creator, generated identities, or career progression.
- `clocks`: required `{calendar: {dayIndex: safe nonnegative integer}, fight: {elapsedMilliseconds: safe nonnegative integer}}`. These refer to existing L3-024 time axes and do not advance during validation.
- `random`: required `{algorithm: 'LEGACY3-MULBERRY32-V1', seed: uint32, word: uint32, draws: safe nonnegative integer}`. Internal word MUST match the L3-025 seeded source after the specified draw count, checked with exact BigInt modular arithmetic. The validator does not draw or seed itself.

Required keys only at each level. No arbitrary extensions, arrays, missing keys, unknown or symbol keys, object accessors, custom prototypes, malformed numbers, wrong literal versions or out-of-range values. Unsupported numeric version yields `UNSUPPORTED_VERSION`; malformed version yields `INVALID_VALUE`; inconsistent PRNG counters yield `CORRUPT_RANDOM_STATE`.

`validateGameState(candidate: unknown): GameStateValidationResult` returns a discriminated `{ok:false,code,path}` error or `{ok:true,state}`. On success `state` is a **deep-frozen independent copy** structurally identical to the supplied values; on failure nothing is modified, defaulted or repaired, and there is no partial success. Proxies that raise exceptions are rejected as `INVALID_STRUCTURE`.

## Scope exclusions

No IndexedDB/storage APIs, autosave, manual slots, JSON import/export, save checksums, migrations, schema negotiation, UI, characters, gameplay, event log, economy or relationship behavior. Only existing core domain contracts are referenced; no new feature-domain import dependency is introduced. The schema does not decide the future comprehensive saved career model. Real-world game design decisions remain unapproved where indicated in the Decision Log.

## Acceptance / reproducibility

- AC-01: literal V1 typed schema with required career identity, existing clock and RNG state.
- AC-02: corrupted structures, missing/extra keys, invalid fields, version mismatches, and PRNG contradictions must reject deterministically.
- AC-03: valid complete states preserve exact values with immutable independent snapshots; rejected states never mutate inputs.
- AC-04: positive TS strict compile succeeds and ≥5 deliberately invalid TS fixture cases fail compilation.
- AC-05: core-only architecture; no persisted storage, migration, gameplay, new UI or event mechanics.
- AC-06: clean networked `npm ci`, full TypeScript/lint/tests/Vite build and existing CI regressions pass, including 20 real Vite dev/preview browser checks.
- AC-07: preserve parent files and Git history; verify CRC, SHA-256 manifest and append-only numbered checkpoint.

Use `npm run typecheck:state && npm run test:state`, `npm run verify`, `npm run check:vite`, `npm run lint:domains`, then run the real Vite dev/preview Chromium scripts at widths 375, 390, 402, 430, 1280. Physical iPhone Safari is independently `NOT_RUN` until actual device inspection.

**Next:** L3-028 — Implement IndexedDB wrapper. NOT STARTED by this milestone.
