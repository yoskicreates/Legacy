import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','--project','tsconfig.panel-kit-negative.json','--noEmit','--pretty','false'],{encoding:'utf8'});
const errors=(result.stdout+result.stderr).split('\n').filter(line=>/error TS\d+:/.test(line));
if(result.status===0||errors.length!==8||errors.some(line=>!line.includes('tests/ui/panel-kit-negative.ts'))){console.error(result.stdout,result.stderr,`Expected exactly eight invalid kit types, got ${errors.length}`);process.exit(1);}
console.log('L3-041: eight invalid kit types correctly rejected');
