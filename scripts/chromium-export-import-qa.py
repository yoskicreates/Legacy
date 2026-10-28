#!/usr/bin/env python3
"""Real Vite development/preview Chromium import-export persistence verification, L3-031."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
WIDTHS=(375,390,402,430)
TEST=r'''async () => {
 const p=window.__LEGACY3_EXPORT_IMPORT_QA__;
 const ok=(condition,message)=>{if(!condition)throw Error(message)};
 const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const alice=p.state('alice',91,123), bob=p.state('bob',111,789);
 ok((await p.exportManualSlot('slot-1')).code==='EMPTY_SLOT','empty export did not fail');
 ok((await p.saveManualSlot('slot-1',alice,1700000000000)).ok,'failed to save alice');
 ok((await p.saveManualSlot('slot-2',bob,1700000000090)).ok,'failed to save bob');
 const exp=await p.exportManualSlot('slot-1');ok(exp.ok,'export failed');
 const exp2=await p.exportManualSlot('slot-1');ok(exp2.ok && exp.value===exp2.value,'export not deterministic');
 const archive=JSON.parse(exp.value);
 ok(archive.body.metadata.careerId==='alice'&&archive.body.state.random.seed===123,'archive lost seed/identity');
 ok(/^[a-f0-9]{64}$/.test(archive.checksum.hex),'SHA-256 malformed');
 const import3=await p.importManualSlot('slot-3',exp.value);
 ok(import3.ok&&import3.value.sourceSlotId==='slot-1'&&import3.value.targetSlotId==='slot-3','different slot import failed');
 const slot3=await p.loadManualSlot('slot-3');ok(slot3.ok&&eq(slot3.value.state,alice)&&slot3.value.metadata.savedAtEpochMs===1700000000000,'restored state mismatch');
 ok((await p.importManualSlot('slot-2',exp.value)).code==='SLOT_OCCUPIED','existing slot replaced without consent');
 const before=await p.loadManualSlot('slot-2');ok(before.ok&&eq(before.value.state,bob),'bob corrupted');
 const mutated=JSON.parse(exp.value);mutated.body.state.clocks.calendar.dayIndex+=1;
 ok((await p.importManualSlot('slot-2',JSON.stringify(mutated),{overwrite:true})).code==='CHECKSUM_MISMATCH','tampered data passed');
 const future=JSON.parse(exp.value);future.body.archiveVersion=2;
 ok((await p.importManualSlot('slot-2',JSON.stringify(future),{overwrite:true})).code==='UNSUPPORTED_ARCHIVE_VERSION','future archive accepted');
 const futureState=JSON.parse(exp.value);futureState.body.state.schemaVersion=2;
 ok((await p.importManualSlot('slot-2',JSON.stringify(futureState),{overwrite:true})).code==='UNSUPPORTED_VERSION','future state accepted');
 ok((await p.importManualSlot('slot-2','{',{overwrite:true})).code==='INVALID_ARCHIVE','invalid JSON accepted');
 const unexpected=JSON.parse(exp.value);unexpected.body.metadata.newField=123;
 ok((await p.importManualSlot('slot-2',JSON.stringify(unexpected),{overwrite:true})).code==='INVALID_ARCHIVE','extra field accepted');
 const broken=JSON.parse(exp.value);broken.body.state.random.word=0;
 ok((await p.importManualSlot('slot-2',JSON.stringify(broken),{overwrite:true})).code==='CORRUPT_STATE','corrupted RNG accepted');
 ok((await p.importManualSlot('slot-2','a'.repeat(131073),{overwrite:true})).code==='ARCHIVE_TOO_LARGE','huge archive accepted');
 const controller=new AbortController();controller.abort();
 ok((await p.importManualSlot('slot-2',exp.value,{overwrite:true,signal:controller.signal})).code==='WRITE_ABORTED','aborted overwrite not rejected');
 const after=await p.loadManualSlot('slot-2');ok(after.ok&&eq(after.value.state,bob),'rejections damaged bob');
 const fake={metadata:{slotId:'slot-2',savedAtEpochMs:100,careerId:'alice',fighterId:'fighter-alice',schemaVersion:1},state:alice};
 await p.transactionAbort('slot-2',fake);
 const afterAbort=await p.loadManualSlot('slot-2');ok(afterAbort.ok&&eq(afterAbort.value.state,bob),'aborted write destroyed bob');
 const overwrite=await p.importManualSlot('slot-2',exp.value,{overwrite:true});ok(overwrite.ok,'explicit override failed');
 const overwritten=await p.loadManualSlot('slot-2');ok(overwritten.ok&&eq(overwritten.value.state,alice),'overwrite did not commit');
 const first=await p.loadManualSlot('slot-1');ok(first.ok&&eq(first.value.state,alice),'source was mutated');
 const singleton=await p.readAutosavedGameState();ok(singleton.ok&&singleton.value===null,'singleton autosave touched');
 const list=await p.listManualSlots();ok(list.ok&&list.value.length===3&&list.value.every(v=>v.occupied),'slot listing not preserved');
 return {alice,bob,hex:archive.checksum.hex,checks:23};
}'''

def run(base,out):
 out.mkdir(parents=True,exist_ok=True)
 results=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for width in WIDTHS:
   context=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True)
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   try:
    response=page.goto(base.rstrip('/')+'/export-import-qa.html',wait_until='load',timeout=30000)
    page.wait_for_function("document.documentElement.dataset.archiveQaReady==='true'",timeout=30000)
    data=page.evaluate(TEST)
    page.reload(wait_until='load')
    page.wait_for_function("document.documentElement.dataset.archiveQaReady==='true'",timeout=30000)
    loaded=page.evaluate("async()=>{const p=window.__LEGACY3_EXPORT_IMPORT_QA__;return {a:await p.loadManualSlot('slot-1'),b:await p.loadManualSlot('slot-2'),c:await p.loadManualSlot('slot-3'),exported:await p.exportManualSlot('slot-1')}}")
    assert all(loaded[k]['ok'] for k in ['a','b','c','exported']), 'reload lost data'
    assert loaded['a']['value']['state']==data['alice'] and loaded['b']['value']['state']==data['alice'] and loaded['c']['value']['state']==data['alice'],'state mismatch post reload'
    assert json.loads(loaded['exported']['value'])['checksum']['hex']==data['hex'],'checksum changed on reload'
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'horizontal overflow'
    assert response.status==200 and not errors,f'{response.status}: {errors}'
    result={'width':width,'status':'PASS','assertions':27,'reload':True,'browser_errors':errors}
   except Exception as err:result={'width':width,'status':'FAIL','error':str(err),'browser_errors':errors}
   page.screenshot(path=str(out/f'export-import-{width}px.png'),full_page=True)
   results.append(result);print(f'L3-031 export/import {width}px {result["status"]}',flush=True)
   context.close()
  browser.close()
 (out/'results.json').write_text(json.dumps({'base_url':base,'results':results},indent=2)+'\n')
 if any(x['status']!='PASS' for x in results):raise SystemExit(1)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--base-url',required=True);p.add_argument('--out',required=True);a=p.parse_args();run(a.base_url,Path(a.out))
