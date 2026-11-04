#!/usr/bin/env python3
"""L3-045 mobile browser QA against genuine Vite development and preview servers."""
import argparse,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
WIDTHS=(375,390,402,430)

def run_case(browser,base,out,width,theme,mode):
    forced = mode=='forced'
    ctx=browser.new_context(viewport={'width':width,'height':430 if forced else 844},device_scale_factor=2,
      is_mobile=True,has_touch=True,forced_colors='active' if forced else 'none',reduced_motion='reduce' if forced else 'no-preference')
    page=ctx.new_page()
    errors=[];external=[];count=0
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.on('request',lambda req:external.append(req.url) if not req.url.startswith(base) and not req.url.startswith('data:') else None)
    page.goto(base+'/dashboard-qa.html',wait_until='networkidle')
    page.wait_for_function("document.documentElement.dataset.dashboardReady==='true'")
    assert page.locator('[data-dashboard-gallery="L3-045"]').count()==1;count+=1
    assert page.locator('[data-dashboard-source="fixture"]').count()==1;count+=1
    assert page.get_by_text('SAMPLE DATA · NO LIVE SAVE').count()==1;count+=1
    assert page.get_by_role('heading',name='Example Fighter').count()==1;count+=1
    assert page.get_by_role('heading',name='Available money').count()==1;count+=1
    assert page.get_by_role('heading',name='Notifications').count()==1;count+=1
    assert page.locator('[data-dashboard-cash]').inner_text()=='$2,450.00';count+=1
    assert page.locator('[data-dashboard-date]').get_attribute('datetime')=='2027-03-08';count+=1
    assert page.locator('[data-dashboard-date]').inner_text()=='Monday, March 8, 2027';count+=1
    assert page.locator('[data-dashboard-notice]').count()==2;count+=1
    assert page.get_by_role('img',name='Fighter portrait is not connected in this dashboard preview').count()==1;count+=1
    assert page.get_by_role('button',name='Preview next action').is_enabled();count+=1
    # Theme switching is presentation-only and reflects its pressed state.
    page.get_by_role('button',name='Light appearance' if theme=='light' else 'Dark appearance').click()
    assert page.locator('[data-dashboard-gallery]').get_attribute('data-kit-theme')==theme;count+=1
    assert page.get_by_role('button',name='Light appearance' if theme=='light' else 'Dark appearance').get_attribute('aria-pressed')=='true';count+=1
    # Native keyboard activation communicates local preview intent, never actual gameplay.
    button=page.locator('[data-dashboard-next]')
    button.focus();page.keyboard.press('Enter')
    page.wait_for_function("document.querySelector('[data-dashboard-preview-count]').textContent.includes('Preview visits: 1')")
    assert 'No training, purchase, save, or gameplay action was completed' in page.locator('[data-dashboard-preview-count]').inner_text();count+=2
    button.click()
    page.wait_for_function("document.querySelector('[data-dashboard-preview-count]').textContent.includes('Preview visits: 2')")
    count+=1
    status=page.locator('[data-dashboard-preview-count]')
    assert status.get_attribute('role')=='status' and status.get_attribute('aria-live')=='polite';count+=1
    page.locator('[data-dashboard-toggle-notices]').click()
    assert page.locator('[data-dashboard-empty]').is_visible();count+=1
    assert page.locator('[data-dashboard-notice]').count()==0;count+=1
    page.locator('[data-dashboard-toggle-notices]').click()
    assert page.locator('[data-dashboard-notice]').count()==2;count+=1
    assert page.locator('[data-dashboard-cash]').inner_text()=='$2,450.00';count+=1
    # 200% large text, 44px tap targets and scrolling without horizontal overflow.
    page.add_style_tag(content='html{font-size:200%!important}')
    assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1');count+=1
    assert page.locator('[data-dashboard-next]').bounding_box()['height']>=44;count+=1
    assert page.get_by_role('button',name='Dark appearance').bounding_box()['height']>=44;count+=1
    assert page.get_by_role('button',name='Light appearance').bounding_box()['height']>=44;count+=1
    assert len(errors)==0;count+=1
    assert len(external)==0;count+=1
    assert page.locator('input[type="range"]').count()==0;count+=1
    assert page.locator('[data-dashboard-preview-count]').inner_text().count('No training')==1;count+=1
    # Return to normal text for a truthful visual screenshot of this compiled page.
    page.reload(wait_until='networkidle');page.wait_for_function("document.documentElement.dataset.dashboardReady==='true'")
    if theme=='light':page.get_by_role('button',name='Light appearance').click()
    assert page.locator('[data-dashboard-preview-count]').inner_text().startswith('Preview visits: 0.');count+=1
    assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1');count+=1
    assert not errors;count+=1
    name=f'dashboard-{width}-{theme}-{mode}.png'
    page.screenshot(path=str(out/name),full_page=True)
    ctx.close()
    return {'width':width,'theme':theme,'mode':mode,'checks':count,'passed':True,'screenshot':name,'errors':errors,'external_requests':external}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--base-url',required=True);ap.add_argument('--out',required=True)
    args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
    all_results=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        for width in WIDTHS:
            for theme in ('dark','light'):
                for mode in ('normal','forced'):
                    result=run_case(browser,args.base_url.rstrip('/'),out,width,theme,mode)
                    print('PASS',result['width'],result['theme'],result['mode'],result['checks'],flush=True)
                    all_results.append(result)
        browser.close()
    data={'source':args.base_url,'cases':len(all_results),'passed':len(all_results),'assertions':sum(x['checks'] for x in all_results),'results':all_results}
    (out/'dashboard-browser-results.json').write_text(json.dumps(data,indent=2)+'\n')
    print('L3-045 mobile browser QA PASS',data['passed'],'/',data['cases'],'cases;',data['assertions'],'checks')

if __name__=='__main__':main()
