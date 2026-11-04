import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const read=async path=>readFile(join(root,path),'utf8');
const contract=await read('src/ui/dashboard-contract.ts');
const component=await read('src/ui/dashboard.ts');
const css=await read('src/ui/dashboard.css');
const html=await read('dashboard-qa.html');
const preview=await read('src/dashboard-qa.ts');
test('dashboard displays all five required sections',()=>{
 for(const label of ['FIGHTER OVERVIEW','CAREER DAY','FINANCES','Notifications','UP NEXT'])assert.ok(component.includes(label),label);
});
test('dashboard fixture explicitly identifies non-live data',()=>{
 assert.match(contract,/source:'fixture'/);assert.match(component,/SAMPLE DATA · NO LIVE SAVE/);assert.match(component,/All values are fictional examples/);
});
test('no portrait is fabricated or original approved character art modified',()=>{
 assert.match(component,/APPROVED FIGHTER ART/);assert.match(component,/Not connected to this preview/);
 assert.doesNotMatch(component,/<svg|imageGen|sprites|fighterRig|new Image\(/);
});
test('date is semantic and formatter uses fixed UTC for fixture data',()=>{
 assert.match(component,/h\('time'/);assert.match(contract,/timeZone:'UTC'/);
});
test('cash is formatted from fixture only and cannot purchase or save',()=>{
 assert.match(component,/formatCashUsd\(data.cashUsd\)/);
 assert.doesNotMatch(component,/indexedDB|localStorage|sessionStorage|fetch\(|saveGame|updateBalance|onClick.*purchase/);
});
test('real buttons and status for safe preview action',()=>{
 assert.match(component,/'data-dashboard-next':'true'/);
 assert.match(component,/onClick:activate/);
 assert.match(component,/role:'status','aria-live':'polite'/);
 assert.match(component,/No training, purchase, save, or gameplay action was completed/);
});
test('notification list is keyed by ID and handles empty fixtures',()=>{
 assert.match(component,/key:item.id/);
 assert.match(component,/data-dashboard-empty/);
 assert.match(component,/No sample notifications/);
});
test('fixture contract validates dates, money and duplicate messages',()=>{
 for(const piece of ['validateDashboardData','Number.isFinite(data.cashUsd)','new Set(data.notifications.map(n=>n.id))','parsed.toISOString()'])assert.ok(contract.includes(piece),piece);
});
test('isolated preview has full Vite entry but no gameplay dependencies',async()=>{
 const vite=await read('vite.config.mjs');
 assert.match(vite,/dashboardQa: path\('\.\/dashboard-qa\.html'\)/);
 assert.match(html,/src\/ui\/dashboard\.css/);
 assert.match(preview,/render\(h\(DashboardGallery/);
});
test('mobile styling adapts to 375/390/402/430 and has no fixed overlay',()=>{
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/@media\(max-width:380px\)/);
 assert.doesNotMatch(css,/position:fixed/);
 assert.match(css,/min-inline-size:0/);
});
test('approved navy and gold token variables are reused',()=>{
 for(const variable of ['--kit-accent','--kit-panel','--kit-border','--kit-ink'])assert.ok(css.includes(variable),variable);
});
test('focus, high contrast and reduced motion are supported',()=>{
 assert.match(css,/focus-visible/);
 assert.match(css,/forced-colors:active/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/min-block-size:44px/);
});
test('no sliders or false real-world game effects',()=>{
 assert.doesNotMatch(component,/type:'range'|slider|save-committed|gameState|fighterState/);
 assert.match(component,/No fighter, save, or career has been loaded/);
});
test('pure fixture validators work and reject impossible inputs',()=>{
 const source=`import {SAMPLE_DASHBOARD,validateDashboardData,formatGameDate,formatCashUsd} from './src/ui/dashboard-contract.ts';
if(!validateDashboardData(SAMPLE_DASHBOARD)||formatCashUsd(2450)!=='$2,450.00'||!formatGameDate('2027-03-08').includes('2027'))process.exit(2);
for(const bad of [{...SAMPLE_DASHBOARD,source:'live'},{...SAMPLE_DASHBOARD,cashUsd:-1},{...SAMPLE_DASHBOARD,gameDate:'2027-02-30'},{...SAMPLE_DASHBOARD,notifications:[SAMPLE_DASHBOARD.notifications[0],SAMPLE_DASHBOARD.notifications[0]]}]){try{validateDashboardData(bad);process.exit(4)}catch(e){if(!(e instanceof TypeError||e instanceof RangeError))process.exit(5)}}
console.log('fixture contract PASS');`;
 const r=spawnSync(process.execPath,['--disable-warning=ExperimentalWarning','--experimental-strip-types','--input-type=module','-e',source],{cwd:root,encoding:'utf8'});
 assert.equal(r.status,0,r.stdout+' '+r.stderr);
 assert.match(r.stdout,/fixture contract PASS/);
});
test('dashboard is still not marked accepted or started in official register',async()=>{
 const reg=JSON.parse(await read('docs/task-register.json'));
 assert.equal(reg.completed.length,44);
 assert.equal(reg.next_task,'L3-045');
 assert.equal(reg.tasks.find(t=>t.id==='L3-045').status,'planned');
});
