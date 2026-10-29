import {spawnSync} from 'node:child_process';
const result=spawnSync('node',['node_modules/typescript/bin/tsc','--project','tsconfig.nested-nav-negative.json','--pretty','false'],{encoding:'utf8'});
const output=result.stdout+result.stderr;
const errors=output.split('\n').filter(x=>/error TS\d+/.test(x));
if(result.status===0 || errors.length!==7 || errors.some(line=>!/tests\/ui\/nested-nav-negative\.ts/.test(line))){
 console.error('Expected seven deliberately invalid L3-040 type errors:\n'+output);process.exit(1);
}
console.log('L3-040: seven invalid nested navigation types rejected');
