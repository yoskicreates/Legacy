/** Internal browser-only L3-029 QA API; never mounted by main game. */
import { autosaveGameState, readAutosavedGameState } from '@domain/persistence/autosave';
import { LEGACY3_STORE, LEGACY3_RECORD_KEY } from '@domain/persistence/indexeddb';
import type { IndexedDbOptions, IndexedDbWriteOptions } from '@domain/persistence/indexeddb';

const validState = () => ({
  schemaVersion: 1,
  career: { careerId: 'career-qa', fighterId: 'fighter-qa' },
  clocks: { calendar: { dayIndex: 30 }, fight: { elapsedMilliseconds: 120000 } },
  random: { algorithm: 'LEGACY3-MULBERRY32-V1', seed: 42, word: 42, draws: 0 },
});

/** A real IndexedDB transaction, explicitly aborted after a queued put, for rollback proof. */
async function explicitlyAbortRealTransaction(name: string, candidate: unknown): Promise<void> {
  const request = indexedDB.open(name, 1);
  const db = await new Promise<IDBDatabase>((resolve,reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    await new Promise<void>((resolve,reject) => {
      const tx = db.transaction(LEGACY3_STORE, 'readwrite');
      tx.objectStore(LEGACY3_STORE).put(candidate, LEGACY3_RECORD_KEY);
      tx.oncomplete = () => reject(new Error('unexpected commit after abort'));
      tx.onabort = () => resolve();
      tx.onerror = () => resolve();
      tx.abort();
    });
  } finally { db.close(); }
}

interface AutosaveQaProbe {
  validState: typeof validState;
  autosaveGameState: typeof autosaveGameState;
  readAutosavedGameState: typeof readAutosavedGameState;
  explicitlyAbortRealTransaction: typeof explicitlyAbortRealTransaction;
  noBrowser: () => IndexedDbOptions;
  throwsOpen: () => IndexedDbWriteOptions;
}
declare global { interface Window { __LEGACY3_AUTOSAVE_QA__?: AutosaveQaProbe } }
window.__LEGACY3_AUTOSAVE_QA__ = {
  validState, autosaveGameState, readAutosavedGameState, explicitlyAbortRealTransaction,
  noBrowser: () => ({factory: null}),
  throwsOpen: () => ({factory: {open() {throw new DOMException('no access','SecurityError');}} as unknown as IDBFactory}),
};
document.documentElement.dataset.autosaveQaReady = 'true';
