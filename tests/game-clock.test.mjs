import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
const source = await readFile(join(root, 'src/domain/core/clock.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  fileName: 'clock.ts',
  reportDiagnostics: true,
});
assert.deepEqual(compiled.diagnostics ?? [], []);
const { createGameClocks, reduceGameClocks } =
  await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
const days = n => ({ type: 'advance-calendar-days', days: n });
const millis = n => ({ type: 'advance-fight-milliseconds', milliseconds: n });
const resetFight = { type: 'reset-fight-clock' };

test('new clock state has independent zero-based game calendar and fight time', () => {
  assert.deepEqual(createGameClocks(), { calendar: { dayIndex: 0 }, fight: { elapsedMilliseconds: 0 } });
  assert.deepEqual(createGameClocks(365).calendar, { dayIndex: 365 });
  assert.deepEqual(createGameClocks(365).fight, { elapsedMilliseconds: 0 });
});

test('calendar advancement is explicit and cannot move fight simulation time', () => {
  const initial = reduceGameClocks(createGameClocks(3), millis(70_000));
  const next = reduceGameClocks(initial, days(2));
  assert.equal(next.calendar.dayIndex, 5);
  assert.equal(next.fight.elapsedMilliseconds, 70_000);
  assert.equal(next.fight, initial.fight, 'fight object identity proves no covert progression');
  assert.equal(initial.calendar.dayIndex, 3, 'parent snapshot never mutated');
});

test('fight advancement is explicit and cannot move game-calendar day', () => {
  const initial = reduceGameClocks(createGameClocks(80), days(2));
  const next = reduceGameClocks(initial, millis(5_000));
  assert.equal(next.calendar.dayIndex, 82);
  assert.equal(next.fight.elapsedMilliseconds, 5_000);
  assert.equal(next.calendar, initial.calendar, 'calendar identity proves no covert progression');
  assert.equal(initial.fight.elapsedMilliseconds, 0);
});

test('zero-delta requests and reset at zero never create extra time or snapshots', () => {
  const initial = createGameClocks();
  assert.equal(reduceGameClocks(initial, days(0)), initial);
  assert.equal(reduceGameClocks(initial, millis(0)), initial);
  assert.equal(reduceGameClocks(initial, resetFight), initial);
});

test('reset-fight-clock clears simulated fight time but never advances or rewinds calendar', () => {
  const initial = reduceGameClocks(createGameClocks(77), millis(82_000));
  const next = reduceGameClocks(initial, resetFight);
  assert.deepEqual(next, { calendar: { dayIndex: 77 }, fight: { elapsedMilliseconds: 0 } });
  assert.equal(next.calendar, initial.calendar);
  assert.equal(initial.fight.elapsedMilliseconds, 82_000);
});

test('crossed actions do not secretly create a coupled calendar or fight timeline', () => {
  const actions = [days(2), millis(700), days(1), millis(500), resetFight, days(3), millis(250)];
  const snapshots = [createGameClocks(9)];
  for (const action of actions) snapshots.push(reduceGameClocks(snapshots.at(-1), action));
  assert.deepEqual(snapshots.at(-1), { calendar: { dayIndex: 15 }, fight: { elapsedMilliseconds: 250 } });
  assert.equal(snapshots[0].calendar.dayIndex, 9);
  assert.equal(snapshots[0].fight.elapsedMilliseconds, 0);
  assert.equal(snapshots[1].fight, snapshots[0].fight);
  assert.equal(snapshots[2].calendar, snapshots[1].calendar);
});

test('all snapshots are immutable, including nested calendar and fight state', () => {
  const base = createGameClocks();
  const after = reduceGameClocks(base, days(1));
  for (const snap of [base, after]) {
    assert.ok(Object.isFrozen(snap));
    assert.ok(Object.isFrozen(snap.calendar));
    assert.ok(Object.isFrozen(snap.fight));
  }
  assert.throws(() => { base.calendar.dayIndex = 999; }, TypeError);
  assert.throws(() => { base.fight.elapsedMilliseconds = 999; }, TypeError);
});

test('invalid inputs reject negative, fractional, NaN, Infinity and string deltas', () => {
  const base = createGameClocks(5);
  for (const value of [-1, .5, NaN, Infinity, -Infinity, '7', null, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => reduceGameClocks(base, days(value)), RangeError);
    assert.throws(() => reduceGameClocks(base, millis(value)), RangeError);
    assert.throws(() => createGameClocks(value), RangeError);
  }
  assert.deepEqual(base, { calendar: { dayIndex: 5 }, fight: { elapsedMilliseconds: 0 } });
});

