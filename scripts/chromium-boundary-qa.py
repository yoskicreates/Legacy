#!/usr/bin/env python3
"""L3-021: real dev/preview browser regression plus independent lifecycle proof."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

WIDTHS = (375, 390, 402, 430, 1280)


def verify(url: str, out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    findings = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=[
            '--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'
        ])
        for width in WIDTHS:
            ctx = browser.new_context(viewport={'width': width, 'height': 844 if width <= 430 else 800},
                is_mobile=width <= 430, has_touch=width <= 430, device_scale_factor=1)
            page = ctx.new_page()
            errors = []
            bad_http = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('response', lambda r: bad_http.append(f'{r.status} {r.url}') if r.status >= 400 else None)
            response = page.goto(url, wait_until='load', timeout=30000)
            page.wait_for_function("document.querySelector('#renderer-root')?.dataset.rendererState === 'ready'", timeout=25000)
            page.locator('#check-button').click()
            pressed = page.locator('#check-button').get_attribute('aria-pressed')
            result = page.locator('#check-result').inner_text()
            initial = page.evaluate("""() => ({
              state: window.__LEGACY3_BOUNDARY__.snapshot(),
              rendererRootCount: document.querySelectorAll('#renderer-root canvas[data-boundary-renderer="pixijs"]').length,
              menuRootCount: document.querySelectorAll('#menu-root [data-menu-framework="preact"]').length,
              docWidth: document.documentElement.scrollWidth,
              bodyWidth: document.body.scrollWidth,
              viewportWidth: innerWidth,
              buttonHeight: Math.round(document.querySelector('#check-button').getBoundingClientRect().height)
            })""")
            page.evaluate("window.__LEGACY3_BOUNDARY__.unmountMenu()")
            after_menu_off = page.evaluate("""() => ({
              menu: document.querySelectorAll('#menu-root [data-menu-framework="preact"]').length,
              renderer: document.querySelectorAll('#renderer-root canvas').length,
              status: window.__LEGACY3_BOUNDARY__.snapshot()
            })""")
            page.evaluate("window.__LEGACY3_BOUNDARY__.remountMenu()")
            page.locator('#check-button').wait_for()
            page.evaluate("window.__LEGACY3_BOUNDARY__.unmountRenderer()")
            after_renderer_off = page.evaluate("""() => ({
              menu: document.querySelectorAll('#menu-root #check-button').length,
              renderer: document.querySelectorAll('#renderer-root canvas').length,
              status: window.__LEGACY3_BOUNDARY__.snapshot()
            })""")
            page.evaluate("window.__LEGACY3_BOUNDARY__.remountRenderer()")
            page.wait_for_function("document.querySelector('#renderer-root')?.dataset.rendererState === 'ready'", timeout=25000)
            final = page.evaluate("""() => ({
              menu: document.querySelectorAll('#menu-root #check-button').length,
              renderer: document.querySelectorAll('#renderer-root canvas').length,
              status: window.__LEGACY3_BOUNDARY__.snapshot(),
              docWidth: document.documentElement.scrollWidth
            })""")
            screenshot = out / f'boundary_{width}px.png'
            page.screenshot(path=str(screenshot), full_page=True, animations='disabled')
            passed = (
                response is not None and response.status == 200
                and pressed == 'true'
                and result == 'Browser module loaded and interaction verified.'
                and initial['state'] == {'menu': True, 'renderer': True, 'state': 'ready'}
                and initial['rendererRootCount'] == initial['menuRootCount'] == 1
                and after_menu_off['menu'] == 0 and after_menu_off['renderer'] == 1
                and after_renderer_off['menu'] == 1 and after_renderer_off['renderer'] == 0
                and final['menu'] == final['renderer'] == 1
                and final['status'] == {'menu': True, 'renderer': True, 'state': 'ready'}
                and initial['viewportWidth'] == width
                and initial['docWidth'] <= width and initial['bodyWidth'] <= width
                and final['docWidth'] <= width
                and initial['buttonHeight'] >= 44
                and not errors and not bad_http
            )
            record = {'width': width, 'result': 'PASS' if passed else 'FAIL',
                      'status': response.status if response else None, 'initial': initial,
                      'after_menu_off': after_menu_off, 'after_renderer_off': after_renderer_off,
                      'remounted': final, 'page_errors': errors, 'http_errors': bad_http,
                      'screenshot': screenshot.name,
                      'provenance': 'Chromium real Vite HTTP, not physical iPhone Safari'}
            findings.append(record)
            print(f'L3-021 {width}px: {record["result"]}', flush=True)
            ctx.close()
        browser.close()
    (out/'boundary-qa-results.json').write_text(json.dumps(findings, indent=2)+'\n')
    if not all(x['result'] == 'PASS' for x in findings):
        raise SystemExit('L3-021 boundary acceptance failed; inspect JSON and screenshots')


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--base-url', required=True)
    p.add_argument('--out', type=Path, required=True)
    a = p.parse_args()
    verify(a.base_url, a.out)
