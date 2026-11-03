import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../src/ui/panel-kit.ts',import.meta.url),'utf8');
const component=source.split('export function ChecklistCard(')[1]?.split('/** Enforce real ISO')[0];
assert.ok(component,'ChecklistCard implementation is present');

// Execute the actual effect updater body, rather than duplicate its logic.
const effect=component.match(/useLayoutEffect\(\(\)=>\{\s*setCheckedIds\(previous=>\{([\s\S]*?)\n\s*\}\);\s*\},\[itemIdentity\]\)/);
assert.ok(effect,'checklist prunes removed IDs on changes to the item identity sequence');
const reconcile=runInNewContext(`(function(previous,itemIds) {${effect[1]}})`);

test('removed checklist IDs are pruned without requiring another checkbox click',()=>{
  const initial=['a','b','c'];
  const remaining=reconcile(initial,['a','c']);
  assert.deepEqual(Array.from(remaining),['a','c']);
  assert.equal(remaining.includes('b'),false);
  assert.deepEqual(Array.from(reconcile(remaining,['a','b','c'])),['a','c'],
    'reintroducing b does not resurrect its previous checked state');
});
test('unchanged checklists retain the same state reference to avoid update loops',()=>{
  const selection=['a','c'];
  assert.equal(reconcile(selection,['a','b','c']),selection);
  assert.equal(reconcile([],[]).length,0);
});
test('pruning tracks item ID changes, not only changes to the array reference',()=>{
  assert.match(component,/const itemIdentity=JSON\.stringify\(itemIds\)/);
  assert.match(component,/\},\[itemIdentity\]\)/);
});
