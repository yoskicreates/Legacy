#!/usr/bin/env python3
"""L3-042 real compiled Preact/Vite selection-card UI: dev/preview mobile Chromium."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright

WIDTHS=(375,390,402,430)
SNAPSHOT=r'''() => {
 const root=document.querySelector('main.legacy-selection-gallery');
 const component=document.querySelector('[data-selection-component="choice-group"]');
 const choices=[...document.querySelectorAll('[data-selection-choice]')];
 const visible=e=>Boolean(e&&e.getClientRects().length);
 const controls=[...document.querySelectorAll('.legacy-selection-gallery button')].filter(visible);
 const bounds=controls.map(e=>e.getBoundingClientRect());
 const group=document.querySelector('.legacy-selection-options');
 const heading=document.getElementById(component?.getAttribute('aria-labelledby')||'');
 const descriptions=choices.map(e=>{
   const id=e.getAttribute('aria-describedby');const d=id&&document.getElementById(id);
   return Boolean(d&&e.contains(d)&&d.textContent?.trim());
 });
 const roles=choices.map(e=>({tag:e.tagName,type:e.type,pressed:e.getAttribute('aria-pressed'),disabled:e.disabled,hasSvg:Boolean(e.querySelector('svg[aria-hidden="true"][focusable="false"]'))}));
 return {ready:document.documentElement.dataset.selectionCardReady,root:Boolean(root),theme:root?.dataset.kitTheme,
   noOverflow:document.documentElement.scrollWidth<=innerWidth+1,noClip:bounds.every(r=>r.left>=-1&&r.right<=innerWidth+1),minTouch:bounds.every(r=>r.height>=44),
   count:choices.length,pressed:choices.filter(e=>e.getAttribute('aria-pressed')==='true').length,roles,descriptions,
   titleNamed:Boolean(heading&&component?.contains(heading)&&heading.tagName==='H2'&&visible(heading)),
   groupNamed:group?.getAttribute('aria-label')?.length>8,
   hasStatus:Boolean(component?.querySelector('[role="status"][aria-live="polite"]')),
   empty:Boolean(document.querySelector('[data-selection-empty="true"]')),
   disabled:choices.filter(e=>e.disabled).length,
   sliders:document.querySelectorAll('input[type="range"],[role="slider"]').length,
   contrast:controls.map(e=>({fg:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor})),
   canvas:getComputedStyle(root).backgroundColor,
   focus:document.querySelector('.legacy-selection-option:focus-visible')?.getAttribute('data-selection-choice')||null,
 };
}'''

def rgb(s):
 import re
 v=list(map(float,re.findall(r'[\d.]+',s)[:3]));assert len(v)==3,(s,v);return v

def contrast(fg,bg):
 def linear(color):
  a=[x/255 for x in rgb(color)]
  z=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in a]
  return .2126*z[0]+.7152*z[1]+.0722*z[2]
 a,b=linear(fg),linear(bg)
 return (max(a,b)+.05)/(min(a,b)+.05)

def layout(page,theme,expected_count=4):
 v=page.evaluate(SNAPSHOT)
 assert v['ready']=='true' and v['root'] and v['theme']==theme,v
 assert v['noOverflow'] and v['noClip'] and v['minTouch'],v
 assert v['count']==expected_count and v['pressed']<=1 and v['disabled']==(1 if expected_count==4 else 0),v
 assert v['titleNamed'] and v['groupNamed'] and v['hasStatus'] and v['empty'] and v['sliders']==0,v
 assert all(v['descriptions']) and all(x['tag']=='BUTTON' and x['type']=='button' and x['hasSvg'] and x['pressed'] in ('true','false') for x in v['roles']),v
 for row in v['contrast']:
  assert contrast(row['fg'],row['bg'])>=4.5,(theme,row,contrast(row['fg'],row['bg']))
 return 15+len(v['contrast'])+len(v['roles'])

def interactions(page):
 checks=0
 striker=page.locator('[data-selection-choice="striking"]')
 grappler=page.locator('[data-selection-choice="grappling"]')
 disabled=page.locator('[data-selection-choice="later"]')
 assert disabled.is_disabled() and disabled.get_attribute('aria-pressed')=='false';checks+=2
 striker.focus()
 # The theme switch click leaves Chromium in pointer-input mode. Traverse
 # with keyboard Tab and Shift+Tab before testing the focus-visible ring.
 page.keyboard.press('Tab');page.keyboard.press('Shift+Tab')
 assert striker.evaluate('(e)=>e===document.activeElement') and striker.evaluate('(e)=>getComputedStyle(e).outlineStyle')!='none';checks+=2
 page.keyboard.press('Enter');page.wait_for_function("document.querySelector('[data-selection-choice=striking]').getAttribute('aria-pressed')==='true'")
 assert page.locator('[data-selection-component="choice-group"]').get_attribute('data-selection-selected')=='striking';checks+=2
 assert 'Striking focus selected' in page.locator('.legacy-selection-live').inner_text();checks+=1
 grappler.focus();page.keyboard.press('Space')
 page.wait_for_function("document.querySelector('[data-selection-choice=grappling]').getAttribute('aria-pressed')==='true'")
 assert striker.get_attribute('aria-pressed')=='false' and page.locator('[aria-pressed="true"][data-selection-choice]').count()==1;checks+=2
 assert page.locator('.legacy-selection-feedback').inner_text().startswith('Selection changes in this preview: 2');checks+=1
 # Selecting the same option again must not generate a second event.
 grappler.click();assert 'preview: 2.' in page.locator('.legacy-selection-feedback').inner_text();checks+=1
 # First select an ID that is absent from the alternate dataset. Shared IDs
 # must stay selected; only removed IDs should be pruned on prop replacement.
 striker.click()
 assert striker.get_attribute('aria-pressed')=='true'
 assert 'preview: 3.' in page.locator('.legacy-selection-feedback').inner_text();checks+=2
 # Replace/reinsert the removed option ID; it must never silently reappear.
 page.locator('[data-selection-swap="true"]').click()
 page.wait_for_function("document.querySelector('[data-selection-component=choice-group]').getAttribute('data-selection-selected')==='none'")
 assert page.locator('[data-selection-choice]').count()==2;checks+=1
 page.locator('[data-selection-swap="true"]').click()
 assert page.locator('[data-selection-choice="striking"]').get_attribute('aria-pressed')=='false';checks+=1
 assert page.locator('[data-selection-component="choice-group"]').get_attribute('data-selection-selected')=='none';checks+=1
 page.locator('button').filter(has_text='Light preview').first.click()
 assert page.locator('main.legacy-selection-gallery').get_attribute('data-kit-theme')=='light';checks+=1
 return checks

def run(base,out):
 out.mkdir(parents=True,exist_ok=True);records=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for width in WIDTHS:
   context=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));count=0
   try:
    response=page.goto(base.rstrip('/')+'/selection-card-qa.html',wait_until='load',timeout=45000)
    page.wait_for_function("document.documentElement.dataset.selectionCardReady==='true'")
    assert response.status==200;count+=1
    for theme in ('dark','light'):
     page.get_by_role('button',name=f'{theme.capitalize()} preview').click()
     count+=layout(page,theme)
     page.screenshot(path=str(out/f'selection-{theme}-{width}.png'),full_page=True)
    count+=interactions(page)
    count+=layout(page,'light')
    page.evaluate("document.documentElement.style.fontSize='32px'")
    count+=layout(page,'light')
    page.evaluate("document.documentElement.style.fontSize='' ")
    page.locator('main.legacy-selection-gallery').evaluate("n=>{n.style.setProperty('--legacy-safe-left','47px');n.style.setProperty('--legacy-safe-right','47px');n.style.setProperty('--legacy-safe-bottom','34px')}")
    count+=layout(page,'light')
    page.set_viewport_size({'width':844,'height':width});count+=layout(page,'light')
    page.screenshot(path=str(out/f'selection-landscape-{width}.png'),full_page=True)
    page.reload(wait_until='load');page.wait_for_function("document.documentElement.dataset.selectionCardReady==='true'")
    assert page.locator('[data-selection-component="choice-group"]').get_attribute('data-selection-selected')=='none';count+=1
    count+=layout(page,'dark')
    assert not errors,errors
    records.append({'width':width,'status':'PASS','assertions':count,'javascript_errors':errors})
   except Exception as exc:
    records.append({'width':width,'status':'FAIL','assertions':count,'error':str(exc),'javascript_errors':errors})
    page.screenshot(path=str(out/f'selection-FAIL-{width}.png'),full_page=True)
   print('L3-042',width,records[-1]['status'],flush=True);context.close()
  browser.close()
 (out/'results.json').write_text(json.dumps({'source':'genuine Vite dev/preview with Preact (not static fake UI)','physical_iphone_safari':'NOT_RUN','base_url':base,'results':records},indent=2)+'\n')
 if any(r['status']!='PASS' for r in records):raise SystemExit(1)

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--base-url',required=True);ap.add_argument('--out',required=True)
 args=ap.parse_args();run(args.base_url,Path(args.out))
