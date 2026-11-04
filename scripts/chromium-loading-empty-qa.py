#!/usr/bin/env python3
"""L3-047 genuine Vite/Chromium visual and interaction QA."""
import argparse,json
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser()
parser.add_argument('--base-url',required=True)
parser.add_argument('--out',required=True)
args=parser.parse_args()
out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for width in (375,390,402,430):
  for forced in (False,True):
   ctx=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True,forced_colors='active' if forced else 'none',reduced_motion='reduce')
   page=ctx.new_page()
   errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   page.goto(args.base_url+'/loading-empty-qa.html',wait_until='networkidle')
   for state in ('loading','no-save','no-events','missing-asset'):
    page.locator('[data-switch-state="'+state+'"]').click()
    assert page.locator('[data-placeholder-state="'+state+'"]').count()==1
    assert page.locator('[data-placeholder-state="'+state+'"] h2').inner_text().strip()
    assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
   page.locator('[data-switch-state="no-save"]').click()
   page.locator('.legacy-placeholder button').click()
   assert page.locator('[data-action-count="1"]').count()==1
   page.locator('[data-switch-state="loading"]').click()
   assert page.locator('[role="status"]').count()==1
   assert page.locator('[aria-busy="true"]').count()==1
   page.add_style_tag(content='html{font-size:200%!important}')
   assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
   assert not errors,errors
   page.screenshot(path=str(out/f'loading-empty-{width}-{"forced" if forced else "normal"}.png'),full_page=True)
   results.append({'width':width,'forced_colors':forced,'passed':True})
   ctx.close()
 browser.close()
(out/'results.json').write_text(json.dumps(results,indent=2))
print(f'{len(results)}/{len(results)} real Chromium cases passed')
