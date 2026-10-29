import {spawnSync} from 'node:child_process';
const result=spawnSync('node',['node_modules/typescript/bin/tsc','--project','tsconfig.home-negative.json','--pretty','false'],{encoding:'utf8'});
const output=(result.stdout+result.stderr);
const diagnostics=output.split('\n').filter(x=>/error TS\d+/.test(x));
if(result.status===0||diagnostics.length!==7||diagnostics.some(x=>!/tests\/ui\/home-negative\.ts/.test(x))){
 console.error('Expected exactly seven deliberate home contract errors:\n'+output);process.exit(1);
}
console.log('L3-038: seven deliberately invalid home type cases rejected');
