#!/usr/bin/env python3
"""L3-029: Real browser autosave/rollback with reload across Vite dev and preview."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

WIDTHS=(375,390,402,430)
JS=r"""async (suffix) => {
 const api=window.__LEGACY3_AUTOSAVE_QA__;
 const assert=(test,msg)=>{if(!test)throw Error(msg)};
 const databaseName='L3-029-'+suffix;
 const options={databaseName};
 const starting=api.validState();
 const empty=await api.readAutosavedGameState(options);
 assert(empty.ok&&empty.value===null,'empty DB must return null');
 const initial=await api.autosaveGameState(starting,options);
 assert(initial.ok&&initial.value.committed===true&&initial.value.schemaVersion===1,'initial save missing completion receipt');
 const before=await api.readAutosavedGameState(options);
 assert(before.ok&&JSON.stringify(before.value)===JSON.stringify(starting),'initial roundtrip mismatch');
 const updated=JSON.parse(JSON.stringify(starting));updated.clocks.calendar.dayIndex=65;updated.random.seed=222;updated.random.word=222;updated.career.careerId='updated';
 const committed=await api.autosaveGameState(updated,options);
 assert(committed.ok,'replacement did not commit');
 const after=await api.readAutosavedGameState(options);
 assert(after.ok&&JSON.stringify(after.value)===JSON.stringify(updated),'replacement invalid');
 assert(Object.isFrozen(after.value)&&Object.isFrozen(after.value.career),'loaded state must be immutable');
 const aborted=JSON.parse(JSON.stringify(updated));aborted.career.careerId='never';
 const controller=new AbortController();controller.abort();
 const cancelled=await api.autosaveGameState(aborted,{...options,signal:controller.signal});
 assert(!cancelled.ok&&cancelled.code==='WRITE_ABORTED','pre-aborted signal accepted');
 await api.explicitlyAbortRealTransaction(databaseName,aborted);
 const preserved=await api.readAutosavedGameState(options);
 assert(preserved.ok&&JSON.stringify(preserved.value)===JSON.stringify(updated),'real aborted transaction destroyed last good record');
 const bad=JSON.parse(JSON.stringify(updated));bad.clocks.calendar.dayIndex=-4;
 const invalid=await api.autosaveGameState(bad,options);
 assert(!invalid.ok&&invalid.code==='INVALID_STATE','invalid autosave accepted');
 const unsupported={...updated,schemaVersion:99};
 const denied=await api.autosaveGameState(unsupported,options);
 assert(!denied.ok&&denied.code==='UNSUPPORTED_VERSION','future schema accepted');
 const failed=await api.autosaveGameState(aborted,api.throwsOpen());
 assert(!failed.ok&&failed.code==='DATABASE_ERROR','factory failure lost');
 const noBrowser=await api.autosaveGameState(aborted,api.noBrowser());
 assert(!noBrowser.ok&&noBrowser.code==='UNSUPPORTED_BROWSER','no-browser accepted');
 const afterFailure=await api.readAutosavedGameState(options);
 assert(afterFailure.ok&&JSON.stringify(afterFailure.value)===JSON.stringify(updated),'failures changed committed state');
 return {databaseName,state:updated,checks:14};
}"""

def run(base,out):
 out.mkdir(parents=True,exist_ok=True)
 results=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for width in WIDTHS:
   context=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True)
   page=context.new_page();errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   try:
    resp=page.goto(base.rstrip('/')+'/autosave-qa.html',wait_until='load',timeout=30000)
    page.wait_for_function("document.documentElement.dataset.autosaveQaReady==='true'",timeout=25000)
    sample=page.evaluate(JS,f'{width}-{base.split("://")[-1].replace("/","-")}')
    page.reload(wait_until='load');page.wait_for_function("document.documentElement.dataset.autosaveQaReady==='true'",timeout=25000)
    loaded=page.evaluate('async (name)=>window.__LEGACY3_AUTOSAVE_QA__.readAutosavedGameState({databaseName:name})',sample['databaseName'])
    assert loaded.get('ok') and loaded['value']==sample['state'],'reload corrupted or rerolled existing state'
    assert resp.status==200 and not errors,f'browser errors {errors}'
    result={'width':width,'status':'PASS','checks':15,'reload':True,'errors':errors}
   except Exception as e: result={'width':width,'status':'FAIL','error':str(e),'errors':errors}
   page.screenshot(path=str(out/f'autosave_{width}px.png'),full_page=True)
   results.append(result)
   print(f'L3-029 AUTOSAVE {width}px: {result["status"]}',flush=True)
   context.close()
  browser.close()
 (out/'autosave-results.json').write_text(json.dumps({'base_url':base,'results':results},indent=2)+'\n')
 if any(x['status']!='PASS' for x in results): raise SystemExit(1)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--base-url',required=True);parser.add_argument('--out',required=True);a=parser.parse_args()
 run(a.base_url,Path(a.out))
