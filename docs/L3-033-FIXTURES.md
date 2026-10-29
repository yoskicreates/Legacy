# LEGACY 3.0 L3-033 — deterministic test fixture system

This milestone creates **internal test-only synthetic data**. There is no real fighter-creator, production fighter model, event simulator, save UI or gameplay. Source is isolated at `src/tooling/fixture-system.ts`, and production `src/main.ts`, domain reducers, and persistence stores do not import it. The test-only Vite entry `fixtures-qa.html` exists only for Chromium acceptance.

## Typed helpers

- `makeFighterFixture(seed:uint32, ordinal=0)`: seeded fictional name, style and division; ID includes the seed and ordinal. **Not** a production fighter.
- `makeCareerFixture({seed, careerId?, fighterId?, calendarDay?, fightMilliseconds?, randomDraws?})`: accepted, immutable `GameStateV1` with explicit clocks and replay source. Inputs default only to deterministic constants; no wall-clock or `Math.random`.
- `makeSaveFixture({slotId, savedAtEpochMs, ...careerOptions})`: one frozen `LoadedManualSlot` record with synchronized identity and version.
- `makeFixtureBundle(seed, savedAtEpochMs)`: three independent records for `slot-1`, `slot-2`, `slot-3`; seed derivation uses deterministic uint32 rollover, no hidden global state.
- `makeInvalidStateFixture(kind,seed=42)`: intentionally rejected `unknown` state for `unsupported-version`, `corrupt-random`, `negative-clock`, `missing-career`, `extra-root-field`. **Never save these records.**
- `makeBoundaryFixtures()`: one zero-seeded zero-clock state and one maximal uint32 seed / maximal safe integer clock and draw count. Both must pass the V1 schema validator.

## Determinism and preservation

All seeds are checked against L3-025's `createRandomSource`. Fake fighter variants use the published L3-025 `nextRandomUint32` generator; the state replay `word` matches the accepted L3-027 BigInt modulo arithmetic for any nonnegative safe integer draw count. All metadata timestamps are explicit input, never ambient `Date`. For the same seed and options, serialized output is identical, regardless of refresh or number of other fixtures created. Newly produced values are recursively immutable and independently allocated. These helpers NEVER write IndexedDB, import a file, advance a production game clock, or change an existing save. Fixtures are not real user data; identifiers are prefixed `fixture-`.

## Tests and failure cases

`npm run typecheck:fixtures`; `npm run test:fixtures:negative` (exactly seven deliberately rejected diagnostics); `npm run test:fixtures` (22 dedicated Node tests); `npm test` (all earlier tests); `npm run build` (real Vite), plus actual Chromium QA on Vite dev and preview at 375/390/402/430 CSS px. Real browser tests verify deterministic snapshots across a full page reload, valid V1 and boundary cases, all invalid cases rejected, three slot identities, no overflow and no modification of a pre-existing IndexedDB career. Existing L3-020 through L3-032 regressions run independently.

## Limits and forward development

This test-only data does not establish real fighter attributes, real MMA tactics, gameplay, visual artwork, actual save migration, an interactive menu, production fake-data injection, iPhone Safari physical hardware verification, or L3-034. Physical iPhone Safari remains **NOT_RUN**. Do not import this utility from production screens or domain modules. When production fighter and career fields are later approved, add a new fixture contract and explicit tests instead of silently changing these V1 fixture semantics. Immutable numbered checkpoints and the original Git graph remain protected.
