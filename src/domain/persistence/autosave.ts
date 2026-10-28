/**
 * L3-029: one explicit, atomic autosave of the current validated V1 core state.
 * No timer, subscription, scheduler, save slots, migration or gameplay behavior.
 * A successful result means IndexedDB transaction COMPLETE, not merely put queued.
 */
import { GAME_STATE_SCHEMA_VERSION } from '@domain/core';
import { writeGameState, readGameState } from './indexeddb';
import type { IndexedDbWriteOptions, IndexedDbOptions, IndexedDbResult } from './indexeddb';
import type { GameStateV1 } from '@domain/core';

export type AutosaveReceipt = Readonly<{ committed: true; schemaVersion: typeof GAME_STATE_SCHEMA_VERSION }>;

/** Aborted/failed/invalid writes never return a successful receipt or delete a prior snapshot. */
export async function autosaveGameState(candidate: unknown, options: IndexedDbWriteOptions = {}): Promise<IndexedDbResult<AutosaveReceipt>> {
  const result = await writeGameState(candidate, options);
  if (!result.ok) return result;
  return Object.freeze({ ok: true as const, value: Object.freeze({ committed: true as const, schemaVersion: GAME_STATE_SCHEMA_VERSION }) });
}

/** A verified read of the sole snapshot; missing record is null, not a fabricated career. */
export function readAutosavedGameState(options: IndexedDbOptions = {}): Promise<IndexedDbResult<GameStateV1 | null>> {
  return readGameState(options);
}
