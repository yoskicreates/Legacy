import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const read=async p=>readFile(join(root,p),'utf8');
const contract=await read('src/ui/toast-status-contract.ts');
const component=await read('src/ui/toast-status.ts');
const css=await read('src/ui/toast-status.css');
const preview=await read('src/toast-status-qa.ts');
const html=await read('toast-status-qa.html');
const pkg=JSON.parse(await read('package.json'));

test('all four requested states have honest implementations',()=>{
 for(const kind of ['practice-complete','preview-error','preview-locked','preview-save','save-committed','save-failed','feature-locked'])assert.ok(contract.includes(kind),kind);
});
test('save receipt demands committed write and destination',()=>{
 assert.match(contract,/readonly persisted:true/);
 assert.match(contract,/readonly receiptId:string/);
 assert.match(contract,/readonly destination:'device'\|'export'/);
 assert.match(contract,/receipt\.persisted!==true/);
});
test('practice demo never creates actual persisted save result',()=>{
 assert.doesNotMatch(component,/type:'save-committed'/);
 assert.match(component,/type:'preview-save'/);
 assert.match(contract,/No game progress was saved/);
 assert.match(contract,/nothing was written to a save slot or device/);
 assert.match(component,/Real save operations: 0/);
});
test('failed storage writes explicitly reject success',()=>{
 assert.match(contract,/Save did not complete/);
 assert.match(contract,/No successful save was confirmed/);
});
test('native buttons are used for demo choices and dismissal',()=>{
 assert.match(component,/h\('button'/);
 assert.match(component,/type:'button'/);
 assert.match(component,/aria-label.*Dismiss/);
});
test('screen reader roles indicate error vs status without stealing focus',()=>{
 assert.match(component,/role:item\.urgency==='assertive'\?'alert':'status'/);
 assert.match(component,/'aria-live':item\.urgency/);
 assert.doesNotMatch(component,/\.focus\(/);
});
test('notifications capped at three and dismiss by ID',()=>{
 assert.match(component,/\.slice\(-3\)/);
 assert.match(component,/existing\.filter\(item=>item\.id!==id\)/);
});
test('preview is a distinct Vite entry with shared approved tokens',async()=>{
 assert.match(html,/src\/ui\/panel-kit\.css/);
 assert.match(html,/src\/ui\/toast-status\.css/);
 assert.match(html,/src\/style\.css/);
 assert.match(preview,/render\(h\(ToastStatusGallery/);
 assert.match(await read('vite.config.mjs'),/toastStatusQa: path\('\.\/toast-status-qa\.html'\)/);
});
test('navy/gold and light styling use inherited variables',()=>{
 for(const token of ['--kit-panel','--kit-accent','--kit-ink','--kit-border','--kit-focus'])assert.ok(css.includes(token),token);
 assert.match(component,/'data-kit-theme':theme/);
});
test('safe-area, small viewport, contrast and motion considerations',async()=>{
 const shellCss=await read('src/ui/panel-kit.css');
 assert.match(shellCss,/safe-area-inset-right/);
 assert.match(shellCss,/safe-area-inset-bottom/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/@media\(forced-colors:active\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/min-block-size:44px/);
});
test('notification cards remain in flow, never covering action buttons',()=>{
 assert.match(css,/\.legacy-toast-stack\{position:relative/);
 assert.doesNotMatch(css,/\.legacy-toast-stack\{position:fixed/);
 assert.match(css,/overflow-y:auto/);
});
test('no sliders or gameplay state changes',()=>{
 assert.doesNotMatch(component,/<input|type:'range'|indexedDB|localStorage|gameState|sessionStorage/);
 assert.doesNotMatch(preview,/indexedDB|localStorage|gameState/);
});
test('preview status accurately says it is not playable and no saves',()=>{
 assert.match(html,/LEGACY 3\.0/);
 assert.match(component,/No game data changed/);
});
test('negative test and dedicated mobile workflow scripts are present',async()=>{
 assert.equal(typeof pkg.scripts['typecheck:toast-status'],'string');
 assert.equal(typeof pkg.scripts['test:toast-status:negative'],'string');
 assert.match(await read('scripts/toast-status-negative-test.mjs'),/exactly eight rejected/);
 assert.match(await read('.github/workflows/l3-044-toast-status.yml'),/chromium-toast-status-qa\.py/);
});
test('Node can directly execute pure TypeScript factory (actual output)',()=>{
 const code=`import {makeToastNotice} from './src/ui/toast-status-contract.ts';\nconst items=[makeToastNotice('a',{type:'practice-complete',action:'choice'}),makeToastNotice('b',{type:'preview-save'}),makeToastNotice('c',{type:'save-committed',receipt:{persisted:true,destination:'device',receiptId:'confirmed-write'}}),makeToastNotice('d',{type:'save-failed',reason:'quota-exceeded'})];\nif(items[0].previewOnly!==true||items[0].appearance!=='success'||items[1].appearance!=='preview-saved'||items[1].previewOnly!==true||items[2].appearance!=='saved'||items[2].previewOnly!==false||items[3].appearance!=='error'||!items[3].detail.includes('No successful save'))process.exit(3);\nlet threw=false;try{makeToastNotice('e',{type:'save-committed',receipt:{persisted:false,destination:'device',receiptId:'fake'}})}catch(e){threw=e instanceof RangeError};if(!threw)process.exit(4);console.log('factory PASS');`;
 const r=spawnSync(process.execPath,['--disable-warning=ExperimentalWarning','--experimental-strip-types','--input-type=module','-e',code],{cwd:root,encoding:'utf8'});
 assert.equal(r.status,0,r.stdout+' '+r.stderr);
 assert.match(r.stdout,/factory PASS/);
});


test('L3-044 acceptance is intact after L3-045; L3-046 remains planned',async()=>{
 const reg=JSON.parse(await read('docs/task-register.json'));
 assert.ok(reg.completed.length>=45);
 assert.equal(reg.next_task,`L3-${String(reg.completed.length+1).padStart(3,'0')}`);
 for(const id of ['L3-041','L3-042','L3-043','L3-044'])assert.equal(reg.tasks.find(x=>x.id===id)?.status,'completed');
 assert.equal(reg.tasks.find(x=>x.id==='L3-045')?.status,'completed');
 assert.match(reg.L3_044_acceptance_evidence.physical_iphone_safari,/NOT_RUN/);
 assert.match(reg.L3_044_acceptance_evidence.review_github_workflows,/25\/25 PASS/);
 assert.equal(reg.L3_044_acceptance_evidence.browser_assertions,1760);
});
