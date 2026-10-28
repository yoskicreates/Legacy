# LEGACY 3.0 — L3-024 Separate Game Clock Contract

**Task:** L3-024 Define game clock (Phase 02; P2 Simulation / P4 Realism).  
**Current state:** REVIEW — awaiting final GitHub Actions and immutable checkpoint acceptance.  
**Dependency:** L3-023 completed, immutable source baseline `LEGACY_3_0_L3-023_COMPLETE_SOURCE.zip`.  
**Next:** L3-025 deterministic seeded random source, expressly NOT started.

## Blueprint requirement and measurable acceptance criteria

The L3-024 blueprint build requirement is **separate game-calendar time from fight simulation time**. Its acceptance test is **clock tests show no unintended time advancement**.

- **A01 — Distinct typed clocks:** `src/domain/core/clock.ts` models `calendar.dayIndex` as an abstract, nonnegative safe integer and `fight.elapsedMilliseconds` as an independent nonnegative safe integer. Both start at zero unless an explicit calendar starting index is provided.
- **A02 — Explicit, isolated transitions:** `reduceGameClocks` accepts `advance-calendar-days`, `advance-fight-milliseconds`, and `reset-fight-clock`. Advancing one axis retains the other axis's object identity and numeric value.
- **A03 — No implicit advancement:** creation, no-op transitions, menu navigation, idle microtasks, and unknown/automatic-tick actions never increment calendar days or simulated milliseconds. The reducer cannot read `Date`, timers, DOM, playback speeds, random values, storage, or network.
- **A04 — Safety and determinism:** negative, fractional, nonfinite and unsafe integer inputs are rejected, safe-integer overflow throws, prior snapshots remain immutable, and identical action sequences always return identical state.
- **A05 — Type contract:** strict TypeScript rejects wrong units, unknown actions, and mutation of readonly state; tests work headlessly with no renderer or browser.
- **A06 — Regression and preservation:** verify `npm ci`, full lint, domain import graph, strict types, the deliberate negative fixture, full Node suite, genuine Vite production build and existing L3-020/L3-021 Chromium dev/preview tests at 375, 390, 402, 430 and 1280 CSS px.
- **A07 — Checkpoint:** preserve all parent ZIP files and original Git objects byte-for-byte, publish a new numbered source ZIP with CRC and SHA-256 manifest and QA report, and retain old checkpoints untouched.

## API contract

```ts
const original = createGameClocks(12);
const nextDay = reduceGameClocks(original, {type:'advance-calendar-days', days:2});
// nextDay.calendar.dayIndex = 14; nextDay.fight.elapsedMilliseconds = 0
const nextFight = reduceGameClocks(nextDay, {type:'advance-fight-milliseconds', milliseconds:5000});
// nextFight.calendar.dayIndex = 14; nextFight.fight.elapsedMilliseconds = 5000
const reset = reduceGameClocks(nextFight, {type:'reset-fight-clock'});
// reset.calendar.dayIndex = 14; reset.fight.elapsedMilliseconds = 0
```

State is frozen, pure, in-memory, with no timers. `0` increments preserve the original object reference. The fight clock's unit is milliseconds **of abstract simulation**, *not* actual fight-round simulation or elapsed real time. Its value increases only when the caller explicitly supplies a validated increment; this is not a source of truth for 3×5 or 5×5 round results, fight playback, stoppages, or on-screen elapsed time at this stage. No game-calendar date is implied by day index 0. No season/aging/training cadence is decided.

## Architectural and decision controls

- **DEC-001 APPROVED:** clean new LEGACY3 source; no legacy V1/V2 imports.
- **DEC-002 APPROVED:** one numbered milestone with tests and source preservation.
- **DEC-003 APPROVED:** iPhone Safari first; no UI changed this milestone, run existing mobile Chromium regression and report physical Safari as NOT_RUN.
- **DEC-006/DEC-007 APPROVED:** automatic fights, corner-only tactics, 5-minute rounds and fixed speed options are *future combat engine requirements*, not implemented by this neutral time-state contract.
- **DEC-012 REJECTED:** never import previous SVG rigs or old game code.
- **DEC-030 OPEN:** game calendar simulation cadence and passing-time UX (daily, weekly, hybrid) await decision at L3-152. An integer day index as a storage-free counter does not select a UX cadence.
- **L3-119 FUTURE:** detailed fight clock and bout phase model remains unimplemented. L3-025 random source, L3-026 events, L3-027 save schema, L3-028 IndexedDB, actual UI integration, timers, route wiring, character and combat gameplay are excluded.

## Verification and known limitations

New headless test: `npm run test:clock` (15 tests). All existing project checks must pass after a clean networked install. iPhone Safari physical-device testing: **NOT_RUN**, no ability to remotely operate the user's device. Browser QA may only claim emulated Chromium coverage. Persisted saves, time zones, scheduling UX, fight rounds and rendering time are **NOT_IMPLEMENTED**.

The GitHub repository `yoskicreates/Legacy` is a separate import history from the original local archived Git graph. Preserve both; never imply they are identical. A source ZIP is not a playable MMA simulator.
