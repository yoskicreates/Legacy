/**
 * LEGACY 3.0 L3-027 — V1 core-state wire contract and strict read-only validation.
 *
 * This is a MINIMAL versioned snapshot of career identity and already accepted core clocks/RNG.
 * It does not decide future fighter/career save fields, event history, storage,
 * migration, import/export UX, or persistence. Future versions must be explicit.
 * The validator never modifies the candidate; success yields a separate deeply
 * frozen, structurally identical value. Failure produces an issue, never a repair.
 */
import type { GameClockState } from './clock';
import type { RandomSourceState, RANDOM_ALGORITHM } from './random';

export const GAME_STATE_SCHEMA_VERSION = 1 as const;
/** The type annotation pins the embedded identifier to the L3-025 PRNG version. */
export const GAME_STATE_RANDOM_ALGORITHM: typeof RANDOM_ALGORITHM = 'LEGACY3-MULBERRY32-V1';

export interface GameStateV1 {
  readonly schemaVersion: typeof GAME_STATE_SCHEMA_VERSION;
  readonly career: Readonly<{ careerId: string; fighterId: string }>;
  readonly clocks: GameClockState;
  readonly random: RandomSourceState & Readonly<{ algorithm: typeof GAME_STATE_RANDOM_ALGORITHM }>;
}

export type GameStateValidationCode =
  | 'INVALID_STRUCTURE'
  | 'MISSING_FIELD'
  | 'UNEXPECTED_FIELD'
  | 'INVALID_VALUE'
  | 'UNSUPPORTED_VERSION'
  | 'CORRUPT_RANDOM_STATE';

export type GameStateValidationResult =
  | Readonly<{ ok: true; state: GameStateV1 }>
  | Readonly<{ ok: false; code: GameStateValidationCode; path: string }>;

/** Single rejected state is never partially returned as a successful snapshot. */
function reject(code: GameStateValidationCode, path: string): GameStateValidationResult {
  return Object.freeze({ ok: false as const, code, path });
}

/** Do not read inherited properties, execute accessors, or accept custom prototypes. */
function record(value: unknown, path: string, keys: readonly string[]):
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; result: GameStateValidationResult } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, result: reject('INVALID_STRUCTURE', path) };
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    return { ok: false, result: reject('INVALID_STRUCTURE', path) };
  }
  const all = Reflect.ownKeys(value);
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      return { ok: false, result: reject('MISSING_FIELD', `${path}.${key}`) };
    }
  }
  for (const key of all) {
    if (typeof key !== 'string' || !keys.includes(key)) {
      return { ok: false, result: reject('UNEXPECTED_FIELD', `${path}.${String(key)}`) };
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
      return { ok: false, result: reject('INVALID_STRUCTURE', `${path}.${key}`) };
    }
  }
  return { ok: true, data: value as Record<string, unknown> };
}

function nonnegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
function identifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
function uint32(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xFFFF_FFFF;
}

/** Validation of already-parsed untrusted data. NO JSON parsing or save I/O. */
export function validateGameState(candidate: unknown): GameStateValidationResult {
  try {
    const root = record(candidate, '$', ['schemaVersion', 'career', 'clocks', 'random']);
    if (!root.ok) return root.result;
    if (root.data.schemaVersion !== GAME_STATE_SCHEMA_VERSION) {
      return reject(typeof root.data.schemaVersion === 'number' && Number.isSafeInteger(root.data.schemaVersion)
        ? 'UNSUPPORTED_VERSION' : 'INVALID_VALUE', '$.schemaVersion');
    }
    const career = record(root.data.career, '$.career', ['careerId', 'fighterId']);
    if (!career.ok) return career.result;
    if (!identifier(career.data.careerId)) return reject('INVALID_VALUE', '$.career.careerId');
    if (!identifier(career.data.fighterId)) return reject('INVALID_VALUE', '$.career.fighterId');
    const clocks = record(root.data.clocks, '$.clocks', ['calendar', 'fight']);
    if (!clocks.ok) return clocks.result;
    const calendar = record(clocks.data.calendar, '$.clocks.calendar', ['dayIndex']);
    if (!calendar.ok) return calendar.result;
    const fight = record(clocks.data.fight, '$.clocks.fight', ['elapsedMilliseconds']);
    if (!fight.ok) return fight.result;
    if (!nonnegativeSafeInteger(calendar.data.dayIndex)) return reject('INVALID_VALUE', '$.clocks.calendar.dayIndex');
    if (!nonnegativeSafeInteger(fight.data.elapsedMilliseconds)) return reject('INVALID_VALUE', '$.clocks.fight.elapsedMilliseconds');
    const random = record(root.data.random, '$.random', ['algorithm', 'seed', 'word', 'draws']);
    if (!random.ok) return random.result;
    if (random.data.algorithm !== GAME_STATE_RANDOM_ALGORITHM) return reject('INVALID_VALUE', '$.random.algorithm');
    if (!uint32(random.data.seed)) return reject('INVALID_VALUE', '$.random.seed');
    if (!uint32(random.data.word)) return reject('INVALID_VALUE', '$.random.word');
    if (!nonnegativeSafeInteger(random.data.draws)) return reject('INVALID_VALUE', '$.random.draws');
    // Mulberry32's internal word advances by this exact uint32 step per draw.
    // BigInt prevents loss of precision for large (but safe) draw counters.
    const expectedWord = Number((BigInt(random.data.seed) + BigInt(random.data.draws) * 0x6D2B79F5n) & 0xFFFF_FFFFn);
    if (random.data.word !== expectedWord) return reject('CORRUPT_RANDOM_STATE', '$.random.word');
    const state: GameStateV1 = Object.freeze({
      schemaVersion: GAME_STATE_SCHEMA_VERSION,
      career: Object.freeze({ careerId: career.data.careerId, fighterId: career.data.fighterId }),
      clocks: Object.freeze({
        calendar: Object.freeze({ dayIndex: calendar.data.dayIndex }),
        fight: Object.freeze({ elapsedMilliseconds: fight.data.elapsedMilliseconds }),
      }),
      random: Object.freeze({
        algorithm: GAME_STATE_RANDOM_ALGORITHM,
        seed: random.data.seed,
        word: random.data.word,
        draws: random.data.draws,
      }),
    });
    return Object.freeze({ ok: true as const, state });
  } catch {
    // Malicious or revoked proxies must not make an unhandled validation error.
    return reject('INVALID_STRUCTURE', '$');
  }
}
