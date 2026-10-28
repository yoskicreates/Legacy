/**
 * LEGACY 3.0 L3-025 — explicit, reproducible 32-bit random source.
 *
 * This is mulberry32 (32-bit modular arithmetic), pinned as algorithm
 * LEGACY3-MULBERRY32-V1. Identical seeds + identical draw order yield
 * identical uint32 and [0,1) sequences in compliant JS environments.
 *
 * No Math.random, Date, crypto, entropy, timer, storage, DOM, or gameplay.
 * Not suitable for security, gambling, cryptography, or secret generation.
 */
export const RANDOM_ALGORITHM = 'LEGACY3-MULBERRY32-V1' as const;
const UINT32_MAX = 0xFFFF_FFFF;
const STEP = 0x6D2B_79F5;

/** A snapshot is completely explicit and replayable; nothing is in a closure. */
export interface RandomSourceState {
  readonly seed: number;
  readonly word: number;
  readonly draws: number;
}

/** A sampled value and the new immutable source state; the input is unchanged. */
export interface RandomSourceStep {
  readonly value: number;
  readonly state: RandomSourceState;
}

function assertUint32(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0 || value > UINT32_MAX) {
    throw new RangeError(`LEGACY3 random: ${field} must be a uint32 integer`);
  }
}

function assertSource(state: RandomSourceState): void {
  if (state === null || typeof state !== 'object') {
    throw new TypeError('LEGACY3 random: invalid source state');
  }
  assertUint32(state.seed, 'state.seed');
  assertUint32(state.word, 'state.word');
  if (!Number.isSafeInteger(state.draws) || state.draws < 0) {
    throw new RangeError('LEGACY3 random: state.draws must be a nonnegative safe integer');
  }
}

/** All uint32 seeds, including 0 and 0xffffffff, are valid and distinct. */
export function createRandomSource(seed: number): RandomSourceState {
  assertUint32(seed, 'seed');
  return Object.freeze({ seed, word: seed, draws: 0 });
}

/** Deterministically consume exactly one draw without mutating its parent state. */
export function nextRandomUint32(source: RandomSourceState): RandomSourceStep {
  assertSource(source);
  if (source.draws === Number.MAX_SAFE_INTEGER) {
    throw new RangeError('LEGACY3 random: draw counter overflow');
  }
  const word = (source.word + STEP) >>> 0;
  let t = Math.imul(word ^ (word >>> 15), word | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = (t ^ (t >>> 14)) >>> 0;
  const state = Object.freeze({ seed: source.seed, word, draws: source.draws + 1 });
  return Object.freeze({ value, state });
}

/** Same draw and next state as nextRandomUint32, normalized to [0,1). */
export function nextRandomUnitInterval(source: RandomSourceState): RandomSourceStep {
  const sample = nextRandomUint32(source);
  return Object.freeze({ value: sample.value / 0x1_0000_0000, state: sample.state });
}
