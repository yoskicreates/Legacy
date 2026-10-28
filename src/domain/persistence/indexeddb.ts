/**
 * L3-028 — minimal browser IndexedDB boundary for a SINGLE V1 core snapshot.
 * No autosave, slots, migrations, import/export, UI, or arbitrary object writes.
 * Only transaction completion constitutes a committed write. Stored reads are
 * validated as untrusted data and never silently corrected or migrated.
 */
import { validateGameState, type GameStateV1, type GameStateValidationCode } from '@domain/core';

export const LEGACY3_DB_NAME = 'LEGACY3_CORE_V1' as const;
export const LEGACY3_DB_VERSION = 1 as const;
export const LEGACY3_STORE = 'core-state' as const;
export const LEGACY3_RECORD_KEY = 'current' as const;

export type IndexedDbCode =
  | 'UNSUPPORTED_BROWSER'
  | 'INVALID_STATE'
  | 'CORRUPT_STATE'
  | 'UNSUPPORTED_VERSION'
  | 'DATABASE_BLOCKED'
  | 'DATABASE_ERROR'
  | 'STORE_MISSING'
  | 'TRANSACTION_ERROR'
  | 'WRITE_ABORTED';

export type IndexedDbResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; code: IndexedDbCode; detail?: string; validationCode?: GameStateValidationCode }>;

/** Optional factory for testing; null explicitly simulates no browser support. */
export interface IndexedDbOptions {
  readonly factory?: IDBFactory | null;
  /** Use isolated DB names only in tests; no save-slot behavior. */
  readonly databaseName?: string;
}
const success = <T>(value: T): IndexedDbResult<T> => Object.freeze({ ok: true as const, value });
const failure = <T>(code: IndexedDbCode, detail?: string, validationCode?: GameStateValidationCode): IndexedDbResult<T> =>
  Object.freeze({ ok: false as const, code, ...(detail === undefined ? {} : { detail }),
    ...(validationCode === undefined ? {} : { validationCode }) });

function resolvedFactory(options: IndexedDbOptions): IDBFactory | null {
  if ('factory' in options) return options.factory ?? null;
  try { return typeof indexedDB === 'undefined' ? null : indexedDB; }
  catch { return null; }
}
function databaseName(options: IndexedDbOptions): string | null {
  const name = options.databaseName ?? LEGACY3_DB_NAME;
  return typeof name === 'string' && name.length > 0 && name.trim() === name ? name : null;
}

/** Cancellation applies ONLY to a pending write transaction, never to a completed commit. */
export interface IndexedDbWriteOptions extends IndexedDbOptions {
  readonly signal?: AbortSignal;
}

type OpenResult = IndexedDbResult<IDBDatabase>;
function openDatabase(options: IndexedDbOptions): Promise<OpenResult> {
  const factory = resolvedFactory(options);
  if (!factory) return Promise.resolve(failure('UNSUPPORTED_BROWSER'));
  const name = databaseName(options);
  if (name === null) return Promise.resolve(failure('DATABASE_ERROR', 'Invalid database name'));
  return new Promise(resolve => {
    let finished = false;
    const settle = (result: OpenResult) => { if (!finished) { finished = true; resolve(result); } };
    try {
      const request = factory.open(name, LEGACY3_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        // First creation only. Existing schemas are NOT migrated in L3-028.
        if (!db.objectStoreNames.contains(LEGACY3_STORE)) db.createObjectStore(LEGACY3_STORE);
      };
      request.onblocked = () => settle(failure('DATABASE_BLOCKED'));
      request.onerror = () => settle(failure('DATABASE_ERROR', request.error?.name ?? 'open failed'));
      request.onsuccess = () => {
        const db = request.result;
        if (finished) { db.close(); return; }
        if (!db.objectStoreNames.contains(LEGACY3_STORE)) {
          db.close(); settle(failure('STORE_MISSING')); return;
        }
        db.onversionchange = () => db.close();
        settle(success(db));
      };
    } catch (error) {
      settle(failure('DATABASE_ERROR', error instanceof Error ? error.name : 'open threw'));
    }
  });
}

