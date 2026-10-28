import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
const source = await readFile(join(root, 'src/domain/core/random.ts'), 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  fileName: 'random.ts', reportDiagnostics: true,
});
assert.deepEqual(transpiled.diagnostics ?? [], []);
const {
  RANDOM_ALGORITHM, createRandomSource, nextRandomUint32, nextRandomUnitInterval,
} = await import(`data:text/javascript;base64,${Buffer.from(transpiled.outputText).toString('base64')}`);

function sequence(seed, count, take = nextRandomUint32) {
  let state = createRandomSource(seed);
  const values = [];
  for (let i = 0; i < count; i++) {
    const next = take(state);
    values.push(next.value);
    state = next.state;
  }
  return { values, state };
}

test('algorithm is explicit and immutable snapshots begin at exactly the given seed', () => {
  assert.equal(RANDOM_ALGORITHM, 'LEGACY3-MULBERRY32-V1');
  assert.deepEqual(createRandomSource(0), { seed: 0, word: 0, draws: 0 });
  assert.deepEqual(createRandomSource(0xFFFF_FFFF), { seed: 0xFFFF_FFFF, word: 0xFFFF_FFFF, draws: 0 });
  assert.ok(Object.isFrozen(createRandomSource(9)));
});

test('same seed and draw order produce identical uint32 sequences across independent sources', () => {
  for (const seed of [0, 1, 42, 0x12345678, 0xFFFF_FFFF]) {
    assert.deepEqual(sequence(seed, 1_000), sequence(seed, 1_000));
  }
});

test('pinned algorithm version yields known explicit output vectors, not only self-consistency', () => {
  assert.deepEqual(sequence(0, 7).values, [0x4434B462, 0x00159C37, 0x39285B08, 0x256D8104, 0x77A2CBD4, 0x8B885631, 0x9D811D5F]);
  assert.deepEqual(sequence(1, 7).values, [0xA087EAF3, 0x00B349C9, 0x8706C4EB, 0xFB2627FD, 0xF7E79D2B, 0x47F66630, 0x9CE301F0]);
  assert.deepEqual(sequence(42, 7).values, [0x99E1EF7C, 0x72C32B8A, 0xDA3B32C0, 0xAB73B0AD, 0x2CC09A8A, 0x86CEC4D3, 0x45F24514]);
  assert.deepEqual(sequence(0xFFFF_FFFF, 7).values, [0xE57BF3D3, 0x3081A5A4, 0xB7350390, 0xF1ADE904, 0xD8616A2F, 0x8A051437, 0xAE35198D]);
});

test('different seeds produce different streams and zero is a usable seed', () => {
  assert.notDeepEqual(sequence(1, 50).values, sequence(2, 50).values);
  assert.notDeepEqual(sequence(0, 50).values, sequence(0xFFFF_FFFF, 50).values);
  assert.equal(sequence(0, 100).state.draws, 100);
});

test('every uint32 draw lies in the inclusive integer domain [0, 2^32-1]', () => {
  const { values } = sequence(0xABCDEF12, 2_048);
  for (const value of values) {
    assert.ok(Number.isInteger(value) && value >= 0 && value <= 0xFFFF_FFFF);
  }
});

test('unit interval draw matches the identical uint32 draw and remains in [0,1)', () => {
  let a = createRandomSource(42);
  let b = createRandomSource(42);
  for (let i = 0; i < 1_024; i++) {
    const raw = nextRandomUint32(a);
    const unit = nextRandomUnitInterval(b);
    assert.equal(unit.value, raw.value / 0x1_0000_0000);
    assert.ok(unit.value >= 0 && unit.value < 1);
    assert.deepEqual(raw.state, unit.state);
    a = raw.state;
    b = unit.state;
  }
});

test('state transitions never mutate parent snapshots, including value and next state', () => {
  const rootState = createRandomSource(42);
  const first = nextRandomUint32(rootState);
  const second = nextRandomUint32(first.state);
  assert.ok(Object.isFrozen(rootState));
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.state));
  assert.ok(Object.isFrozen(second.state));
  assert.deepEqual(rootState, { seed: 42, word: 42, draws: 0 });
  assert.equal(first.state.draws, 1);
  assert.equal(second.state.draws, 2);
  assert.throws(() => { first.state.seed = 0; }, TypeError);
  assert.throws(() => { first.value = -1; }, TypeError);
});

