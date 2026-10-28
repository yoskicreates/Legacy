import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
const compile = async path => {
  const content = await readFile(join(root,path), 'utf8');
  const r=ts.transpileModule(content,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},fileName:path,reportDiagnostics:true});
  assert.deepEqual(r.diagnostics??[],[]);
  return r.outputText;
};
const coreUrl=`data:text/javascript;base64,${Buffer.from(await compile('src/domain/core/state-schema.ts')).toString('base64')}`;
const persistenceSource = (await compile('src/domain/persistence/indexeddb.ts')).replaceAll("'@domain/core'",`'${coreUrl}'`);
const api=await import(`data:text/javascript;base64,${Buffer.from(persistenceSource).toString('base64')}`);
const valid=() => ({schemaVersion:1,career:{careerId:'c',fighterId:'f'},clocks:{calendar:{dayIndex:0},fight:{elapsedMilliseconds:0}},random:{algorithm:'LEGACY3-MULBERRY32-V1',seed:42,word:42,draws:0}});
const badFactory={open(){throw new DOMException('not allowed','SecurityError')}};
const factoryNoOpen={open(){throw new Error('refused')}};

test('storage namespace, object store and key are fixed for one V1 core record',()=>{
  assert.equal(api.LEGACY3_DB_NAME,'LEGACY3_CORE_V1');
  assert.equal(api.LEGACY3_DB_VERSION,1);
  assert.equal(api.LEGACY3_STORE,'core-state');
  assert.equal(api.LEGACY3_RECORD_KEY,'current');
});
test('unsupported browser returns explicit typed errors',async()=>{
  assert.deepEqual(await api.readGameState({factory:null}),{ok:false,code:'UNSUPPORTED_BROWSER'});
  assert.deepEqual(await api.writeGameState(valid(),{factory:null}),{ok:false,code:'UNSUPPORTED_BROWSER'});
});
test('missing global browser indexedDB returns unsupported without throwing',async()=>{
  assert.deepEqual(await api.readGameState(),{ok:false,code:'UNSUPPORTED_BROWSER'});
});
test('invalid or absent state never calls the browser database factory',async()=>{
  let opens=0;
  const factory={open(){opens++;throw Error('not reached')}};
  const bad=valid();bad.random.word=999;
  assert.equal((await api.writeGameState(bad,{factory})).code,'INVALID_STATE');
  assert.equal((await api.writeGameState(null,{factory})).code,'INVALID_STATE');
  assert.equal(opens,0);
});
test('unsupported state schema is rejected before opening database',async()=>{
  const state={...valid(),schemaVersion:2};
  const r=await api.writeGameState(state,{factory:badFactory});
  assert.deepEqual(r,{ok:false,code:'UNSUPPORTED_VERSION',detail:'$.schemaVersion',validationCode:'UNSUPPORTED_VERSION'});
});
test('failed validation never mutates or repairs the submitted object',async()=>{
  const submitted=valid();submitted.clocks.calendar.dayIndex=-12;
  const frozen=structuredClone(submitted);
  const r=await api.writeGameState(submitted,{factory:badFactory});
  assert.equal(r.ok,false);assert.deepEqual(submitted,frozen);
});
test('synchronous SecurityError in IndexedDB open maps to DATABASE_ERROR',async()=>{
  assert.deepEqual(await api.readGameState({factory:badFactory}),{ok:false,code:'DATABASE_ERROR',detail:'SecurityError'});
  assert.deepEqual(await api.writeGameState(valid(),{factory:badFactory}),{ok:false,code:'DATABASE_ERROR',detail:'SecurityError'});
});
test('ordinary factory open error maps to DATABASE_ERROR, not a thrown promise',async()=>{
  assert.equal((await api.readGameState({factory:factoryNoOpen})).code,'DATABASE_ERROR');
});
test('invalid database name rejected rather than opening another store',async()=>{
  assert.equal((await api.readGameState({factory:factoryNoOpen,databaseName:''})).code,'DATABASE_ERROR');
  assert.equal((await api.readGameState({factory:factoryNoOpen,databaseName:' malformed '})).code,'DATABASE_ERROR');
});
test('read and write function declarations are async, isolated from gameplay',async()=>{
  const source=await readFile(join(root,'src/domain/persistence/indexeddb.ts'),'utf8');
  const ast=ts.createSourceFile('indexeddb.ts',source,ts.ScriptTarget.ES2022,true);
  const names=[];const forbidden=new Set(['setInterval','setTimeout','localStorage','sessionStorage','fetch','Date','Math','navigator']);
  function visit(n){if(ts.isIdentifier(n)&&forbidden.has(n.text))names.push(n.text);ts.forEachChild(n,visit)}visit(ast);
  assert.deepEqual(names,[]);
  assert.match(source,/tx\.oncomplete\s*=/);
  assert.match(source,/validateGameState\(raw\)/);
  assert.match(source,/validateGameState\(candidate\)/);
});
test('positive TypeScript contracts and five negative compiler diagnostics',()=>{
  const compiler=join(root,'node_modules/typescript/bin/tsc');
  const ok=spawnSync(process.execPath,[compiler,'--project','tsconfig.indexeddb.json','--noEmit'],{cwd:root,encoding:'utf8'});
  assert.equal(ok.status,0,ok.stdout+ok.stderr);
  const bad=spawnSync(process.execPath,[compiler,'--project','tsconfig.indexeddb-negative.json','--noEmit'],{cwd:root,encoding:'utf8'});
  assert.notEqual(bad.status,0);
  assert.ok([...bad.stdout.matchAll(/error TS\d+/g)].length>=5,bad.stdout);
});
test('QA page is isolated, never mounted in the normal game entry',async()=>{
  const main=await readFile(join(root,'src/main.ts'),'utf8');
  const html=await readFile(join(root,'indexeddb-qa.html'),'utf8');
  assert.doesNotMatch(main,/indexeddb/i);
  assert.match(html,/indexeddb-browser-qa\.ts/);
});
