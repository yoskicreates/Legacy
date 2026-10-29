/**
 * LEGACY 3.0 L3-033: PURE TEST-ONLY fixtures. Never import from production code.
 * A fighter here is synthetic test metadata, not a game character or stat engine.
 * Every input including seed, clock and save timestamp is explicit. No Date,
 * Math.random, storage, network, mutable singleton or hidden draw history.
 */
import { createRandomSource, nextRandomUint32, RANDOM_ALGORITHM } from '../domain/core/random';
import type { GameStateV1 } from '../domain/core/state-schema';
import type { LoadedManualSlot, ManualSaveSlotId } from '../domain/persistence/manual-slots';

export const FIXTURE_SCHEMA_VERSION = 1 as const;
export const FIXTURE_SLOT_IDS = ['slot-1', 'slot-2', 'slot-3'] as const satisfies readonly ManualSaveSlotId[];
export type FixtureStyle = 'striker' | 'grappler' | 'balanced';
export type FixtureDivision = 'flyweight' | 'lightweight' | 'welterweight' | 'heavyweight';
export type FighterFixture = Readonly<{
  fighterId: string;
  name: string;
  style: FixtureStyle;
  division: FixtureDivision;
  seed: number;
}>;
export type CareerFixtureOptions = Readonly<{
  seed: number;
  careerId?: string;
  fighterId?: string;
  calendarDay?: number;
  fightMilliseconds?: number;
  randomDraws?: number;
}>;
export type SaveFixtureOptions = Readonly<CareerFixtureOptions & {
  slotId: ManualSaveSlotId;
  savedAtEpochMs: number;
}>;
export type FixtureInvalidCase = 'unsupported-version' | 'corrupt-random' | 'negative-clock' | 'missing-career' | 'extra-root-field';

const names = ['Ari Stone', 'Jules Carter', 'Taylor Morgan', 'Sage Lee', 'Devon Rivera', 'Riley Quinn'] as const;
const styles = ['striker', 'grappler', 'balanced'] as const;
const divisions = ['flyweight', 'lightweight', 'welterweight', 'heavyweight'] as const;
const RNG_STEP = 0x6D2B79F5n;
function safeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`fixture ${name} must be a nonnegative safe integer`);
}
function validId(value: string, name: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) throw new TypeError(`fixture ${name} must be nonblank`);
}
function seedSource(seed: number): void {
  createRandomSource(seed); // L3-025 is the sole source of truth for seed validity.
}
function slotId(id: string): asserts id is ManualSaveSlotId {
  if (!FIXTURE_SLOT_IDS.some(x => x === id)) throw new RangeError('fixture slotId must be a fixed manual slot');
}
function snapshotWord(seed: number, draws: number): number {
  return Number((BigInt(seed) + RNG_STEP * BigInt(draws)) & 0xFFFF_FFFFn);
}
/** Distinct stable mock fighter metadata. Does not create a production fighter. */
export function makeFighterFixture(seed: number, ordinal = 0): FighterFixture {
  seedSource(seed);
  safeInteger(ordinal, 'ordinal');
  let source = createRandomSource(seed);
  const first = nextRandomUint32(source); source = first.state;
  const second = nextRandomUint32(source); source = second.state;
  const third = nextRandomUint32(source);
  return Object.freeze({
    fighterId: `fixture-fighter-${seed}-${ordinal}`,
    name: names[first.value % names.length]!,
    style: styles[second.value % styles.length]!,
    division: divisions[third.value % divisions.length]!,
    seed,
  });
}
/** Valid strict V1 state. No writes; no clock advances; no hidden RNG draws. */
export function makeCareerFixture(options: CareerFixtureOptions): GameStateV1 {
  seedSource(options.seed);
  const calendarDay = options.calendarDay ?? 0;
  const fightMilliseconds = options.fightMilliseconds ?? 0;
  const randomDraws = options.randomDraws ?? 0;
  safeInteger(calendarDay, 'calendarDay');
  safeInteger(fightMilliseconds, 'fightMilliseconds');
  safeInteger(randomDraws, 'randomDraws');
  const careerId = options.careerId ?? `fixture-career-${options.seed}`;
  const fighterId = options.fighterId ?? makeFighterFixture(options.seed).fighterId;
  validId(careerId, 'careerId'); validId(fighterId, 'fighterId');
  return Object.freeze({
    schemaVersion: FIXTURE_SCHEMA_VERSION,
    career: Object.freeze({ careerId, fighterId }),
    clocks: Object.freeze({
      calendar: Object.freeze({dayIndex: calendarDay}),
      fight: Object.freeze({elapsedMilliseconds: fightMilliseconds}),
    }),
    random: Object.freeze({
      algorithm: RANDOM_ALGORITHM,
      seed: options.seed,
      word: snapshotWord(options.seed, randomDraws),
      draws: randomDraws,
    }),
  });
}
/** Metadata and state are one independent, immutable manual-slot record. */
export function makeSaveFixture(options: SaveFixtureOptions): LoadedManualSlot {
  slotId(options.slotId);
  safeInteger(options.savedAtEpochMs, 'savedAtEpochMs');
  const state = makeCareerFixture(options);
  return Object.freeze({
    metadata: Object.freeze({
      slotId: options.slotId, savedAtEpochMs: options.savedAtEpochMs,
      careerId: state.career.careerId, fighterId: state.career.fighterId,
      schemaVersion: FIXTURE_SCHEMA_VERSION,
    }),
    state,
  });
}
/** Three deterministic independent career records, never real save data. */
export function makeFixtureBundle(seed: number, savedAtEpochMs: number): readonly LoadedManualSlot[] {
  seedSource(seed); safeInteger(savedAtEpochMs, 'savedAtEpochMs');
  return Object.freeze(FIXTURE_SLOT_IDS.map((id, i) => makeSaveFixture({
    seed: (seed + i) >>> 0, slotId: id, savedAtEpochMs,
    careerId: `fixture-career-${seed}-slot-${i + 1}`,
  })));
}
/** Explicitly invalid cases for validator rejection tests. These are unknown, not GameStateV1. */
export function makeInvalidStateFixture(kind: FixtureInvalidCase, seed = 42): unknown {
  const copy = structuredClone(makeCareerFixture({ seed })) as unknown as Record<string, unknown>;
  switch (kind) {
    case 'unsupported-version': copy.schemaVersion = 99; break;
    case 'corrupt-random': (copy.random as Record<string, unknown>).word = 7; break;
    case 'negative-clock': ((copy.clocks as Record<string, unknown>).calendar as Record<string, unknown>).dayIndex = -1; break;
    case 'missing-career': delete copy.career; break;
    case 'extra-root-field': copy.unexpected = true; break;
    default: { const neverKind: never = kind; throw new TypeError(`unknown invalid fixture ${String(neverKind)}`); }
  }
  return copy;
}
/** Boundary snapshots: valid 0, maximal uint32 and safe-integer clock/draw values. */
export function makeBoundaryFixtures(): readonly GameStateV1[] {
  return Object.freeze([
    makeCareerFixture({seed:0,calendarDay:0,fightMilliseconds:0,randomDraws:0}),
    makeCareerFixture({seed:0xFFFF_FFFF, calendarDay:Number.MAX_SAFE_INTEGER,
      fightMilliseconds:Number.MAX_SAFE_INTEGER,randomDraws:Number.MAX_SAFE_INTEGER}),
  ]);
}
