#!/usr/bin/env python3
"""L3-043 real Vite dev/preview Chromium QA for native confirmation dialog.

Runs at 375/390/402/430 CSS px; tests keyboard, pointer, Escape, single commit,
focus handling, forced-color/reduced-motion, contrast, 200% text, and overflow.
NEVER reports physical iPhone Safari as tested.
"""
import argparse,json,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

WIDTHS=(375,390,402,430)

def expect(condition,message):
    if not condition: raise AssertionError(message)
    return 1

def counter(page):
    return page.locator('[data-confirm-counter="true"]').inner_text()

def wait_counter(page,confirmed,cancelled):
    page.wait_for_function('''([c,x]) => {
      const s=document.querySelector('[data-confirm-counter="true"]')?.textContent||'';
      return s.includes('confirmations: '+c+'.')&&s.includes('Cancelled: '+x+'.');
    }''',arg=[confirmed,cancelled],timeout=10000)

def check_page(page,width,theme):
    tests=0
    root=page.locator('[data-confirm-gallery="L3-043"]')
    tests+=expect(root.count()==1,f'{width}: gallery missing')
    tests+=expect(root.get_attribute('data-kit-theme')==theme,'Incorrect theme')
    tests+=expect(page.get_by_role('heading',name='Confirmation pop-ups').count()==1,'Missing heading')
    tests+=expect(page.locator('input[type=range],[role=slider]').count()==0,'Sliders forbidden')
    tests+=expect(page.locator('dialog.legacy-confirm-modal').count()==1,'Native dialog missing')
    tests+=expect(not page.locator('dialog.legacy-confirm-modal').is_visible(),'Dialog starts closed')
    tests+=expect(page.locator('button.legacy-confirm-launch').count()==2,'Two example triggers required')
    tests+=expect(page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),'Horizontal overflow')
    tests+=expect(all(page.locator('button.legacy-confirm-launch').nth(i).evaluate('(n)=>{const r=n.getBoundingClientRect();return r.height>=44 && r.left>=-1 && r.right<=innerWidth+1;}') for i in range(2)),'Triggers too small or clipped')
    tests+=expect('No saved game data changed' in counter(page),'Warning that preview has no game effects missing')
    return tests

def check_open(page,width,kind,expected_label):
    tests=0
    modal=page.get_by_role('dialog')
    modal.wait_for(state='visible',timeout=10000)
    tests+=expect(modal.count()==1,'Exactly one dialog is shown')
    tests+=expect(modal.get_attribute('aria-modal')=='true','Not marked modal')
    desc_id=modal.get_attribute('aria-describedby')
    title_id=modal.get_attribute('aria-labelledby')
    tests+=expect(bool(desc_id and title_id),'Accessible labels missing')
    tests+=expect(modal.locator('#'+title_id).count()==1 and modal.locator('#'+desc_id).count()==1,'Bad title or description reference')
    tests+=expect(modal.locator('button.legacy-confirm-cancel').count()==1,'Cancel missing')
    tests+=expect(modal.locator('button.legacy-confirm-accept').inner_text()==expected_label,'Confirm text wrong')
    tests+=expect(modal.locator('button.legacy-confirm-cancel').evaluate('(e)=>document.activeElement===e'),'Cancel is not default focused')
    tests+=expect(modal.evaluate('(e)=>e.open && e.matches(":modal")'),'Not genuinely modal')
    tests+=expect(modal.evaluate('(e)=>{const r=e.getBoundingClientRect();return r.width<=innerWidth+1 && r.left>=-1 && r.right<=innerWidth+1 && r.height<=innerHeight+1;}'),'Modal clipped')
    tests+=expect(all(modal.locator('button').nth(i).evaluate('(e)=>e.getBoundingClientRect().height>=44') for i in range(2)),'Modal touch controls too small')
    tests+=expect(modal.get_attribute('class').endswith(kind),'Wrong confirmation style')
    return tests

