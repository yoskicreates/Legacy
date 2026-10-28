/**
 * L3-030: explicit manual career save slots; no save scheduling, migration, or gameplay.
 * The dedicated store is isolated from the L3-028/L3-029 singleton autosave store.
 * A game snapshot and slot metadata are committed as ONE IndexedDB record/transaction.
 */
import { GAME_STATE_SCHEMA_VERSION, validateGameState, type GameStateV1 } from '@domain/core';
import type { IndexedDbCode, IndexedDbOptions, IndexedDbResult, IndexedDbWriteOptions } from './indexeddb';

export const MANUAL_SAVE_SLOT_IDS = ['slot-1', 'slot-2', 'slot-3'] as const;
export type ManualSaveSlotId = typeof MANUAL_SAVE_SLOT_IDS[number];
export const MANUAL_SLOTS_DB_NAME = 'LEGACY3_MANUAL_SLOTS_V1' as const;
export const MANUAL_SLOTS_DB_VERSION = 1 as const;
export const MANUAL_SLOTS_STORE = 'manual-careers' as const;

export type ManualSlotMetadata = Readonly<{
  slotId: ManualSaveSlotId;
  savedAtEpochMs: number;
  careerId: string;
  fighterId: string;
  schemaVersion: typeof GAME_STATE_SCHEMA_VERSION;
}>;
export type LoadedManualSlot = Readonly<{ metadata: ManualSlotMetadata; state: GameStateV1 }>;
export type ManualSlotSummary =
  | Readonly<{ slotId: ManualSaveSlotId; occupied: false }>
  | Readonly<{ slotId: ManualSaveSlotId; occupied: true; metadata: ManualSlotMetadata }>;
export type ManualSlotCode = IndexedDbCode | 'INVALID_SLOT' | 'INVALID_TIMESTAMP' | 'SLOT_OCCUPIED';
export type ManualSlotResult<T> = IndexedDbResult<T> | Readonly<{ ok: false; code: 'INVALID_SLOT' | 'INVALID_TIMESTAMP' | 'SLOT_OCCUPIED'; detail?: string }>;

const success = <T>(value: T): ManualSlotResult<T> => Object.freeze({ ok: true as const, value });
const failure = <T>(code: ManualSlotCode, detail?: string): ManualSlotResult<T> => Object.freeze({
  ok: false as const, code, ...(detail === undefined ? {} : { detail }),
});
function validSlotId(value: unknown): value is ManualSaveSlotId {
  return MANUAL_SAVE_SLOT_IDS.some(id => id === value);
}
function validTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
function factoryFor(options: IndexedDbOptions): IDBFactory | null {
  if ('factory' in options) return options.factory ?? null;
  try { return typeof indexedDB === 'undefined' ? null : indexedDB; } catch { return null; }
}

function openManualDatabase(options: IndexedDbOptions): Promise<ManualSlotResult<IDBDatabase>> {
  const factory = factoryFor(options);
  if (!factory) return Promise.resolve(failure('UNSUPPORTED_BROWSER'));
  return new Promise(resolve => {
    let done = false;
    const settle = (result: ManualSlotResult<IDBDatabase>) => { if (!done) { done = true; resolve(result); } };
    try {
      const request = factory.open(MANUAL_SLOTS_DB_NAME, MANUAL_SLOTS_DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(MANUAL_SLOTS_STORE)) request.result.createObjectStore(MANUAL_SLOTS_STORE);
      };
      request.onblocked = () => settle(failure('DATABASE_BLOCKED'));
      request.onerror = () => settle(failure('DATABASE_ERROR', request.error?.name ?? 'open failed'));
      request.onsuccess = () => {
        const db = request.result;
        if (done) { db.close(); return; }
        if (!db.objectStoreNames.contains(MANUAL_SLOTS_STORE)) {
          db.close(); settle(failure('STORE_MISSING')); return;
        }
        db.onversionchange = () => db.close();
        settle(success(db));
      };
    } catch (error) { settle(failure('DATABASE_ERROR', error instanceof Error ? error.name : 'open threw')); }
  });
}
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function verifiedStoredSlot(raw: unknown, requestedId: ManualSaveSlotId): ManualSlotResult<LoadedManualSlot> {
  if (!isPlainRecord(raw) || !exactKeys(raw, ['metadata', 'state']) || !isPlainRecord(raw.metadata)) return failure('CORRUPT_STATE', 'record shape');
  const m = raw.metadata;
  if (!exactKeys(m, ['slotId', 'savedAtEpochMs', 'careerId', 'fighterId', 'schemaVersion']) ||
      m.slotId !== requestedId || !validTimestamp(m.savedAtEpochMs) || m.schemaVersion !== GAME_STATE_SCHEMA_VERSION ||
      typeof m.careerId !== 'string' || typeof m.fighterId !== 'string') {
    return failure(m.schemaVersion !== GAME_STATE_SCHEMA_VERSION ? 'UNSUPPORTED_VERSION' : 'CORRUPT_STATE', 'metadata');
  }
  const state = validateGameState(raw.state);
  if (!state.ok) return failure(state.code === 'UNSUPPORTED_VERSION' ? 'UNSUPPORTED_VERSION' : 'CORRUPT_STATE', state.path);
  if (state.state.career.careerId !== m.careerId || state.state.career.fighterId !== m.fighterId) return failure('CORRUPT_STATE', 'identity mismatch');
  const metadata: ManualSlotMetadata = Object.freeze({
    slotId: requestedId, savedAtEpochMs: m.savedAtEpochMs, careerId: m.careerId,
    fighterId: m.fighterId, schemaVersion: GAME_STATE_SCHEMA_VERSION,
  });
  return success(Object.freeze({ metadata, state: state.state }));
}

