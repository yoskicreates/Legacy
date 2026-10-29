import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const tsc=resolve(root,'node_modules/typescript/bin/tsc');
const out=spawnSync(process.execPath,[tsc,'--project','tsconfig.typography-negative.json','--noEmit','--pretty','false'],{cwd:root,encoding:'utf8'});
const count=(out.stdout.match(/error TS\d+/g)||[]).length;
if(out.status===0||count!==7){console.error(out.stdout,out.stderr,`expected 7 TypeScript errors, received ${count}`);process.exitCode=1;}
else console.log('PASS: seven invalid typography contracts rejected by TypeScript');