/** One transaction per call, with fixed record key. Resolves only on commit. */
export async function writeGameState(candidate: unknown, options: IndexedDbWriteOptions = {}): Promise<IndexedDbResult<true>> {
  const validation = validateGameState(candidate);
  if (!validation.ok) return failure(validation.code === 'UNSUPPORTED_VERSION' ? 'UNSUPPORTED_VERSION' : 'INVALID_STATE', validation.path, validation.code);
  if (options.signal?.aborted) return failure('WRITE_ABORTED', 'AbortError');
  const opened = await openDatabase(options);
  if (!opened.ok) return opened;
  const db = opened.value;
  if (options.signal?.aborted) { db.close(); return failure('WRITE_ABORTED', 'AbortError'); }
  return new Promise(resolve => {
    let finished = false;
    let cancelled = false;
    let abortPending: (() => void) | undefined;
    const settle = (result: IndexedDbResult<true>) => {
      if (finished) return;
      finished = true;
      if (abortPending) options.signal?.removeEventListener('abort', abortPending);
      db.close();
      resolve(result);
    };
    try {
      const tx = db.transaction(LEGACY3_STORE, 'readwrite');
      abortPending = () => {
        if (finished) return;
        cancelled = true;
        try { tx.abort(); } catch { /* already committed: completion event remains authoritative */ }
      };
      options.signal?.addEventListener('abort', abortPending, { once: true });
      tx.oncomplete = () => settle(success(true));
      tx.onerror = () => settle(failure('TRANSACTION_ERROR', tx.error?.name ?? 'transaction error'));
      tx.onabort = () => settle(cancelled ? failure('WRITE_ABORTED', 'AbortError') : failure('TRANSACTION_ERROR', tx.error?.name ?? 'transaction aborted'));
      const request = tx.objectStore(LEGACY3_STORE).put(validation.state, LEGACY3_RECORD_KEY);
      // Transaction events handle request failures and aborted writes.
      request.onerror = () => { /* IndexedDB abort propagates to transaction */ };
      if (options.signal?.aborted) abortPending();
    } catch (error) {
      settle(failure('TRANSACTION_ERROR', error instanceof Error ? error.name : 'write threw'));
    }
  });
}

/** Missing record is a valid empty database, not a synthetic career. */
export async function readGameState(options: IndexedDbOptions = {}): Promise<IndexedDbResult<GameStateV1 | null>> {
  const opened = await openDatabase(options);
  if (!opened.ok) return opened;
  const db = opened.value;
  return new Promise(resolve => {
    let finished = false;
    let raw: unknown = null;
    const settle = (result: IndexedDbResult<GameStateV1 | null>) => {
      if (finished) return;
      finished = true;
      db.close();
      resolve(result);
    };
    try {
      const tx = db.transaction(LEGACY3_STORE, 'readonly');
      tx.onerror = () => settle(failure('TRANSACTION_ERROR', tx.error?.name ?? 'transaction error'));
      tx.onabort = () => settle(failure('TRANSACTION_ERROR', tx.error?.name ?? 'transaction aborted'));
      tx.oncomplete = () => {
        if (raw === undefined) { settle(success(null)); return; }
        const validation = validateGameState(raw);
        if (!validation.ok) {
          settle(failure(validation.code === 'UNSUPPORTED_VERSION' ? 'UNSUPPORTED_VERSION' : 'CORRUPT_STATE', validation.path, validation.code));
          return;
        }
        settle(success(validation.state));
      };
      const request = tx.objectStore(LEGACY3_STORE).get(LEGACY3_RECORD_KEY);
      request.onsuccess = () => { raw = request.result as unknown; };
      request.onerror = () => { /* transaction abort handles read failure */ };
    } catch (error) {
      settle(failure('TRANSACTION_ERROR', error instanceof Error ? error.name : 'read threw'));
    }
  });
}
