/** L3-034: verifiable, deterministic build manifest. Never trust externally supplied PASS labels. */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstat, readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, join, dirname, sep } from 'node:path';

export const TASK = 'L3-034';
export const FORMAT = 'LEGACY3_VERIFIED_BUILD_MANIFEST_V1';
export const CHECKS = Object.freeze([
  ['lint', ['run', 'lint']],
  ['domain-boundaries', ['run', 'lint:domains']],
  ['typescript-strict', ['run', 'typecheck']],
  ['negative-type-tests', ['run', 'test:types:negative']],
  ['fixture-negative-tests', ['run', 'test:fixtures:negative']],
  ['unit-tests', ['test']],
  ['vite-production-build', ['run', 'build']],
]);
const SKIP = new Set(['.git','node_modules','dist','coverage','.vite','.cache','l3-034-evidence','l3-034-acceptance']);
const GENERATED = new Set(['public/build-manifest.json','dist/build-manifest.json']);
export const sha256 = data => createHash('sha256').update(data).digest('hex');
function insist(condition, message) { if (!condition) throw new Error(message); }
const normalized = p => p.split(sep).join('/');
export function canonicalObject(obj) { return JSON.stringify(obj, null, 2) + '\n'; }

async function collect(dir, root, allowEmpty = false) {
  const found=[];
  async function walk(path) {
    const stat=await lstat(path);
    insist(!stat.isSymbolicLink(), `symbolic link not allowed: ${path}`);
    if(stat.isDirectory()) {
      for(const item of (await readdir(path)).sort()) {
        if(SKIP.has(item))continue;
        await walk(join(path,item));
      }
    } else if(stat.isFile()) {
      const rel=normalized(relative(root,path));
      if(GENERATED.has(rel))return;
      const body=await readFile(path);
      found.push({path:rel,bytes:body.length,sha256:sha256(body)});
    } else throw Error(`unsupported file type: ${path}`);
  }
  await walk(dir);
  found.sort((a,b)=>a.path.localeCompare(b.path,'en'));
  insist(allowEmpty || found.length>0,'no files to verify');
  return found;
}
export async function inventory(root, name) {
  const dir=join(root,name);
  const stat=await lstat(dir);
  insist(stat.isDirectory()&&!stat.isSymbolicLink(),`${name} is not a directory`);
  return collect(dir,root);
}
export async function sourceInventory(root) {
  const found=await collect(root,root);
  return found.filter(x=>!x.path.startsWith('l3-034-acceptance/')&&!x.path.startsWith('l3-034-evidence/'));
}
function digestInventory(files) { return sha256(Buffer.from(JSON.stringify(files))); }
function validateKnownIssues(issues) {
  insist(Array.isArray(issues),'known issues must be an array');
  for(const x of issues)insist(typeof x==='string'&&x.trim().length>0&&x.length<400,'invalid known issue');
  insist(new Set(issues).size===issues.length,'duplicate issues');
  return issues;
}
export async function runChecks(root, evidenceDir, runner=spawnSync) {
  const checks=[];
  await mkdir(evidenceDir,{recursive:true});
  for(const [id,args] of CHECKS) {
    const result=runner('npm',args,{cwd:root,encoding:'utf8',timeout:180000,env:process.env,maxBuffer:20*1024*1024});
    const combined=String(result.stdout??'')+String(result.stderr??'');
    const logPath=join(evidenceDir,`${id}.log`);
    await writeFile(logPath,combined);
    insist(result.status===0 && !result.error && !result.signal, `CHECK_FAILED ${id} code=${result.status} ${result.error?.message??''}`);
    insist(combined.trim().length>0,`EMPTY_EVIDENCE ${id}`);
    checks.push({id,command:['npm',...args],exitCode:result.status,log:`l3-034-evidence/${id}.log`,logBytes:Buffer.byteLength(combined),logSha256:sha256(Buffer.from(combined))});
  }
  return checks;
}
export async function buildVerifiedManifest(root, checks) {
  insist(Array.isArray(checks)&&checks.length===CHECKS.length,'missing checks');
  for(let i=0;i<CHECKS.length;i++) {
    const check=checks[i];const [id,args]=CHECKS[i];
    insist(check?.id===id&&JSON.stringify(check.command)===JSON.stringify(['npm',...args])&&check.exitCode===0,'missing or failed command evidence');
    insist(check.log===`l3-034-evidence/${id}.log`,'unexpected evidence path');
    const body=await readFile(join(root,check.log));
    insist(body.length>0&&body.length===check.logBytes&&sha256(body)===check.logSha256,'stale or tampered test evidence');
  }
  const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
  const issues=validateKnownIssues(JSON.parse(await readFile(join(root,'docs/L3-034-KNOWN-ISSUES.json'),'utf8')));
  const source=await sourceInventory(root), built=await inventory(root,'dist');
  insist(source.some(x=>x.path==='package.json')&&built.some(x=>x.path==='dist/index.html'),'missing source or genuine Vite index');
  return {format:FORMAT,taskId:TASK,projectVersion:pkg.version,buildTool:'vite',verification:'PASS',knownIssues:issues,
    source:{sha256:digestInventory(source),files:source},build:{sha256:digestInventory(built),files:built},tests:checks};
}
export async function verifyManifest(root, manifest) {
  insist(manifest?.format===FORMAT&&manifest.taskId===TASK&&manifest.verification==='PASS','invalid manifest header or unverified status');
  const expected=await buildVerifiedManifest(root,manifest.tests);
  insist(canonicalObject(expected)===canonicalObject(manifest),'stale, missing or tampered build manifest');
  return true;
}
export async function generate(root) {
  const evidence=join(root,'l3-034-evidence');
  const checks=await runChecks(root,evidence);
  // Manifest itself is excluded from the file list to avoid a circular hash.
  const manifest=await buildVerifiedManifest(root,checks);
  await mkdir(join(root,'public'),{recursive:true});
  await writeFile(join(root,'public/build-manifest.json'),canonicalObject(manifest));
  await writeFile(join(root,'dist/build-manifest.json'),canonicalObject(manifest));
  await verifyManifest(root,manifest);
  return manifest;
}
if(process.argv[1] && resolve(process.argv[1])===resolve(import.meta.filename)) {
  const root=resolve(import.meta.dirname,'..');
  try {
    if(process.argv.length!==3)throw Error('Usage: node scripts/build-manifest.mjs generate|verify');
    const command=process.argv[2];
    if(command==='generate') {
      const m=await generate(root);
      console.log(`PASS verified ${m.taskId} manifest, ${m.source.files.length} source, ${m.build.files.length} build files, ${m.tests.length} logged checks`);
    } else if(command==='verify') {
      const manifest=JSON.parse(await readFile(join(root,'dist/build-manifest.json'),'utf8'));
      insist(canonicalObject(manifest)===await readFile(join(root,'public/build-manifest.json'),'utf8'),'dev/preview manifest mismatch');
      await verifyManifest(root,manifest);
      console.log(`PASS verified ${TASK} manifest: exact files, SHA-256, evidence, version and known issues`);
    } else throw Error('Unknown command');
  } catch(error){console.error(`FAIL BUILD MANIFEST: ${error.message}`);process.exitCode=1}
}
