import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
const typecheck = (file) => spawnSync(process.execPath,
  [join(root, 'node_modules/typescript/bin/tsc'), '--project', file, '--pretty', 'false', '--noEmit'],
  { cwd: root, encoding: 'utf8' });
const source = await readFile(join(root, 'src/domain/core/events.ts'), 'utf8');
const fixture = await readFile(join(root, 'tests/fixtures/invalid-domain-events.ts'), 'utf8');
const ast = ts.createSourceFile('events.ts', source, ts.ScriptTarget.ES2022, true);

function interfaceNode(name) {
  return ast.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === name);
}

test('event source parses cleanly as TypeScript', () => {
  assert.equal(ast.parseDiagnostics.length, 0);
});

test('exactly four type-keyed payload contracts are declared', () => {
  const map = interfaceNode('DomainEventPayloads');
  assert.ok(map);
  assert.deepEqual(map.members.map(x => x.name?.text), [
    'fight.recorded', 'training.recorded', 'purchase.recorded', 'relationship.recorded',
  ]);
});

test('event source provides a discriminated union, not an event bus or event effects', () => {
  assert.match(source, /export type DomainEventOf/);
  assert.match(source, /export type DomainEvent =/);
  assert.match(source, /type: T/);
  assert.match(source, /DomainEventPayloads\[T\]/);
  assert.equal(ast.statements.filter(node => ts.isImportDeclaration(node)).length, 0);
  assert.equal(ast.statements.filter(node => ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)).length, 0);
});

test('valid fight, training, purchase and relationship payloads pass strict TypeScript', () => {
  const result = typecheck('tsconfig.events.json');
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('deliberately malformed event payload fixture is rejected by strict TypeScript', () => {
  const result = typecheck('tsconfig.events-negative.json');
  assert.notEqual(result.status, 0, 'Invalid event payloads must not typecheck');
  assert.match(result.stdout, /invalid-domain-events\.ts/);
  const diagnostics = [...result.stdout.matchAll(/error TS\d+/g)].length;
  assert.ok(diagnostics >= 6, `Expected >=6 invalid-payload diagnostics, got ${diagnostics}: ${result.stdout}`);
  assert.match(result.stdout, /TS2322|TS2353|TS2741/);
});

test('all six negative scenarios are present in the compiled invalid fixture', () => {
  for (let i = 1; i <= 6; i++) assert.match(fixture, new RegExp(`EV-NEG-0${i}`));
});

test('type contracts have no timestamps, RNG, clock, prices, scores, or gameplay behavior', () => {
  const tokens = new Set(['Date', 'Math', 'setInterval', 'setTimeout', 'performance', 'window',
    'document', 'localStorage', 'indexedDB', 'random', 'fetch']);
  const found = [];
  function visit(node) {
    if (ts.isIdentifier(node) && tokens.has(node.text)) found.push(node.text);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.deepEqual(found, []);
});

test('separate event contracts reject invalid payloads without any rendered UI', () => {
  const check = typecheck('tsconfig.events-negative.json');
  assert.notEqual(check.status, 0);
  const positive = typecheck('tsconfig.events.json');
  assert.equal(positive.status, 0, positive.stdout + positive.stderr);
});