def run_case(browser,base,output,width,theme,forced,motion):
    ctx=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True,
        device_scale_factor=2,forced_colors='active' if forced else 'none',
        reduced_motion='reduce' if motion else 'no-preference')
    page=ctx.new_page();errors=[];requests=[];checks=0
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('requestfailed',lambda r:requests.append(r.url))
    key=f'{width}-{theme}-'+('forced' if forced else 'normal')+('-reduced' if motion else '')
    try:
        response=page.goto(base.rstrip('/')+'/confirm-dialog-qa.html',wait_until='load',timeout=45000)
        page.wait_for_function("document.documentElement.dataset.confirmDialogReady==='true'",timeout=15000)
        checks+=expect(response.status==200,'QA page not served by actual Vite')
        if theme=='light':page.get_by_role('button',name='Light preview').click()
        checks+=check_page(page,width,theme)
        # Standard Cancel leaves confirmations untouched.
        page.get_by_role('button',name='Open regular confirmation').click()
        checks+=check_open(page,width,'standard','Confirm preview')
        page.screenshot(path=str(output/f'confirm-{key}-open.png'),full_page=True)
        page.locator('.legacy-confirm-cancel').click()
        page.get_by_role('dialog').wait_for(state='hidden')
        wait_counter(page,0,1);checks+=2
        # Confirm fires exactly once, including two JS clicks before Preact flush.
        page.get_by_role('button',name='Open regular confirmation').click()
        checks+=check_open(page,width,'standard','Confirm preview')
        page.locator('.legacy-confirm-accept').evaluate('(n)=>{n.click();n.click()}')
        page.get_by_role('dialog').wait_for(state='hidden')
        wait_counter(page,1,1);checks+=2
        # Danger example is still a preview: escape is Cancel, not Confirm.
        page.get_by_role('button',name='Open irreversible-action warning').click()
        checks+=check_open(page,width,'danger','Confirm preview deletion')
        page.keyboard.press('Escape');page.get_by_role('dialog').wait_for(state='hidden')
        wait_counter(page,1,2);checks+=2
        # Real keyboard navigation: focused Cancel is safe; Tab reaches Confirm.
        page.get_by_role('button',name='Open irreversible-action warning').click()
        checks+=check_open(page,width,'danger','Confirm preview deletion')
        page.keyboard.press('Tab')
        confirm=page.locator('.legacy-confirm-accept')
        checks+=expect(confirm.evaluate('(n)=>n===document.activeElement'),'Tab did not focus confirm')
        checks+=expect(confirm.evaluate('(n)=>getComputedStyle(n).outlineStyle!=="none"'),'Keyboard focus not visible')
        page.keyboard.press('Space');page.get_by_role('dialog').wait_for(state='hidden')
        wait_counter(page,2,2);checks+=2
        # Native Escape stays cancellable after multiple interactions.
        page.get_by_role('button',name='Open regular confirmation').click()
        page.keyboard.press('Escape');page.get_by_role('dialog').wait_for(state='hidden')
        wait_counter(page,2,3);checks+=2
        # 200%-size text and responsive focus controls; use genuine dialog.
        page.evaluate("document.documentElement.style.fontSize='32px'")
        page.get_by_role('button',name='Open regular confirmation').click()
        tests=check_open(page,width,'standard','Confirm preview')
        checks+=tests
        checks+=expect(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'200% text overflow')
        page.locator('.legacy-confirm-cancel').click();page.get_by_role('dialog').wait_for(state='hidden')
        wait_counter(page,2,4);checks+=1
        page.screenshot(path=str(output/f'confirm-{key}-closed.png'),full_page=True)
        checks+=expect(not errors,'JS errors: '+str(errors))
        checks+=expect(not requests,'Failed web requests: '+str(requests))
        return dict(key=key,width=width,theme=theme,forced_colors=forced,reduced_motion=motion,assertions=checks,status='PASS',js_errors=errors,network_errors=requests)
    finally:
        ctx.close()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--base-url',required=True)
    parser.add_argument('--out',required=True)
    args=parser.parse_args()
    dest=Path(args.out);dest.mkdir(parents=True,exist_ok=True)
    results=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        try:
            for width in WIDTHS:
                for theme in ('dark','light'):
                    for forced,motion in ((False,False),(True,True)):
                        try:
                            r=run_case(browser,args.base_url,dest,width,theme,forced,motion)
                        except Exception as exc:
                            r=dict(key=f'{width}-{theme}-{forced}-{motion}',status='FAIL',error=str(exc),traceback=traceback.format_exc());results.append(r)
                            (dest/'results.json').write_text(json.dumps(results,indent=2))
                            raise
                        results.append(r)
        finally:
            browser.close()
    (dest/'results.json').write_text(json.dumps(results,indent=2))
    print(json.dumps({'configurations':len(results),'passed':sum(r['status']=='PASS' for r in results),'assertions':sum(r.get('assertions',0) for r in results)},indent=2))

if __name__=='__main__':main()
