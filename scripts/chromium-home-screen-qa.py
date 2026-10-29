#!/usr/bin/env python3
"""L3-038 real Chromium home UI checks; mobile viewports are NOT physical Safari."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

WIDTHS = (375, 390, 402, 430)
ACTIONS = ('start', 'continue', 'settings')
PROBE = '''() => {
  const root = document.documentElement, el = document.querySelector('.legacy-home');
  const buttons = [...document.querySelectorAll('button')];
  const boxes = [...buttons,document.querySelector('#page-title')].filter(Boolean).map(x=>x.getBoundingClientRect());
  return {
    overflow: root.scrollWidth > innerWidth + 1,
    clipped: boxes.some(x => x.width < 1 || x.left < -1 || x.right > innerWidth + 1),
    undersized: buttons.some(x=>x.getBoundingClientRect().height<44),
    view:el?.dataset.homeView,
    host:document.querySelector('#menu-root')?.dataset.uiMounted,
    rendered:document.querySelector('#renderer-root')!==null,
    viewportFit:document.querySelector('meta[name="viewport"]')?.content.includes('viewport-fit=cover'),
  };
}'''

def assert_layout(page):
    value=page.evaluate(PROBE)
    assert value['view'] in ('home',*ACTIONS),f'invalid view: {value}'
    assert not value['overflow'] and not value['clipped'] and not value['undersized'],f'bad layout: {value}'
    assert value['host']=='true' and value['rendered'] and value['viewportFit'],f'lost foundation: {value}'
    return value

def run(base,out):
    out.mkdir(parents=True,exist_ok=True)
    results=[]
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True)
        for width in WIDTHS:
            context=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True,device_scale_factor=3)
            page=context.new_page()
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            assertions=0
            try:
                response=page.goto(base.rstrip('/')+'/',wait_until='load',timeout=45000)
                page.wait_for_function("document.documentElement.dataset.jsReady==='true'",timeout=30000)
                assert response is not None and response.status==200
                assert page.title()=='LEGACY 3.0 | Home Screen Foundation'
                assert_layout(page);assertions+=10
                assert page.locator('#home-start').is_visible()
                assert page.locator('#home-continue').is_visible()
                assert page.locator('#home-settings').is_visible()
                assert page.locator('#page-title').count()==1
                assertions+=4
                page.screenshot(path=str(out/f'home-portrait-{width}px.png'),full_page=True)
                for action in ACTIONS:
                    page.locator('#home-'+action).click()
                    page.locator('[data-panel="'+action+'"]').wait_for()
                    assert page.locator('#home-panel-description').count()==1
                    positions=page.evaluate('''() => {const back=document.querySelector('#home-back').getBoundingClientRect();const label=document.querySelector('.legacy-home-panel .legacy-home-kicker').getBoundingClientRect();return {backBottom:back.bottom,labelTop:label.top}}''')
                    assert positions['labelTop'] >= positions['backBottom'],f'back button overlaps panel label: {positions}'
                    assert page.locator('#home-panel-description').inner_text().strip()
                    assert 'No game or save state is changed' in page.locator('[data-panel="'+action+'"]').inner_text()
                    assert_layout(page);assertions+=10
                    page.screenshot(path=str(out/f'home-{action}-{width}px.png'),full_page=True)
                    page.locator('#home-back').click()
                    assert page.locator('.legacy-home[data-home-view="home"]').count()==1
                    assert_layout(page);assertions+=6
                # Keyboard navigation must follow replaced content and return to its trigger.
                for action in ACTIONS:
                    button=page.locator('#home-'+action)
                    button.focus()
                    page.keyboard.press('Shift+Tab')
                    page.keyboard.press('Tab')
                    assert page.evaluate('document.activeElement.id')=='home-'+action
                    outline=button.evaluate('(el)=>getComputedStyle(el).outlineStyle')
                    assert outline != 'none',f'missing keyboard focus ring: {action}'
                    page.keyboard.press('Enter')
                    page.wait_for_function("document.activeElement?.id==='page-title'")
                    assert page.locator('#page-title').get_attribute('tabindex')=='-1'
                    page.keyboard.press('Shift+Tab')
                    assert page.evaluate('document.activeElement.id')=='home-back'
                    page.keyboard.press('Space')
                    page.wait_for_function("document.activeElement?.id==='home-"+action+"'")
                    assert_layout(page)
                    assertions+=6
                page.locator('#check-button').click()
                assert page.locator('#check-button').get_attribute('aria-pressed')=='true'
                assert page.locator('#check-result').inner_text()=='Browser module loaded and interaction verified.'
                assertions+=2
                page.reload(wait_until='load')
                page.wait_for_function("document.documentElement.dataset.jsReady==='true'")
                assert page.locator('#home-start').is_visible()
                assert_layout(page);assertions+=10
                page.evaluate("document.documentElement.style.fontSize='32px'")
                assert_layout(page);assertions+=10
                page.locator('#home-settings').click()
                assert_layout(page);assertions+=10
                page.locator('#home-back').click()
                page.evaluate("document.documentElement.style.fontSize='' ")
                # These are simulated CSS test insets, NOT device/simulator measurements.
                page.evaluate('''() => {
                    const el=document.querySelector('#app');
                    el.style.setProperty('--legacy-safe-top','59px');
                    el.style.setProperty('--legacy-safe-bottom','34px');
                }''')
                assert_layout(page);assertions+=10
                top=page.locator('#app').evaluate('(el)=>parseFloat(getComputedStyle(el).paddingTop)')
                assert top>=71,f'simulated Dynamic Island inset unprotected: {top}'
                assertions+=1
                page.set_viewport_size({'width':844,'height':width})
                page.evaluate('''() => {
                    const el=document.querySelector('#app');
                    el.style.setProperty('--legacy-safe-top','0px');
                    el.style.setProperty('--legacy-safe-left','47px');
                    el.style.setProperty('--legacy-safe-right','47px');
                }''')
                assert_layout(page);assertions+=10
                page.screenshot(path=str(out/f'home-landscape-{width}px.png'),full_page=True)
                assert not errors,f'page exceptions: {errors}'
                results.append({'width':width,'status':'PASS','assertions':assertions,'modes':['portrait','landscape','200% text','simulated insets'],'page_errors':errors})
            except Exception as e:
                results.append({'width':width,'status':'FAIL','error':str(e),'page_errors':errors})
                page.screenshot(path=str(out/f'home-FAIL-{width}px.png'),full_page=True)
            print(f'Home {width}px: {results[-1]["status"]}',flush=True)
            context.close()
        browser.close()
    (out/'results.json').write_text(json.dumps({'base_url':base,'physical_iphone_safari':'NOT_RUN','simulated_insets_only':True,'results':results},indent=2)+'\n')
    if any(r['status']!='PASS' for r in results):raise SystemExit(1)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--base-url',required=True)
    parser.add_argument('--out',required=True)
    args=parser.parse_args()
    run(args.base_url,Path(args.out))
