import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../src/ui/panel-kit.ts',import.meta.url),'utf8');
const qa=readFileSync(new URL('../scripts/chromium-panel-kit-qa.py',import.meta.url),'utf8');

test('Chromium stats assertion counts primary and variant native definition lists',()=>{
  const gallery=src.slice(src.indexOf('export function PanelKitGallery()'));
  assert.ok(gallery.startsWith('export function PanelKitGallery()'), 'Gallery must exist');
  const instances=[...gallery.matchAll(/h\(StatPanel,\{/g)];
  assert.equal(instances.length,2,'One primary stats panel and one progress-variant stats panel');
  assert.match(gallery,/h\(StatPanel,\{label:'FIGHTER RATING · PREVIEW'/);
  assert.match(gallery,/h\(StatPanel,\{label:'PROGRESS METER · PREVIEW'/);
  assert.match(src,/h\('dl',\{/);
  assert.match(qa,/v\['dl'\]==2/, 'Browser acceptance must expect both rendered native <dl> groups');
});
