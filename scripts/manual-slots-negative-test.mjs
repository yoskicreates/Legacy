import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const result=spawnSync(process.execPath,[resolve(root,'node_modules/typescript/bin/tsc'),'--project','tsconfig.manual-slots-negative.json','--pretty','false','--noEmit'],{cwd:root,encoding:'utf8'});
const codes=(result.stdout.match(/error TS\d+/g)||[]);
if(result.status===0||codes.length!==5||!result.stdout.includes('TS2322')||!result.stdout.includes('TS2345')){
 console.error(result.stdout,result.stderr,'Five intentional manual-slot type errors expected');process.exit(1);
}
console.log('PASS: five intentionally invalid manual slot types rejected');
