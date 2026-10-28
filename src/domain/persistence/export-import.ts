/** L3-031 portable JSON career archives. No UI, migrations, scheduler or gameplay. */
import { GAME_STATE_SCHEMA_VERSION, validateGameState, type GameStateV1 } from '@domain/core';
import { loadManualSlot, commitImportedManualSlot, MANUAL_SAVE_SLOT_IDS, type ManualSaveSlotId, type ManualSlotMetadata, type ManualSlotResult } from './manual-slots';
import type { IndexedDbOptions, IndexedDbWriteOptions } from './indexeddb';

export const CAREER_ARCHIVE_FORMAT = 'LEGACY3_CAREER_ARCHIVE' as const;
export const CAREER_ARCHIVE_VERSION = 1 as const;
export const CAREER_ARCHIVE_CHECKSUM_ALGORITHM = 'SHA-256' as const;
export const CAREER_ARCHIVE_MAX_BYTES = 131072;

export type CareerArchiveCode = 'EMPTY_SLOT' | 'INVALID_ARCHIVE' | 'ARCHIVE_TOO_LARGE' | 'UNSUPPORTED_ARCHIVE_VERSION' |
 'CHECKSUM_MISMATCH' | 'CRYPTO_UNAVAILABLE' | 'CRYPTO_ERROR' | 'SLOT_OCCUPIED';
export type CareerArchiveResult<T> = ManualSlotResult<T> | Readonly<{ok:false;code:CareerArchiveCode;detail?:string}>;
export interface CareerImportOptions extends IndexedDbWriteOptions { readonly overwrite?: boolean }
export type CareerImportReceipt = Readonly<{sourceSlotId:ManualSaveSlotId;targetSlotId:ManualSaveSlotId;metadata:ManualSlotMetadata;checksum:string}>;

