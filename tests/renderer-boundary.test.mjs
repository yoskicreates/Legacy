import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const text = async file => readFile(join(root,file),'utf8');

test('PREACT owns menu, PIXI owns renderer, with isolated imports', async () => {
  const menu = await text('src/ui/menu.ts');
  const renderer = await text('src/renderer/viewport.ts');
  const main = await text('src/main.ts');
  assert.match(menu, /from 'preact'/);
  assert.doesNotMatch(menu, /from 'pixi\.js'|@renderer/);
  assert.match(renderer, /from 'pixi\.js'/);
  assert.doesNotMatch(renderer, /from 'preact'|@ui/);
  assert.match(main, /mountMenu\(/);
  assert.match(main, /mountRendererViewport\(/);
});

test('HTML owns independent roots and no playable fighter artwork', async () => {
  const html = await text('index.html');
  assert.match(html, /id="menu-root" data-boundary="ui"/);
  assert.match(html, /id="renderer-root"[^>]*data-boundary="renderer"/);
  assert.match(html, /no gameplay yet/i);
  const renderer = await text('src/renderer/viewport.ts');
  assert.doesNotMatch(renderer, /fighter\.png|character\.svg|old-rig|old-legacy/i);
});

test('Pin exact Preact and PixiJS dependencies before enabling import', async () => {
  const p=JSON.parse(await text('package.json'));
  assert.equal(p.dependencies.preact,'10.29.8');
  assert.equal(p.dependencies['pixi.js'],'8.20.1');
  assert.equal(p.devDependencies.typescript,'5.8.3');
  assert.equal(p.devDependencies.vite,'6.3.6');
});

test('Independent lifecycle probe explicitly supports teardown and remount', async () => {
  const main=await text('src/main.ts');
  for(const name of ['unmountMenu','remountMenu','unmountRenderer','remountRenderer','snapshot']) {
    assert.match(main,new RegExp(name));
  }
});
