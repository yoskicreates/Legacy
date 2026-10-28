import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const tsc = resolve(root, 'node_modules/typescript/bin/tsc');
const result = spawnSync(process.execPath, [tsc, '--project', 'tsconfig.autosave-negative.json', '--noEmit', '--pretty', 'false'], {cwd:root,encoding:'utf8'});
const errors = result.stdout.match(/error TS\d+/g) ?? [];
if (result.status === 0 || errors.length < 5 || !result.stdout.includes('TS2322')) {
  console.error(result.stdout,result.stderr,'Expected 5 negative contract errors'); process.exit(1);
}
console.log(`PASS: ${errors.length} deliberately invalid autosave types rejected`);