const fail = <T>(code: CareerArchiveCode, detail?:string):CareerArchiveResult<T> => Object.freeze({ok:false as const,code,...(detail===undefined?{}:{detail})});
const success = <T>(value:T):CareerArchiveResult<T> => Object.freeze({ok:true as const,value});
function plain(v:unknown):v is Record<string,unknown> {
 if (typeof v!=='object'||v===null||Array.isArray(v))return false;
 const proto=Object.getPrototypeOf(v);return proto===Object.prototype||proto===null;
}
function keys(v:Record<string,unknown>,required:readonly string[]):boolean {
 return Reflect.ownKeys(v).length===required.length && required.every(k=>Object.hasOwn(v,k)) &&
  Reflect.ownKeys(v).every(k=>typeof k==='string' && required.includes(k) && !!Object.getOwnPropertyDescriptor(v,k) && Object.hasOwn(Object.getOwnPropertyDescriptor(v,k)!, 'value'));
}
function validSlot(value:unknown):value is ManualSaveSlotId { return MANUAL_SAVE_SLOT_IDS.some(id=>id===value); }
function validTime(value:unknown):value is number {return typeof value==='number'&&Number.isSafeInteger(value)&&value>=0;}
function canonical(meta:ManualSlotMetadata,state:GameStateV1):string {
 // Intentionally rebuild all known V1 fields in fixed order. Input key order cannot change checksum.
 return JSON.stringify({format:CAREER_ARCHIVE_FORMAT,archiveVersion:CAREER_ARCHIVE_VERSION,
  metadata:{slotId:meta.slotId,savedAtEpochMs:meta.savedAtEpochMs,careerId:meta.careerId,fighterId:meta.fighterId,schemaVersion:meta.schemaVersion},
  state:{schemaVersion:state.schemaVersion,career:{careerId:state.career.careerId,fighterId:state.career.fighterId},
   clocks:{calendar:{dayIndex:state.clocks.calendar.dayIndex},fight:{elapsedMilliseconds:state.clocks.fight.elapsedMilliseconds}},
   random:{algorithm:state.random.algorithm,seed:state.random.seed,word:state.random.word,draws:state.random.draws}}});
}
async function checksum(data:string):Promise<CareerArchiveResult<string>> {
 try {
  if(typeof crypto==='undefined'||!crypto.subtle||typeof TextEncoder==='undefined')return fail('CRYPTO_UNAVAILABLE');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(data));
  return success(Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''));
 }catch{return fail('CRYPTO_ERROR');}
}
/** Export a single occupied, validated slot as deterministic portable JSON with SHA-256. */
export async function exportManualSlot(slotId:ManualSaveSlotId,options:IndexedDbOptions={}):Promise<CareerArchiveResult<string>> {
 const read=await loadManualSlot(slotId,options);
 if(!read.ok)return read;
 if(read.value===null)return fail('EMPTY_SLOT');
 const body=canonical(read.value.metadata,read.value.state);
 const sha=await checksum(body);if(!sha.ok)return sha;
 // Wrapper and body are separate to make checksum coverage unambiguous.
 return success(JSON.stringify({body:JSON.parse(body) as unknown,checksum:{algorithm:CAREER_ARCHIVE_CHECKSUM_ALGORITHM,hex:sha.value}})+'\n');
}
/** Parse and validate all content BEFORE accessing IndexedDB. Existing slots never overwrite by default. */
export async function importManualSlot(targetSlotId:ManualSaveSlotId,archiveText:string,options:CareerImportOptions={}):Promise<CareerArchiveResult<CareerImportReceipt>> {
 if(!validSlot(targetSlotId))return {ok:false,code:'INVALID_SLOT'};
 if(typeof archiveText!=='string')return fail('INVALID_ARCHIVE');
 if(archiveText.length>CAREER_ARCHIVE_MAX_BYTES)return fail('ARCHIVE_TOO_LARGE');
 // JSON's UTF-8 length is bounded too; reject before parsing large input.
 if(typeof TextEncoder==='undefined')return fail('CRYPTO_UNAVAILABLE');
 if(new TextEncoder().encode(archiveText).length>CAREER_ARCHIVE_MAX_BYTES)return fail('ARCHIVE_TOO_LARGE');
 let parsed:unknown;
 try{parsed=JSON.parse(archiveText) as unknown;}catch{return fail('INVALID_ARCHIVE','JSON syntax');}
 if(!plain(parsed)||!keys(parsed,['body','checksum'])||!plain(parsed.body)||!plain(parsed.checksum))return fail('INVALID_ARCHIVE','envelope');
 if(!keys(parsed.body,['format','archiveVersion','metadata','state'])||!keys(parsed.checksum,['algorithm','hex']))return fail('INVALID_ARCHIVE','fields');
 const body=parsed.body;
 if(body.format!==CAREER_ARCHIVE_FORMAT)return fail('INVALID_ARCHIVE','format');
 if(body.archiveVersion!==CAREER_ARCHIVE_VERSION)return fail('UNSUPPORTED_ARCHIVE_VERSION');
 if(parsed.checksum.algorithm!==CAREER_ARCHIVE_CHECKSUM_ALGORITHM||typeof parsed.checksum.hex!=='string'||!/^[a-f0-9]{64}$/.test(parsed.checksum.hex))return fail('INVALID_ARCHIVE','checksum');
 if(!plain(body.metadata)||!keys(body.metadata,['slotId','savedAtEpochMs','careerId','fighterId','schemaVersion']))return fail('INVALID_ARCHIVE','metadata');
 const meta=body.metadata;
 if(!validSlot(meta.slotId)||!validTime(meta.savedAtEpochMs)||typeof meta.careerId!=='string'||typeof meta.fighterId!=='string')return fail('INVALID_ARCHIVE','metadata values');
 if(meta.schemaVersion!==GAME_STATE_SCHEMA_VERSION)return {ok:false,code:'UNSUPPORTED_VERSION'};
 const validated=validateGameState(body.state);
 if(!validated.ok)return {ok:false,code:validated.code==='UNSUPPORTED_VERSION'?'UNSUPPORTED_VERSION':'CORRUPT_STATE',detail:validated.path};
 if(validated.state.career.careerId!==meta.careerId||validated.state.career.fighterId!==meta.fighterId)return fail('INVALID_ARCHIVE','identity mismatch');
 const reconstructed:ManualSlotMetadata={slotId:meta.slotId,savedAtEpochMs:meta.savedAtEpochMs,careerId:meta.careerId,fighterId:meta.fighterId,schemaVersion:GAME_STATE_SCHEMA_VERSION};
 const checked=await checksum(canonical(reconstructed,validated.state));if(!checked.ok)return checked;
 if(checked.value!==parsed.checksum.hex)return fail('CHECKSUM_MISMATCH');
 if(options.overwrite!==undefined&&typeof options.overwrite!=='boolean')return fail('INVALID_ARCHIVE','overwrite option');
 const written=await commitImportedManualSlot(targetSlotId,validated.state,meta.savedAtEpochMs,options.overwrite===true,options);
 if(!written.ok)return written;
 return success(Object.freeze({sourceSlotId:meta.slotId,targetSlotId,metadata:written.value,checksum:checked.value}));
}
