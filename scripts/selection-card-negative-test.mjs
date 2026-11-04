import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--project','tsconfig.selection-card-negative.json','--noEmit','--pretty','false'],{encoding:'utf8'});
const errors=(result.stdout+result.stderr).split('\n').filter(line=>/error TS\d+:/.test(line));
if(result.status===0||errors.length!==7||errors.some(line=>!line.includes('tests/ui/selection-card-negative.ts'))){
  console.error(result.stdout,result.stderr,`Expected exactly 7 L3-042 invalid types, saw ${errors.length}`);process.exit(1);
}
console.log('L3-042: seven invalid selection-card types correctly rejected');
