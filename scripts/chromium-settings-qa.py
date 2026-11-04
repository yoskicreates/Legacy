#!/usr/bin/env python3
"""L3-048 real Vite settings QA: phone sizes, persistence, accessibility, export."""
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
   ctx=browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True,accept_downloads=True,forced_colors='active' if forced else 'none',reduced_motion='reduce')
   page=ctx.new_page()
   errors=[]
   page.on('pageerror',lambda error:errors.append(str(error)))
   page.goto(args.base_url+'/settings-qa.html',wait_until='networkidle')
   assert page.locator('[data-settings-group]').count()==3
   assert page.locator('input[type="range"]').count()==0
   assert page.locator('fieldset legend').count()==3
   assert page.locator('[role="status"][aria-live="polite"]').count()==1
   for group,value in [('audio','off'),('motion','reduced'),('textSize','largest')]:
    button=page.locator('[data-setting="'+group+'"][data-value="'+value+'"]')
    button.click()
    assert button.get_attribute('aria-pressed')=='true'
   assert page.evaluate('document.documentElement.dataset.legacyMotion')=='reduced'
   assert page.evaluate('document.documentElement.dataset.legacyAudio')=='off'
   assert page.evaluate('getComputedStyle(document.documentElement).getPropertyValue("--legacy-user-text-scale").trim()')=='1.25'
   page.reload(wait_until='networkidle')
   assert page.evaluate('document.documentElement.dataset.legacyMotion')=='reduced'
   assert page.locator('[data-setting="audio"][data-value="off"]').get_attribute('aria-pressed')=='true'
   assert page.locator('[data-setting="textSize"][data-value="largest"]').get_attribute('aria-pressed')=='true'
   with page.expect_download() as d:
    page.locator('[data-export-settings="true"]').click()
   download=d.value
   assert download.suggested_filename=='LEGACY3-settings.json'
   path=out/f'export-{width}-{"forced" if forced else "normal"}.json'
   download.save_as(path)
   payload=json.loads(path.read_text())
   assert payload['schema']=='legacy3.settings.v1'
   assert payload['preferences']=={'audio':'off','motion':'reduced','textSize':'largest'}
   assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
   page.add_style_tag(content='html{font-size:200%!important}')
   assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
   assert not errors,errors
   page.screenshot(path=str(out/f'settings-{width}-{"forced" if forced else "normal"}.png'),full_page=True)
   results.append({'width':width,'forced_colors':forced,'passed':True})
   ctx.close()
 # Actual application integration: home Settings must render functional controls.
 app=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 page=app.new_page()
 app_errors=[]
 page.on('pageerror',lambda error:app_errors.append(str(error)))
 page.goto(args.base_url+'/',wait_until='networkidle')
 page.locator('#home-settings').click()
 assert page.locator('[data-panel="settings"] [data-settings-group]').count()==3
 page.locator('[data-panel="settings"] [data-setting="motion"][data-value="reduced"]').click()
 assert page.locator('[data-panel="settings"] [data-setting="motion"][data-value="reduced"]').get_attribute('aria-pressed')=='true'
 assert page.evaluate('document.documentElement.dataset.legacyMotion')=='reduced'
 page.reload(wait_until='networkidle')
 page.locator('#home-settings').click()
 assert page.locator('[data-panel="settings"] [data-setting="motion"][data-value="reduced"]').get_attribute('aria-pressed')=='true'
 assert page.evaluate('document.documentElement.dataset.legacyMotion')=='reduced'
 assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
 assert not app_errors,app_errors
 results.append({'width':390,'actual_app_settings':True,'passed':True})
 app.close()
 # Privacy mode: blocked storage must not crash the settings screen.
 privacy=browser.new_context(viewport={'width':375,'height':844},is_mobile=True,has_touch=True)
 privacy.add_init_script("""Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}});""")
 page=privacy.new_page()
 privacy_errors=[]
 page.on('pageerror',lambda error:privacy_errors.append(str(error)))
 page.goto(args.base_url+'/settings-qa.html',wait_until='networkidle')
 assert page.locator('[data-settings-group]').count()==3
 page.locator('[data-setting="audio"][data-value="off"]').click()
 assert page.locator('[data-setting="audio"][data-value="off"]').get_attribute('aria-pressed')=='true'
 assert 'storage unavailable' in page.locator('[data-settings-status]').inner_text().lower()
 assert not privacy_errors,privacy_errors
 results.append({'width':375,'storage_blocked':True,'passed':True})
 privacy.close()
 browser.close()
(out/'results.json').write_text(json.dumps(results,indent=2))
print(f'{len(results)}/{len(results)} real Chromium settings cases passed')