/** Date/time is supplied explicitly by the caller; saving never advances the simulation clock. */
export async function saveManualSlot(
  slotId: ManualSaveSlotId, candidate: unknown, savedAtEpochMs: number,
  options: IndexedDbWriteOptions = {},
): Promise<ManualSlotResult<ManualSlotMetadata>> {
  if (!validSlotId(slotId)) return failure('INVALID_SLOT');
  if (!validTimestamp(savedAtEpochMs)) return failure('INVALID_TIMESTAMP');
  const validation = validateGameState(candidate);
  if (!validation.ok) return failure(validation.code === 'UNSUPPORTED_VERSION' ? 'UNSUPPORTED_VERSION' : 'INVALID_STATE', validation.path);
  if (options.signal?.aborted) return failure('WRITE_ABORTED');
  const opened = await openManualDatabase(options);
  if (!opened.ok) return opened;
  const db = opened.value;
  if (options.signal?.aborted) { db.close(); return failure('WRITE_ABORTED'); }
  const metadata: ManualSlotMetadata = Object.freeze({
    slotId, savedAtEpochMs, careerId: validation.state.career.careerId,
    fighterId: validation.state.career.fighterId, schemaVersion: GAME_STATE_SCHEMA_VERSION,
  });
  return new Promise(resolve => {
    let done = false;
    let cancelled = false;
    let abortListener: (() => void) | undefined;
    const settle = (result: ManualSlotResult<ManualSlotMetadata>) => {
      if (done) return;
      done = true;
      if (abortListener) options.signal?.removeEventListener('abort', abortListener);
      db.close(); resolve(result);
    };
    try {
      const tx = db.transaction(MANUAL_SLOTS_STORE, 'readwrite');
      abortListener = () => { if (!done) { cancelled = true; try { tx.abort(); } catch { /* transaction completed */ } } };
      options.signal?.addEventListener('abort', abortListener, { once: true });
      tx.oncomplete = () => settle(success(metadata));
      tx.onerror = () => settle(failure('TRANSACTION_ERROR', tx.error?.name ?? 'write error'));
      tx.onabort = () => settle(failure(cancelled ? 'WRITE_ABORTED' : 'TRANSACTION_ERROR', tx.error?.name ?? 'abort'));
      tx.objectStore(MANUAL_SLOTS_STORE).put({metadata, state: validation.state}, slotId);
      if (options.signal?.aborted) abortListener();
    } catch (error) { settle(failure('TRANSACTION_ERROR', error instanceof Error ? error.name : 'write threw')); }
  });
}

