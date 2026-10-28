#!/usr/bin/env python3
"""Real Chromium migration harness verification without performing automatic persisted migrations."""
import argparse, json
from pathlib import Path
from playwright.sync_api import sync_playwright
WIDTHS=(375,390,402,430)
SCRIPT=r'''async()=>{
const q=window.__LEGACY3_MIGRATIONS_QA__;
const ok=(v,m)=>{if(!v)throw Error(m)};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const a=q.slotRecord('slot-1','alice',1700000011234,0);
const unchanged=structuredClone(a);
const m=q.migrateManualSlotRecord(a);
ok(m.ok&&m.steps.length===1&&m.steps[0].from===0&&m.steps[0].to===1,'no ordered migration');
ok(same(a,unchanged),'migration mutated source');
ok(m.value.metadata.savedAtEpochMs===1700000011234,'timestamp shifted');
ok(m.value.state.random.word===123&&m.value.state.random.seed===123&&m.value.state.random.draws===0,'RNG replay lost');
ok(m.value.state.clocks.calendar.dayIndex===170&&m.value.state.clocks.fight.elapsedMilliseconds===8000,'clocks shifted');
const old=q.state('bob',1,900);
ok((await q.saveManualSlot('slot-2',old,1710000000000)).ok,'existing save failed');
const before=await q.loadManualSlot('slot-2');ok(before.ok,'cannot read original');
const future=q.state('bob',9);ok(q.migrateGameState(future).code==='UNSUPPORTED_VERSION','future migration accepted');
const corrupt=q.slotRecord('slot-1','alice',1700000011234);corrupt.state.random.word=77;
ok(q.migrateManualSlotRecord(corrupt).code==='CORRUPT_STATE','bad seed accepted');
const after=await q.loadManualSlot('slot-2');ok(after.ok&&same(after.value,before.value),'failed migration changed previous slot');
ok((await q.saveManualSlot('slot-1',m.value.state,m.value.metadata.savedAtEpochMs)).ok,'explicit migrated save failed');
const saved=await q.loadManualSlot('slot-1');ok(saved.ok&&same(saved.value,m.value),'migrated state or metadata mismatch');
return {alice:m.value,bob:before.value,checks:14};
}'''
def run(url,out):
 out.mkdir(parents=True,exist_ok=True); results=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for width in WIDTHS:
   ctx=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True)
   page=ctx.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   try:
    resp=page.goto(url.rstrip('/')+'/migrations-qa.html',wait_until='load',timeout=30000)
    page.wait_for_function("document.documentElement.dataset.migrationQaReady==='true'",timeout=30000)
    a=page.evaluate(SCRIPT)
    page.reload(wait_until='load')
    page.wait_for_function("document.documentElement.dataset.migrationQaReady==='true'",timeout=30000)
    r=page.evaluate("async()=>{const q=window.__LEGACY3_MIGRATIONS_QA__;return {alice:await q.loadManualSlot('slot-1'),bob:await q.loadManualSlot('slot-2')}}")
    assert r['alice']['ok'] and r['bob']['ok'] and r['alice']['value']==a['alice'] and r['bob']['value']==a['bob'],'reload changed saved records'
    assert resp.status==200 and not errors,f'{resp.status} {errors}'
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'horizontal overflow'
    result={'width':width,'status':'PASS','assertions':18,'browser_errors':errors,'reloaded':True}
   except Exception as e:result={'width':width,'status':'FAIL','error':str(e),'browser_errors':errors}
   page.screenshot(path=str(out/f'migrations-{width}px.png'),full_page=True); results.append(result); print(f'L3-032 {width}px {result["status"]}',flush=True);ctx.close()
  browser.close()
 (out/'results.json').write_text(json.dumps({'url':url,'results':results},indent=2)+'\n')
 if any(x['status']!='PASS' for x in results):raise SystemExit(1)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--base-url',required=True);p.add_argument('--out',required=True);a=p.parse_args();run(a.base_url,Path(a.out))
