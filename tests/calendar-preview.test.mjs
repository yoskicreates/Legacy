import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temp=mkdtempSync(join(tmpdir(),'legacy-calendar-'));
try {
 execFileSync('tsc',['--target','ES2022','--module','commonjs','--moduleResolution','node','--skipLibCheck','--rootDir','src','--outDir',temp,'src/ui/calendar-preview-contract.ts'],{stdio:'pipe'});
 const compiled=readFileSync(join(temp,'ui','calendar-preview-contract.js'),'utf8');
 const path=join(temp,'calendar-preview-contract.cjs');writeFileSync(path,compiled);
 const {dayAt,validateCalendar,SAMPLE_CALENDAR}=await import(pathToFileURL(path).href);
 test('day index is deterministic across leap year',()=>{assert.equal(dayAt('2028-02-28',1),'2028-02-29');assert.equal(dayAt('2028-02-28',2),'2028-03-01');});
 test('calendar derives dates from game clock',()=>{assert.equal(dayAt(SAMPLE_CALENDAR.epochIso,SAMPLE_CALENDAR.clock.dayIndex),'2027-03-08');assert.equal(dayAt(SAMPLE_CALENDAR.epochIso,SAMPLE_CALENDAR.events[0].dayIndex),'2027-03-09');});
 test('fixture is valid',()=>assert.equal(validateCalendar(SAMPLE_CALENDAR),true));
 test('reject impossible epoch',()=>assert.throws(()=>dayAt('2027-02-29',0)));
 test('reject invalid clock indices',()=>{for(const x of [-1,1.5,NaN,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>dayAt('2027-03-08',x));});
 test('reject duplicate IDs',()=>assert.throws(()=>validateCalendar({...SAMPLE_CALENDAR,events:[SAMPLE_CALENDAR.events[0],SAMPLE_CALENDAR.events[0]]})));
 test('reject past events',()=>assert.throws(()=>validateCalendar({...SAMPLE_CALENDAR,clock:{dayIndex:5}})));
 test('reject missing clock or event array',()=>{for(const change of [{clock:null},{events:null},{events:{}}])assert.throws(()=>validateCalendar({...SAMPLE_CALENDAR,...change}));});
 test('reject malformed event fields',()=>{for(const event of [null,{id:5,title:'A',detail:'B',dayIndex:1},{id:'a',title:' ',detail:'B',dayIndex:1}])assert.throws(()=>validateCalendar({...SAMPLE_CALENDAR,events:[event]}));});
 test('reject fractional or nonfinite event day',()=>{for(const dayIndex of [1.5,NaN,Infinity,-1])assert.throws(()=>validateCalendar({...SAMPLE_CALENDAR,events:[{...SAMPLE_CALENDAR.events[0],dayIndex}]}));});
 test('reject nonfixture source',()=>assert.throws(()=>validateCalendar({...SAMPLE_CALENDAR,source:'save'})));
} finally { process.on('exit',()=>rmSync(temp,{recursive:true,force:true})); }
