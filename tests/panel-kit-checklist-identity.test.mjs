import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/ui/panel-kit.ts',import.meta.url),'utf8');
const component=source.split('export function ChecklistCard(')[1]?.split('/** Enforce real ISO')[0];
assert.ok(component,'ChecklistCard implementation is present');
test('checklist counts only IDs still present in current items',()=>{
  assert.match(component,/const activeCheckedIds=checkedIds\.filter\(id=>itemIds\.includes\(id\)\)/);
  assert.match(component,/const count=activeCheckedIds\.length/);
  assert.match(component,/checked:activeCheckedIds\.includes\(item\.id\)/);
});
test('checklist change handler drops removed IDs before updating',()=>{
  assert.match(component,/const active=previous\.filter\(id=>items\.some\(item=>item\.id===id\)\)/);
  assert.match(component,/return active\.includes\(item\.id\)\?active\.filter/);
});
