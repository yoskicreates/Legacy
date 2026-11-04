/** Negative typing is PASS only if precisely eight documented invalid contracts fail. */
import {spawnSync} from 'node:child_process';
const tsc='node_modules/typescript/bin/tsc';
const run=spawnSync(process.execPath,[tsc,'--project','tsconfig.confirm-dialog-negative.json','--noEmit','--pretty','false'],{encoding:'utf8'});
const lines=(run.stdout+'\n'+run.stderr).split('\n').filter(x=>/error TS\d+:/.test(x));
const invalid=lines.filter(x=>x.includes('tests/ui/confirm-dialog-negative.ts'));
if(run.status!==2 || lines.length!==8 || invalid.length!==8){
 console.error('Expected exactly eight rejected L3-043 TypeScript contracts. Actual exit:',run.status,'errors:',lines.length,'expected-file errors:',invalid.length);
 console.error(run.stdout,run.stderr);process.exit(1);
}
console.log('L3-043: all eight invalid confirmation contracts correctly rejected');
