import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync('src/combat/fast-track-engine.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
const url='data:text/javascript;base64,'+Buffer.from(compiled.outputText).toString('base64');
const {newFight,tick,setCornerTactic}=await import(url);
test('initial round is five minutes and all meters full',()=>{
 const f=newFight(123);
 assert.equal(f.round,1);assert.equal(f.secondsRemaining,300);
 assert.deepEqual(f.fighters.map(x=>x.health),[100,100]);
});
test('deterministic seed yields identical results',()=>{
 assert.deepEqual(tick(newFight(45),120),tick(newFight(45),120));
});
test('time, attacks and stamina advance',()=>{
 const f=tick(newFight(123),30);
 assert.equal(f.secondsRemaining,270);
 assert.ok(f.fighters.some(x=>x.strikes>0));
 assert.ok(f.fighters.every(x=>x.health>=0&&x.health<=100&&x.stamina>=0&&x.stamina<=100));
});
test('three round structure and corner-only tactics',()=>{
 let f=newFight(100);
 assert.throws(()=>setCornerTactic(f,'pressure'));
 f=tick(f,300);
 if(f.phase==='corner'){
  f=setCornerTactic(f,'counter');
  assert.equal(f.round,2);assert.equal(f.secondsRemaining,300);
  f=tick(f,300);
  if(f.phase==='corner'){f=setCornerTactic(f,'balanced');assert.equal(f.round,3);f=tick(f,300);}
 }
 assert.equal(f.phase,'finished');assert.ok(['player','opponent','draw'].includes(f.winner));
});
test('invalid durations rejected',()=>{
 for(const n of [0,-1,301,1.5])assert.throws(()=>tick(newFight(),n));
});
