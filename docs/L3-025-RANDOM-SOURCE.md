# LEGACY 3.0 — L3-025 Deterministic Seeded Random Source

**Task:** L3-025 — Seed deterministic random source (Phase 02, Foundation, P2 Simulation / P5 Preservation).
**Parent:** verified `LEGACY_3_0_L3-024_COMPLETE_SOURCE.zip`, SHA-256 `8462fd8e8bcf7d1c7da74130577fd2f7095ef5d6d46519deb826fe2f36ad82bd`, task register 24/272.
**Blueprint build:** provide seedable PRNG interface for reproducible simulations.
**Blueprint acceptance:** identical seed reproduces identical sample sequence.
**Acceptance:** COMPLETE after all GitHub acceptance workflows, new source checkpoint CRC and per-file SHA-256 verification. **Next:** L3-026 remains NOT STARTED.

## Public API and deterministic specification

`src/domain/core/random.ts` exports:

- `RANDOM_ALGORITHM = 'LEGACY3-MULBERRY32-V1'`: versioned, documented fixed 32-bit Mulberry32 algorithm. A later algorithm change requires a new version and migration decision, not a silent behavior change.
- `createRandomSource(seed: number): RandomSourceState`: accepts **only uint32 integer values** in `[0, 4294967295]`, including zero, rejects missing/invalid input. Returns frozen `{ seed, word: seed, draws: 0 }`. Seeding is **explicit**.
- `nextRandomUint32(source)`: returns frozen `{ value, state }`, where `value` is a uint32 integer and `state` is a new frozen `{seed, word, draws}` with one exact consumed draw.
- `nextRandomUnitInterval(source)`: consumes exactly the same draw and advances state identically, with `value = uint32 / 4294967296` in `[0,1)`.

The complete generator state is passed into and returned from each call. There is **no hidden global generator**, mutation, ambient `Math.random`, `crypto`, clock, DOM, storage, framework or external library. Separate state objects have no shared state. The internal `word` advances using 32-bit modular addition of constant `0x6D2B79F5`; mixing uses JavaScript `Math.imul` and unsigned bitwise operations. Draw count is an exact nonnegative safe integer and cannot overflow silently.

**Pinned known sequences (first five `nextRandomUint32` values):**

- Seed `0`: `0x4434B462`, `0x00159C37`, `0x39285B08`, `0x256D8104`, `0x77A2CBD4`.
- Seed `1`: `0xA087EAF3`, `0x00B349C9`, `0x8706C4EB`, `0xFB2627FD`, `0xF7E79D2B`.
- Seed `42`: `0x99E1EF7C`, `0x72C32B8A`, `0xDA3B32C0`, `0xAB73B0AD`, `0x2CC09A8A`.
- Seed `4294967295`: `0xE57BF3D3`, `0x3081A5A4`, `0xB7350390`, `0xF1ADE904`, `0xD8616A2F`.

Seed equality is sufficient for identical sequences when the **algorithm version and draw order are also the same**. Different seeds do not promise universal sequence uniqueness. This is non-cryptographic simulation randomness, **not suitable for cryptographic, secret, gambling, or security use**. No statistical-quality certification is claimed.

## Traceable acceptance criteria

- **AC-01:** Explicit uint32 seed always creates reproducible and independent frozen states; all allowed seeds include zero and `UINT32_MAX`.
- **AC-02:** Identical seeds yield equal sequences across independently instantiated sources and at least 1,000 samples; frozen snapshots replay exactly.
- **AC-03:** Golden output vectors for 0, 1, 42, and `UINT32_MAX` lock down algorithm portability, not merely comparing one implementation with itself.
- **AC-04:** Uint32 outputs are integers in the uint32 range; `nextRandomUnitInterval` returns the identical underlying draw divided by `2^32`, confined to `[0,1)`.
- **AC-05:** No hidden random draws, mutable snapshots, global/host randomness, clocks, UI, storage or cross-domain dependencies; interleaved sources remain independent.
- **AC-06:** Invalid seeds, malformed snapshots, bad draw counts and draw overflow are rejected; compile-only TypeScript fixtures reject unseeded, incorrectly typed and mutable usage.
- **AC-07:** Full clean `npm ci`, strict TypeScript, negative fixtures, domain lint, all Node tests, genuine Vite build, and previous L3-020–L3-024 workflows pass.
- **AC-08:** Existing Preact/PixiJS UI and prior Vite behavior regress at 375/390/402/430/1280px on development and preview servers (20 Chromium browser checks), with recorded screenshot evidence.
- **AC-09:** Immutable numbered source archive, verified CRC, manifest SHA-256, all predecessor source files and archived Git objects preserved; 272-task register advances **only after** all acceptance gates pass.

## Decisions and boundaries

`DEC-007` approved five-minute fight rounds and speeds; L3-025 does not select a fight-event distribution, create fight logic or implement playback. `DEC-030` (calendar granularity), `DEC-031` (combat outcomes), and `DEC-035` (random dangerous-event/scandal probabilities) remain **OPEN**. No random event probability, combat scoring, or player agency choice is inferred from the PRNG implementation. No rejected paid-energy or mid-round tactical controls are reintroduced.

**Excluded:** L3-026 domain events, L3-027 persistence schema, L3-028 IndexedDB, gameplay, fights, careers, visual changes, saves, persistent PRNG seed format, background timers, true iPhone Safari QA. The site remains **not playable**.

## Reproduce checks

```sh
npm ci
npm run test:random
npm run typecheck:random
npm run lint:domains
npm run typecheck
npm run test:types:negative
npm run lint
npm test
npm run build
```

Chromium responsive tests and full hosted acceptance require GitHub Actions with the pinned npm packages; local runs without installed Preact/PixiJS must be reported accurately as **blocked**, not passing. Physical iPhone Safari test status is **NOT_RUN**.

## Verified cloud acceptance

- L3-025 dedicated CI: https://github.com/yoskicreates/Legacy/actions/runs/40777352852 — PASS.
- Prior L3-020, L3-021, L3-022, L3-023 and L3-024 regression CI runs: 40777352627, 40777352537, 40777352563, 40777352454 and 40777352701 — all PASS.
- 15/15 PRNG tests and all prior Node tests, clean npm ci, strict TypeScript typecheck, domain dependency lint, normal lint, and real Vite production build PASS.
- Chromium Preact/PixiJS boundary and Vite interactions PASS (20/20) at 375, 390, 402, 430 and 1280px against development and preview servers. Screenshots and build artifacts are in GitHub Actions evidence and Library checkpoint.
- Physical iPhone Safari test: **NOT_RUN** (not equivalent to Chromium emulation).