test('replaying from a held snapshot yields exactly the same future samples', () => {
  let state = createRandomSource(0x12345678);
  for (let i = 0; i < 7; i++) state = nextRandomUint32(state).state;
  const anchor = state;
  const nextA = Array.from({ length: 50 }, () => { const result = nextRandomUint32(state); state = result.state; return result.value; });
  let replay = { ...anchor };
  const nextB = Array.from({ length: 50 }, () => { const result = nextRandomUint32(replay); replay = result.state; return result.value; });
  assert.deepEqual(nextA, nextB);
  assert.deepEqual(replay, state);
  assert.equal(anchor.draws, 7);
});

test('interleaving two sources never couples streams or consumes covert random draws', () => {
  const expected = sequence(999, 10).values;
  let a = createRandomSource(999);
  let b = createRandomSource(88);
  const actual = [];
  for (let i = 0; i < 10; i++) {
    const fromA = nextRandomUint32(a);
    a = fromA.state;
    actual.push(fromA.value);
    for (let j = 0; j < 4; j++) b = nextRandomUint32(b).state;
  }
  assert.deepEqual(actual, expected);
  assert.equal(a.draws, 10);
  assert.equal(b.draws, 40);
});

test('a draw wraps unsigned 32-bit internal state without precision loss', () => {
  const state = createRandomSource(0xFFFF_FFFF);
  const result = nextRandomUint32(state);
  assert.equal(result.state.word, (0xFFFF_FFFF + 0x6D2B79F5) >>> 0);
  assert.equal(result.state.seed, 0xFFFF_FFFF);
  assert.equal(result.state.draws, 1);
});

test('invalid seeds are rejected instead of silently coerced, including missing seed', () => {
  const bad = [-1, 0x1_0000_0000, 3.5, NaN, Infinity, -Infinity, '1', null, undefined, 1n, true, {}, []];
  for (const value of bad) assert.throws(() => createRandomSource(value), /random|integer/);
  assert.throws(() => createRandomSource(), RangeError);
});

test('corrupted snapshot state is rejected before any draw', () => {
  for (const state of [null, undefined, {}, { seed: 3, word: -1, draws: 0 },
    { seed: 3, word: 0, draws: NaN }, { seed: 3, word: 0, draws: -1 },
    { seed: 3, word: 0, draws: Number.MAX_SAFE_INTEGER + 1 },
    { seed: 3, word: 0x1_0000_0000, draws: 0 },
    { seed: 3, word: 0, draws: '0' }]) {
    assert.throws(() => nextRandomUint32(state), /random/);
    assert.throws(() => nextRandomUnitInterval(state), /random/);
  }
});

test('draw-counter overflow throws, leaving the source state unchanged', () => {
  const state = Object.freeze({ seed: 1, word: 5, draws: Number.MAX_SAFE_INTEGER });
  assert.throws(() => nextRandomUint32(state), /overflow/);
  assert.equal(state.draws, Number.MAX_SAFE_INTEGER);
});

test('the generator is independent of ambient random, clocks, crypto, DOM and storage', () => {
  const ast = ts.createSourceFile('random.ts', source, ts.ScriptTarget.ES2022, true);
  assert.equal(ast.parseDiagnostics.length, 0);
  assert.deepEqual(ast.statements.filter(node => ts.isImportDeclaration(node)), []);
  const forbiddenIdentifiers = new Set(['Date', 'performance', 'setTimeout', 'setInterval', 'requestAnimationFrame',
    'window', 'document', 'localStorage', 'indexedDB', 'navigator', 'crypto', 'fetch']);
  const forbidden = [];
  const walk = node => {
    if (ts.isIdentifier(node) && forbiddenIdentifiers.has(node.text)) {
      // Comments are excluded by the AST; fail only if source uses an ambient API.
      forbidden.push(node.text);
    }
    if (ts.isPropertyAccessExpression(node) && node.expression.getText(ast) === 'Math' && node.name.text === 'random') forbidden.push('Math.random');
    ts.forEachChild(node, walk);
  };
  walk(ast);
  assert.deepEqual(forbidden, []);
  const original = Math.random;
  Math.random = () => { throw Error('ambient entropy called'); };
  try { assert.deepEqual(sequence(7, 100), sequence(7, 100)); }
  finally { Math.random = original; }
});

test('generating random numbers has no automatic effects on calendar/fight clocks or routes', async () => {
  const clocks = await readFile(join(root,'src/domain/core/clock.ts'),'utf8');
  const emitted = ts.transpileModule(clocks,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const { createGameClocks } = await import(`data:text/javascript;base64,${Buffer.from(emitted).toString('base64')}`);
  const state = createGameClocks(15);
  sequence(25, 100);
  assert.deepEqual(state, {calendar:{dayIndex:15},fight:{elapsedMilliseconds:0}});
});
