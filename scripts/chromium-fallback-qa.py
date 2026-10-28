#!/usr/bin/env python3
"""L3-020 optional FALLBACK asset Chromium verification; NOT Vite verification.

Requires Python playwright and a Chromium binary. Reproduces responsive screenshots
from the compiled temporary offline dist without requiring an HTTP navigation.
The module-only `export {};` marker is removed only to enable inline injection
into about:blank; no application logic or stylesheet declarations are changed.
"""
import argparse
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

def run(output: Path, chromium: str, widths: tuple[int, ...]) -> list[dict]:
    root = ROOT / 'dist'
    html = (root / 'index.html').read_text(encoding='utf-8')
    css = (root / 'assets/style.css').read_text(encoding='utf-8')
    script = (root / 'assets/main.js').read_text(encoding='utf-8')
    html = re.sub(r'<link rel="stylesheet" href="[^"]+"\s*/?>', '<style>' + css + '</style>', html)
    html = re.sub(r'<script type="module" src="[^"]+"\s*></script>', '', html)
    if not html.count('<style>') == 1 or '<script type="module"' in html:
        raise AssertionError('Expected only the offline HTML/CSS/JS asset layout')
    script = script.replace('export {};', '')
    output.mkdir(parents=True, exist_ok=True)
    records = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=chromium, headless=True, timeout=15000,
                                    args=['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-zygote'])
        for width in widths:
            is_mobile = width <= 430
            page = browser.new_page(viewport={'width':width,'height':844 if is_mobile else 800},
                                    device_scale_factor=1,is_mobile=is_mobile,has_touch=is_mobile)
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.set_content(html,wait_until='load',timeout=8000)
            page.add_script_tag(content=script)
            page.wait_for_function("document.documentElement.dataset.jsReady === 'true'",timeout=4000)
            title=page.title()
            h1=page.locator('h1').inner_text()
            page.locator('#check-button').click(timeout=3000)
            result=page.locator('#check-result').inner_text()
            pressed=page.locator('#check-button').get_attribute('aria-pressed')
            dimensions=page.evaluate('''() => ({innerWidth:innerWidth,htmlWidth:document.documentElement.scrollWidth,
                        bodyWidth:document.body.scrollWidth,buttonHeight:Math.round(document.querySelector('#check-button').getBoundingClientRect().height)})''')
            passed=('LEGACY' in title and 'legacy' in h1.lower() and
                    result=='Browser module loaded and interaction verified.' and pressed=='true' and
                    dimensions['htmlWidth']<=width and dimensions['bodyWidth']<=width and
                    dimensions['buttonHeight']>=44 and not errors)
            screenshot=output / f'chromium_fallback_{width}px.png'
            page.screenshot(path=str(screenshot),full_page=True,animations='disabled',timeout=8000)
            record={'viewport_width':width,'result':'PASS' if passed else 'FAIL', 'title':title,
                    'heading':h1,'status_after_click':result,'aria_pressed':pressed,
                    'dimensions':dimensions,'page_errors':errors,'screenshot':screenshot.name,
                    'test_provenance':'Chromium in-memory render of offline fallback assets, NOT Vite/dev/preview'}
            records.append(record)
            print(f'CHROMIUM {width}px: {record["result"]}',flush=True)
            page.close()
        browser.close()
    (output/'chromium_results.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')
    if not all(record['result']=='PASS' for record in records):
        raise SystemExit('Browser render verification failures')
    return records

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,required=True)
    parser.add_argument('--chromium',default='/usr/bin/chromium')
    args=parser.parse_args()
    run(args.out,args.chromium,(375,390,402,430,1280))
