import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const result=spawnSync(process.execPath,[resolve(root,'node_modules/typescript/bin/tsc'),'--project','tsconfig.build-manifest-negative.json','--noEmit','--pretty','false'],{cwd:root,encoding:'utf8'});
const count=(result.stdout.match(/error TS\d+/g)||[]).length;
if(result.status===0||count!==6){console.error(result.stdout,result.stderr,`expected 6 errors, received ${count}`);process.exit(1)}
console.log('PASS: six intentionally invalid manifest TypeScript contracts rejected');
