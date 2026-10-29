import { spawnSync } from 'node:child_process';
const result=spawnSync('node',['node_modules/typescript/bin/tsc','--project','tsconfig.safe-area-negative.json','--pretty','false'],{encoding:'utf8'});
const diagnostics=(result.stdout+result.stderr).split('\n').filter(x=>/error TS\d+/.test(x));
if(result.status===0||diagnostics.length!==7||diagnostics.some(x=>!/tests\/shell\/safe-area-negative\.ts/.test(x))) {
 console.error('Expected exactly seven deliberate safe-area TypeScript diagnostics.\n'+result.stdout+result.stderr);process.exit(1);
}
console.log('L3-037: seven invalid safe-area type cases rejected');
