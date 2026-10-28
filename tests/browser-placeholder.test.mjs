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
test('L3-021 keeps the genuine Vite browser entry and prior setup button contract',async()=>{
 const page=await readFile(join(root,'index.html'),'utf8');
 const ui=await readFile(join(root,'src/ui/menu.ts'),'utf8');
 assert.match(page, /src="\/src\/main\.ts"/);
 assert.match(page, /id="menu-root"/);
 assert.match(page, /id="renderer-root"/);
 assert.match(page, /viewport-fit=cover/);
 assert.match(ui, /id: 'check-button'/);
 assert.match(ui, /Browser module loaded and interaction verified\./);
});
