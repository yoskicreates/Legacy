#!/usr/bin/env python3
"""L3-030 real Chromium IndexedDB slot switching/reload/atomic rollback QA."""
import argparse, json
from pathlib import Path
from playwright.sync_api import sync_playwright

WIDTHS=(375,390,402,430)
JS=r'''async () => {
 const p=window.__LEGACY3_MANUAL_SLOTS_QA__;
 const ok=(c,message)=>{if(!c)throw Error(message)};
 const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const a=p.validState('career-alice'),b=p.validState('career-bob');
 const empty=await p.listManualSlots();ok(empty.ok&&empty.value.length===3&&empty.value.every(x=>!x.occupied),'empty slots incorrect');
 const before=await p.loadManualSlot('slot-1');ok(before.ok&&before.value===null,'slot 1 not initially empty');
 const ra=await p.saveManualSlot('slot-1',a,1700000000000);ok(ra.ok&&ra.value.savedAtEpochMs===1700000000000,'slot 1 commit or timestamp invalid');
 const rb=await p.saveManualSlot('slot-2',b,1700000000099);ok(rb.ok&&rb.value.careerId==='career-bob','slot 2 commit invalid');
 const r1=await p.loadManualSlot('slot-1'),r2=await p.loadManualSlot('slot-2');
 ok(r1.ok&&eq(r1.value.state,a)&&r2.ok&&eq(r2.value.state,b),'cross-slot data corruption');
 ok(Object.isFrozen(r1.value.state)&&Object.isFrozen(r1.value.metadata),'loaded data not immutable');
 const listed=await p.listManualSlots();ok(listed.ok&&listed.value[0].metadata.careerId==='career-alice'&&listed.value[1].metadata.savedAtEpochMs===1700000000099&&!listed.value[2].occupied,'metadata list mismatch');
 for(let n=0;n<3;n++){const x=await p.loadManualSlot('slot-2'),y=await p.loadManualSlot('slot-1');ok(x.value.metadata.careerId==='career-bob'&&y.value.metadata.careerId==='career-alice','switch leaked career')}
 const newA=p.validState('career-alice-new');newA.clocks.calendar.dayIndex=65;
 const updated=await p.saveManualSlot('slot-1',newA,1700000000300);ok(updated.ok,'slot-1 update refused');
 const afterSwitch=await p.loadManualSlot('slot-2');ok(afterSwitch.ok&&eq(afterSwitch.value.state,b),'update of slot 1 changed slot 2');
 const ctrl=new AbortController();ctrl.abort();const denied=await p.saveManualSlot('slot-1',a,1700000000310,{signal:ctrl.signal});ok(!denied.ok&&denied.code==='WRITE_ABORTED','pre-aborted save accepted');
 const fake={metadata:{slotId:'slot-1',savedAtEpochMs:1700000000999,careerId:'never',fighterId:'never',schemaVersion:1},state:a};
 await p.abortRealTransaction('slot-1',fake);
 const saved=await p.loadManualSlot('slot-1');ok(saved.ok&&eq(saved.value.state,newA)&&saved.value.metadata.savedAtEpochMs===1700000000300,'real abort replaced committed slot');
 const bad=p.validState('bad');bad.random.word=999;
 const invalid=await p.saveManualSlot('slot-2',bad,1700000000400);ok(!invalid.ok&&invalid.code==='INVALID_STATE','invalid state accepted');
 const future=await p.saveManualSlot('slot-2',{...b,schemaVersion:10},1700000000400);ok(!future.ok&&future.code==='UNSUPPORTED_VERSION','future schema accepted');
 const badDate=await p.saveManualSlot('slot-2',b,-1);ok(!badDate.ok&&badDate.code==='INVALID_TIMESTAMP','bad timestamp accepted');
 const badSlot=await p.saveManualSlot('slot-10',b,1700000000400);ok(!badSlot.ok&&badSlot.code==='INVALID_SLOT','arbitrary slot accepted');
 const unsupported=await p.loadManualSlot('slot-1',p.noBrowser());ok(!unsupported.ok&&unsupported.code==='UNSUPPORTED_BROWSER','unsupported browser accepted');
 const blocked=await p.saveManualSlot('slot-1',a,1700000000400,p.throwsOpen());ok(!blocked.ok&&blocked.code==='DATABASE_ERROR','failed database open accepted');
 const last=await p.loadManualSlot('slot-2');ok(last.ok&&eq(last.value.state,b)&&last.value.metadata.savedAtEpochMs===1700000000099,'failure corrupted other slot');
 const originalAuto=await p.readAutosavedGameState();ok(originalAuto.ok&&originalAuto.value===null,'manual slots modified singleton autosave');
 await p.saveManualSlot('slot-3',p.validState('temp'),1700000000500);await p.tamper('slot-3','metadata');
 const tampered=await p.loadManualSlot('slot-3');ok(!tampered.ok&&tampered.code==='CORRUPT_STATE','tampered metadata accepted');
 const hidden=await p.listManualSlots();ok(!hidden.ok&&hidden.code==='CORRUPT_STATE','list silently hid corruption');
 await p.saveManualSlot('slot-3',p.validState('restored'),1700000000600);
 const repaired=await p.loadManualSlot('slot-3');ok(repaired.ok&&repaired.value.metadata.careerId==='restored','valid explicit overwrite failed');
 return {a:newA,b,checks:23};
}'''

def run(base,out):
 out.mkdir(parents=True,exist_ok=True);results=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for width in WIDTHS:
   context=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True)
   page=context.new_page();errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   try:
    resp=page.goto(base.rstrip('/')+'/manual-slots-qa.html',wait_until='load',timeout=30000)
    page.wait_for_function("document.documentElement.dataset.manualSlotsQaReady==='true'",timeout=30000)
    data=page.evaluate(JS)
    page.reload(wait_until='load');page.wait_for_function("document.documentElement.dataset.manualSlotsQaReady==='true'",timeout=30000)
    persisted=page.evaluate("async ()=>{const p=window.__LEGACY3_MANUAL_SLOTS_QA__;return {a:await p.loadManualSlot('slot-1'),b:await p.loadManualSlot('slot-2'),slots:await p.listManualSlots()}}")
    assert persisted['a']['ok'] and persisted['a']['value']['state']==data['a'],'slot 1 not preserved on reload'
    assert persisted['b']['ok'] and persisted['b']['value']['state']==data['b'],'slot 2 not preserved on reload'
    assert persisted['slots']['ok'] and len(persisted['slots']['value'])==3,'metadata lost on reload'
    assert resp.status==200 and not errors, f'page response/errors {resp.status} {errors}'
    doc=page.evaluate('()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth})')
    assert doc['scroll']<=doc['viewport'],'horizontal overflow'
    result={'width':width,'status':'PASS','checks':26,'real_reload':True,'errors':errors}
   except Exception as e:result={'width':width,'status':'FAIL','error':str(e),'errors':errors}
   page.screenshot(path=str(out/f'manual-slots-{width}px.png'),full_page=True)
   results.append(result);print(f'L3-030 manual slots {width}px: {result["status"]}',flush=True)
   context.close()
  browser.close()
 (out/'results.json').write_text(json.dumps({'base_url':base,'results':results},indent=2)+'\n')
 if any(x['status']!='PASS' for x in results):raise SystemExit(1)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--base-url',required=True);parser.add_argument('--out',required=True)
 args=parser.parse_args();run(args.base_url,Path(args.out))
