from playwright.sync_api import sync_playwright
from pathlib import Path
import json
out=Path('fast-track-qa')
out.mkdir(exist_ok=True)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for port in (5173,4173):
  for width in (375,390,402,430):
   ctx=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce')
   page=ctx.new_page()
   errors=[]
   page.on('pageerror',lambda e: errors.append(str(e)))
   page.goto(f'http://127.0.0.1:{port}/fast-track-fight.html',wait_until='networkidle')
   assert page.locator('.fighter').count()==2
   assert page.locator('.score output').inner_text()=='05:00'
   page.get_by_role('button',name='Advance 1s').click()
   assert page.locator('.score output').inner_text()=='04:59'
   page.get_by_role('button',name='Speed 1×').click()
   assert page.get_by_role('button',name='Speed 2×').count()==1
   page.get_by_role('button',name='Play').click()
   assert page.get_by_role('button',name='Pause').count()==1
   page.get_by_role('button',name='Pause').click()
   assert page.get_by_role('button',name='Play').count()==1
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   assert not errors,errors
   page.screenshot(path=str(out/f'fight-{port}-{width}.png'),full_page=True)
   results.append({'port':port,'width':width,'passed':True})
   ctx.close()
 browser.close()
(out/'browser-results.json').write_text(json.dumps(results,indent=2))
print(f'{len(results)} browser cases passed')
