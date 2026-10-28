import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const r=spawnSync(process.execPath,[resolve(root,'node_modules/typescript/bin/tsc'),'--project','tsconfig.export-import-negative.json','--noEmit','--pretty','false'],{cwd:root,encoding:'utf8'});
const count=(r.stdout.match(/error TS\d+/g)||[]).length;
if(r.status===0||count!==5){console.error(r.stdout,r.stderr,`expected 5 deliberate errors, got ${count}`);process.exit(1)}
console.log('PASS: five negative export/import TypeScript cases rejected');
