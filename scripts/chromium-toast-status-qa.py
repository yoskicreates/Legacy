#!/usr/bin/env python3
"""L3-044 real Vite Chromium QA: truthfulness, keyboard, screen readers, mobile fit."""
import argparse,json,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

WIDTHS=(375,390,402,430)
def ensure(ok,why):
    if not ok:raise AssertionError(why)
    return 1

def measure(page,width,theme):
    n=0
    n+=ensure(page.locator('[data-toast-gallery="L3-044"]').count()==1,'Actual Preact toast gallery missing')
    n+=ensure(page.locator('[data-kit-theme]').first.get_attribute('data-kit-theme')==theme,'Theme mismatch')
    n+=ensure(page.locator('input[type=range]').count()==0,'Sliders forbidden')
    n+=ensure(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Horizontal overflow')
    n+=ensure(page.locator('[data-toast-stack]').count()==1,'Toast container missing')
    n+=ensure(page.locator('[data-toast-id]').count()<=3,'Notice queue exceeded three')
    n+=ensure(page.get_by_text('No game data changed.',exact=False).count()>=1,'Preview data statement missing')
    for key in ('success','error','locked','saved'):
        button=page.locator(f'[data-demo-toast="{key}"]')
        n+=ensure(button.count()==1,f'{key} demo missing')
        n+=ensure(button.get_attribute('type')=='button','Demo must use native button')
        n+=ensure(button.evaluate('(e)=>e.getBoundingClientRect().height>=44'),'Too small demo touch target')
    n+=ensure(page.locator('[data-practice-actions]').get_attribute('role')=='status','Practice outcome not announced')
    return n

def run(browser,base,out,width,theme,forced,reduced):
    context=browser.new_context(viewport={'width':width,'height':844},device_scale_factor=2,
        has_touch=True,is_mobile=True,forced_colors='active' if forced else 'none',
        reduced_motion='reduce' if reduced else 'no-preference')
    page=context.new_page();errors=[];failed=[];n=0
    page.on('pageerror',lambda x:errors.append(str(x)))
    page.on('requestfailed',lambda x:failed.append(x.url))
    key=f'{width}-{theme}-'+('forced-reduced' if forced else 'normal')
    try:
        response=page.goto(base.rstrip('/')+'/toast-status-qa.html',wait_until='load',timeout=45000)
        page.wait_for_function('document.documentElement.dataset.toastStatusReady==="true"',timeout=25000)
        n+=ensure(response.status==200,'Real Vite did not serve preview')
        if theme=='light':page.get_by_role('button',name='Light preview').click()
        n+=measure(page,width,theme)
        n+=ensure(page.locator('.legacy-toast').count()==0,'Toasts visible before operation')
        n+=ensure('Real save operations: 0' in page.locator('[data-practice-actions]').inner_text(),'Preview started with saved claim')
        page.locator('[data-demo-toast="saved"]').click()
        toast=page.locator('.legacy-toast').last
        n+=ensure(toast.get_attribute('data-toast-kind')=='preview-saved','Demo pretends to have saved')
        n+=ensure(toast.get_attribute('data-preview-only')=='true','Demo save is not flagged preview')
        n+=ensure('nothing was written' in toast.inner_text(),'Demo save failed to deny a real write')
        n+=ensure(toast.get_attribute('role')=='status','Save preview is not polite status')
        page.locator('[data-demo-toast="success"]').click()
        n+=ensure(page.locator('.legacy-toast').last.get_attribute('data-toast-kind')=='success','Success notification missing')
        n+=ensure('Practice action completed' in page.locator('.legacy-toast').last.inner_text() or 'Practice choice selected' in page.locator('.legacy-toast').last.inner_text(),'Success not truthfully labeled')
        n+=ensure('Completed practice choices: 1.' in page.locator('[data-practice-actions]').inner_text(),'Practice counter incorrect')
        page.locator('[data-demo-toast="error"]').click()
        n+=ensure(page.locator('.legacy-toast').last.get_attribute('role')=='alert','Error must be assertive alert')
        n+=ensure('No real operation failed' in page.locator('.legacy-toast').last.inner_text(),'Demo error falsely claims failure')
        n+=ensure(page.locator('.legacy-toast').count()==3,'Three notices not queued')
        page.locator('[data-demo-toast="locked"]').click()
        n+=ensure(page.locator('.legacy-toast').count()==3,'Queue did not drop oldest message')
        n+=ensure(page.locator('.legacy-toast').last.get_attribute('data-toast-kind')=='locked','Locked notice missing')
        n+=ensure(page.locator('.legacy-toast-stack').evaluate('(e)=>{const actions=document.querySelector(".legacy-toast-demo-actions").getBoundingClientRect();const alerts=e.getBoundingClientRect();return alerts.top>=actions.bottom-1;}'),'Notification cards cover action buttons')
        n+=ensure(page.locator('[data-toast-kind="preview-saved"]').count()==0,'Oldest item not removed')
        n+=ensure(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Notice caused horizontal overflow')
        page.screenshot(path=str(out/f'toast-{key}-open.png'),full_page=True)
        last=page.locator('.legacy-toast').last
        close=last.get_by_role('button',name='Dismiss Locked state example')
        n+=ensure(close.evaluate('(e)=>e.getBoundingClientRect().height>=44'),'Close touch target too small')
        close.focus()
        page.keyboard.press('Enter')
        n+=ensure(page.locator('.legacy-toast').count()==2,'Keyboard dismissal failed')
        page.locator('[data-demo-toast="saved"]').focus()
        page.keyboard.press('Space')
        n+=ensure(page.locator('[data-toast-kind="preview-saved"]').count()==1,'Keyboard launch did not work')
        n+=ensure('Real save operations: 0.' in page.locator('[data-practice-actions]').inner_text(),'Demo falsely claimed saved data')
        n+=ensure(page.locator('[data-toast-kind="saved"]').count()==0,'Demo generated a real save notice')
        for i in range(4):
            page.locator('[data-demo-toast="success"]').click()
            n+=ensure(page.locator('.legacy-toast').count()<=3,'Rapid notifications exceeded cap')
        n+=ensure('Completed practice choices: 5.' in page.locator('[data-practice-actions]').inner_text(),'Repeated actions were not recorded')
        n+=ensure(page.locator('[data-toast-kind="success"]').count()==3,'Latest success notices not retained')
        # The toast stack is bounded and scrollable when 200% font size is requested.
        page.evaluate('document.documentElement.style.fontSize="32px"')
        n+=ensure(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'200% text caused overflow')
        n+=ensure(page.locator('.legacy-toast-stack').evaluate('(e)=>e.getBoundingClientRect().width<=innerWidth+1'),'Toast stack wider than viewport')
        n+=ensure(page.locator('.legacy-toast-dismiss').last.evaluate('(e)=>e.getBoundingClientRect().height>=44'),'200% close target too small')
        if forced:
            n+=ensure(page.locator('.legacy-toast').first.evaluate('(e)=>getComputedStyle(e).borderLeftWidth!=="0px"'),'Forced colors lost notice outline')
        if reduced:
            n+=ensure(page.locator('.legacy-toast').first.evaluate('(e)=>getComputedStyle(e).animationName==="none"'),'Reduced motion ignored')
        n+=ensure(not errors,f'JavaScript errors: {errors}')
        n+=ensure(not failed,f'Failed network requests: {failed}')
        page.screenshot(path=str(out/f'toast-{key}-zoom.png'),full_page=True)
        return dict(key=key,width=width,theme=theme,forced_colors=forced,reduced_motion=reduced,assertions=n,status='PASS',js_errors=errors,network_errors=failed)
    finally:
        context.close()

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--base-url',required=True);ap.add_argument('--out',required=True);args=ap.parse_args()
    folder=Path(args.out);folder.mkdir(parents=True,exist_ok=True);results=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        try:
            for width in WIDTHS:
                for theme in ('dark','light'):
                    for forced,reduced in ((False,False),(True,True)):
                        try:r=run(browser,args.base_url,folder,width,theme,forced,reduced)
                        except Exception as exc:
                            results.append({'width':width,'theme':theme,'forced':forced,'reduced':reduced,'status':'FAIL','error':str(exc),'traceback':traceback.format_exc()})
                            (folder/'results.json').write_text(json.dumps(results,indent=2))
                            raise
                        results.append(r)
        finally:browser.close()
    (folder/'results.json').write_text(json.dumps(results,indent=2))
    print(json.dumps({'configurations':len(results),'passed':sum(v['status']=='PASS' for v in results),'assertions':sum(v['assertions'] for v in results)}))
if __name__=='__main__':main()
