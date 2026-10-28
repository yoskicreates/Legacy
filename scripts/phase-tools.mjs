/** LEGACY3 L3-019 — package workflow with strict TypeScript. No web bundle is produced. */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join, relative, extname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const excluded = new Set(['.git', 'node_modules', 'dist', 'coverage', '.vite']);
const digest = input => createHash('sha256').update(input).digest('hex');

async function listFiles(dir = root) {
  const files = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (excluded.has(item.name)) continue;
    const full = join(dir, item.name);
    if (item.isDirectory()) files.push(...await listFiles(full));
    else if (item.isFile()) files.push(full);
  }
  return files.sort();
}

async function lint() {
  const files = await listFiles();
  const issues = [];
  let reviewed = 0;
  for (const file of files) {
    const path = relative(root, file).replaceAll('\\', '/');
    if (!/\.(mjs|js|json)$/.test(path)) continue;
    const content = await readFile(file, 'utf8');
    reviewed++;
    if (!content.endsWith('\n')) issues.push(`${path}: missing final newline`);
    if (content.includes('\r')) issues.push(`${path}: CR line endings`);
    if (content.split('\n').some(line => /[ \t]+$/.test(line))) issues.push(`${path}: trailing whitespace`);
    if (extname(file) === '.json') {
      try { JSON.parse(content); } catch (error) { issues.push(`${path}: malformed JSON — ${error.message}`); }
    }
  }
  if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; return; }
  console.log(`PASS lint: ${reviewed} code/JSON files checked for syntax/format consistency`);
  console.log('NOTE: ESLint rules are not configured at this stage.');
}

async function typecheck() {
  const check = spawnSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--project', join(root, 'tsconfig.json'), '--noEmit'], {cwd:root,encoding:'utf8'});
  if (check.status !== 0) { console.error(check.stdout + check.stderr); process.exitCode=1; return; }
  console.log('PASS: TypeScript strict project compilation (noEmit)');
}

async function build() {
  const files = (await listFiles()).filter(f => !f.endsWith('.gitkeep'));
  const manifest = [];
  for (const f of files) {
    const body = await readFile(f);
    manifest.push({ path: relative(root, f).replaceAll('\\', '/'), sha256: digest(body) });
  }
  await mkdir(join(root, 'dist'), { recursive: true });
  const output = {
    kind: 'LEGACY3_SCAFFOLD_READINESS',
    milestone: 'L3-019',
    runnable_web_application: false,
    vite_pipeline: 'NOT_CONFIGURED_L3_020',
    typescript_strict: 'CONFIGURED_L3_019',
    files: manifest,
  };
  await writeFile(join(root, 'dist', 'scaffold-manifest.json'), JSON.stringify(output, null, 2) + '\n');
  console.log(`PASS scaffold artifact: dist/scaffold-manifest.json (${manifest.length} files)`);
  console.log('NOT A WEB BUILD: Vite production bundling belongs to L3-020.');
}

const command = process.argv[2];
if (command === 'lint') await lint();
else if (command === 'typecheck') await typecheck();
else if (command === 'build') await build();
else { console.error('Usage: node scripts/phase-tools.mjs build|lint|typecheck'); process.exitCode = 2; }
