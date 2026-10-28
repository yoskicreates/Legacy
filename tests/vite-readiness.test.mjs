import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const root = resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
test('Vite readiness reflects whether genuine Vite is locally locked and available', () => {
  const run = spawnSync(process.execPath, ['scripts/vite-readiness.mjs'], {cwd: root, encoding:'utf8'});
  const lock = JSON.parse(readFileSync(resolve(root,'package-lock.json'),'utf8'));
  let installed = false;
  try { installed = Boolean(lock.packages?.['node_modules/vite'] && require.resolve('vite/package.json')); }
  catch { installed = false; }
  assert.equal(run.status, installed ? 0 : 2);
  assert.match(installed ? run.stdout : run.stderr, installed ? /READY:/ : /BLOCKED: real Vite/);
});
