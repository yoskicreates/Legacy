#!/usr/bin/env python3
"""L3-037 mobile Chromium safe-area QA: simulated inset scenarios, real CSS layout.
Note: Chromium emulation is NOT physical iPhone Safari validation.
"""
import argparse, json
from pathlib import Path
from playwright.sync_api import sync_playwright
WIDTHS=(375,390,402,430)
SCENARIOS=('neutral','notch','island','landscape')
PROBE=r'''(name)=>{
const fail=(s)=>{throw Error(s)};const ok=(v,m)=>{if(!v)fail(m)};
const host=document.getElementById('safe-area-demo');const api=window.__LEGACY3_SAFE_AREA_QA__;ok(api?.version==='L3-037.V1','missing safe area contract');
ok(host.classList.contains('legacy-safe-shell'),'missing shared shell class');
ok(host.dataset.simulatedInsets===name,'scenario not applied');
const expected=api.scenarios[name],css=getComputedStyle(host),root=document.documentElement;
const insets=['top','right','bottom','left'].map(s=>Number.parseFloat(expected[s]));
const pads=[css.paddingTop,css.paddingRight,css.paddingBottom,css.paddingLeft].map(x=>Number.parseFloat(x));
for(let i=0;i<4;i++)ok(pads[i]>=insets[i]+7,`insufficient safe padding ${i}: ${pads[i]} vs ${insets[i]}`);
ok(root.scrollWidth<=window.innerWidth+1,`horizontal overflow: ${root.scrollWidth}/${innerWidth}`);
for(const el of host.querySelectorAll('button,[data-safe-edge],h1')){
 const box=el.getBoundingClientRect();ok(box.width>0&&box.left>=-1&&box.right<=innerWidth+1,'clipped horizontal '+el.textContent.trim().slice(0,30));
}
for(const button of host.querySelectorAll('button'))ok(button.getBoundingClientRect().height>=44,'undersized touch target');
ok(getComputedStyle(host).minHeight!=='0px','no viewport height');
ok(document.querySelector('meta[name="viewport"]')?.content.includes('viewport-fit=cover'),'viewport fit missing');
const active=host.querySelectorAll('button[aria-pressed="true"]');ok(active.length===1&&active[0].dataset.safeScenario===name,'inconsistent scenario button');
const status=document.getElementById('safe-area-status').textContent;ok(status.includes('Simulated')&&status.includes('not measured from an iPhone'),'missing simulation disclosure');
return {name, pads, insets, w:innerWidth, landscape:innerWidth>innerHeight};
}'''
def run(base,out):
 out.mkdir(parents=True,exist_ok=True);results=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for width in WIDTHS:
   ctx=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True,device_scale_factor=3)
   page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   try:
    response=page.goto(base.rstrip('/')+'/safe-area-qa.html',wait_until='load',timeout=45000)
    page.wait_for_function("document.documentElement.dataset.safeAreaReady==='true'",timeout=30000)
    ok=[]
    for name in SCENARIOS:
     page.evaluate('(name)=>window.__LEGACY3_SAFE_AREA_QA__.setScenario(name)',name)
     ok.append(page.evaluate(PROBE,name))
    page.reload(wait_until='load');page.wait_for_function("document.documentElement.dataset.safeAreaReady==='true'",timeout=30000)
    ok.append(page.evaluate(PROBE,'island'))
    page.evaluate("document.documentElement.style.fontSize='32px'")
    page.evaluate('(name)=>window.__LEGACY3_SAFE_AREA_QA__.setScenario(name)','island')
    ok.append(page.evaluate(PROBE,'island'))
    page.screenshot(path=str(out/f'safe-area-portrait-{width}px.png'),full_page=True)
    page.evaluate("document.documentElement.style.fontSize='' ")
    page.set_viewport_size({'width':844,'height':width})
    page.evaluate('(name)=>window.__LEGACY3_SAFE_AREA_QA__.setScenario(name)','landscape')
    ok.append(page.evaluate(PROBE,'landscape'))
    page.locator('#safe-footer-action').scroll_into_view_if_needed()
    foot=page.locator('#safe-footer-action').bounding_box();assert foot and foot['x']>=0 and foot['x']+foot['width']<=844,'landscape bottom action clipped'
    page.screenshot(path=str(out/f'safe-area-landscape-{width}px.png'),full_page=True)
    assert response.status==200 and not errors,errors
    results.append({'width':width,'status':'PASS','scenarios':len(ok),'assertions':len(ok)*13,'orientation':'portrait+landscape'})
   except Exception as e:
    results.append({'width':width,'status':'FAIL','error':str(e),'page_errors':errors})
    page.screenshot(path=str(out/f'safe-area-failure-{width}px.png'),full_page=True)
   print(f'Safe area {width}px: {results[-1]["status"]}',flush=True)
   ctx.close()
  browser.close()
 (out/'results.json').write_text(json.dumps({'base_url':base,'simulated_only':True,'physical_iphone_safari':'NOT_RUN','results':results},indent=2)+'\n')
 if any(r['status']!='PASS' for r in results):raise SystemExit(1)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--base-url',required=True);parser.add_argument('--out',required=True);a=parser.parse_args();run(a.base_url,Path(a.out))