test('reject overflow of calendar or simulated fight milliseconds rather than wrapping', () => {
  const near = createGameClocks(Number.MAX_SAFE_INTEGER - 1);
  assert.equal(reduceGameClocks(near, days(1)).calendar.dayIndex, Number.MAX_SAFE_INTEGER);
  assert.throws(() => reduceGameClocks(near, days(2)), RangeError);
  const fight = reduceGameClocks(createGameClocks(), millis(Number.MAX_SAFE_INTEGER));
  assert.throws(() => reduceGameClocks(fight, millis(1)), RangeError);
  assert.equal(fight.fight.elapsedMilliseconds, Number.MAX_SAFE_INTEGER);
});

test('unknown, implicit, and malformed actions cannot advance either time axis', () => {
  const base = createGameClocks(99);
  for (const action of [{ type: 'tick' }, { type: 'automatic' }, { type: 'advance-both', days: 1, milliseconds: 1 }, {}, null]) {
    assert.throws(() => reduceGameClocks(base, action), TypeError);
  }
  assert.equal(base.calendar.dayIndex, 99);
  assert.equal(base.fight.elapsedMilliseconds, 0);
});

test('invalid or corrupted runtime clock state is rejected, not used for advancement', () => {
  for (const broken of [null, {}, { calendar: { dayIndex: -1 }, fight: { elapsedMilliseconds: 0 } },
    { calendar: { dayIndex: 0 }, fight: { elapsedMilliseconds: -10 } },
    { calendar: { dayIndex: NaN }, fight: { elapsedMilliseconds: 0 } },
    { calendar: null, fight: { elapsedMilliseconds: 0 } }]) {
    assert.throws(() => reduceGameClocks(broken, days(1)), /clock/);
  }
});

test('headless calculations reproduce exactly the same result for the same actions', () => {
  const actions = [days(1), millis(6000), days(0), millis(4000), resetFight, millis(1500), days(365)];
  const run = () => actions.reduce(reduceGameClocks, createGameClocks(8));
  assert.deepEqual(run(), run());
  assert.deepEqual(run(), { calendar: { dayIndex: 374 }, fight: { elapsedMilliseconds: 1500 } });
});

test('idle time, menu navigation and render-only activity have no implicit clock effects', async () => {
  const base = createGameClocks(17);
  const navigation = await readFile(join(root, 'src/navigation/route-state.ts'), 'utf8');
  const navJs = ts.transpileModule(navigation, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const routes = await import(`data:text/javascript;base64,${Buffer.from(navJs).toString('base64')}`);
  let route = routes.initialRouteState();
  route = routes.reduceRoute(route, { type: 'navigate', to: 'career' });
  route = routes.reduceRoute(route, { type: 'back' });
  await Promise.resolve();
  assert.equal(routes.currentRoute(route), 'home');
  assert.equal(base.calendar.dayIndex, 17);
  assert.equal(base.fight.elapsedMilliseconds, 0);
});

test('clock reducer source is independent of rendering, storage, host time and RNG', () => {
  const ast = ts.createSourceFile('clock.ts', source, ts.ScriptTarget.ES2022, true);
  assert.equal(ast.parseDiagnostics.length, 0);
  const imported = ast.statements.filter(n => ts.isImportDeclaration(n));
  assert.deepEqual(imported, [], 'no package, UI, render or cross-domain imports');
  const forbidden = new Set(['Date', 'performance', 'Math', 'setTimeout', 'setInterval', 'requestAnimationFrame',
    'window', 'document', 'localStorage', 'indexedDB', 'navigator', 'fetch', 'preact', 'pixi']);
  const present = [];
  const walk = n => {
    if (ts.isIdentifier(n) && forbidden.has(n.text)) present.push(n.text);
    ts.forEachChild(n, walk);
  };
  walk(ast);
  assert.deepEqual(present, [], `ambient source found: ${present}`);
});

test('clock input and output never use real dates or implicit playback speed', () => {
  const base = createGameClocks(190);
  const x = reduceGameClocks(base, millis(300_000));
  assert.deepEqual(Object.keys(x).sort(), ['calendar', 'fight']);
  assert.deepEqual(Object.keys(x.calendar), ['dayIndex']);
  assert.deepEqual(Object.keys(x.fight), ['elapsedMilliseconds']);
  assert.equal(x.calendar.dayIndex, 190, 'five simulated minutes do not consume a calendar day');
});
