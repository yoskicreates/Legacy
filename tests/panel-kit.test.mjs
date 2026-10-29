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
test('L3-041 four immutable, distinct components',()=>{assert.equal(api.PANEL_KIT_VERSION,'L3-041.V1');assert.deepEqual(api.PANEL_KIT_CATALOG.map(x=>x.id),['text','stat','action','list']);assert.ok(Object.isFrozen(api.PANEL_KIT_CATALOG));});
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
test('component API has four independently reusable exported functions',()=>{for(const x of ['TextCard','StatPanel','ActionTile','PanelList'])assert.match(components,new RegExp(`export function ${x}\\(`));});
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
