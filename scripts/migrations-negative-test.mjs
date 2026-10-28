import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const r=spawnSync(process.execPath,[resolve(root,'node_modules/typescript/bin/tsc'),'--project','tsconfig.migrations-negative.json','--noEmit','--pretty','false'],{cwd:root,encoding:'utf8'});
const count=(r.stdout.match(/error TS\d+/g)||[]).length;
if(r.status===0||count!==6){console.error(r.stdout,r.stderr,`expected 6 deliberate errors, got ${count}`);process.exit(1)}
console.log('PASS: six negative migrations TypeScript diagnostics rejected');
