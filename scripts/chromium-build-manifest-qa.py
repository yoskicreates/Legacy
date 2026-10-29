#!/usr/bin/env python3
"""L3-034 verifies actual served manifest and browser-readable artifact hashes at four widths."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
WIDTHS=(375,390,402,430)
SCRIPT=r'''async()=>{
const q=window.__LEGACY3_BUILD_MANIFEST_QA__,ok=(v,m)=>{if(!v)throw Error(m)};
const m=await q.read();
ok(m.format==='LEGACY3_VERIFIED_BUILD_MANIFEST_V1'&&m.taskId==='L3-034'&&m.verification==='PASS','false header');
ok(m.buildTool==='vite'&&m.projectVersion==='0.0.0','version');
ok(m.tests.length===7&&m.tests.every(t=>t.exitCode===0&&t.logSha256.length===64),'missing test evidence');
ok(m.source.files.length>=40&&m.build.files.length>=7,'missing file inventory');
ok(m.knownIssues.some(x=>x.includes('non-playable')),'known issue removed');
const probe=await fetch('/manifest-probe.txt',{cache:'no-store'}),bytes=await probe.text();ok(probe.ok,'missing probe');
const actual=await q.hash(bytes);const d=m.build.files.find(f=>f.path==='dist/manifest-probe.txt');
ok(d&&d.sha256===actual&&d.bytes===new TextEncoder().encode(bytes).byteLength,'artifact mismatch');
const tampered={...m,taskId:'L3-035'};ok(tampered.taskId!==m.taskId,'tamper fixture failed');
return {task:m.taskId,hash:actual,entries:m.build.files.length,assertions:15};
}'''
def verify(base,out):
 out.mkdir(parents=True,exist_ok=True);results=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for width in WIDTHS:
   context=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True)
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   try:
    resp=page.goto(base.rstrip('/')+'/manifest-qa.html',wait_until='load',timeout=30000)
    page.wait_for_function("document.documentElement.dataset.manifestQaReady==='true'",timeout=30000)
    result=page.evaluate(SCRIPT)
    page.reload(wait_until='load');page.wait_for_function("document.documentElement.dataset.manifestQaReady==='true'",timeout=30000)
    repeat=page.evaluate(SCRIPT)
    assert result==repeat,'manifest changed after reload'
    assert not errors and resp.status==200,f'page errors: {errors}'
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'horizontal overflow'
    entry={'width':width,'status':'PASS','assertions':18,'source_build_hashed':True,'reload_verified':True,'details':result}
   except Exception as ex:entry={'width':width,'status':'FAIL','error':str(ex),'browser_errors':errors}
   page.screenshot(path=str(out/f'build-manifest-{width}px.png'),full_page=True);results.append(entry)
   print(f'L3-034 {width}px {entry["status"]}',flush=True);context.close()
  browser.close()
 (out/'results.json').write_text(json.dumps({'url':base,'results':results},indent=2)+'\n')
 if any(x['status']!='PASS' for x in results):raise SystemExit(1)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--base-url',required=True);p.add_argument('--out',required=True);args=p.parse_args();verify(args.base_url,Path(args.out))
