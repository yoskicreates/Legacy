#!/usr/bin/env python3
"""L3-040: genuine Chromium Vite dev/preview, not physical iPhone Safari."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
WIDTHS=(375,390,402,430)
STEPS={
 'career':('career-rankings','career-ranking-rules'),
 'fighter':('fighter-attributes','fighter-attribute-guide'),
 'fight':('fight-matchups','fight-matchup-details'),
 'life':('life-relationships','life-relationship-details'),
 'finances':('finances-budget','finances-budget-details'),
}
PROBE='''() => {
 const n=document.querySelector('.legacy-bottom-nav');
 const targets=[...document.querySelectorAll('.legacy-route-preview button,.legacy-bottom-nav button')];
 const boxes=targets.map(el=>el.getBoundingClientRect());
 const box=n?.getBoundingClientRect();
 return {ready:document.documentElement.dataset.jsReady,overflow:document.documentElement.scrollWidth>innerWidth+1,
  clipped:boxes.some(r=>r.left< -1||r.right>innerWidth+1||r.width<1),
  undersized:boxes.some(r=>r.height<44),navbar:!!box&&box.top>=-1&&box.bottom<=innerHeight+1,
  count:document.querySelectorAll('.legacy-bottom-nav button').length,renderer:!!document.querySelector('#renderer-root')};
}'''
def layout(page):
 value=page.evaluate(PROBE)
 assert value['ready']=='true' and not value['overflow'] and not value['clipped'] and not value['undersized'] and value['navbar'] and value['renderer'] and value['count']==5,value

def run(base,out):
 out.mkdir(parents=True,exist_ok=True)
 results=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for width in WIDTHS:
   context=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
   page=context.new_page();errors=[];checks=0
   page.on('pageerror',lambda e:errors.append(str(e)))
   try:
    response=page.goto(base.rstrip('/')+'/',wait_until='load',timeout=45000)
    page.wait_for_function("document.documentElement.dataset.jsReady==='true'")
    assert response.status==200
    layout(page);checks+=8
    for tab,(level1,level2) in STEPS.items():
     page.locator('#nav-'+tab).click()
     page.locator('[data-detail-page="root"]').wait_for();checks+=1
     page.locator('#detail-open-'+level1).click()
     page.locator(f'[data-detail-page="{level1}"]').wait_for()
     assert page.locator('.legacy-breadcrumbs [aria-current="location"]').count()==1
     assert page.locator('#page-title').evaluate('(e)=>e===document.activeElement')
     layout(page);checks+=9
     page.locator('#detail-open-'+level2).click()
     page.locator(f'[data-detail-page="{level2}"]').wait_for()
     assert page.locator('.legacy-breadcrumbs .legacy-crumb').count()==3
     assert page.locator('#page-title').evaluate('(e)=>e===document.activeElement')
     layout(page);checks+=10
     page.screenshot(path=str(out/f'nested-{tab}-{width}.png'),full_page=True)
     page.locator('#nav-back').click()
     assert page.locator(f'[data-detail-page="{level1}"]').count()==1
     page.locator('#nav-forward').click()
     assert page.locator(f'[data-detail-page="{level2}"]').count()==1
     checks+=2
     page.locator('#detail-crumb-'+level1).click()
     assert page.locator(f'[data-detail-page="{level1}"]').count()==1
     page.locator('#detail-crumb-root').click()
     assert page.locator('[data-detail-page="root"]').count()==1
     checks+=2
     page.locator('#nav-forward').click()
     assert page.locator(f'[data-detail-page="{level1}"]').count()==1
     checks+=1
    page.locator('#nav-career').click()
    assert page.locator('[data-detail-page="career-rankings"]').count()==1;checks+=1
    page.locator('#nav-fight').click()
    assert page.locator('[data-detail-page="fight-matchups"]').count()==1;checks+=1
    page.locator('#nav-life').click()
    assert page.locator('[data-detail-page="life-relationships"]').count()==1;checks+=1
    page.locator('#nav-home').click()
    assert page.locator('.legacy-home[data-current-route="home"]').count()==1
    assert page.locator('#home-start').is_visible();checks+=2
    page.locator('#nav-finances').click()
    page.locator('#detail-crumb-root').click()
    page.locator('#detail-open-finances-budget').focus()
    page.keyboard.press('Shift+Tab');page.keyboard.press('Tab')
    assert page.evaluate('document.activeElement.id')=='detail-open-finances-budget'
    assert page.locator('#detail-open-finances-budget').evaluate('(e)=>getComputedStyle(e).outlineStyle')!='none'
    page.keyboard.press('Enter')
    page.locator('[data-detail-page="finances-budget"]').wait_for();checks+=4
    page.locator('#detail-crumb-root').focus()
    page.keyboard.press('Shift+Tab');page.keyboard.press('Tab')
    assert page.evaluate('document.activeElement.id')=='detail-crumb-root'
    assert page.locator('#detail-crumb-root').evaluate('(e)=>getComputedStyle(e).outlineStyle')!='none'
    page.keyboard.press('Enter')
    assert page.locator('[data-detail-page="root"]').count()==1;checks+=3
    page.evaluate("document.documentElement.style.fontSize='32px'")
    layout(page);checks+=8
    page.evaluate("document.documentElement.style.fontSize='' ")
    page.evaluate("document.querySelector('#app').style.setProperty('--legacy-safe-bottom','34px')")
    page.evaluate("document.querySelector('#app').style.setProperty('--legacy-safe-top','59px')")
    layout(page);checks+=8
    page.set_viewport_size({'width':844,'height':width})
    page.evaluate("document.querySelector('#app').style.setProperty('--legacy-safe-left','47px')")
    page.evaluate("document.querySelector('#app').style.setProperty('--legacy-safe-right','47px')")
    page.locator('#detail-open-finances-budget').click()
    layout(page);checks+=8
    page.screenshot(path=str(out/f'nested-landscape-{width}.png'),full_page=True)
    page.reload(wait_until='load')
    page.wait_for_function("document.documentElement.dataset.jsReady==='true'")
    assert page.locator('[data-current-route="home"]').count()==1
    layout(page);checks+=8
    assert not errors,errors
    results.append({'width':width,'status':'PASS','assertions':checks,'browser_exceptions':errors})
   except Exception as exc:
    results.append({'width':width,'status':'FAIL','error':str(exc),'browser_exceptions':errors})
    page.screenshot(path=str(out/f'nested-FAIL-{width}.png'),full_page=True)
   print('L3-040',width,results[-1]['status'],flush=True)
   context.close()
  browser.close()
 (out/'results.json').write_text(json.dumps({'base_url':base,'physical_iphone_safari':'NOT_RUN','simulated_insets_only':True,'results':results},indent=2)+'\n')
 if any(r['status']!='PASS' for r in results):raise SystemExit(1)
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--base-url',required=True);ap.add_argument('--out',required=True)
 args=ap.parse_args();run(args.base_url,Path(args.out))
