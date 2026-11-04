import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import ts from 'typescript';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(join(root,p),'utf8');
const code=read('src/ui/selection-card.ts'),contracts=read('src/ui/selection-card-contract.ts'),styles=read('src/ui/selection-card.css');
const page=read('selection-card-qa.html'),entry=read('src/selection-card-qa.ts'),packageJson=JSON.parse(read('package.json'));
const vite=read('vite.config.mjs'),reg=JSON.parse(read('docs/task-register.json'));
const tsjs=x=>ts.transpileModule(x,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const original=read('src/ui/panel-kit-contract.ts'),tokens=read('src/design/tokens.ts');
const tokUrl='data:text/javascript;base64,'+Buffer.from(tsjs(tokens)).toString('base64');
const kitUrl='data:text/javascript;base64,'+Buffer.from(tsjs(original).replace(/from ['"]\.\.\/design\/tokens['"]/,`from '${tokUrl}'`)).toString('base64');
const contractUrl='data:text/javascript;base64,'+Buffer.from(tsjs(contracts).replace(/from ['"]\.\/panel-kit-contract['"]/,`from '${kitUrl}'`)).toString('base64');
const api=await import(contractUrl);
const example=(id,illustration='balanced')=>({id,label:'Example '+id,description:'Preview only',illustration});

test('L3-042 is named, typed and isolated from gameplay',()=>{
 assert.equal(api.SELECTION_CARD_VERSION,'L3-042.V1');
 assert.deepEqual(api.SELECTION_ILLUSTRATIONS,['striking','grappling','balanced']);
 for(const term of ['localStorage','indexedDB','fetch(','window.history','dispatchEvent','@domain/'])assert.ok(!code.includes(term),term);
});
test('valid samples and empty state accepted',()=>{
 assert.equal(api.validateSelectionOptions([example('a'),example('b','striking')]),true);
 assert.equal(api.validateSelectionOptions([]),true);
});
test('reject duplicate choice IDs',()=>assert.throws(()=>api.validateSelectionOptions([example('same'),example('same')]),/unique/));
test('reject missing IDs',()=>assert.throws(()=>api.validateSelectionOptions([example('   ')]),/non-empty/));
test('reject missing labels',()=>assert.throws(()=>api.validateSelectionOptions([{...example('a'),label:'  '}]),/non-empty/));
test('reject missing descriptions',()=>assert.throws(()=>api.validateSelectionOptions([{...example('a'),description:'  '}]),/non-empty/));
test('reject unsupported illustration tokens',()=>assert.throws(()=>api.validateSelectionOptions([example('a','stick-figure')]),/unsupported/));
test('reject more than six choices',()=>assert.throws(()=>api.validateSelectionOptions(Array.from({length:7},(_,i)=>example(String(i)))),/six/));
test('palette inherits approved L3-041 and WCAG AA contract',()=>{
 assert.equal(api.assertSelectionCardContrast(),true);
 assert.equal(api.SELECTION_CARD_PALETTES.dark.accent,'#DDBD82');
 assert.notEqual(api.SELECTION_CARD_PALETTES.light.canvas,api.SELECTION_CARD_PALETTES.dark.canvas);
});
test('native button pressed semantics and per-choice description announced',()=>{
 for(const x of ["h('button'","type:'button'","'aria-pressed':isSelected","'aria-describedby':descriptionId","onClick:()=>select(option)","role:'group'"])assert.ok(code.includes(x),x);
});
test('keyboard uses native Tab/Enter/Space, no custom key trapping',()=>{
 assert.doesNotMatch(code,/onKeyDown|preventDefault\(/);
 assert.match(code,/disabled:option\.disabled\?\?false/);
});
test('decorative inline artwork never claims fighter identity',()=>{
 assert.match(code,/h\('svg'/);
 assert.match(code,/'aria-hidden':'true'/);
 assert.match(code,/focusable:'false'/);
 assert.doesNotMatch(code,/fighter-sprite|new Image\(/);
});
test('selected choice has visible state and polite live announcement',()=>{
 assert.match(code,/isSelected\?'Selected':'Choose option'/);
 assert.match(code,/role:'status','aria-live':'polite'/);
 assert.match(code,/No game data changed/);
});
test('disabled choice cannot invoke selection callback',()=>assert.match(code,/if\(option\.disabled\|\|option\.id===currentId\)return/));
test('stale choice IDs pruned after parent replacement',()=>{
 assert.match(code,/useLayoutEffect\(\(\)=>/);
 assert.match(code,/setChosenId\(previous=>previous&&options\.some\(option=>option\.id===previous&&!option\.disabled\)\?previous:null\)/);
 assert.match(code,/\[optionIdentity\]/);
});
test('gallery exercises replacement of available options',()=>{
 assert.match(code,/data-selection-swap/);
 assert.match(code,/setAlternate\(value=>!value\)/);
 assert.match(code,/id:'mobility'/);
});
test('standalone QA entry uses actual reusable Preact component',()=>{
 assert.match(entry,/SelectionCardGallery/);
 assert.match(vite,/selectionCardQa: path\('\.\/selection-card-qa\.html'\)/);
 assert.match(page,/viewport-fit=cover/);
 assert.match(page,/src\/ui\/selection-card\.css/);
 assert.match(page,/src\/selection-card-qa\.ts/);
});
test('existing app entry not modified for L3-042',()=>{
 assert.doesNotMatch(read('src/main.ts'),/selection-card/);
 assert.doesNotMatch(read('src/style.css'),/selection-card/);
});
test('phone widths use a single column, 44px minimum and safe area inherited',()=>{
 assert.match(styles,/@media\(max-width:600px\)/);
 assert.match(styles,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(styles,/min-block-size:48px/);
 assert.match(read('src/ui/panel-kit.css'),/env\(safe-area-inset-bottom\)/);
});
test('forced colors, visible focus, and reduced motion are explicit',()=>{
 assert.match(styles,/@media\(forced-colors:active\)/);
 assert.match(styles,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(styles,/:focus-visible/);
 assert.match(styles,/Highlight/);
});
test('no slider controls or suppressed overflow hacks',()=>{
 assert.doesNotMatch(code+page+styles,/type=['"]range|role=['"]slider|overflow-x\s*:\s*hidden/);
});
test('owner-authorized L3-042 acceptance remains preserved after L3-043',()=>{
 assert.equal(reg.completed.length,43);assert.equal(reg.next_task,'L3-044');
 assert.equal(reg.tasks.find(x=>x.id==='L3-041').status,'completed');
 assert.equal(reg.tasks.find(x=>x.id==='L3-042').status,'completed');
 assert.equal(reg.tasks.find(x=>x.id==='L3-043').status,'completed');assert.equal(reg.tasks.find(x=>x.id==='L3-044').status,'planned');
 assert.match(reg.L3_042_acceptance_evidence.physical_iphone_safari,/NOT_RUN/);
});
test('isolated scripts expose strict typecheck and negative test',()=>{
 for(const k of ['typecheck:selection-card','test:selection-card:negative','test:selection-card'])assert.ok(packageJson.scripts[k]);
 assert.match(read('scripts/selection-card-negative-test.mjs'),/errors\.length!==7/);
});


test('Chromium focus check first enters real keyboard modality',()=>{
 const browser=read('scripts/chromium-selection-card-qa.py');
 assert.match(browser,/page\.keyboard\.press\('Tab'\);page\.keyboard\.press\('Shift\+Tab'\)/);
 assert.match(browser,/outlineStyle/);
});
test('Chromium prop-swap test removes selected ID before checking stale selection',()=>{
 const browser=read('scripts/chromium-selection-card-qa.py');
 assert.match(browser,/striker\.click\(\)/);
 assert.match(browser,/preview: 3\./);
 assert.match(browser,/data-selection-selected/);
});
