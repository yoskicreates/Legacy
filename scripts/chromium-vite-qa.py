#!/usr/bin/env python3
"""L3-020 acceptance: test the REAL Vite-served placeholder in Chromium.

Run once for the dev server and again for the production preview server. The
script is separate from the offline fallback QA and makes no assertion that
any server was launched unless its navigation succeeds.
"""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

WIDTHS = (375, 390, 402, 430, 1280)


def verify(base_url: str, out_dir: Path, browser_binary: str | None) -> list[dict]:
    out_dir.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as pw:
        options = {"headless": True, "timeout": 30000}
        if browser_binary:
            options["executable_path"] = browser_binary
        browser = pw.chromium.launch(**options)
        for width in WIDTHS:
            mobile = width <= 430
            context = browser.new_context(
                viewport={"width": width, "height": 844 if mobile else 800},
                is_mobile=mobile,
                has_touch=mobile,
                device_scale_factor=1,
            )
            page = context.new_page()
            errors: list[str] = []
            failed_responses: list[str] = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("response", lambda response: failed_responses.append(f"{response.status} {response.url}") if response.status >= 400 else None)
            response = page.goto(base_url, wait_until="load", timeout=20000)
            page.wait_for_function("document.documentElement.dataset.jsReady === 'true'", timeout=12000)
            heading = page.locator("h1").inner_text()
            title = page.title()
            button = page.locator("#check-button")
            button.click(timeout=5000)
            result_text = page.locator("#check-result").inner_text()
            pressed = button.get_attribute("aria-pressed")
            metrics = page.evaluate("""() => ({
                documentWidth: document.documentElement.scrollWidth,
                bodyWidth: document.body.scrollWidth,
                buttonHeight: Math.round(document.querySelector('#check-button').getBoundingClientRect().height),
                windowWidth: window.innerWidth,
            })""")
            success = (
                response is not None and response.status == 200
                and 'LEGACY' in title
                and 'legacy' in heading.lower()
                and pressed == 'true'
                and result_text == 'Browser module loaded and interaction verified.'
                and metrics['windowWidth'] == width
                and metrics['documentWidth'] <= width
                and metrics['bodyWidth'] <= width
                and metrics['buttonHeight'] >= 44
                and not errors and not failed_responses
            )
            shot = out_dir / f'vite_{width}px.png'
            page.screenshot(path=str(shot), full_page=True, animations="disabled")
            record = {
                'width': width, 'result': 'PASS' if success else 'FAIL',
                'url': base_url, 'http_status': response.status if response else None,
                'title': title, 'heading': heading, 'button_status': result_text,
                'aria_pressed': pressed, 'metrics': metrics, 'page_errors': errors,
                'http_errors': failed_responses, 'screenshot': shot.name,
                'provenance': 'Real Vite dev or production preview HTTP navigation in Chromium',
            }
            results.append(record)
            print(f"VITE BROWSER {width}px: {record['result']}", flush=True)
            context.close()
        browser.close()
    (out_dir / 'chromium-vite-results.json').write_text(json.dumps(results, indent=2) + '\n', encoding='utf-8')
    if not all(r['result'] == 'PASS' for r in results):
        raise SystemExit('Vite browser acceptance failed; see results and screenshots')
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--chromium', default=None)
    args = parser.parse_args()
    verify(args.base_url, args.out, args.chromium)
