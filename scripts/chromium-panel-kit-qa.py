#!/usr/bin/env python3
"""L3-041: real Chromium QA for standalone kit, both themes, safe area and keyboard."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
WIDTHS=(375,390,402,430)
CHECK=r'''() => {
const root=document.querySelector('.legacy-kit'), cards=[...document.querySelectorAll('[data-kit-component]')];
const rects=[...document.querySelectorAll('.legacy-kit button')].map(n=>n.getBoundingClientRect());
return {ready:document.documentElement.dataset.panelKitReady,version:root?.dataset.panelKitVersion,theme:root?.dataset.kitTheme,
 noOverflow:document.documentElement.scrollWidth<=innerWidth+1,
 noClipped:rects.every(r=>r.left>=-1&&r.right<=innerWidth+1),
 noTiny:rects.every(r=>r.height>=44),
 count:cards.length,types:cards.map(c=>c.dataset.kitComponent),
 listItems:document.querySelectorAll('.legacy-kit-list li').length,
 dl:document.querySelectorAll('.legacy-kit-stat dl dt').length,
 cardHeadings:document.querySelectorAll('.legacy-kit h2').length,
 actionDescription: (()=>{const tile=document.querySelector('.legacy-kit-action');const id=tile?.getAttribute('aria-describedby');const target=id&&document.getElementById(id);return Boolean(id&&target&&tile.contains(target)&&target.textContent?.includes('does not change game state'));})(),
 sliders:document.querySelectorAll('input[type="range"],[role="slider"]').length,
 shadow:getComputedStyle(root).backgroundColor,
 buttonContrast:[...document.querySelectorAll('.legacy-kit button')].map(b=>({fg:getComputedStyle(b).color,bg:getComputedStyle(b).backgroundColor})),
 foregrounds:[...document.querySelectorAll('.legacy-kit-eyebrow,.legacy-kit-heading,.legacy-kit-description,.legacy-kit-value,.legacy-kit-action-title,.legacy-kit-list-title,.legacy-kit-status')].map(n=>({fg:getComputedStyle(n).color,bg:getComputedStyle(n.closest('.legacy-kit-card')||root).backgroundColor}))
};
}'''
def rgb(s):
 import re
 values=list(map(float,re.findall(r'[\d.]+',s)[:3]));return values

def contrast(fg,bg):
 a,b=rgb(fg),rgb(bg)
 def l(v):
  out=[(x/255/12.92 if x/255<=0.04045 else ((x/255+0.055)/1.055)**2.4) for x in v]
  return .2126*out[0]+.7152*out[1]+.0722*out[2]
 x,y=l(a),l(b);return (max(x,y)+.05)/(min(x,y)+.05)

def check(page,theme):
 v=page.evaluate(CHECK)
 assert v['ready']=='true' and v['version']=='L3-041.V1',v
 assert v['theme']==theme and v['noOverflow'] and v['noClipped'] and v['noTiny'],v
 assert v['count']==4 and set(v['types'])=={'text','stat','action','list'},v
 assert v['listItems']==3 and v['dl']==1 and v['cardHeadings']>=2 and v['sliders']==0 and v['actionDescription'],v
 for row in v['buttonContrast']+v['foregrounds']:
  assert contrast(row['fg'],row['bg'])>=4.5,(theme,row,contrast(row['fg'],row['bg']))
 return 12+len(v['buttonContrast'])+len(v['foregrounds'])

def run(base,out):
 out.mkdir(parents=True,exist_ok=True);rows=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for width in WIDTHS:
   ctx=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
   page=ctx.new_page();errors=[];page.on('pageerror',lambda exc:errors.append(str(exc)));count=0
   try:
    rsp=page.goto(base.rstrip('/')+'/panel-kit-qa.html',wait_until='load',timeout=45000)
    page.wait_for_function("document.documentElement.dataset.panelKitReady==='true'")
    assert rsp.status==200
    for theme in ['dark','light']:
     page.locator('#kit-theme-'+theme).click();assert page.locator('#kit-theme-'+theme).get_attribute('aria-pressed')=='true';count+=1
     count+=check(page,theme)
     page.screenshot(path=str(out/f'panel-kit-{theme}-{width}.png'),full_page=True)
    page.locator('[data-kit-component="action"]').focus()
    page.keyboard.press('Tab');page.keyboard.press('Shift+Tab')
    assert page.locator('[data-kit-component="action"]').evaluate('(n)=>n===document.activeElement')
    assert page.locator('[data-kit-component="action"]').evaluate('(n)=>getComputedStyle(n).outlineStyle')!='none';count+=2
    page.keyboard.press('Enter')
    assert page.locator('#kit-action-result').get_attribute('data-activation-count')=='1';count+=1
    page.keyboard.press('Space')
    assert page.locator('#kit-action-result').get_attribute('data-activation-count')=='2';count+=1
    page.evaluate("document.documentElement.style.fontSize='32px'")
    count+=check(page,'light')
    page.evaluate("document.documentElement.style.fontSize=''")
    page.locator('.legacy-kit').evaluate("n=>{n.style.setProperty('--legacy-safe-left','47px');n.style.setProperty('--legacy-safe-right','47px');n.style.setProperty('--legacy-safe-bottom','34px')}")
    count+=check(page,'light')
    page.set_viewport_size({'width':844,'height':width});count+=check(page,'light')
    page.screenshot(path=str(out/f'panel-kit-light-landscape-{width}.png'),full_page=True)
    page.reload(wait_until='load');page.wait_for_function("document.documentElement.dataset.panelKitReady==='true'")
    assert page.locator('#kit-action-result').get_attribute('data-activation-count')=='0'
    assert page.locator('.legacy-kit').get_attribute('data-kit-theme')=='dark';count+=2
    assert not errors,errors
    row={'width':width,'status':'PASS','assertions':count,'browser_errors':errors}
   except Exception as exc:
    row={'width':width,'status':'FAIL','error':str(exc),'browser_errors':errors}
    page.screenshot(path=str(out/f'panel-kit-FAIL-{width}.png'),full_page=True)
   rows.append(row);print('L3-041',width,row['status'],flush=True);ctx.close()
  browser.close()
 (out/'results.json').write_text(json.dumps({'physical_iphone_safari':'NOT_RUN','simulated_safe_area_only':True,'results':rows},indent=2)+'\n')
 if any(r['status']!='PASS' for r in rows):raise SystemExit(1)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--base-url',required=True);parser.add_argument('--out',required=True)
 a=parser.parse_args();run(a.base_url,Path(a.out))
