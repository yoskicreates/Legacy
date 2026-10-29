#!/usr/bin/env python3
"""L3-039 real Vite/Chromium UI acceptance; emulation is not physical Safari."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
WIDTHS=(375,390,402,430)
IDS=('career','fighter','fight','life','finances')
ROUTES=('career','character','fight','social','economy')
PROBE='''() => {
 const buttons=[...document.querySelectorAll('button')];
 const targets=[...buttons,document.getElementById('page-title')].filter(Boolean).map(el=>el.getBoundingClientRect());
 return {overflow:document.documentElement.scrollWidth>innerWidth+1,
 clipped:targets.some(r=>r.width<1||r.left< -1||r.right>innerWidth+1),
 undersized:buttons.some(el=>el.getBoundingClientRect().height<44),
 navCount:document.querySelectorAll('.legacy-bottom-nav button').length,
 navFixed:getComputedStyle(document.querySelector('.legacy-bottom-nav')).position==='fixed',
 navInViewport:(()=>{const box=document.querySelector('.legacy-bottom-nav').getBoundingClientRect();return box.top>=-1 && box.bottom<=innerHeight+1})(),
 ready:document.querySelector('#menu-root')?.dataset.uiMounted,
 renderer:!!document.querySelector('#renderer-root'),
 viewport:document.querySelector('meta[name="viewport"]')?.content.includes('viewport-fit=cover')};
}'''
def assert_layout(page):
 state=page.evaluate(PROBE)
 assert not state['overflow'] and not state['clipped'] and not state['undersized'],state
 assert state['navCount']==5 and state['navFixed'] and state['navInViewport'] and state['ready']=='true' and state['renderer'] and state['viewport'],state

def run(base,out):
 out.mkdir(parents=True,exist_ok=True)
 results=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for width in WIDTHS:
   context=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
   page=context.new_page();errors=[];checks=0
   page.on('pageerror',lambda e: errors.append(str(e)))
   try:
    resp=page.goto(base.rstrip('/')+'/',wait_until='load',timeout=45000)
    page.wait_for_function("document.documentElement.dataset.jsReady==='true'")
    assert resp.status==200
    assert page.locator('.legacy-home[data-current-route="home"]').count()==1
    assert_layout(page);checks+=8
    page.screenshot(path=str(out/f'bottom-home-{width}.png'),full_page=True)
    for tab,route in zip(IDS,ROUTES):
     page.locator('#nav-'+tab).click()
     page.locator(f'[data-route-preview="{tab}"][data-route-id="{route}"]').wait_for()
     assert page.locator('#nav-'+tab).get_attribute('aria-current')=='page'
     assert page.locator('[aria-current="page"]').count()==1
     assert page.locator('#nav-panel-description').inner_text()
     assert 'Navigation only' in page.locator('.legacy-route-preview').inner_text()
     assert_layout(page);checks+=9
     page.screenshot(path=str(out/f'bottom-{tab}-{width}.png'),full_page=True)
    page.locator('#nav-back').click()
    assert page.locator('[data-route-preview="life"]').count()==1;checks+=1
    page.locator('#nav-back').click()
    assert page.locator('[data-route-preview="fight"]').count()==1;checks+=1
    page.locator('#nav-forward').click()
    assert page.locator('[data-route-preview="life"]').count()==1;checks+=1
    page.locator('#nav-career').click()
    assert page.locator('#nav-forward').is_disabled();checks+=1
    page.locator('#nav-home').click()
    assert page.locator('.legacy-home[data-current-route="home"]').count()==1
    assert page.locator('#home-start').is_visible()
    assert_layout(page);checks+=8
    for tab in IDS:
     button=page.locator('#nav-'+tab)
     button.focus()
     page.keyboard.press('Shift+Tab');page.keyboard.press('Tab')
     assert page.evaluate('document.activeElement.id')=='nav-'+tab
     assert button.evaluate('(el)=>getComputedStyle(el).outlineStyle')!='none'
     page.keyboard.press('Enter')
     page.wait_for_function("document.activeElement?.id==='page-title'")
     assert_layout(page);checks+=5
    page.locator('#nav-home').click()
    assert page.locator('#home-start').is_visible()
    page.locator('#home-start').click()
    assert page.locator('[data-panel="start"]').count()==1
    page.locator('#home-back').click()
    assert page.locator('.legacy-home[data-home-view="home"]').count()==1
    page.locator('#check-button').click()
    assert page.locator('#check-button').get_attribute('aria-pressed')=='true'
    assert_layout(page);checks+=8
    page.evaluate("document.documentElement.style.fontSize='32px'")
    page.locator('#nav-finances').click()
    assert_layout(page);checks+=8
    page.locator('#nav-home').click()
    assert_layout(page);checks+=8
    page.evaluate("document.documentElement.style.fontSize='' ")
    page.evaluate("document.querySelector('#app').style.setProperty('--legacy-safe-bottom','34px')")
    page.evaluate("document.querySelector('#app').style.setProperty('--legacy-safe-top','59px')")
    assert_layout(page);checks+=8
    page.set_viewport_size({'width':844,'height':width})
    page.evaluate("document.querySelector('#app').style.setProperty('--legacy-safe-left','47px')")
    page.evaluate("document.querySelector('#app').style.setProperty('--legacy-safe-right','47px')")
    page.locator('#nav-life').click()
    assert_layout(page);checks+=8
    page.screenshot(path=str(out/f'bottom-landscape-{width}.png'),full_page=True)
    page.reload(wait_until='load')
    page.wait_for_function("document.documentElement.dataset.jsReady==='true'")
    assert page.locator('[data-current-route="home"]').count()==1
    assert_layout(page);checks+=8
    assert not errors,errors
    results.append({'width':width,'status':'PASS','assertions':checks,'browser_exceptions':errors})
   except Exception as ex:
    results.append({'width':width,'status':'FAIL','error':str(ex),'browser_exceptions':errors})
    page.screenshot(path=str(out/f'bottom-FAIL-{width}.png'),full_page=True)
   print('L3-039',width,results[-1]['status'],flush=True)
   context.close()
  browser.close()
 (out/'results.json').write_text(json.dumps({'base_url':base,'physical_iphone_safari':'NOT_RUN','simulated_insets_only':True,'results':results},indent=2)+'\n')
 if any(x['status']!='PASS' for x in results):raise SystemExit(1)
if __name__=='__main__':
 arg=argparse.ArgumentParser();arg.add_argument('--base-url',required=True);arg.add_argument('--out',required=True)
 a=arg.parse_args();run(a.base_url,Path(a.out))
