#!/usr/bin/env python3
"""L3-036 actual Chromium semantic typography, mobile/reflow/zoom/safe-area smoke checks."""
import argparse, json
from pathlib import Path
from playwright.sync_api import sync_playwright
WIDTHS=(375,390,402,430)
JS=r'''()=>{
const ok=(v,m)=>{if(!v)throw Error(m)};
const q=window.__LEGACY3_TYPOGRAPHY_QA__,root=document.documentElement;
// Vite's production CSS minifier may remove leading zeroes from decimals (e.g. -.035em).
// Normalize equivalent CSS number spellings; do not relax units, roles or actual values.
const normalizedCss=v=>v.trim().replace(/(^|[^\d])(-?)\.(\d+)/g,(_all,prefix,sign,digits)=>`${prefix}${sign}0.${digits}`).replace(/\s+/g,' ');
ok(q?.version==='L3-036.V1','missing QA module');ok(q.palette==='L3-035.V1','palette regression');
ok(q.roles.length===7,'missing semantic roles');
for(const role of q.roles){
 const node=document.querySelector('.legacy-type-'+role);ok(node,'missing role '+role);
 const s=getComputedStyle(node),spec=q.scale[role];
 ok(parseFloat(s.fontSize)>=13,'small type '+role);
 ok(s.fontWeight==='750'||s.fontWeight==='800'||s.fontWeight==='700'||s.fontWeight==='550'||s.fontWeight==='400','font weight '+role);
 const line=parseFloat(s.lineHeight);ok(line>=parseFloat(s.fontSize)*1.08,'insufficient line height '+role);
 for(const [name,value] of Object.entries(spec)){
  const cssVar='--legacy-type-'+role+'-'+name.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  ok(normalizedCss(getComputedStyle(root).getPropertyValue(cssVar))===normalizedCss(value),'CSS drift '+cssVar)
 }
}
const num=document.querySelector('[data-qa="numeric"]'),style=getComputedStyle(num);
ok(style.fontVariantNumeric.includes('tabular-nums'),'numeric column alignment missing');
const testRect=node=>{const r=node.getBoundingClientRect();ok(r.width>0&&r.left>=-1&&r.right<=innerWidth+1,'clipped text '+node.textContent);};
for(const el of document.querySelectorAll('[data-qa],h1,h2,h3'))testRect(el);
ok(root.scrollWidth<=innerWidth,'horizontal overflow');
ok(document.querySelector('meta[name="viewport"]').content.includes('viewport-fit=cover'),'missing viewport safe-area');
const pad=getComputedStyle(document.querySelector('.type-shell'));
ok(parseFloat(pad.paddingLeft)>=15&&parseFloat(pad.paddingRight)>=15,'side padding missing');
return {version:q.version,roles:q.roles.length,colors:q.palette,body:parseFloat(getComputedStyle(document.querySelector('.legacy-type-body')).fontSize),assertions:24};
}'''
def run(base,out):
 out.mkdir(parents=True,exist_ok=True); results=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True)
  for width in WIDTHS:
   ctx=browser.new_context(viewport={'width':width,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
   page=ctx.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   try:
    response=page.goto(base.rstrip('/')+'/typography-qa.html',wait_until='load',timeout=45000)
    page.wait_for_function("document.documentElement.dataset.typographyQaReady==='true'",timeout=30000)
    first=page.evaluate(JS)
    page.reload(wait_until='load');page.wait_for_function("document.documentElement.dataset.typographyQaReady==='true'",timeout=30000)
    second=page.evaluate(JS);assert first==second,'non-deterministic reload'
    # text-only zoom emulation at 200% while keeping the viewport CSS width unchanged
    page.evaluate("document.documentElement.style.fontSize='32px'")
    reflow=page.evaluate('''() => ({scrollWidth:document.documentElement.scrollWidth, viewport:innerWidth, bodySize:parseFloat(getComputedStyle(document.querySelector('.legacy-type-body')).fontSize),longRight:document.querySelector('[data-qa="long-label"]').getBoundingClientRect().right})''')
    assert reflow['scrollWidth']<=width and reflow['longRight']<=width+1 and reflow['bodySize']>=32,f'text resize overflow {reflow}'
    assert response.status==200 and not errors,repr(errors)
    page.evaluate("document.documentElement.style.fontSize='16px'")
    result={'width':width,'status':'PASS','assertions':26,'details':first,'text_resize':reflow}
   except Exception as e: result={'width':width,'status':'FAIL','error':str(e),'page_errors':errors}
   page.screenshot(path=str(out/f'typography-{width}px.png'),full_page=True)
   results.append(result); print(f'Typography {width}px: {result["status"]}',flush=True);ctx.close()
  browser.close()
 (out/'results.json').write_text(json.dumps({'url':base,'results':results},indent=2)+'\n')
 if any(r['status']!='PASS' for r in results): raise SystemExit(1)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--base-url',required=True);p.add_argument('--out',required=True);a=p.parse_args();run(a.base_url,Path(a.out))
