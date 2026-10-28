import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const result = spawnSync(process.execPath, [resolve(root,'node_modules/typescript/bin/tsc'), '--project',
  'tsconfig.indexeddb-negative.json', '--noEmit', '--pretty', 'false'], {cwd:root, encoding:'utf8'});
const diagnostics = result.stdout.match(/error TS\d+/g) ?? [];
if (result.status === 0 || diagnostics.length < 5 || !/TS2540/.test(result.stdout)) {
  console.error('INVALID IndexedDB fixture was not strictly rejected:',result.stdout, result.stderr);
  process.exit(1);
}
console.log(`PASS ${diagnostics.length} expected IndexedDB compiler diagnostics`);
