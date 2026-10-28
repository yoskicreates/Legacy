/** L3-029: compile-only positive autosave contract. */
import { autosaveGameState, readAutosavedGameState } from '@domain/persistence/autosave';
import type { AutosaveReceipt } from '@domain/persistence/autosave';
import type { IndexedDbWriteOptions } from '@domain/persistence/indexeddb';
import type { GameStateV1 } from '@domain/core';

export async function verifyAutosaveTypes(state: GameStateV1, signal: AbortSignal): Promise<void> {
  const options: IndexedDbWriteOptions = {signal};
  const saved = await autosaveGameState(state, options);
  if (saved.ok) {
    const receipt: AutosaveReceipt = saved.value;
    const version: 1 = receipt.schemaVersion;
    const committed: true = receipt.committed;
    void version; void committed;
  }
  const loaded = await readAutosavedGameState();
  if (loaded.ok && loaded.value !== null) {
    const version: 1 = loaded.value.schemaVersion;
    void version;
  }
}
