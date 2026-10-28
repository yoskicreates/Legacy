import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
const source = await readFile(join(root, 'src/navigation/route-state.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  fileName: 'route-state.ts',
  reportDiagnostics: true,
});
assert.deepEqual(output.diagnostics ?? [], []);
const routes = await import(`data:text/javascript;base64,${Buffer.from(output.outputText).toString('base64')}`);
const {
  MENU_ROUTE_IDS, ROUTE_HISTORY_LIMIT, isMenuRoute, initialRouteState,
  currentRoute, canGoBack, canGoForward, reduceRoute,
} = routes;
const go = to => ({ type: 'navigate', to });

// These are data-only identifiers; no destination page, UI, gameplay, save or URL routing exists.
test('typed route registry has finite unique, documented identifiers', () => {
  assert.deepEqual(MENU_ROUTE_IDS, [
    'home', 'character', 'career', 'training', 'fight', 'social', 'economy', 'settings',
  ]);
  assert.equal(new Set(MENU_ROUTE_IDS).size, MENU_ROUTE_IDS.length);
  assert.equal(isMenuRoute('home'), true);
  assert.equal(isMenuRoute('unknown'), false);
  assert.equal(isMenuRoute(null), false);
  assert.equal(isMenuRoute({ toString: () => 'home' }), false);
});

test('initial state has one active route and recursively frozen history', () => {
  const s = initialRouteState();
  assert.deepEqual(s, { entries: ['home'], cursor: 0 });
  assert.equal(currentRoute(s), 'home');
  assert.ok(Object.isFrozen(s));
  assert.ok(Object.isFrozen(s.entries));
  assert.deepEqual(initialRouteState('settings').entries, ['settings']);
  assert.throws(() => initialRouteState('not-in-registry'), TypeError);
});

test('navigate creates deterministic history without mutating older snapshots', () => {
  const s0 = initialRouteState();
  const s1 = reduceRoute(s0, go('character'));
  const s2 = reduceRoute(s1, go('career'));
  assert.deepEqual(s2, { entries: ['home', 'character', 'career'], cursor: 2 });
  assert.deepEqual(s0.entries, ['home']);
  assert.deepEqual(s1.entries, ['home', 'character']);
  assert.equal(currentRoute(s2), 'career');
  assert.equal(reduceRoute(s2, go('career')), s2, 'same-route push must not duplicate');
});

test('back and forward clamp to bounds; no-op snapshots preserve identity', () => {
  const last = reduceRoute(reduceRoute(initialRouteState(), go('character')), go('career'));
  assert.equal(canGoBack(last), true);
  assert.equal(canGoForward(last), false);
  assert.equal(reduceRoute(last, { type: 'forward' }), last);
  const middle = reduceRoute(last, { type: 'back' });
  const first = reduceRoute(middle, { type: 'back' });
  assert.equal(currentRoute(middle), 'character');
  assert.equal(currentRoute(first), 'home');
  assert.equal(reduceRoute(first, { type: 'back' }), first);
  assert.equal(canGoBack(first), false);
  assert.equal(canGoForward(first), true);
  assert.deepEqual(reduceRoute(first, { type: 'forward' }), middle);
  assert.deepEqual(reduceRoute(middle, { type: 'forward' }), last);
});

test('navigating from a prior history entry truncates its forward branch', () => {
  let s = initialRouteState();
  for (const to of ['character', 'career', 'fight']) s = reduceRoute(s, go(to));
  s = reduceRoute(reduceRoute(s, { type: 'back' }), { type: 'back' });
  s = reduceRoute(s, go('settings'));
  assert.deepEqual(s, { entries: ['home', 'character', 'settings'], cursor: 2 });
  assert.equal(canGoForward(s), false);
});

test('replace changes only the current entry, retaining back and forward history', () => {
  let s = initialRouteState();
  for (const to of ['character', 'career', 'fight']) s = reduceRoute(s, go(to));
  s = reduceRoute(s, { type: 'back' });
  const modified = reduceRoute(s, { type: 'replace', to: 'social' });
  assert.deepEqual(modified, { entries: ['home', 'character', 'social', 'fight'], cursor: 2 });
  assert.equal(reduceRoute(modified, { type: 'replace', to: 'social' }), modified);
  assert.equal(currentRoute(reduceRoute(modified, { type: 'forward' })), 'fight');
  assert.equal(currentRoute(s), 'career');
});

test('reset starts a fresh history at the requested typed route', () => {
  const state = reduceRoute(initialRouteState(), go('career'));
  const reset = reduceRoute(state, { type: 'reset', to: 'settings' });
  assert.deepEqual(reset, initialRouteState('settings'));
  assert.equal(reduceRoute(reset, { type: 'reset', to: 'settings' }), reset);
  assert.equal(canGoBack(reset), false);
});

test('history size is bounded even after long sessions and branch rewrites', () => {
  let state = initialRouteState();
  const other = ['home', 'character', 'career', 'training', 'fight', 'social', 'economy', 'settings'];
  for (let i = 0; i < 300; i++) {
    state = reduceRoute(state, go(other[i % other.length]));
    assert.ok(state.entries.length <= ROUTE_HISTORY_LIMIT);
    assert.equal(state.cursor, state.entries.length - 1);
  }
  assert.equal(state.entries.length, 32);
  state = reduceRoute(state, { type: 'back' });
  state = reduceRoute(state, go('settings'));
  assert.ok(state.entries.length <= 32);
  assert.equal(canGoForward(state), false);
});

test('invalid runtime targets and actions are rejected without changing prior state', () => {
  const state = reduceRoute(initialRouteState(), go('character'));
  assert.throws(() => reduceRoute(state, go('premium-boost')), TypeError);
  assert.throws(() => reduceRoute(state, { type: 'replace', to: '' }), TypeError);
  assert.throws(() => reduceRoute(state, { type: 'reset', to: null }), TypeError);
  assert.throws(() => reduceRoute(state, { type: 'unrecognized' }), TypeError);
  assert.deepEqual(state, { entries: ['home', 'character'], cursor: 1 });
  assert.throws(() => currentRoute({ entries: ['home'], cursor: 100 }), RangeError);
});

test('repeated headless transition sequences are deterministic and source has no UI coupling', () => {
  const commands = [go('character'), go('career'), { type: 'back' }, go('social'),
    { type: 'replace', to: 'economy' }, { type: 'back' }, { type: 'forward' },
    { type: 'reset', to: 'home' }, go('settings')];
  const run = () => commands.reduce(reduceRoute, initialRouteState());
  assert.deepEqual(run(), run());
  assert.equal(currentRoute(run()), 'settings');
  const program = ts.createSourceFile('route-state.ts', source, ts.ScriptTarget.ES2022, true);
  const imports = program.statements.filter(st => ts.isImportDeclaration(st));
  assert.equal(imports.length, 0, 'routing engine must be independent of rendering');
  const forbidden = new Set(['window', 'document', 'localStorage', 'indexedDB', 'history', 'Math', 'Date']);
  const found = [];
  const visit = node => {
    if (ts.isIdentifier(node) && forbidden.has(node.text)) found.push(node.text);
    ts.forEachChild(node, visit);
  };
  visit(program);
  assert.deepEqual(found, [], 'routing engine must not read DOM, browser APIs or time');
});
