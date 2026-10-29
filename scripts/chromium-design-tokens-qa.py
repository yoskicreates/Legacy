#!/usr/bin/env python3
"""L3-035: real mobile Chromium palette, contrast, interactions and safe-area QA."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
WIDTHS=(375,390,402,430)
JS=r'''()=>{
const root=document.documentElement,q=window.__LEGACY3_DESIGN_TOKENS_QA__,styles=getComputedStyle(root),ok=(v,m)=>{if(!v)throw Error(m)};
ok(q&&q.version==='L3-035.V1','missing token API');
ok(q.pairs.length>=12&&q.check()===true,'inadequate contrast');
for(const [f,b] of q.pairs){ok(q.contrast(q.colors[f],q.colors[b])>=4.5,`contrast ${f} on ${b}`)}
for(const [k,v] of Object.entries(q.colors))ok(styles.getPropertyValue('--legacy-'+k).trim().toLowerCase()===v.toLowerCase(),`CSS drift ${k}`);
const btn=document.getElementById('contrast-check'),status=document.getElementById('contrast-result');ok(btn&&status,'no action');btn.click();ok(status.dataset.contrastStatus==='pass'&&status.textContent.includes('PASS:'),'broken interactive check');
ok(root.scrollWidth<=innerWidth,'horizontal overflow');ok(document.querySelector('meta[name="viewport"]').content.includes('viewport-fit=cover'),'safe area meta');
const shell=document.querySelector('.token-shell'),sc=getComputedStyle(shell);ok(sc.paddingLeft!=='0px'&&sc.paddingRight!=='0px'&&sc.paddingBottom!=='0px','missing safe insets');
const rect=btn.getBoundingClientRect();ok(rect.left>=-1&&rect.right<=innerWidth+1&&rect.height>=44,'button clipped or too short');
return {version:q.version,pairs:q.pairs.length,semantic:Object.keys(q.colors).length,assertions:25}
}'''
def check(base,out):
 out.mkdir(parents=True,exist_ok=True);rows=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for w in WIDTHS:
   ctx=browser.new_context(viewport={'width':w,'height':844},is_mobile=True,has_touch=True,device_scale_factor=3)
   page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   try:
    response=page.goto(base.rstrip('/')+'/design-tokens-qa.html',wait_until='load',timeout=30000)
    page.wait_for_function("document.documentElement.dataset.designTokenQaReady==='true'",timeout=30000)
    result=page.evaluate(JS)
    page.reload(wait_until='load');page.wait_for_function("document.documentElement.dataset.designTokenQaReady==='true'",timeout=30000)
    repeat=page.evaluate(JS);assert repeat==result,'nondeterministic token preview';assert not errors and response.status==200,repr(errors)
    row={'width':w,'status':'PASS','assertions':27,'result':result}
   except Exception as e:row={'width':w,'status':'FAIL','error':str(e),'browser_errors':errors}
   page.screenshot(path=str(out/f'design-tokens-{w}px.png'),full_page=True);rows.append(row);print(f'Design tokens {w}px: {row["status"]}',flush=True);ctx.close()
  browser.close()
 (out/'results.json').write_text(json.dumps({'url':base,'results':rows},indent=2)+'\n')
 if any(x['status']!='PASS' for x in rows):raise SystemExit(1)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--base-url',required=True);p.add_argument('--out',required=True);args=p.parse_args();check(args.base_url,Path(args.out))
