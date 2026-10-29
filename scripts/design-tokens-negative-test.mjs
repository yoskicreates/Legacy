import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const out=spawnSync(process.execPath,[resolve(root,'node_modules/typescript/bin/tsc'),'--project','tsconfig.design-tokens-negative.json','--noEmit','--pretty','false'],{cwd:root,encoding:'utf8'});
const count=(out.stdout.match(/error TS\d+/g)||[]).length;
if(out.status===0||count!==7){console.error(out.stdout,out.stderr,`expected 7 TypeScript errors, got ${count}`);process.exit(1)}
console.log('PASS: 7 deliberately invalid design token TypeScript contracts rejected');
