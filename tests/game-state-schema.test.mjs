import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');
const source = await readFile(join(root, 'src/domain/core/state-schema.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  fileName: 'state-schema.ts', reportDiagnostics: true,
});
assert.deepEqual(compiled.diagnostics ?? [], []);
const { GAME_STATE_SCHEMA_VERSION, GAME_STATE_RANDOM_ALGORITHM, validateGameState } =
  await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);
const valid = () => ({
  schemaVersion: 1,
  career: { careerId: 'career-1', fighterId: 'fighter-1' },
  clocks: { calendar: { dayIndex: 25 }, fight: { elapsedMilliseconds: 125_000 } },
  random: { algorithm: 'LEGACY3-MULBERRY32-V1', seed: 42, word: 42, draws: 0 },
});
const deepCopy = o => structuredClone(o);
const reject = (candidate, code, path) => {
  const result = validateGameState(candidate);
  assert.deepEqual(result, { ok: false, code, path });
  assert.equal(Object.isFrozen(result), true);
};
const mutate = (path, value) => {
  const object = valid();
  const steps = path.split('.');
  const last = steps.pop();
  let current = object;
  for (const step of steps) current = current[step];
  current[last] = value;
  return object;
};
const typecheck = file => spawnSync(process.execPath,
  [join(root, 'node_modules/typescript/bin/tsc'), '--project', file, '--pretty', 'false', '--noEmit'],
  { cwd: root, encoding: 'utf8' });

