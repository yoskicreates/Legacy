import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../src/ui/panel-kit.ts',import.meta.url),'utf8');
const match=source.match(/function assertUniquePanelListIds\(items:readonly PanelListItem\[\]\):void\s*\{([\s\S]*?)\n\}/);
assert.ok(match,'shared list ID validator exists');
const validate=runInNewContext(`(function(items) {${match[1]}})`);

test('both list components use shared stable-ID validation',()=>{
  assert.match(source,/function PanelList\([^]*?\{\n  assertUniquePanelListIds\(items\)/);
  assert.match(source,/function SearchableListCard\([^]*?\{\n  assertUniquePanelListIds\(items\)/);
});
test('accepts empty and unique items',()=>{
  assert.doesNotThrow(()=>validate([]));
  assert.doesNotThrow(()=>validate([{id:'one',label:'One'},{id:'two',label:'Two'}]));
});
test('rejects duplicate and blank list identities',()=>{
  for(const items of [
    [{id:'x',label:'First'},{id:'x',label:'Second'}],
    [{id:'',label:'Empty'}],
    [{id:' ',label:'Whitespace'}],
    [{id:'x',label:' '}],
  ])assert.throws(()=>validate(items),/unique non-empty IDs and labels/);
});
