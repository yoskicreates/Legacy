/** Internal real-browser QA only: does not mount UI or change gameplay. */
import { saveManualSlot, loadManualSlot, listManualSlots, MANUAL_SLOTS_DB_NAME, MANUAL_SLOTS_STORE } from '@domain/persistence/manual-slots';
import { readAutosavedGameState } from '@domain/persistence/autosave';
const validState = (id: string) => ({
 schemaVersion:1,career:{careerId:id,fighterId:`fighter-${id}`},
 clocks:{calendar:{dayIndex:40},fight:{elapsedMilliseconds:6000}},
 random:{algorithm:'LEGACY3-MULBERRY32-V1',seed:42,word:42,draws:0},
});
async function tamper(slotId: string, field: 'metadata'|'state'): Promise<void> {
 const request=indexedDB.open(MANUAL_SLOTS_DB_NAME,1);
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
 try {await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction(MANUAL_SLOTS_STORE,'readwrite');const store=tx.objectStore(MANUAL_SLOTS_STORE);
  const get=store.get(slotId);get.onsuccess=()=>{
   const value=get.result as {metadata: {savedAtEpochMs:number};state:{random:{word:number}}};
   if(field==='metadata')value.metadata.savedAtEpochMs=-1;else value.state.random.word=999;
   store.put(value,slotId);
  };
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 })}finally{db.close()}
}
async function abortRealTransaction(slotId: string, badCandidate: unknown): Promise<void> {
 const req=indexedDB.open(MANUAL_SLOTS_DB_NAME,1);
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
 try {await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction(MANUAL_SLOTS_STORE,'readwrite');
  tx.objectStore(MANUAL_SLOTS_STORE).put(badCandidate,slotId);
  tx.oncomplete=()=>reject(Error('unexpected transaction commit'));tx.onabort=()=>resolve();tx.onerror=()=>resolve();tx.abort();
 })}finally{db.close()}
}
declare global {interface Window {__LEGACY3_MANUAL_SLOTS_QA__?:unknown}}
window.__LEGACY3_MANUAL_SLOTS_QA__={saveManualSlot,loadManualSlot,listManualSlots,validState,tamper,abortRealTransaction,readAutosavedGameState,
 noBrowser:()=>({factory:null}),throwsOpen:()=>({factory:{open(){throw new DOMException('blocked','SecurityError')}}})};
document.documentElement.dataset.manualSlotsQaReady='true';
