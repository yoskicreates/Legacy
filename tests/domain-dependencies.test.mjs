import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { verifyDomainBoundaries, analyzeDomainSource } from '../scripts/check-domain-boundaries.mjs';

const root = resolve(import.meta.dirname, '..');
const policyPath = join(root, 'docs/domain-dependencies.json');
const policy = JSON.parse(await readFile(policyPath, 'utf8'));
const six = ['core', 'combat', 'career', 'economy', 'social', 'persistence'];
const expected = Object.fromEntries(six.map(name => [name, name === 'core' ? ['core'] : [name, 'core']]));

function analyze(origin, snippet) {
  return analyzeDomainSource({
    file: join(root, 'src/domain', origin, 'invalid-fixture.ts'),
    text: snippet, policy, root,
  });
}

test('published dependency policy contains exactly the six authorized modules and edges', () => {
  assert.equal(policy.task, 'L3-022');
  assert.deepEqual(policy.modules, six);
  assert.deepEqual(policy.allowedDomainImports, expected);
  assert.equal(Object.keys(policy.allowedDomainImports).length, 6);
});

test('each module has a typed public boundary but does not ship gameplay', async () => {
  for (const name of six) {
    const actual = (await readdir(join(root, 'src/domain', name))).sort();
    assert.deepEqual(actual, name === 'core' ? ['clock.ts', 'events.ts', 'index.ts', 'random.ts', 'state-schema.ts'] : name === 'persistence' ? ['autosave.ts', 'export-import.ts', 'index.ts', 'indexeddb.ts', 'manual-slots.ts', 'migrations.ts'] : ['index.ts']);
    const source = await readFile(join(root, 'src/domain', name, 'index.ts'), 'utf8');
    assert.match(source, /contracts-only/);
    assert.match(source, /hasRuntimeSimulation:\s*false/);
    if (name !== 'core') assert.match(source, /import type \{ DomainBoundary \} from '@domain\/core'/);
  }
  const config = await readFile(join(root, 'tsconfig.json'), 'utf8');
  const tsConfig = JSON.parse(config);
  assert.deepEqual(tsConfig.compilerOptions.paths['@domain/*'], ['src/domain/*']);
  const viteConfig = await readFile(join(root, 'vite.config.mjs'), 'utf8');
  assert.match(viteConfig, /'@domain': path\('\.\/src\/domain'\)/);
});

test('actual domain tree respects all edges and has no bypass imports', async () => {
  const result = await verifyDomainBoundaries(root);
  assert.equal(result.scanned, 15);
  assert.deepEqual(result.errors, []);
});

test('allow intra-domain relative imports, type-only and static exports, and permitted core alias', () => {
  for (const domain of six) {
    assert.deepEqual(analyze(domain, `import type { DomainBoundary } from '@domain/${domain}';\nexport { ok } from './internal';\n`), []);
  }
  for (const domain of six.slice(1)) {
    assert.deepEqual(analyze(domain, `import type { DomainBoundary } from '@domain/core';\nexport type { DomainId } from '@domain/core';`), []);
  }
});

test('forbid all cross-feature imports, including type-only, re-export, relative traversal and core backflow', () => {
  for (const domain of six) {
    for (const target of six) {
      if (expected[domain].includes(target)) continue;
      assert.ok(analyze(domain, `import type { X } from '@domain/${target}';`).length, `${domain} -> ${target}`);
      assert.ok(analyze(domain, `export * from '@domain/${target}';`).length, `${domain} export -> ${target}`);
      assert.ok(analyze(domain, `type X = import('@domain/${target}').X;`).length, `${domain} import type -> ${target}`);
    }
  }
  assert.match(analyze('combat', `import x from '../career';`)[0].reason, /relative path crosses/);
  assert.match(analyze('core', `import x from '../combat';`)[0].reason, /relative path crosses/);
  assert.match(analyze('career', `import x from '@domain/economy';`)[0].reason, /forbidden dependency/);
  assert.match(analyze('persistence', `import x from '@domain/social';`)[0].reason, /forbidden dependency/);
});

test('forbid UI/renderer aliases, external packages and unsafe dynamic imports, including types', () => {
  for (const name of six) {
    for (const forbidden of ['@ui/menu', '@renderer/viewport', '@game/contracts', '@/main', 'preact', 'pixi.js', 'node:fs', '@domain/unknown', '@domain/core/../combat']) {
      assert.ok(analyze(name, `import type { X } from '${forbidden}';`).length, `${name} imports ${forbidden}`);
    }
    assert.match(analyze(name, `const x = import('@domain/core');`)[0].reason, /dynamic import/);
    assert.match(analyze(name, `const x = require('@domain/core');`)[0].reason, /require/);
    assert.match(analyze(name, `const x = import(path);`)[0].reason, /dynamic import/);
    assert.match(analyze(name, `import X = require('@domain/core');`)[0].reason, /import-equals/);
  }
});

test('L3-022 domains remain isolated through L3-031 export/import milestone', async () => {
  const reg = JSON.parse(await readFile(join(root, 'docs/task-register.json'), 'utf8'));
  assert.equal(reg.total_tasks, 272);
  assert.ok(['L3-032','L3-033','L3-034'].includes(reg.next_task));
  assert.ok([31,32,33].includes(reg.completed.length));
  assert.equal(reg.tasks.find(x => x.id === 'L3-022').status, 'completed');
  assert.equal(reg.tasks.find(x => x.id === 'L3-023').status, 'completed');
  assert.equal(reg.tasks.find(x => x.id === 'L3-024').status, 'completed');
  assert.equal(reg.tasks.find(x => x.id === 'L3-025').status, 'completed');
  assert.equal(reg.tasks.find(x => x.id === 'L3-026').status, 'completed');
  assert.equal(reg.tasks.find(x => x.id === 'L3-027').status, 'completed');
  assert.equal(reg.tasks.find(x => x.id === 'L3-028').status, 'completed');
  assert.equal(reg.tasks.find(x => x.id === 'L3-029').status, 'completed');
  assert.equal(reg.tasks.find(x => x.id === 'L3-030').status, 'completed');
  assert.equal(reg.tasks.find(x => x.id === 'L3-031').status, 'completed');
  const files = (await readdir(join(root,'src/domain/core')));
  assert.deepEqual(files.sort(), ['clock.ts', 'events.ts', 'index.ts', 'random.ts', 'state-schema.ts']);
});
