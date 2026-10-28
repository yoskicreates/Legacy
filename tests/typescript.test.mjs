import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve, join} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const run=(args)=>spawnSync(process.execPath,[join(root,'node_modules/typescript/bin/tsc'),...args],{cwd:root,encoding:'utf8'});

test('strict TypeScript configuration enables strictness and game aliases',async()=>{
  const c=JSON.parse(await readFile(join(root,'tsconfig.json'),'utf8'));
  for (const key of ['strict','noImplicitAny','strictNullChecks','noUncheckedIndexedAccess','exactOptionalPropertyTypes','noEmit']) assert.equal(c.compilerOptions[key],true,key);
  assert.equal(c.compilerOptions.paths['@game/*'][0],'src/game/*');
  assert.ok(c.include.includes('src/**/*.ts'));
  assert.ok(!c.include.includes('tests/fixtures/**/*.ts'));
});

test('valid typed source and aliases pass strict compilation',()=>{
  const out=run(['--project','tsconfig.json','--noEmit','--pretty','false']);
  assert.equal(out.status,0,out.stdout+out.stderr);
});

test('negative sample fails strict compilation with TS2322 and TS7006',()=>{
  const out=run(['--project','tsconfig.negative.json','--noEmit','--pretty','false']);
  assert.notEqual(out.status,0);
  assert.match(out.stdout,/error TS2322/);
  assert.match(out.stdout,/error TS7006/);
  assert.match(out.stdout,/intentional-invalid-types\.ts/);
});
