import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readdirSync,readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import ts from 'typescript';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFile(join(root,p),'utf8');
const [contract,components,styles,html,qa,vite,reg,mainCss]=await Promise.all([
 read('src/ui/panel-kit-contract.ts'),read('src/ui/panel-kit.ts'),read('src/ui/panel-kit.css'),read('panel-kit-qa.html'),read('src/panel-kit-qa.ts'),read('vite.config.mjs'),read('docs/task-register.json'),read('src/style.css')
]);
const tsjs=code=>ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const tokens=await read('src/design/tokens.ts');
const tokenModule='data:text/javascript;base64,'+Buffer.from(tsjs(tokens)).toString('base64');
const kitUrl='data:text/javascript;base64,'+Buffer.from(tsjs(contract).replace(/from ['"]\.\.\/design\/tokens['"]/,`from '${tokenModule}'`)).toString('base64');
const api=await import(kitUrl);
const regData=JSON.parse(reg);
test('L3-041 eleven immutable, distinct components',()=>{assert.equal(api.PANEL_KIT_VERSION,'L3-041.V1');assert.deepEqual(api.PANEL_KIT_CATALOG.map(x=>x.id),['text','stat','action','list','disclosure','notice','search-list','segmented-info','checklist','timeline','comparison']);assert.ok(Object.isFrozen(api.PANEL_KIT_CATALOG));});
test('dark palette reuses approved L3-035 design tokens',async()=>{const t=await import(tokenModule);assert.equal(api.PANEL_KIT_PALETTES.dark.canvas,t.SEMANTIC['surface-canvas']);assert.equal(api.PANEL_KIT_PALETTES.dark.accent,t.SEMANTIC['accent-primary']);});
test('light and dark pass WCAG 2 AA normal text at 4.5:1',()=>{for(const theme of ['dark','light']){assert.equal(api.assertPanelKitContrast(theme),true);for(const [fg,bg] of api.PANEL_KIT_TEXT_PAIRS)assert.ok(Boolean(api.PANEL_KIT_PALETTES[theme][fg]));}});
test('computed CSS palette declarations stay synchronized with type-safe contrast catalog',()=>{
  const mappings={canvas:'canvas',panel:'panel',raised:'raised',ink:'ink',muted:'muted',accent:'accent',border:'border',onAccent:'on-accent',focus:'focus'};
  const scoped={dark:styles.match(/\.legacy-kit\{([^}]+)\}/)?.[1],light:styles.match(/\.legacy-kit\[data-kit-theme="light"\]\{([^}]+)\}/)?.[1]};
  for(const theme of ['dark','light']){
    assert.ok(scoped[theme],`missing ${theme} CSS`);
    for(const [key,suffix] of Object.entries(mappings)){
      const actual=scoped[theme].match(new RegExp(`--kit-${suffix}:\\s*(#[\\da-fA-F]{6})`))?.[1];
      assert.equal(actual?.toUpperCase(),api.PANEL_KIT_PALETTES[theme][key].toUpperCase(),`${theme} ${key} mismatch`);
    }
  }
});
test('invalid runtime theme is rejected',()=>assert.throws(()=>api.assertPanelKitContrast('teal'),/Unknown/));
test('light palette uses visibly distinct surface and ink',()=>{assert.notEqual(api.PANEL_KIT_PALETTES.light.canvas,api.PANEL_KIT_PALETTES.dark.canvas);assert.notEqual(api.PANEL_KIT_PALETTES.light.ink,api.PANEL_KIT_PALETTES.dark.ink);});
test('component API has eleven independently reusable exported functions',()=>{for(const x of ['TextCard','StatPanel','ActionTile','PanelList','DisclosureCard','NoticeCard','SearchableListCard','SegmentedInfoCard','ChecklistCard','TimelineCard','ComparisonCard'])assert.match(components,new RegExp(`export function ${x}\\(`));});
test('text card uses article with heading and description',()=>{assert.match(components,/h\('article'/);assert.match(components,/h\('h2'/);assert.match(components,/h\('p'/);});
test('stats expose semantic description list with dt and dd',()=>{for(const x of ["h('dl'","h('dt'","h('dd'"])assert.ok(components.includes(x),x);});
test('actions use real button and supplied callback, never empty handler',()=>{assert.match(components,/type:'button',onClick:onActivate/);assert.match(components,/onActivate:\(\)=>void/);assert.doesNotMatch(components,/localStorage|indexedDB|fetch\(|window\.history/);});
test('action description is announced with a per-instance accessible relation',()=>{assert.match(components,/const descriptionId=useId\(\)/);assert.match(components,/'aria-describedby':descriptionId/);assert.match(components,/class:'legacy-kit-description',id:descriptionId/);});
test('disabled actions preserve full text contrast',()=>{assert.match(styles,/\.legacy-kit-action:disabled\{[^}]*cursor:not-allowed/);assert.doesNotMatch(styles,/\.legacy-kit-action:disabled\{[^}]*opacity\s*:/);});
test('lists use native ul/li and data-driven stable keys',()=>{assert.match(components,/h\('ul'/);assert.match(components,/h\('li',\{key:item\.id\}/);});
test('gallery includes preview-only action acknowledgement and role status',()=>{assert.match(components,/No game data changed/);assert.match(components,/role:'status'/);assert.match(components,/setActionCount/);assert.match(components,/no gameplay/i);});
test('theme switch uses pressed native buttons, no sliders',()=>{assert.match(components,/'aria-pressed':theme===t/);assert.match(components,/setTheme\(t\)/);assert.doesNotMatch(components+html,/<input|<select|type=['"]range|role=['"]slider/i);});
test('panel kit styles use scoped CSS tokens and tactile accessible controls',()=>{assert.match(styles,/\.legacy-kit\[data-kit-theme="light"\]/);assert.match(styles,/min-block-size:44px/);assert.match(styles,/:focus-visible/);assert.match(styles,/grid-template-columns:minmax\(0,1fr\)/);assert.doesNotMatch(styles,/overflow-x\s*:\s*hidden/);});
test('uses native accessibility semantics and live status',()=>{assert.match(components,/role:'group'/);assert.match(components,/aria-label/);assert.match(components,/'aria-live':'polite'/);});
test('separate Vite QA page and entry preserve existing game renderer',()=>{assert.match(vite,/panelKitQa: path\('\.\/panel-kit-qa\.html'\)/);assert.match(html,/viewport-fit=cover/);assert.match(qa,/PanelKitGallery/);assert.doesNotMatch(qa,/mountRendererViewport|from ['"]@renderer/);assert.doesNotMatch(mainCss,/panel-kit/);});
test('earlier L3-040 milestone remains accepted and L3-041 not previously completed',()=>{assert.equal(regData.tasks.find(x=>x.id==='L3-040').status,'completed');assert.equal(regData.tasks.find(x=>x.id==='L3-041').status,'planned');});

// Retain inherited regression coverage without paying for 21 duplicate runners per L3-041 PR commit.
test('L3-041 review skips only redundant inherited jobs, retains regular main and dispatch triggers',()=>{
  const dir=join(root,'.github/workflows');
  const files=readdirSync(dir).filter(name=>/^l3-(?:0[23]\d|040)-.+\.yml$/.test(name));
  assert.equal(files.length,21,'all accepted inherited workflow definitions must remain');
  for(const name of files){
    const workflow=readFileSync(join(dir,name),'utf8');
    assert.ok(workflow.includes("if: ${{ github.event_name != 'pull_request' || github.head_ref != 'l3-041-panel-card-kit' }}"),`${name} must skip only duplicated L3-041 PR runners`);
    assert.match(workflow,/workflow_dispatch:/,`${name} remains runnable manually`);
    if(name!=='l3-021-boundary-acceptance.yml') assert.match(workflow,/push:/,`${name} remains active on main`);
  }
});
test('consolidated L3-041 workflow retains inherited test and browser coverage',()=>{
  const yaml=readFileSync(join(root,'.github/workflows/l3-041-panel-kit.yml'),'utf8');
  for(const line of ['npm ci --no-audit --no-fund','npm run lint','npm run typecheck','npm run test:types:negative','npm test','npm run build','npm run manifest:verify'])
    assert.ok(yaml.includes(line),`required acceptance stage ${line}`);
  for(const old of ['nested-nav','bottom-nav','home-screen','safe-area','typography','design-tokens','build-manifest','fixtures','migrations','export-import','manual-slots','autosave','indexeddb','boundary','vite'])
    assert.ok(yaml.includes(`chromium-${old}-qa.py`),`missing inherited Chromium regression ${old}`);
  assert.match(yaml,/chromium-panel-kit-qa.py/);
  assert.match(yaml,/cancel-in-progress: true/);
  assert.match(yaml,/cache: npm/);
});


test('empty collection uses a meaningful paragraph, not a fake list item',()=>{
  assert.match(components,/class:'legacy-kit-description legacy-kit-empty','data-kit-empty':'true'/);
  assert.match(components,/emptyMessage='No items available\.'/);
  assert.match(components,/emptyMessage\)/);
  assert.doesNotMatch(components,/No preview items\./);
});
test('variant gallery demonstrates both disabled action and empty collection',()=>{
  assert.match(components,/Component states/);
  assert.match(components,/disabled:true,onActivate:/);
  assert.match(components,/title:'Empty collection example',items:\[\],emptyMessage:/);
  assert.match(styles,/\.legacy-kit-variants/);
});
test('real browser QA checks disabled actions and empty collection semantics',()=>{
  const playwright=readFileSync(join(root,'scripts/chromium-panel-kit-qa.py'),'utf8');
  assert.match(playwright,/disabledCount/);
  assert.match(playwright,/emptyState/);
  assert.match(playwright,/legacy-kit-action:not\(:disabled\)/);
  assert.match(playwright,/legacy-kit-action:disabled/);
});

test('accessible card regions are labelled by actual visible headings',()=>{
  assert.match(components,/const headingId=useId\(\)/);
  assert.match(components,/const labelId=useId\(\)/);
  assert.match(components,/'aria-labelledby':headingId/);
  assert.match(components,/'aria-labelledby':labelId/);
});
test('high-contrast operating system colors and focus are not overridden',()=>{
  assert.match(styles,/@media\s*\(forced-colors:\s*active\)/);
  assert.match(styles,/--kit-panel:Canvas/);
  assert.match(styles,/--kit-ink:CanvasText/);
  assert.match(styles,/background:ButtonFace;color:ButtonText;border:3px solid Highlight/);
  assert.match(styles,/focus-visible\s*\{outline:3px solid Highlight/);
  assert.doesNotMatch(styles,/forced-color-adjust:\s*none/);
});

test('offline fixture writes explicit aria-pressed boolean values, but native disabled remains boolean',async()=>{
  const fixture=await read('scripts/panel-kit-offline-fixture.mjs');
  assert.match(fixture,/key\.startsWith\('aria-'\)/);
  assert.match(fixture,/v!==false\|\|key\.startsWith\('aria-'\)/);
  assert.match(fixture,/v===true&&!key\.startsWith\('aria-'\)/);
});

// R7: the native button must use its visible title for the accessible name,
// and a separately described hint; never override its visible name.
test('action naming and independent description are verified in genuine browser QA contract',()=>{
  const browser=readFileSync(join(root,'scripts/chromium-panel-kit-qa.py'),'utf8');
  assert.match(browser,/actionVisibleLabel/);
  assert.match(browser,/getAttribute\('aria-labelledby'\)/);
  assert.match(browser,/actionDescription/);
});
test('empty list copy can be supplied by callers without synthesizing list rows',()=>{
  assert.match(components,/readonly emptyMessage\?:string/);
  assert.match(components,/emptyMessage='No items available\.'/);
  assert.match(components,/data-kit-empty/);
});

// R8: make gallery landmarks reusable without fixed ID collisions.
test('gallery visible h1 and variant heading label their landmarks using useId',()=>{
  assert.match(components,/const titleId=useId\(\)/);
  assert.match(components,/const variantsId=useId\(\)/);
  assert.match(components,/'data-kit-title':'true'/);
  assert.match(components,/'aria-labelledby':titleId/);
  assert.match(components,/'aria-labelledby':variantsId/);
  assert.doesNotMatch(components,/id:'kit-title'|id:'kit-variants-title'/);
});
test('genuine browser acceptance contract checks main and variant landmark names',()=>{
  const browser=readFileSync(join(root,'scripts/chromium-panel-kit-qa.py'),'utf8');
  assert.match(browser,/mainVisibleName/);
  assert.match(browser,/variantsVisibleName/);
  assert.match(browser,/mainVisibleName'\] and v\['variantsVisibleName/);
});
test('list rows have accessible visual separators and coarse-pointer targets',()=>{
  assert.match(styles,/\.legacy-kit-list li\+li\{border-block-start:1px solid var\(--kit-border\)/);
  assert.match(styles,/@media \(pointer:coarse\)\{\.legacy-kit-action\{min-block-size:100px/);
});

test('R8 gallery theme and status IDs are per-instance and testable without hard-coded IDs',()=>{
  for(const id of ['darkButtonId','lightButtonId','statusId'])assert.ok(components.includes(`const ${id}=useId()`));
  assert.match(components,/'data-kit-theme-button':t/);
  assert.match(components,/'data-kit-status':'true'/);
  assert.doesNotMatch(components,/id:`kit-theme-|id:'kit-action-result'/);
  const browser=readFileSync(join(root,'scripts/chromium-panel-kit-qa.py'),'utf8');
  assert.match(browser,/data-kit-theme-button/);
  assert.match(browser,/data-kit-status/);
});

test('notice card has independent labelled region with optional dismissal action',()=>{
  assert.match(components,/export function NoticeCard\(/);
  assert.match(components,/role:'note','aria-labelledby':titleId,'aria-describedby':bodyId/);
  assert.match(components,/onDismiss\?h\('button'/);
  assert.match(components,/type:'button',class:'legacy-kit-notice-dismiss',onClick:onDismiss/);
  assert.match(components,/noticeVisible\?h\(NoticeCard/);
  assert.match(components,/setNoticeVisible\(false\)/);
  assert.match(components,/setNoticeVisible\(true\)/);
  assert.match(styles,/\.legacy-kit-notice-restore\{inline-size:100%/);
  assert.match(styles,/\.legacy-kit-notice-dismiss,\.legacy-kit-notice-restore\{min-block-size:44px/);
});

test('search-list filter supports partial label and description matching, case and Unicode normalization',()=>{
  const list=[{id:'a',label:'Training',description:'Cardio drills'},{id:'b',label:'Career',description:'Résumé and goals'},{id:'c',label:'Fighter',description:'Anatomy preview'}];
  assert.deepEqual(api.filterPanelListItems(list,'TRAIN').map(x=>x.id),['a']);
  assert.deepEqual(api.filterPanelListItems(list,'  CARDIO  ').map(x=>x.id),['a']);
  assert.deepEqual(api.filterPanelListItems(list,'re\u0301sume\u0301').map(x=>x.id),['b']);
  assert.deepEqual(api.filterPanelListItems(list,'no matching term'),[]);
  assert.equal(api.filterPanelListItems(list,' '),list,'empty term returns original, unmodified list');
  assert.equal(list.length,3,'source list is not mutated');
});
test('search-list card uses native labelled search field and screen reader result status',()=>{
  assert.match(components,/export function SearchableListCard\(/);
  assert.match(components,/h\('label',\{class:'legacy-kit-search-label',htmlFor:inputId\}/);
  assert.match(components,/type:'search',value:query/);
  assert.match(components,/onInput:\(event:Event\)=>setQuery/);
  assert.match(components,/filterPanelListItems\(items,query\)/);
  assert.match(components,/role:'status','aria-live':'polite','aria-atomic':'true'/);
  assert.match(components,/data-kit-search-empty/);
  assert.match(components,/key:item\.id/);
  assert.match(components,/No saved fighter available/);
  assert.match(styles,/legacy-kit-search-input\{[^}]*min-block-size:48px/);
  assert.match(styles,/@media\(forced-colors:active\)\{\.legacy-kit-search-input/);
  assert.doesNotMatch(components,/localStorage|indexedDB|fetch\(|window\.history/);
});

test('P5 segmented information card supports local pressed-button selection with no sliders or game writes',()=>{
  assert.match(components,/export function SegmentedInfoCard\(/);
  assert.match(components,/role:'group','aria-label':`Choose \${title} information`/);
  assert.match(components,/'aria-pressed':selected.id===section.id/);
  assert.match(components,/'aria-controls':contentId,onClick:\(\)=>setSelectedId\(section.id\)/);
  assert.match(components,/role:'region','aria-labelledby':selectedButtonId/);
  assert.match(components,/data-kit-active-section/);
  assert.match(styles,/\.legacy-kit-segmented-option\{[^}]*min-block-size:48px/);
  assert.match(styles,/\.legacy-kit-segmented-option\[aria-pressed="true"\]/);
  assert.match(components,/title:'Preview information'/);
  assert.doesNotMatch(components,/localStorage|indexedDB|fetch\(|window\.history|type:'range'/);
});


test('P6 checklist controls use native inputs and a local review-only state',()=>{
  assert.match(components,/export function ChecklistCard\(/);
  assert.match(components,/type:'checkbox',checked:activeCheckedIds\.includes\(item\.id\)/);
  assert.match(components,/setCheckedIds\(previous=>/);
  assert.match(components,/role:'status','aria-live':'polite','aria-atomic':'true'/);
  assert.match(components,/data-kit-checklist-empty/);
  assert.match(styles,/\.legacy-kit-checklist-row\{[^}]*min-block-size:56px/);
  assert.match(styles,/@media\(forced-colors:active\)\{\.legacy-kit-checklist-count/);
  assert.match(components,/Preparation checklist · preview/);
  assert.doesNotMatch(components,/localStorage|indexedDB|fetch\(|window\.history|type:'range'/);
});


test('P7 event timeline uses an ordered list, native dates, large local buttons and accessible details',()=>{
  assert.match(components,/export function TimelineCard\(/);
  assert.match(components,/h\('ol',\{class:'legacy-kit-timeline-items'/);
  assert.match(components,/h\('time',\{class:'legacy-kit-timeline-date',dateTime:entry\.date\}/);
  assert.match(components,/'aria-pressed':selected\?\.id===entry\.id/);
  assert.match(components,/onClick:\(\)=>setSelectedId\(entry\.id\)/);
  assert.match(components,/data-kit-timeline-empty/);
  assert.match(styles,/\.legacy-kit-timeline-option\{[^}]*min-block-size:58px/);
  assert.match(styles,/@media\(forced-colors:active\)\{\.legacy-kit-timeline-items/);
  assert.doesNotMatch(components,/localStorage|indexedDB|fetch\(|window\.history|type:'range'/);
});


test('P8 comparison card keeps semantics, touch controls and presentation-only state',()=>{
  assert.match(components,/export function ComparisonCard\(/);
  assert.match(components,/h\('table',\{id:tableId,class:'legacy-kit-comparison-table'/);
  assert.match(components,/scope:'col'/);
  assert.match(components,/scope:'row'/);
  assert.match(components,/'aria-pressed':differencesOnly/);
  assert.match(components,/onClick:\(\)=>setDifferencesOnly\(value=>!value\)/);
  assert.match(components,/data-kit-comparison-empty/);
  assert.match(components,/Training approach comparison · preview/);
  assert.match(styles,/\.legacy-kit-comparison-toggle\{[^}]*min-block-size:48px/);
  assert.match(styles,/@media\(forced-colors:active\)\{\.legacy-kit-comparison-toggle/);
  assert.doesNotMatch(components,/localStorage|indexedDB|fetch\(|window\.history|type:'range'/);
});


test('P8 difference filter compares rendered values without mutating source data',()=>{
  const values=Object.freeze([
    Object.freeze({id:'a',left:'Gym',right:'Gym'}),
    Object.freeze({id:'b',left:'Drills',right:'Circuits'}),
    Object.freeze({id:'c',left:'Rest',right:'Rest'}),
  ]);
  assert.equal(api.filterComparisonDifferences(values,false),values);
  assert.deepEqual(api.filterComparisonDifferences(values,true).map(item=>item.id),['b']);
  assert.deepEqual(api.filterComparisonDifferences([],true),[]);
  assert.equal(values.length,3);
});
