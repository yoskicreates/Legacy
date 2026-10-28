import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
test('Vite config aliases agree with strict TypeScript paths', async()=>{
 const cfg=(await import(join(root,'vite.config.mjs'))).default;
 const ts=JSON.parse(await readFile(join(root,'tsconfig.json'),'utf8'));
 for(const [key,alias] of Object.entries({'@game':'@game/*','@ui':'@ui/*','@renderer':'@renderer/*','@':'@/*'})){
   assert.ok(cfg.resolve.alias[key].startsWith(root));
   assert.ok(ts.compilerOptions.paths[alias]?.length===1);
 }
 assert.equal(cfg.base,'./');assert.equal(cfg.build.outDir,'dist');
});
test('real Vite tasks are primary and the historical fallback stays clearly labeled',async()=>{
 const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
 assert.equal(pkg.scripts['build:vite'],'vite build');
 assert.equal(pkg.scripts.build, 'vite build');
 const server=await readFile(join(root,'scripts/web-pipeline.mjs'),'utf8');
 assert.match(server,/DOES NOT claim to be Vite/);
});
test('source HTML is a real browser entry with no gameplay claims',async()=>{
 const page=await readFile(join(root,'index.html'),'utf8');
 assert.match(page, /src="\/src\/main\.ts"/);
 assert.match(page, /no[t]? been built/i);
 assert.match(page, /id="check-button"/);
 assert.match(page, /viewport-fit=cover/);
});
test('placeholder build serves simple browser assets',async()=>{
 const built=spawnSync(process.execPath,['scripts/web-pipeline.mjs','build'],{cwd:root,encoding:'utf8'});
 assert.equal(built.status,0,built.stderr);
 const js=await readFile(join(root,'dist/assets/main.js'),'utf8');
 assert.match(js,/addEventListener/);
 assert.match(js,/aria-pressed/);
});
test('placeholder interaction changes the status without network or gameplay', async()=>{
 const {runInNewContext}=await import('node:vm');
 const script=(await readFile(join(root,'dist/assets/main.js'),'utf8')).replace(/^export\s*\{\s*\}\s*;?\s*$/gm,'');
 let click;let pressed=false;
 const button={addEventListener:(name,cb)=>{assert.equal(name,'click');click=cb;},setAttribute:(key,value)=>{assert.equal(key,'aria-pressed');pressed=value==='true';}};
 const result={textContent:'Browser script not checked yet.'};
 const doc={documentElement:{dataset:{}},querySelector:(selector)=>selector==='#check-button'?button:selector==='#check-result'?result:null};
 runInNewContext(script,{document:doc});
 assert.equal(doc.documentElement.dataset.jsReady,'true');
 assert.equal(typeof click,'function');
 click();
 assert.match(result.textContent,/interaction verified/);
 assert.equal(pressed,true);
});
