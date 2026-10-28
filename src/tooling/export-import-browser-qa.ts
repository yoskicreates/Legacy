/** Internal L3-031 browser QA; not gameplay or a user-facing save menu. */
import { exportManualSlot, importManualSlot } from '@domain/persistence/export-import';
import {saveManualSlot,loadManualSlot,listManualSlots,MANUAL_SLOTS_DB_NAME,MANUAL_SLOTS_STORE} from '@domain/persistence/manual-slots';
import {readAutosavedGameState} from '@domain/persistence/autosave';
const state=(careerId:string,dayIndex=40,seed=42)=>({schemaVersion:1,career:{careerId,fighterId:`fighter-${careerId}`},clocks:{calendar:{dayIndex},fight:{elapsedMilliseconds:6000}},random:{algorithm:'LEGACY3-MULBERRY32-V1',seed,word:seed,draws:0}});
async function transactionAbort(slotId:string,raw:unknown):Promise<void>{
 const request=indexedDB.open(MANUAL_SLOTS_DB_NAME,1);
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
 try{await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction(MANUAL_SLOTS_STORE,'readwrite');tx.objectStore(MANUAL_SLOTS_STORE).put(raw,slotId);
  tx.oncomplete=()=>reject(Error('abort incorrectly committed'));tx.onabort=()=>resolve();tx.onerror=()=>resolve();tx.abort();
 })}finally{db.close()}
}
declare global {interface Window {__LEGACY3_EXPORT_IMPORT_QA__?:unknown}}
window.__LEGACY3_EXPORT_IMPORT_QA__={exportManualSlot,importManualSlot,saveManualSlot,loadManualSlot,listManualSlots,readAutosavedGameState,state,transactionAbort};
document.documentElement.dataset.archiveQaReady='true';