test('version and RNG identifiers are explicit and pinned', () => {
  assert.equal(GAME_STATE_SCHEMA_VERSION, 1);
  assert.equal(GAME_STATE_RANDOM_ALGORITHM, 'LEGACY3-MULBERRY32-V1');
});
test('complete V1 core state is accepted without adding or altering any field', () => {
  const original = valid();
  const before = deepCopy(original);
  const result = validateGameState(original);
  assert.equal(result.ok, true);
  assert.deepEqual(result.state, before);
  assert.deepEqual(original, before);
  assert.notStrictEqual(result.state, original);
  assert.notStrictEqual(result.state.clocks, original.clocks);
  assert.notStrictEqual(result.state.random, original.random);
});
test('accepted state is deeply frozen and does not freeze or mutate caller input', () => {
  const input = valid();
  const { state } = validateGameState(input);
  for (const object of [state, state.career, state.clocks, state.clocks.calendar, state.clocks.fight, state.random]) {
    assert.equal(Object.isFrozen(object), true);
  }
  assert.equal(Object.isFrozen(input), false);
  assert.throws(() => { state.clocks.calendar.dayIndex = 999; }, TypeError);
  input.clocks.calendar.dayIndex = 99;
  assert.equal(state.clocks.calendar.dayIndex, 25);
});
test('accepted JSON round trip has identical structure (no import/export implementation)', () => {
  const original = valid();
  const parsed = JSON.parse(JSON.stringify(original));
  const result = validateGameState(parsed);
  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(result.state), JSON.stringify(original));
  assert.deepEqual(validateGameState(result.state), result);
});
test('valid RNG snapshot with nonzero draw count is not reset or silently repaired', () => {
  const original = valid();
  original.random.draws = 33;
  original.random.word = Number((42n + 33n * 0x6D2B79F5n) & 0xFFFF_FFFFn);
  const result = validateGameState(original);
  assert.equal(result.ok, true);
  assert.deepEqual(result.state.random, original.random);
});
test('V1 supports exact numeric safe limits without overflow or truncation', () => {
  const value = valid();
  value.clocks.calendar.dayIndex = Number.MAX_SAFE_INTEGER;
  value.clocks.fight.elapsedMilliseconds = Number.MAX_SAFE_INTEGER;
  value.random.seed = 0xFFFF_FFFF;
  value.random.draws = Number.MAX_SAFE_INTEGER;
  value.random.word = Number((BigInt(value.random.seed) + BigInt(value.random.draws) * 0x6D2B79F5n) & 0xFFFF_FFFFn);
  assert.equal(validateGameState(value).ok, true);
});
test('missing, obsolete and future schema versions cannot be treated as V1', () => {
  reject(mutate('schemaVersion', 0), 'UNSUPPORTED_VERSION', '$.schemaVersion');
  reject(mutate('schemaVersion', 2), 'UNSUPPORTED_VERSION', '$.schemaVersion');
  reject(mutate('schemaVersion', Number.MAX_SAFE_INTEGER), 'UNSUPPORTED_VERSION', '$.schemaVersion');
  for (const bad of ['1', null, NaN, Infinity, 1.5]) reject(mutate('schemaVersion', bad), 'INVALID_VALUE', '$.schemaVersion');
  const missing = valid(); delete missing.schemaVersion;
  reject(missing, 'MISSING_FIELD', '$.schemaVersion');
});
test('malformed input is explicitly rejected, not treated as a default state', () => {
  for (const broken of [null, undefined, true, 4, 1n, 'string', [], new Date(), Object.create({ schemaVersion: 1 })]) {
    reject(broken, 'INVALID_STRUCTURE', '$');
  }
  assert.throws(() => JSON.parse('{broken JSON'), SyntaxError);
});
test('every missing essential nested property causes a rejection', () => {
  for (const path of ['career', 'clocks', 'random', 'career.careerId', 'career.fighterId', 'clocks.calendar', 'clocks.fight',
    'clocks.calendar.dayIndex', 'clocks.fight.elapsedMilliseconds',
    'random.algorithm', 'random.seed', 'random.word', 'random.draws']) {
    const data = valid();
    const parts = path.split('.');
    const last = parts.pop();
    let parent = data;
    for (const part of parts) parent = parent[part];
    delete parent[last];
    reject(data, 'MISSING_FIELD', '$.' + path);
  }
});
test('unexpected fields at any depth cannot be discarded silently', () => {
  for (const path of ['', 'career', 'clocks', 'clocks.calendar', 'clocks.fight', 'random']) {
    const data = valid();
    const parent = path ? path.split('.').reduce((o, k) => o[k], data) : data;
    parent.injected = 12;
    reject(data, 'UNEXPECTED_FIELD', '$.' + (path ? path + '.' : '') + 'injected');
  }
});
test('missing and blank career identifiers reject without ID generation', () => {
  for (const path of ['career.careerId', 'career.fighterId']) {
    for (const bad of ['', '  ', 17, null, {}, []]) {
      reject(mutate(path, bad), 'INVALID_VALUE', '$.' + path);
    }
  }
});
test('negative, fractional, string, non-finite and unsafe clock values reject', () => {
  for (const path of ['clocks.calendar.dayIndex', 'clocks.fight.elapsedMilliseconds']) {
    for (const bad of [-1, 1.1, '3', NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, null, true]) {
      reject(mutate(path, bad), 'INVALID_VALUE', '$.' + path);
    }
  }
});
test('invalid PRNG algorithm and invalid uint32 seed/word/draws reject', () => {
  reject(mutate('random.algorithm', 'OTHER'), 'INVALID_VALUE', '$.random.algorithm');
  for (const bad of [-1, 0x1_0000_0000, 1.3, NaN, '12', null]) {
    reject(mutate('random.seed', bad), 'INVALID_VALUE', '$.random.seed');
    reject(mutate('random.word', bad), 'INVALID_VALUE', '$.random.word');
  }
  for (const bad of [-1, 1.1, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, '1']) {
    reject(mutate('random.draws', bad), 'INVALID_VALUE', '$.random.draws');
  }
});
test('corrupted RNG word inconsistent with seed and draws is rejected, never corrected', () => {
  const candidate = mutate('random.word', 123);
  const before = deepCopy(candidate);
  reject(candidate, 'CORRUPT_RANDOM_STATE', '$.random.word');
  assert.deepEqual(candidate, before);
  const another = valid();
  another.random.draws = 1; // word is still seed, no consumed draw was recorded
  reject(another, 'CORRUPT_RANDOM_STATE', '$.random.word');
});
test('nested null, arrays, exotic prototypes and accessors are rejected', () => {
  for (const path of ['career', 'clocks', 'clocks.calendar', 'clocks.fight', 'random']) {
    reject(mutate(path, null), 'INVALID_STRUCTURE', '$.' + path);
    reject(mutate(path, []), 'INVALID_STRUCTURE', '$.' + path);
    reject(mutate(path, new Date()), 'INVALID_STRUCTURE', '$.' + path);
  }
  const withAccessor = valid();
  let readCount = 0;
  Object.defineProperty(withAccessor.random, 'seed', { enumerable: true, get() { readCount++; return 42; } });
  reject(withAccessor, 'INVALID_STRUCTURE', '$.random.seed');
  assert.equal(readCount, 0, 'Never execute untrusted getters');
});
test('prototype-polluting keys and symbol properties are rejected', () => {
  const candidate = JSON.parse('{"schemaVersion":1,"clocks":{"calendar":{"dayIndex":25},"fight":{"elapsedMilliseconds":125000}},"career":{"careerId":"career-1","fighterId":"fighter-1"},"random":{"algorithm":"LEGACY3-MULBERRY32-V1","seed":42,"word":42,"draws":0},"__proto__":{"admin":true}}');
  reject(candidate, 'UNEXPECTED_FIELD', '$.__proto__');
  const symbol = valid(); symbol.random[Symbol('x')] = 3;
  reject(symbol, 'UNEXPECTED_FIELD', '$.random.Symbol(x)');
});
test('revoked proxies reject without throwing or touching original state', () => {
  const proxy = Proxy.revocable(valid(), {}); proxy.revoke();
  reject(proxy.proxy, 'INVALID_STRUCTURE', '$');
});
test('failed validation never mutates candidate even with frozen or null-prototype objects', () => {
  const original = valid();
  const frozen = Object.freeze({ ...original, schemaVersion: 19 });
  reject(frozen, 'UNSUPPORTED_VERSION', '$.schemaVersion');
  const nullProto = Object.assign(Object.create(null), original);
  assert.equal(validateGameState(nullProto).ok, true);
  assert.deepEqual(original, valid());
});
test('strict TypeScript positive types compile; deliberate invalid schema fixture fails >=5 times', () => {
  const positive = typecheck('tsconfig.state.json');
  assert.equal(positive.status, 0, positive.stdout + positive.stderr);
  const negative = typecheck('tsconfig.state-negative.json');
  assert.notEqual(negative.status, 0);
  assert.match(negative.stdout, /invalid-game-state-schema\.ts/);
  assert.ok([...negative.stdout.matchAll(/error TS\d+/g)].length >= 5, negative.stdout);
  assert.match(negative.stdout, /TS2540/);
});
test('validator has no browser I/O, persistent storage, UI, random draw or time advance', () => {
  const tree = ts.createSourceFile('state-schema.ts', source, ts.ScriptTarget.ES2022, true);
  const forbidden = new Set(['window', 'document', 'indexedDB', 'localStorage', 'sessionStorage',
    'fetch', 'setTimeout', 'setInterval', 'Date', 'Math', 'nextRandomUint32', 'reduceGameClocks']);
  const seen = [];
  function visit(node) {
    if (ts.isIdentifier(node) && forbidden.has(node.text)) seen.push(node.text);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  assert.deepEqual(seen, []);
});
