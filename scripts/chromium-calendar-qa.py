#!/usr/bin/env python3
"""Real-browser calendar preview checks; never claim a fixture action changes a save."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--base-url',required=True);p.add_argument('--out',required=True);a=p.parse_args()
out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as playwright:
 browser=playwright.chromium.launch(headless=True)
 for width in (375,390,402,430):
  for mode in ('normal','forced'):
   context=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True,forced_colors='active' if mode=='forced' else 'none',reduced_motion='reduce' if mode=='forced' else 'no-preference')
   page=context.new_page();errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
   page.goto(a.base_url+'/calendar-qa.html',wait_until='networkidle')
   assert page.locator('[data-calendar-source="fixture"]').count()==1
   assert page.locator('[data-game-date]').get_attribute('datetime')=='2027-03-08'
   assert page.locator('[data-event-id]').count()==3
   assert page.locator('[data-event-id="gym"]').get_attribute('aria-pressed')=='false'
   page.locator('[data-event-id="gym"]').click()
   assert page.locator('[data-event-id="gym"]').get_attribute('aria-pressed')=='true'
   assert 'No session is booked' in page.locator('[data-event-details]').inner_text()
   page.locator('[data-event-id="coach"]').focus();page.keyboard.press('Enter')
   assert 'No relationship changes' in page.locator('[data-event-details]').inner_text()
   assert page.locator('input[type="range"]').count()==0
   page.add_style_tag(content='html{font-size:200%!important}')
   assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1')
   assert not errors,errors
   page.reload(wait_until='networkidle')
   page.screenshot(path=str(out/f'calendar-{width}-{mode}.png'),full_page=True)
   results.append({'width':width,'mode':mode,'passed':True})
   context.close()
 browser.close()
(out/'results.json').write_text(json.dumps(results,indent=2))
print(f'{len(results)}/{len(results)} Chromium mobile cases passed')
