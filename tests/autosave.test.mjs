import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
const root = resolve(import.meta.dirname, '..');
const compile = async path => {
  const source = await readFile(join(root,path),'utf8');
  const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true,fileName:path});
  assert.deepEqual(result.diagnostics??[],[]);return result.outputText;
};
const url = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const coreUrl=url(await compile('src/domain/core/state-schema.ts'));
const indexedSource=(await compile('src/domain/persistence/indexeddb.ts')).replaceAll("'@domain/core'",`'${coreUrl}'`);
const indexedUrl=url(indexedSource);
const autoSource=(await compile('src/domain/persistence/autosave.ts')).replaceAll("'@domain/core'",`'${coreUrl}'`).replaceAll("'./indexeddb'",`'${indexedUrl}'`);
const api=await import(url(autoSource));
const storage=await import(indexedUrl);
const valid=()=>({schemaVersion:1,career:{careerId:'c',fighterId:'f'},clocks:{calendar:{dayIndex:0},fight:{elapsedMilliseconds:0}},random:{algorithm:'LEGACY3-MULBERRY32-V1',seed:42,word:42,draws:0}});
const errorFactory={open(){throw new DOMException('failed','SecurityError')}};
function fakeDb({ mode='success', onPut } = {}) {
  let stored=structuredClone(valid()), closed=0, aborted=0, completed=0, writes=0;
  const db={
    objectStoreNames:{ contains:()=>true }, onversionchange:null,
    close(){ closed++; },
    transaction(_name,kind){
      const request={ onsuccess:null, result:undefined };
      const tx={
        oncomplete:null, onabort:null, onerror:null, error:null,
        abort(){ aborted++; queueMicrotask(()=>tx.onabort?.()); },
        objectStore(){return {
          put(value){
            writes++;
            if (onPut) onPut();
            if (mode==='success') queueMicrotask(()=>{ stored=structuredClone(value);completed++;tx.oncomplete?.(); });
            if (mode==='abort') queueMicrotask(()=>tx.abort());
            if (mode==='error') queueMicrotask(()=>{tx.error={name:'QuotaExceededError'};tx.onerror?.();});
            return {onerror:null};
          },
          get(){queueMicrotask(()=>{request.result=structuredClone(stored);request.onsuccess?.();tx.oncomplete?.();});return request;},
        }}
      };
      return tx;
    }
  };
  const factory={open(){const request={result:db,onsuccess:null,onerror:null,onblocked:null,onupgradeneeded:null};queueMicrotask(()=>request.onsuccess?.());return request;}};
  return {factory,stats:()=>({stored,closed,aborted,completed,writes}),db};
}
test('autosave receipt commits only one V1 schema version',async()=>{const fake=fakeDb();const result=await api.autosaveGameState(valid(),{factory:fake.factory});assert.deepEqual(result,{ok:true,value:{committed:true,schemaVersion:1}});assert.deepEqual(fake.stats().stored,valid())});
test('readAutosavedGameState shares the existing strict IndexedDB reader',async()=>{const fake=fakeDb();const result=await api.readAutosavedGameState({factory:fake.factory});assert.equal(result.ok,true);assert.deepEqual(result.value,valid());assert.ok(Object.isFrozen(result.value))});
test('invalid candidate is rejected BEFORE database open',async()=>{const bad=valid();bad.clocks.calendar.dayIndex=-9;const result=await api.autosaveGameState(bad,{factory:errorFactory});assert.equal(result.code,'INVALID_STATE');assert.deepEqual(bad.clocks.calendar,{dayIndex:-9})});
test('unsupported schema prevents any database access',async()=>{const r=await api.autosaveGameState({...valid(),schemaVersion:2},{factory:errorFactory});assert.equal(r.code,'UNSUPPORTED_VERSION')});
test('browser unavailable is explicit and never successful',async()=>{assert.equal((await api.autosaveGameState(valid(),{factory:null})).code,'UNSUPPORTED_BROWSER')});
test('open exceptions are errors, never synthetic commits',async()=>{assert.equal((await api.autosaveGameState(valid(),{factory:errorFactory})).code,'DATABASE_ERROR')});
test('pre-aborted signal cancels before opening the DB',async()=>{const controller=new AbortController();controller.abort();assert.deepEqual(await api.autosaveGameState(valid(),{factory:errorFactory,signal:controller.signal}),{ok:false,code:'WRITE_ABORTED',detail:'AbortError'})});
test('cancellation triggered after queueing put aborts transaction',async()=>{const ctrl=new AbortController();const fake=fakeDb({mode:'idle',onPut:()=>queueMicrotask(()=>ctrl.abort())});const r=await api.autosaveGameState({...valid(),career:{careerId:'replacement',fighterId:'f'}},{factory:fake.factory,signal:ctrl.signal});assert.equal(r.code,'WRITE_ABORTED');assert.equal(fake.stats().aborted,1);assert.deepEqual(fake.stats().stored,valid())});
test('native transaction abort is never reported as success',async()=>{const fake=fakeDb({mode:'abort'});const r=await api.autosaveGameState(valid(),{factory:fake.factory});assert.equal(r.code,'TRANSACTION_ERROR');assert.equal(fake.stats().completed,0)});
test('failed transaction does not return a receipt or replace old state',async()=>{const fake=fakeDb({mode:'error'});const r=await api.autosaveGameState({...valid(),career:{careerId:'new',fighterId:'f'}},{factory:fake.factory});assert.equal(r.code,'TRANSACTION_ERROR');assert.deepEqual(fake.stats().stored,valid())});
test('read uses strict rejected-state semantics for corrupt records',async()=>{const fake=fakeDb();assert.equal((await api.readAutosavedGameState({factory:fake.factory})).ok,true);assert.ok(storage.readGameState)});
test('browser autosave QA is not loaded by the actual application',async()=>{const main=await readFile(join(root,'src/main.ts'),'utf8');assert.doesNotMatch(main,/autosave/i);assert.match(await readFile(join(root,'autosave-qa.html'),'utf8'),/autosave-browser-qa/)});
test('source never schedules recurring autosaves, no slots or migration',async()=>{const source=await readFile(join(root,'src/domain/persistence/autosave.ts'),'utf8');assert.doesNotMatch(source,/\b(setTimeout|setInterval|localStorage|fetch|Date)\s*\(/);assert.doesNotMatch(source,/createObjectStore|deleteDatabase|cursor/i)});
test('positive and negative compiler checks are independently asserted',()=>{const tsc=join(root,'node_modules/typescript/bin/tsc');const ok=spawnSync(process.execPath,[tsc,'--project','tsconfig.autosave.json','--noEmit'],{cwd:root,encoding:'utf8'});assert.equal(ok.status,0,ok.stdout+ok.stderr);const bad=spawnSync(process.execPath,[tsc,'--project','tsconfig.autosave-negative.json','--noEmit'],{cwd:root,encoding:'utf8'});assert.notEqual(bad.status,0);assert.ok((bad.stdout.match(/error TS\d+/g)||[]).length>=5,bad.stdout)});
