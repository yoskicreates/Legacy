import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const json = async f => JSON.parse(await readFile(join(root, f), 'utf8'));

test('workflow exposes all five requested commands without install recursion', async () => {
  const pkg = await json('package.json');
  for (const name of ['install:clean', 'build', 'lint', 'typecheck', 'test']) {
    assert.equal(typeof pkg.scripts[name], 'string');
    assert.ok(pkg.scripts[name].length > 0);
  }
  assert.equal(Object.hasOwn(pkg.scripts, 'install'), false);
  assert.equal(pkg.private, true);
});

test('lock file resolves pinned official TypeScript and Vite versions', async () => {
  const pkg = await json('package.json');
  const lock = await json('package-lock.json');
  assert.equal(lock.name, pkg.name);
  assert.equal(lock.packages[''].name, pkg.name);
  assert.deepEqual(Object.keys(pkg.dependencies ?? {}).sort(), ['pixi.js', 'preact']);
  assert.deepEqual(Object.keys(pkg.devDependencies ?? {}).sort(), ['typescript', 'vite']);
  assert.equal(pkg.devDependencies.typescript, '5.8.3');
  assert.equal(pkg.devDependencies.vite, '6.3.6');
  assert.ok(lock.packages['node_modules/typescript']);
  assert.ok(lock.packages['node_modules/vite']);
});

test('every script module can pass Node syntax check', async () => {
  for (const file of ['scripts/phase-tools.mjs', 'tests/tooling.test.mjs']) {
    const result = spawnSync(process.execPath, ['--check', join(root,file)], {encoding:'utf8'});
    assert.equal(result.status, 0, result.stderr);
  }
});

test('browser placeholder exists but gameplay is still absent', async () => {
  const src = await readdir(join(root, 'src'));
  assert.deepEqual(src, ['.gitkeep', 'domain', 'game', 'main.ts', 'renderer', 'style.css', 'tooling', 'ui']);
  await access(join(root, 'index.html'));
  const readme = await readFile(join(root, 'README.md'), 'utf8');
  assert.match(readme, /not a runnable|not yet runnable|no runnable|not playable/i);
});

test('historical fallback remains preserved but is not the official L3-021 build', async () => {
  const fallback = await readFile(join(root,'scripts/web-pipeline.mjs'),'utf8');
  assert.match(fallback, /DOES NOT claim to be Vite/);
  const pkg = await json('package.json');
  assert.equal(pkg.scripts.build, 'vite build');
  assert.equal(pkg.scripts.dev, 'vite --host 127.0.0.1');
});
