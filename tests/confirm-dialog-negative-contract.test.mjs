import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const invalid=read('tests/ui/confirm-dialog-negative.ts');
const runner=read('scripts/confirm-dialog-negative-test.mjs');
const project=JSON.parse(read('tsconfig.confirm-dialog-negative.json'));
const p=JSON.parse(read('package.json'));
test('exact eight distinct invalid TypeScript declaration examples are maintained',()=>{
 const expected=['invalidIntent','invalidOpen','invalidConfirmLabel','invalidCancelLabel','missingConfirmCallback','missingCancelCallback','invalidCallbackType','invalidCancelSignature'];
 for(const term of expected)assert.match(invalid,new RegExp('const '+term+'\\b'));
 assert.equal((invalid.match(/const /g)||[]).length,8);
});
test('negative project points to the exact invalid fixtures',()=>assert.ok(project.include.includes('tests/ui/confirm-dialog-negative.ts')));
test('negative runner requires eight errors from the targeted fixture',()=>{
 assert.match(runner,/lines\.length!==8/);assert.match(runner,/invalid\.length!==8/);assert.match(runner,/confirm-dialog-negative\.ts/);
});
test('package exposes dedicated strict and negative confirmation scripts',()=>{
 assert.ok(p.scripts['typecheck:confirm-dialog']);assert.ok(p.scripts['test:confirm-dialog:negative']);
});
