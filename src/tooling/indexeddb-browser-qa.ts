/** Isolated browser QA entry for L3-028, not linked from the game shell. */
import { readGameState, writeGameState, LEGACY3_STORE, LEGACY3_RECORD_KEY } from '@domain/persistence/indexeddb';
import type { IndexedDbOptions } from '@domain/persistence/indexeddb';

const validState = () => ({
  schemaVersion: 1,
  career: { careerId: 'career-qa', fighterId: 'fighter-qa' },
  clocks: { calendar: { dayIndex: 30 }, fight: { elapsedMilliseconds: 120_000 } },
  random: { algorithm: 'LEGACY3-MULBERRY32-V1', seed: 42, word: 42, draws: 0 },
});

function rawWrite(databaseName: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onerror = () => reject(request.error ?? new Error('raw open'));
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(LEGACY3_STORE, 'readwrite');
      tx.objectStore(LEGACY3_STORE).put(value, LEGACY3_RECORD_KEY);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error ?? new Error('raw tx')); };
      tx.onabort = () => { db.close(); reject(tx.error ?? new Error('raw abort')); };
    };
  });
}

interface QaProbe {
  readonly validState: typeof validState;
  readonly writeGameState: typeof writeGameState;
  readonly readGameState: typeof readGameState;
  readonly rawWrite: typeof rawWrite;
  readonly noBrowser: () => IndexedDbOptions;
  readonly throwsOpen: () => IndexedDbOptions;
}
declare global { interface Window { __LEGACY3_INDEXEDDB_QA__?: QaProbe } }
window.__LEGACY3_INDEXEDDB_QA__ = {
  validState, writeGameState, readGameState, rawWrite,
  noBrowser: () => ({ factory: null }),
  throwsOpen: () => ({ factory: { open() { throw new DOMException('open failed', 'SecurityError'); } } as unknown as IDBFactory }),
};
document.documentElement.dataset.indexedDbQaReady = 'true';