/** Returns null only if slot is empty. Invalid or tampered data is a reported error. */
export async function loadManualSlot(slotId: ManualSaveSlotId, options: IndexedDbOptions = {}): Promise<ManualSlotResult<LoadedManualSlot | null>> {
  if (!validSlotId(slotId)) return failure('INVALID_SLOT');
  const opened = await openManualDatabase(options);
  if (!opened.ok) return opened;
  const db = opened.value;
  return new Promise(resolve => {
    let done = false, raw: unknown = undefined;
    const settle = (result: ManualSlotResult<LoadedManualSlot | null>) => { if (!done) { done = true; db.close(); resolve(result); } };
    try {
      const tx = db.transaction(MANUAL_SLOTS_STORE, 'readonly');
      tx.onerror = () => settle(failure('TRANSACTION_ERROR', tx.error?.name ?? 'read error'));
      tx.onabort = () => settle(failure('TRANSACTION_ERROR', tx.error?.name ?? 'read abort'));
      tx.oncomplete = () => settle(raw === undefined ? success(null) : verifiedStoredSlot(raw, slotId));
      const req = tx.objectStore(MANUAL_SLOTS_STORE).get(slotId);
      req.onsuccess = () => { raw = req.result as unknown; };
    } catch (error) { settle(failure('TRANSACTION_ERROR', error instanceof Error ? error.name : 'read threw')); }
  });
}
/** Fixed ordering; an unreadable slot rejects the listing rather than hiding corruption as an empty slot. */
export async function listManualSlots(options: IndexedDbOptions = {}): Promise<ManualSlotResult<readonly ManualSlotSummary[]>> {
  const values: ManualSlotSummary[] = [];
  for (const slotId of MANUAL_SAVE_SLOT_IDS) {
    const result = await loadManualSlot(slotId, options);
    if (!result.ok) return result;
    values.push(result.value === null ? Object.freeze({slotId, occupied: false as const}) :
      Object.freeze({slotId, occupied: true as const, metadata: result.value.metadata}));
  }
  return success(Object.freeze(values));
}

/** L3-031: atomic compare-and-commit import. No read-then-write race, no silent overwrite. */
export async function commitImportedManualSlot(
 slotId:ManualSaveSlotId, candidate:unknown, savedAtEpochMs:number, overwrite:boolean,
 options:IndexedDbWriteOptions = {},
):Promise<ManualSlotResult<ManualSlotMetadata>> {
 if(!validSlotId(slotId))return failure('INVALID_SLOT');
 if(!validTimestamp(savedAtEpochMs))return failure('INVALID_TIMESTAMP');
 const checked=validateGameState(candidate);
 if(!checked.ok)return failure(checked.code==='UNSUPPORTED_VERSION'?'UNSUPPORTED_VERSION':'INVALID_STATE',checked.path);
 if(options.signal?.aborted)return failure('WRITE_ABORTED');
 const opened=await openManualDatabase(options);if(!opened.ok)return opened;
 const db=opened.value;
 const metadata:ManualSlotMetadata=Object.freeze({slotId,savedAtEpochMs,careerId:checked.state.career.careerId,fighterId:checked.state.career.fighterId,schemaVersion:GAME_STATE_SCHEMA_VERSION});
 return new Promise(resolve=>{
  let done=false,aborted=false,occupied=false;
  let abortListener:(()=>void)|undefined;
  const settle=(result:ManualSlotResult<ManualSlotMetadata>)=>{
   if(done)return;done=true;if(abortListener)options.signal?.removeEventListener('abort',abortListener);
   db.close();resolve(result);
  };
  try {
   const tx=db.transaction(MANUAL_SLOTS_STORE,'readwrite');
   abortListener=()=>{if(!done){aborted=true;try{tx.abort()}catch{ /* already committed */ }}};
   options.signal?.addEventListener('abort',abortListener,{once:true});
   tx.oncomplete=()=>settle(success(metadata));
   tx.onerror=()=>settle(failure('TRANSACTION_ERROR',tx.error?.name??'write error'));
   tx.onabort=()=>settle(failure(occupied?'SLOT_OCCUPIED':aborted?'WRITE_ABORTED':'TRANSACTION_ERROR'));
   const store=tx.objectStore(MANUAL_SLOTS_STORE);
   const get=store.get(slotId);
   get.onsuccess=()=>{
    if(options.signal?.aborted){abortListener?.();return;}
    if(get.result!==undefined&&!overwrite){occupied=true;tx.abort();return;}
    try{store.put({metadata,state:checked.state},slotId);}catch{try{tx.abort()}catch{ /* already ended */ }}
   };
   if(options.signal?.aborted)abortListener();
  }catch(error){settle(failure('TRANSACTION_ERROR',error instanceof Error?error.name:'write threw'));}
 });
}
