#!/usr/bin/env python3
"""L3-033 real browser reproducibility/old save preservation; no production fixture injection."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
WIDTHS=(375,390,402,430)
SCRIPT=r'''async()=>{
const q=window.__LEGACY3_FIXTURES_QA__;
const ok=(v,m)=>{if(!v)throw Error(m)};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const bundle=q.makeFixtureBundle(4294967295,1700000000999);
ok(bundle.length===3,'bundle count');
ok(new Set(bundle.map(s=>s.metadata.slotId)).size===3,'slot independence');
ok(new Set(bundle.map(s=>s.metadata.careerId)).size===3,'career independence');
ok(same(bundle,q.makeFixtureBundle(4294967295,1700000000999)),'nondeterminism');
ok(Object.isFrozen(bundle)&&Object.isFrozen(bundle[0].state.random),'mutation allowed');
for(const s of bundle)ok(q.validateGameState(s.state).ok,'invalid fixture state');
for(const k of ['unsupported-version','corrupt-random','negative-clock','missing-career','extra-root-field'])ok(!q.validateGameState(q.makeInvalidStateFixture(k)).ok,'invalid fixture passed '+k);
for(const s of q.makeBoundaryFixtures())ok(q.validateGameState(s).ok,'boundary fixture failed');
ok(q.makeFighterFixture(12,4).fighterId!==q.makeFighterFixture(12,5).fighterId,'fighter collision');
const previous=q.makeCareerFixture({seed:7,careerId:'prior-save',randomDraws:3,calendarDay:87,fightMilliseconds:5000});
ok((await q.saveManualSlot('slot-1',previous,1700000000000)).ok,'setup previous save');
const before=await q.loadManualSlot('slot-1');ok(before.ok,'previous record absent');
q.makeFixtureBundle(9,1700000000000);q.makeInvalidStateFixture('corrupt-random');
const after=await q.loadManualSlot('slot-1');ok(after.ok&&same(before.value,after.value),'fixture generation changed production save');
return {before:before.value,bundle,assertions:22};
}'''

def run(base,out):
 out.mkdir(parents=True,exist_ok=True);results=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for width in WIDTHS:
   ctx=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True)
   page=ctx.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   try:
    resp=page.goto(base.rstrip('/')+'/fixtures-qa.html',wait_until='load',timeout=30000)
    page.wait_for_function("document.documentElement.dataset.fixtureQaReady==='true'",timeout=30000)
    a=page.evaluate(SCRIPT)
    page.reload(wait_until='load')
    page.wait_for_function("document.documentElement.dataset.fixtureQaReady==='true'",timeout=30000)
    b=page.evaluate("async()=>{const q=window.__LEGACY3_FIXTURES_QA__;return {before:await q.loadManualSlot('slot-1'),bundle:q.makeFixtureBundle(4294967295,1700000000999)}}")
    assert b['before']['ok'] and b['before']['value']==a['before'],'prior save changed after reload'
    assert b['bundle']==a['bundle'],'fixture bundle changed after reload'
    assert resp.status==200 and not errors,f'{resp.status}, {errors}'
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'horizontal overflow'
    result={'width':width,'status':'PASS','assertions':26,'no_save_mutation':True,'reloaded':True,'browser_errors':errors}
   except Exception as ex:result={'width':width,'status':'FAIL','error':str(ex),'browser_errors':errors}
   page.screenshot(path=str(out/f'fixture-{width}px.png'),full_page=True);results.append(result);print(f'L3-033 {width}px {result["status"]}',flush=True);ctx.close()
  browser.close()
 (out/'results.json').write_text(json.dumps({'url':base,'results':results},indent=2)+'\n')
 if any(x['status']!='PASS' for x in results):raise SystemExit(1)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--base-url',required=True);p.add_argument('--out',required=True);x=p.parse_args();run(x.base_url,Path(x.out))
