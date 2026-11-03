import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Dependency-free regression for the actual L3-041 TypeScript validator.
// Extract the source function, not a reimplementation, so this test also runs
// when npm dependencies are unavailable during an offline handoff.
const source=readFileSync(new URL('../src/ui/panel-kit.ts',import.meta.url),'utf8');
const match=source.match(/function isTimelineDate\(value:string\):boolean\s*\{([\s\S]*?)\n\}/);
assert.ok(match,'timeline ISO-date validator must exist');
const implementation=`(function isTimelineDate(value) {${match[1].replace(/(year|month|day)!/g,'$1')}})`;
const isTimelineDate=runInNewContext(implementation);

test('timeline accepts early ISO years without JavaScript 1900-century coercion',()=>{
  for(const value of ['0000-01-01','0001-01-01','0099-12-31','0100-01-01','2000-02-29','2024-02-29','9999-12-31'])
    assert.equal(isTimelineDate(value),true,value);
});
test('timeline rejects invalid calendar dates and noncanonical ISO text',()=>{
  for(const value of ['0001-02-29','0099-02-29','1900-02-29','2023-02-29','2024-02-30','2024-04-31','2024-00-01','2024-13-01','2024-01-00','2024-1-01','2024-01-1','2024-01-01T00:00:00','2024-01-01Z',' 2024-01-01',''])
    assert.equal(isTimelineDate(value),false,value);
});

// A caller can replace the timeline's entries after an item was selected.
// The visual selection must follow the fallback entry, not a stale stored ID.
test('timeline selection falls back to current entry when previous selection disappears',()=>{
  const component=readFileSync(new URL('../src/ui/panel-kit.ts',import.meta.url),'utf8');
  assert.match(component,/const matchingIndex=entries\.findIndex\(entry=>entry\.id===selectedId\)/);
  assert.match(component,/matchingIndex>=0\?matchingIndex:Math\.max\(0,entries\.findIndex\(entry=>entry\.status==='current'\)\)/);
  assert.match(component,/'aria-pressed':selected\?\.id===entry\.id/);
});

// The segmented card must keep its visible content and aria-pressed selection in sync
// when a parent replaces the sections array after the user selects an option.
test('segmented information falls back to an available option after prop changes',()=>{
  const component=readFileSync(new URL('../src/ui/panel-kit.ts',import.meta.url),'utf8');
  assert.match(component,/const matchingIndex=sections\.findIndex\(x=>x\.id===selectedId\)/);
  assert.match(component,/const fallbackIndex=initialSectionId\?sections\.findIndex\(x=>x\.id===initialSectionId\):-1/);
  assert.match(component,/const selectedIndex=matchingIndex>=0\?matchingIndex:Math\.max\(0,fallbackIndex\)/);
  assert.match(component,/'aria-pressed':selected\.id===section\.id/);
  assert.match(component,/'data-kit-active-section':selected\.id/);
});
