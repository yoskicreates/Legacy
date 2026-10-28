/**
 * LEGACY 3.0 L3-032 — pure, ordered schema migration harness.
 * V0 is explicitly SYNTHETIC: the same documented V1 fields with version literal 0.
 * No migrations are applied to IndexedDB or archive files automatically. A caller
 * must review output and separately perform an authorized transactional write.
 */
import { GAME_STATE_SCHEMA_VERSION, validateGameState, type GameStateV1 } from '@domain/core';
import { MANUAL_SAVE_SLOT_IDS, type LoadedManualSlot, type ManualSlotMetadata, type ManualSaveSlotId } from './manual-slots';

export const OLDEST_SUPPORTED_SYNTHETIC_SCHEMA_VERSION = 0 as const;
export const CURRENT_MIGRATION_SCHEMA_VERSION: typeof GAME_STATE_SCHEMA_VERSION = 1;
export type MigrationErrorCode = 'INVALID_STRUCTURE' | 'INVALID_STATE' | 'UNSUPPORTED_VERSION' | 'CORRUPT_STATE' |
  'INCONSISTENT_VERSION' | 'INVALID_METADATA' | 'MIGRATION_FAILED';
export type MigrationStep = Readonly<{ from: 0; to: 1; name: 'synthetic-v0-to-v1' }>;
export const ORDERED_MIGRATION_STEPS: readonly MigrationStep[] = Object.freeze([
  Object.freeze({ from: 0, to: 1, name: 'synthetic-v0-to-v1' as const }),
]);
export type MigrationResult<T> =
  | Readonly<{ ok: true; value: T; steps: readonly MigrationStep[] }>
  | Readonly<{ ok: false; code: MigrationErrorCode; detail: string }>;

const failure = <T>(code: MigrationErrorCode, detail: string): MigrationResult<T> => Object.freeze({ ok: false as const, code, detail });
const success = <T>(value: T, steps: readonly MigrationStep[]): MigrationResult<T> =>
  Object.freeze({ ok: true as const, value, steps });

/** Reject accessors, symbols, inherited keys and unrecognized fields before reading. */
function exactData(value: unknown, expected: readonly string[]): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  if (proto !== null && proto !== Object.prototype) return false;
  const own = Reflect.ownKeys(value);
  return own.length === expected.length && expected.every(k => own.includes(k)) &&
    own.every(k => typeof k === 'string' && expected.includes(k) &&
      Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(value, k), 'value'));
}
function version(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0; }
const validTime = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const validSlot = (value: unknown): value is ManualSaveSlotId => MANUAL_SAVE_SLOT_IDS.some(id => id === value);

/** Pure migration runner: no clocks advanced, RNG draws, I/O, or in-place mutation. */
export function migrateGameState(candidate: unknown): MigrationResult<GameStateV1> {
  try {
    if (!exactData(candidate, ['schemaVersion', 'career', 'clocks', 'random'])) return failure('INVALID_STRUCTURE', '$');
    const sourceVersion = candidate.schemaVersion;
    if (!version(sourceVersion) || sourceVersion > CURRENT_MIGRATION_SCHEMA_VERSION)
      return failure('UNSUPPORTED_VERSION', '$.schemaVersion');
    if (sourceVersion < OLDEST_SUPPORTED_SYNTHETIC_SCHEMA_VERSION) return failure('UNSUPPORTED_VERSION', '$.schemaVersion');
    let current: unknown = candidate;
    const applied: MigrationStep[] = [];
    // V1's strict validator also checks all nested fields, clock values and RNG word.
    // The single permitted synthetic V0 transform only replaces the schema marker.
    for (const step of ORDERED_MIGRATION_STEPS) {
      if (current === null || typeof current !== 'object') return failure('MIGRATION_FAILED', '$');
      const state = current as Record<string, unknown>;
      if (state.schemaVersion === step.from) {
        current = { ...state, schemaVersion: step.to };
        applied.push(step);
      }
    }
    const checked = validateGameState(current);
    if (!checked.ok) return failure(checked.code === 'UNSUPPORTED_VERSION' ? 'UNSUPPORTED_VERSION' :
      checked.code === 'CORRUPT_RANDOM_STATE' ? 'CORRUPT_STATE' : 'INVALID_STATE', checked.path);
    return success(checked.state, Object.freeze(applied));
  } catch { return failure('INVALID_STRUCTURE', '$'); }
}

/** Validate and migrate one in-memory slot record, retaining original metadata and time. */
export function migrateManualSlotRecord(candidate: unknown): MigrationResult<LoadedManualSlot> {
  try {
    if (!exactData(candidate, ['metadata', 'state']) ||
        !exactData(candidate.metadata, ['slotId', 'savedAtEpochMs', 'careerId', 'fighterId', 'schemaVersion']))
      return failure('INVALID_STRUCTURE', '$.metadata');
    const metadata = candidate.metadata;
    if (!version(metadata.schemaVersion) || metadata.schemaVersion > CURRENT_MIGRATION_SCHEMA_VERSION)
      return failure('UNSUPPORTED_VERSION', '$.metadata.schemaVersion');
    if (!validSlot(metadata.slotId) || !validTime(metadata.savedAtEpochMs) ||
        typeof metadata.careerId !== 'string' || metadata.careerId.trim().length === 0 ||
        typeof metadata.fighterId !== 'string' || metadata.fighterId.trim().length === 0)
      return failure('INVALID_METADATA', '$.metadata');
    if (!exactData(candidate.state, ['schemaVersion', 'career', 'clocks', 'random']))
      return failure('INVALID_STRUCTURE', '$.state');
    if (candidate.state.schemaVersion !== metadata.schemaVersion)
      return failure('INCONSISTENT_VERSION', '$.metadata.schemaVersion');
    const migrated = migrateGameState(candidate.state);
    if (!migrated.ok) return migrated;
    if (migrated.value.career.careerId !== metadata.careerId || migrated.value.career.fighterId !== metadata.fighterId)
      return failure('INVALID_METADATA', '$.metadata.careerId');
    const updated: ManualSlotMetadata = Object.freeze({
      slotId: metadata.slotId, savedAtEpochMs: metadata.savedAtEpochMs,
      careerId: metadata.careerId, fighterId: metadata.fighterId, schemaVersion: GAME_STATE_SCHEMA_VERSION,
    });
    return success(Object.freeze({ metadata: updated, state: migrated.value }), migrated.steps);
  } catch { return failure('INVALID_STRUCTURE', '$'); }
}
