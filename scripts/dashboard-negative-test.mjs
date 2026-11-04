/** Confirm all eight invalid dashboard contracts fail with pinned TypeScript. */
import {spawnSync} from 'node:child_process';
const r=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--project','tsconfig.dashboard-negative.json','--noEmit','--pretty','false'],{encoding:'utf8'});
const errors=(r.stdout+'\n'+r.stderr).split('\n').filter(line=>/error TS\d+:/.test(line));
const local=errors.filter(x=>x.includes('tests/ui/dashboard-negative.ts'));
if(r.status!==2||errors.length!==8||local.length!==8){console.error('Expected eight invalid dashboard fixtures to be rejected, received',r.status,errors.length,local.length);console.error(r.stdout,r.stderr);process.exit(1)}
console.log('L3-045 eight invalid fixtures rejected by strict TypeScript');
