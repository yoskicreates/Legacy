/** PASS only when exactly eight L3-044 unsafe event contracts are rejected. */
import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--project','tsconfig.toast-status-negative.json','--noEmit','--pretty','false'],{encoding:'utf8'});
const errors=(result.stdout+'\n'+result.stderr).split('\n').filter(line=>/error TS\d+:/.test(line));
const scoped=errors.filter(line=>line.includes('tests/ui/toast-status-negative.ts'));
if(result.status!==2||errors.length!==8||scoped.length!==8){
 console.error('Expected exactly eight rejected L3-044 unsafe contracts; got',result.status,errors.length,scoped.length);
 console.error(result.stdout,result.stderr);process.exit(1);
}
console.log('L3-044: eight unsafe toast/save contracts rejected by strict TypeScript');
