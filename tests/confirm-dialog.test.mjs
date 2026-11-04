import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(join(root,p),'utf8');
const c=read('src/ui/confirm-dialog.ts');
const contract=read('src/ui/confirm-dialog-contract.ts');
const css=read('src/ui/confirm-dialog.css');
const page=read('confirm-dialog-qa.html');
const gallery=read('src/confirm-dialog-qa.ts');
const vite=read('vite.config.mjs');
const pkg=JSON.parse(read('package.json'));
const reg=JSON.parse(read('docs/task-register.json'));
const expectations=[
['native HTML dialog for modal semantics',()=>assert.match(c,/h\('dialog'/)],
['showModal used for top-layer and background blocking',()=>assert.match(c,/\.showModal\(\)/)],
['close dialog when state switches off',()=>assert.match(c,/dialog\.close\(\)/)],
['focus Cancel first for safer defaults',()=>assert.match(c,/cancelRef\.current\?\.focus\(\)/)],
['dialog announces title',()=>assert.match(c,/'aria-labelledby':headingId/)],
['dialog announces message',()=>assert.match(c,/'aria-describedby':messageId/)],
['dialog marks itself modal',()=>assert.match(c,/'aria-modal':'true'/)],
['Escape action prevents native uncontrolled closure',()=>assert.match(c,/event\.preventDefault\(\);cancel\(\)/)],
['Cancel calls only onCancel',()=>assert.match(c,/props\.onCancel\(\)/)],
['Confirm calls onConfirm',()=>assert.match(c,/props\.onConfirm\(\)/)],
['Double click cannot call Confirm twice',()=>assert.match(c,/if\(consumedRef\.current\|\|!props\.open\)return/)],
['Buttons are native buttons',()=>assert.match(c,/h\('button'/)],
['Both have type button',()=>assert.equal((c.match(/type:'button'/g)??[]).length>=4,true)],
['Dialog validates visible copy',()=>assert.match(contract,/validateConfirmDialog/)],
['Only standard and danger intent allowed',()=>assert.match(contract,/ConfirmationIntent='standard'\|'danger'/)],
['No game storage or network writes',()=>assert.doesNotMatch(c+contract,/localStorage|indexedDB|fetch\(|from ['"]@game|from ['"]@domain|window\.history/)],
['Dialog styled with dark gold accent',()=>assert.match(css,/var\(--kit-accent\)/)],
['Light palette inherits accepted panel-kit CSS',()=>assert.match(page,/panel-kit\.css/)],
['480px max width and mobile breakpoints',()=>{assert.match(css,/max-inline-size:490px/);assert.match(css,/@media\(max-width:390px\)/);}],
['Visible keyboard focus',()=>assert.match(css,/:focus-visible/)],
['48px minimum target for dialog buttons',()=>assert.match(css,/min-block-size:48px/)],
['Reduced motion is supported',()=>assert.match(css,/prefers-reduced-motion:reduce/)],
['Forced-colors mode is supported',()=>assert.match(css,/forced-colors:active/)],
['Preview-only confirmation callback increments counter',()=>assert.match(c,/setConfirmed\(v=>v\+1\)/)],
['Cancel callback only increments cancelled preview counter',()=>assert.match(c,/setCancelled\(v=>v\+1\)/)],
['Separate Vite gallery entry',()=>assert.match(vite,/confirmDialogQa: path\('\.\/confirm-dialog-qa\.html'\)/)],
['Gallery has standalone root',()=>assert.match(gallery,/confirm-dialog-root/)],
['No range slider UI',()=>assert.doesNotMatch(page+c+css,/type=['"]range|role=['"]slider/)],
['No actual fighter images changed by modal',()=>assert.doesNotMatch(c,/from ['"]@(?:game|domain)|playerSave|combat\//i)],
['L3-043 and L3-044 remain accepted after L3-045',()=>{assert.ok(reg.completed.length>=45);assert.equal(reg.next_task,`L3-${String(reg.completed.length+1).padStart(3,'0')}`);assert.equal(reg.tasks.find(x=>x.id==='L3-043').status,'completed');assert.equal(reg.tasks.find(x=>x.id==='L3-044').status,'completed');assert.equal(reg.tasks.find(x=>x.id==='L3-045').status,'completed');assert.match(reg.L3_043_acceptance_evidence.physical_iphone_safari,/NOT_RUN/);}],
['Scripts explicitly reserve dedicated QA entry',()=>assert.ok(pkg.scripts['typecheck:confirm-dialog']&&pkg.scripts['test:confirm-dialog'])],
];
for(const [name,fn] of expectations)test(name,fn);
