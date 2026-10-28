/** Confirm the intentionally invalid TS fixture genuinely fails strict compiler checks. */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const bin = resolve(root, 'node_modules', 'typescript', 'bin', 'tsc');
const result = spawnSync(process.execPath, [bin, '--project', 'tsconfig.negative.json', '--pretty', 'false', '--noEmit'], {cwd: root, encoding: 'utf8'});
const output = result.stdout + result.stderr;
if (result.status === 0 || !output.includes('error TS2322') || !output.includes('error TS7006') || !output.includes('intentional-invalid-types.ts')) {
  console.error('FAIL negative strict-TypeScript acceptance: expected both TS2322 and TS7006; got:', result.status, output);
  process.exit(1);
}
console.log('PASS deliberate negative fixture: TypeScript rejected null, implicit any and incompatible literals.');
console.log(output.trim());
