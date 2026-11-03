#!/usr/bin/env python3
"""L3-041: genuine Vite/Preact Chromium panel kit acceptance (not an offline fixture)."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

WIDTHS = (375, 390, 402, 430)
COMPONENTS = {
    'text', 'stat', 'action', 'list', 'disclosure', 'notice',
    'search-list', 'segmented-info', 'checklist', 'timeline', 'comparison',
}

CHECK = r'''() => {
const root=document.querySelector('main.legacy-kit');
const cards=[...document.querySelectorAll('[data-kit-component]')];
const visible=element=>element&&element.getClientRects().length>0;
const buttons=[...document.querySelectorAll('.legacy-kit button')].filter(visible);
const rects=buttons.map(n=>n.getBoundingClientRect());
const action=document.querySelector('.legacy-kit-action:not(:disabled)');
const actionVisibleLabel=(()=>{const id=action?.getAttribute('aria-labelledby');const label=id&&document.getElementById(id);return Boolean(label&&action.contains(label)&&label.textContent?.trim()==='Explore preview action');})();
const actionDescription=(()=>{const id=action?.getAttribute('aria-describedby');const desc=id&&document.getElementById(id);return Boolean(id&&desc&&action.contains(desc)&&desc.textContent?.includes('does not change game state'));})();
const namedByVisibleHeading=(region, headingSelector)=>{const id=region?.getAttribute('aria-labelledby');const heading=id&&document.getElementById(id);return Boolean(heading&&region.contains(heading)&&heading.matches(headingSelector)&&visible(heading)&&heading.textContent?.trim());};
const mainVisibleName=namedByVisibleHeading(root,'h1[data-kit-title="true"]');
const variantsVisibleName=namedByVisibleHeading(document.querySelector('.legacy-kit-variants'),'h2');
const emptyState=(()=>{const node=document.querySelector('[data-kit-empty="true"]');return Boolean(node&&node.tagName==='P'&&node.textContent?.trim()&&!node.closest('li'));})();
return {
 ready:document.documentElement.dataset.panelKitReady,
 version:root?.dataset.panelKitVersion,theme:root?.dataset.kitTheme,
 noOverflow:document.documentElement.scrollWidth<=innerWidth+1,
 noClipped:rects.every(r=>r.left>=-1&&r.right<=innerWidth+1),
 noTiny:rects.every(r=>r.height>=44),
 count:cards.length,types:cards.map(c=>c.dataset.kitComponent),
 listItems:document.querySelectorAll('.legacy-kit-list li').length,
 dl:document.querySelectorAll('.legacy-kit-stat dl dt').length,
 cardHeadings:document.querySelectorAll('.legacy-kit h2').length,
 disabledCount:document.querySelectorAll('.legacy-kit-action:disabled').length,
 enabledCount:document.querySelectorAll('.legacy-kit-action:not(:disabled)').length,
 emptyState, actionVisibleLabel, actionDescription, mainVisibleName, variantsVisibleName,
 themeButtons:document.querySelectorAll('[data-kit-theme-button]').length,
 statusRegion:document.querySelectorAll('[data-kit-status="true"][role="status"]').length,
 searchInput:document.querySelectorAll('.legacy-kit-search-input[type="search"]').length,
 checkboxes:document.querySelectorAll('.legacy-kit-checklist input[type="checkbox"]').length,
 sliders:document.querySelectorAll('input[type="range"],[role="slider"]').length,
 buttonContrast:buttons.map(b=>({fg:getComputedStyle(b).color,bg:getComputedStyle(b).backgroundColor})),
 foregrounds:[...document.querySelectorAll('.legacy-kit-eyebrow,.legacy-kit-heading,.legacy-kit-description,.legacy-kit-value,.legacy-kit-action-title,.legacy-kit-list-title,.legacy-kit-status')].filter(visible).map(n=>({fg:getComputedStyle(n).color,bg:getComputedStyle(n.closest('.legacy-kit-card')||root).backgroundColor}))
};
}'''

def rgb(s):
    import re
    values=list(map(float,re.findall(r'[\d.]+',s)[:3]))
    if len(values)!=3:raise AssertionError(f'Unrecognized computed color: {s!r}')
    return values

def contrast(fg,bg):
    a,b=rgb(fg),rgb(bg)
    def l(v):
        out=[(x/255/12.92 if x/255<=0.04045 else ((x/255+0.055)/1.055)**2.4) for x in v]
        return .2126*out[0]+.7152*out[1]+.0722*out[2]
    x,y=l(a),l(b)
    return (max(x,y)+.05)/(min(x,y)+.05)

def check(page,theme):
    v=page.evaluate(CHECK)
    assert v['ready']=='true' and v['version']=='L3-041.V1',v
    assert v['theme']==theme and v['noOverflow'] and v['noClipped'] and v['noTiny'],v
    assert v['count']==len(COMPONENTS)+3 and set(v['types'])==COMPONENTS,v
    assert v['listItems']==3 and v['dl']==1 and v['cardHeadings']>=8,v
    assert v['disabledCount']==1 and v['enabledCount']==1 and v['emptyState'],v
    assert v['mainVisibleName'] and v['variantsVisibleName'] and v['actionVisibleLabel'] and v['actionDescription'],v
    assert v['themeButtons']==2 and v['statusRegion']==1 and v['searchInput']==1 and v['checkboxes']==3,v
    assert v['sliders']==0,v
    for row in v['buttonContrast']+v['foregrounds']:
        assert contrast(row['fg'],row['bg'])>=4.5,(theme,row,contrast(row['fg'],row['bg']))
    return 24+len(v['buttonContrast'])+len(v['foregrounds'])

def interactions(page):
    """Exercise rendered Preact callbacks, native semantics, and local-only state."""
    assertions=0
    action=page.locator('.legacy-kit-action:not(:disabled)')
    action.focus()
    page.keyboard.press('Tab');page.keyboard.press('Shift+Tab')
    assert action.evaluate('(n)=>n===document.activeElement')
    assert action.evaluate('(n)=>getComputedStyle(n).outlineStyle')!='none';assertions+=2
    page.keyboard.press('Enter')
    status=page.locator('[data-kit-status="true"]')
    assert status.get_attribute('data-activation-count')=='1';assertions+=1
    page.keyboard.press('Space')
    assert status.get_attribute('data-activation-count')=='2';assertions+=1
    assert page.locator('.legacy-kit-action:disabled').is_disabled();assertions+=1

    search=page.locator('.legacy-kit-search-input')
    search.fill('COMBAT')
    assert page.locator('.legacy-kit-search-results li').count()==1
    assert page.locator('.legacy-kit-search-count').inner_text().startswith('1 of 4');assertions+=2
    search.fill('zz-no-matches')
    assert page.locator('[data-kit-search-empty="true"]').is_visible();assertions+=1
    search.fill('');assert page.locator('.legacy-kit-search-results li').count()==4;assertions+=1

    checks=page.locator('.legacy-kit-checklist input[type="checkbox"]')
    checks.first.check()
    assert page.locator('.legacy-kit-checklist-status').inner_text().startswith('1 of 3');assertions+=1
    page.locator('.legacy-kit-checklist-reset').click()
    assert checks.first.is_checked() is False;assertions+=1

    segments=page.locator('.legacy-kit-segmented-option')
    segments.nth(1).click()
    assert segments.nth(1).get_attribute('aria-pressed')=='true'
    assert page.locator('.legacy-kit-segmented-content').get_attribute('data-kit-active-section')=='career';assertions+=2
    page.locator('.legacy-kit-timeline-option').first.click()
    assert page.locator('.legacy-kit-timeline-detail').get_attribute('data-kit-selected-entry')=='orientation';assertions+=1
    page.locator('.legacy-kit-comparison-toggle').click()
    assert page.locator('.legacy-kit-comparison-count').inner_text().startswith('2 of 3');assertions+=1

    page.locator('.legacy-kit-notice-dismiss').click()
    assert page.locator('[data-kit-component="notice"]').count()==0;assertions+=1
    page.locator('[data-kit-restore-notice="true"]').click()
    assert page.locator('[data-kit-component="notice"]').count()==1;assertions+=1
    disclosure=page.locator('details.legacy-kit-disclosure')
    disclosure.locator('summary').click()
    assert disclosure.get_attribute('open') is not None
    return assertions+1

def run(base,out):
    out.mkdir(parents=True,exist_ok=True)
    rows=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        for width in WIDTHS:
            ctx=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
            page=ctx.new_page();errors=[]
            page.on('pageerror',lambda exc:errors.append(str(exc)))
            count=0
            try:
                rsp=page.goto(base.rstrip('/')+'/panel-kit-qa.html',wait_until='load',timeout=45000)
                page.wait_for_function("document.documentElement.dataset.panelKitReady==='true'")
                assert rsp.status==200
                for theme in ('dark','light'):
                    button=page.locator(f'[data-kit-theme-button="{theme}"]')
                    button.click();assert button.get_attribute('aria-pressed')=='true';count+=1
                    count+=check(page,theme)
                    page.screenshot(path=str(out/f'panel-kit-{theme}-{width}.png'),full_page=True)
                count+=interactions(page)
                count+=check(page,'light')
                page.evaluate("document.documentElement.style.fontSize='32px'")
                count+=check(page,'light')
                page.evaluate("document.documentElement.style.fontSize=''")
                page.locator('.legacy-kit').evaluate("n=>{n.style.setProperty('--legacy-safe-left','47px');n.style.setProperty('--legacy-safe-right','47px');n.style.setProperty('--legacy-safe-bottom','34px')}")
                count+=check(page,'light')
                page.set_viewport_size({'width':844,'height':width})
                count+=check(page,'light')
                page.screenshot(path=str(out/f'panel-kit-light-landscape-{width}.png'),full_page=True)
                page.reload(wait_until='load')
                page.wait_for_function("document.documentElement.dataset.panelKitReady==='true'")
                assert page.locator('[data-kit-status="true"]').get_attribute('data-activation-count')=='0'
                assert page.locator('.legacy-kit').get_attribute('data-kit-theme')=='dark';count+=2
                assert not errors,errors
                row={'width':width,'status':'PASS','assertions':count,'browser_errors':errors}
            except Exception as exc:
                row={'width':width,'status':'FAIL','error':str(exc),'browser_errors':errors}
                page.screenshot(path=str(out/f'panel-kit-FAIL-{width}.png'),full_page=True)
            rows.append(row);print('L3-041',width,row['status'],flush=True);ctx.close()
        browser.close()
    (out/'results.json').write_text(json.dumps({'physical_iphone_safari':'NOT_RUN','genuine_vite_precondition':True,'simulated_safe_area_only':True,'results':rows},indent=2)+'\n')
    if any(r['status']!='PASS' for r in rows):raise SystemExit(1)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--base-url',required=True)
    parser.add_argument('--out',required=True)
    a=parser.parse_args()
    run(a.base_url,Path(a.out))
