import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import ts from 'typescript';
const root=resolve(import.meta.dirname,'..');
const transpile=async p => {
 const src=await readFile(join(root,p),'utf8');
 const r=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true,fileName:p});
 assert.deepEqual(r.diagnostics??[],[]);return r.outputText;
};
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const core=url(await transpile('src/domain/core/state-schema.ts'));
const src=(await transpile('src/domain/persistence/manual-slots.ts')).replaceAll("'@domain/core'",`'${core}'`);
const api=await import(url(src));
const valid=(id='career-a')=>({schemaVersion:1,career:{careerId:id,fighterId:`fighter-${id}`},clocks:{calendar:{dayIndex:40},fight:{elapsedMilliseconds:6000}},random:{algorithm:'LEGACY3-MULBERRY32-V1',seed:42,word:42,draws:0}});
function factoryMock({error='',onPut=null}={}) {
 const data=new Map(); const calls=[];let closes=0;
 const db={
  objectStoreNames:{contains:name=>name===api.MANUAL_SLOTS_STORE},onversionchange:null,
  close(){closes++;},
  transaction(store,mode){
   assert.equal(store,api.MANUAL_SLOTS_STORE);
   const tx={oncomplete:null,onabort:null,onerror:null,error:null,active:true,
    abort(){if(!tx.active)throw Error('inactive');tx.active=false;queueMicrotask(()=>tx.onabort?.());},
    objectStore(){return {
     put(value,key){assert.equal(mode,'readwrite');calls.push({action:'put',key});onPut?.();
      queueMicrotask(()=>{if(!tx.active)return;if(error==='tx'){tx.active=false;tx.error={name:'QuotaExceededError'};tx.onerror?.();return;}data.set(key,structuredClone(value));tx.active=false;tx.oncomplete?.()});
      return {onerror:null};},
     get(key){assert.equal(mode,'readonly');calls.push({action:'get',key});const req={result:undefined,onsuccess:null};queueMicrotask(()=>{req.result=data.get(key);req.onsuccess?.();tx.active=false;tx.oncomplete?.()});return req;}
    }}
   };return tx;
  }
 };
 const factory={open(name,version){calls.push({action:'open',name,version});if(error==='open')throw new DOMException('blocked','SecurityError');
  const req={result:db,onsuccess:null,onerror:null,onblocked:null,onupgradeneeded:null};queueMicrotask(()=>req.onsuccess?.());return req;
 }};
 return {factory,data,calls,stats:()=>({closes})};
}
test('fixed typed slots, dedicated DB and namespace preserve L3-028 singleton',()=>{
 assert.deepEqual(api.MANUAL_SAVE_SLOT_IDS,['slot-1','slot-2','slot-3']);
 assert.equal(api.MANUAL_SLOTS_DB_VERSION,1);assert.notEqual(api.MANUAL_SLOTS_DB_NAME,'LEGACY3_CORE_V1');
});
test('empty slot returns null and list has stable ordered empty metadata',async()=>{
 const f=factoryMock();assert.deepEqual(await api.loadManualSlot('slot-2',{factory:f.factory}),{ok:true,value:null});
 const r=await api.listManualSlots({factory:f.factory});assert.ok(r.ok);assert.deepEqual(r.value,api.MANUAL_SAVE_SLOT_IDS.map(slotId=>({slotId,occupied:false})));
});
test('two careers save to independent keys and preserve exact state and timestamp',async()=>{
 const f=factoryMock();const a=valid('alice'),b=valid('bob');
 assert.equal((await api.saveManualSlot('slot-1',a,1001,{factory:f.factory})).ok,true);
 assert.equal((await api.saveManualSlot('slot-2',b,2002,{factory:f.factory})).ok,true);
 const ra=await api.loadManualSlot('slot-1',{factory:f.factory}),rb=await api.loadManualSlot('slot-2',{factory:f.factory});
 assert.deepEqual(ra.value.state,a);assert.deepEqual(rb.value.state,b);
 assert.deepEqual(ra.value.metadata,{slotId:'slot-1',savedAtEpochMs:1001,careerId:'alice',fighterId:'fighter-alice',schemaVersion:1});
 assert.deepEqual(rb.value.metadata,{slotId:'slot-2',savedAtEpochMs:2002,careerId:'bob',fighterId:'fighter-bob',schemaVersion:1});
 assert.ok(Object.isFrozen(ra.value)&&Object.isFrozen(ra.value.state)&&Object.isFrozen(ra.value.metadata));
 assert.equal((await api.loadManualSlot('slot-3',{factory:f.factory})).value,null);
});
test('repeated explicit slot switches never leak an active slot into another',async()=>{
 const f=factoryMock();await api.saveManualSlot('slot-1',valid('x'),1,{factory:f.factory});await api.saveManualSlot('slot-2',valid('y'),2,{factory:f.factory});
 for(let i=0;i<5;i++){assert.equal((await api.loadManualSlot('slot-2',{factory:f.factory})).value.state.career.careerId,'y');assert.equal((await api.loadManualSlot('slot-1',{factory:f.factory})).value.state.career.careerId,'x')}
});
test('overwriting slot 1 preserves slot 2 metadata and state',async()=>{
 const f=factoryMock();await api.saveManualSlot('slot-1',valid('one'),1,{factory:f.factory});await api.saveManualSlot('slot-2',valid('two'),2,{factory:f.factory});
 await api.saveManualSlot('slot-1',valid('one-new'),3,{factory:f.factory});
 assert.equal((await api.loadManualSlot('slot-1',{factory:f.factory})).value.metadata.savedAtEpochMs,3);
 assert.deepEqual((await api.loadManualSlot('slot-2',{factory:f.factory})).value.state,valid('two'));
});
test('metadata listing includes exact timestamps, career IDs and all occupied slots',async()=>{
 const f=factoryMock();await api.saveManualSlot('slot-1',valid('aa'),123,{factory:f.factory});await api.saveManualSlot('slot-3',valid('cc'),456,{factory:f.factory});
 const r=await api.listManualSlots({factory:f.factory});assert.equal(r.value.length,3);assert.equal(r.value[0].metadata.careerId,'aa');assert.equal(r.value[1].occupied,false);assert.equal(r.value[2].metadata.savedAtEpochMs,456);
});
test('invalid slot ID rejected before any IndexedDB calls',async()=>{
 const f=factoryMock();const r=await api.saveManualSlot('slot-evil',valid(),1,{factory:f.factory});assert.equal(r.code,'INVALID_SLOT');assert.equal((await api.loadManualSlot('slot-evil',{factory:f.factory})).code,'INVALID_SLOT');assert.equal(f.calls.length,0);
});
test('invalid or nonfinite timestamp rejected before opening database',async()=>{
 const f=factoryMock();for(const value of [-1,NaN,Infinity,1.5,Number.MAX_SAFE_INTEGER+1])assert.equal((await api.saveManualSlot('slot-1',valid(),value,{factory:f.factory})).code,'INVALID_TIMESTAMP');assert.equal(f.calls.length,0);
});
test('invalid game state and future versions are rejected before storage access',async()=>{
 const f=factoryMock();const bad=valid();bad.random.word=999;
 assert.equal((await api.saveManualSlot('slot-1',bad,1,{factory:f.factory})).code,'INVALID_STATE');
 assert.equal((await api.saveManualSlot('slot-1',{...valid(),schemaVersion:900},1,{factory:f.factory})).code,'UNSUPPORTED_VERSION');assert.equal(f.calls.length,0);
});
test('unsupported browser and failed open are explicit; no false commit',async()=>{
 assert.equal((await api.saveManualSlot('slot-1',valid(),1,{factory:null})).code,'UNSUPPORTED_BROWSER');
 assert.equal((await api.loadManualSlot('slot-1',{factory:null})).code,'UNSUPPORTED_BROWSER');
 assert.equal((await api.listManualSlots({factory:null})).code,'UNSUPPORTED_BROWSER');
 assert.equal((await api.saveManualSlot('slot-1',valid(),1,{factory:factoryMock({error:'open'}).factory})).code,'DATABASE_ERROR');
});
test('pre-aborted writes do not touch previous snapshot',async()=>{
 const f=factoryMock();await api.saveManualSlot('slot-1',valid('safe'),1,{factory:f.factory});const ctrl=new AbortController();ctrl.abort();
 assert.equal((await api.saveManualSlot('slot-1',valid('bad'),2,{factory:f.factory,signal:ctrl.signal})).code,'WRITE_ABORTED');
 assert.equal((await api.loadManualSlot('slot-1',{factory:f.factory})).value.metadata.careerId,'safe');
});
test('abort after queuing put preserves previous committed snapshot and timestamp',async()=>{
 const ctrl=new AbortController();const f=factoryMock({onPut:()=>queueMicrotask(()=>ctrl.abort())});
 await api.saveManualSlot('slot-1',valid('safe'),100,{factory:f.factory});
 const x=await api.saveManualSlot('slot-1',valid('bad'),200,{factory:f.factory,signal:ctrl.signal});assert.equal(x.code,'WRITE_ABORTED');
 const r=await api.loadManualSlot('slot-1',{factory:f.factory});assert.equal(r.value.metadata.careerId,'safe');assert.equal(r.value.metadata.savedAtEpochMs,100);
});
test('transaction error does not report success',async()=>{
 const f=factoryMock({error:'tx'});const r=await api.saveManualSlot('slot-1',valid(),1,{factory:f.factory});assert.equal(r.code,'TRANSACTION_ERROR');assert.equal(f.data.size,0);
});
test('tampered metadata is rejected, not silently repaired',async()=>{
 const f=factoryMock();await api.saveManualSlot('slot-1',valid('safe'),1,{factory:f.factory});f.data.get('slot-1').metadata.savedAtEpochMs=-10;
 const r=await api.loadManualSlot('slot-1',{factory:f.factory});assert.equal(r.code,'CORRUPT_STATE');assert.equal((await api.listManualSlots({factory:f.factory})).code,'CORRUPT_STATE');
});
test('tampered state identity and RNG are rejected, never renamed into another slot',async()=>{
 const f=factoryMock();await api.saveManualSlot('slot-2',valid('safe'),1,{factory:f.factory});
 f.data.get('slot-2').metadata.careerId='intruder';assert.equal((await api.loadManualSlot('slot-2',{factory:f.factory})).code,'CORRUPT_STATE');
 f.data.get('slot-2').metadata.careerId='safe';f.data.get('slot-2').state.random.word=444;assert.equal((await api.loadManualSlot('slot-2',{factory:f.factory})).code,'CORRUPT_STATE');
});
test('unsupported stored schema version fails closed',async()=>{
 const f=factoryMock();await api.saveManualSlot('slot-1',valid(),1,{factory:f.factory});f.data.get('slot-1').state.schemaVersion=2;assert.equal((await api.loadManualSlot('slot-1',{factory:f.factory})).code,'UNSUPPORTED_VERSION');
});
test('no manual UI, autosave timer, migrations, cloud sync or export introduced',async()=>{
 const source=await readFile(join(root,'src/domain/persistence/manual-slots.ts'),'utf8');
 for(const term of ['setInterval(', 'setTimeout(', 'Date.now(', 'localStorage', 'fetch(', 'window.', 'navigator.', 'getAllKeys(', 'deleteDatabase('])assert.equal(source.includes(term),false,term);
 const main=await readFile(join(root,'src/main.ts'),'utf8');assert.doesNotMatch(main,/manual-slots/i);
});
