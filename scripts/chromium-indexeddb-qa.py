#!/usr/bin/env python3
"""L3-028: real IndexedDB browser acceptance against genuine Vite dev/preview.

No claims about iPhone Safari; real Chromium at prescribed CSS viewport widths.
"""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

WIDTHS = (375, 390, 402, 430)
JS = """async (suffix) => {
  const p = window.__LEGACY3_INDEXEDDB_QA__;
  const assert = (yes, message) => { if (!yes) throw Error(message); };
  const name = 'L3-028-' + suffix;
  const options = {databaseName:name};
  const state = p.validState();
  const empty = await p.readGameState(options);
  assert(empty.ok && empty.value === null, 'fresh DB must be empty, no fabricated state');
  const write = await p.writeGameState(state, options);
  assert(write.ok && write.value === true, 'valid write transaction did not commit');
  const read = await p.readGameState(options);
  assert(read.ok && JSON.stringify(read.value) === JSON.stringify(state), 'round trip mismatch');
  assert(Object.isFrozen(read.value) && Object.isFrozen(read.value.random), 'loaded data must be frozen');
  const invalid = JSON.parse(JSON.stringify(state));
  invalid.clocks.calendar.dayIndex = -1;
  const denied = await p.writeGameState(invalid, options);
  assert(!denied.ok && denied.code === 'INVALID_STATE', 'invalid write accepted');
  const afterInvalid = await p.readGameState(options);
  assert(afterInvalid.ok && JSON.stringify(afterInvalid.value) === JSON.stringify(state), 'invalid write changed committed state');
  const future = JSON.parse(JSON.stringify(state)); future.schemaVersion = 2;
  const incompatible = await p.writeGameState(future, options);
  assert(!incompatible.ok && incompatible.code === 'UNSUPPORTED_VERSION', 'future version accepted');
  const unsupported = await p.readGameState(p.noBrowser());
  assert(!unsupported.ok && unsupported.code === 'UNSUPPORTED_BROWSER', 'unsupported browser not handled');
  const securityError = await p.writeGameState(state, p.throwsOpen());
  assert(!securityError.ok && securityError.code === 'DATABASE_ERROR', 'open exception not handled');
  const corrupted = {...state, random: {...state.random, word: 999}};
  await p.rawWrite(name, corrupted);
  const rejectedRead = await p.readGameState(options);
  assert(!rejectedRead.ok && rejectedRead.code === 'CORRUPT_STATE' && rejectedRead.validationCode === 'CORRUPT_RANDOM_STATE', 'corrupt record not detected');
  await p.rawWrite(name, future);
  const futureRead = await p.readGameState(options);
  assert(!futureRead.ok && futureRead.code === 'UNSUPPORTED_VERSION', 'unsupported persisted version not detected');
  await p.rawWrite(name, null);
  const nullRead = await p.readGameState(options);
  assert(!nullRead.ok && nullRead.code === 'CORRUPT_STATE', 'null stored record must not look empty');
  await p.rawWrite(name, state);
  return { checks: 12, state, dbName:name };
}"""


def run(base, output):
    output.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        for width in WIDTHS:
            context = browser.new_context(viewport={'width':width,'height':844},is_mobile=True,has_touch=True)
            page=context.new_page()
            errors=[]
            page.on('pageerror', lambda err: errors.append(str(err)))
            try:
                response=page.goto(base.rstrip('/')+'/indexeddb-qa.html',wait_until='load',timeout=30000)
                page.wait_for_function("document.documentElement.dataset.indexedDbQaReady === 'true'",timeout=18000)
                data=page.evaluate(JS,f'{base.split("://")[-1].replace("/", "-")}-{width}')
                # Confirm durable data across full document reload (not just same JavaScript session).
                page.reload(wait_until='load')
                page.wait_for_function("document.documentElement.dataset.indexedDbQaReady === 'true'", timeout=18000)
                persisted=page.evaluate("async (name) => window.__LEGACY3_INDEXEDDB_QA__.readGameState({databaseName:name})",data['dbName'])
                assert persisted.get('ok') and persisted['value']==data['state'], 'state not retained across reload'
                assert response.status == 200 and not errors, f'HTTP/browser errors: {errors}'
                result={'width':width,'status':'PASS','checks':13,'reload':True,'errors':errors}
            except Exception as exc:
                result={'width':width,'status':'FAIL','error':str(exc),'errors':errors}
            page.screenshot(path=str(output/f'indexeddb_{width}px.png'),full_page=True)
            results.append(result)
            print(f'L3-028 INDEXEDDB {width}px: {result["status"]}',flush=True)
            context.close()
        browser.close()
    (output/'indexeddb-results.json').write_text(json.dumps({'base_url':base,'results':results},indent=2)+'\n')
    if any(r['status']!='PASS' for r in results): raise SystemExit(1)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--base-url',required=True)
    parser.add_argument('--out',required=True)
    args=parser.parse_args()
    run(args.base_url,Path(args.out))
