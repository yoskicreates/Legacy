/**
 * L3-020 temporary offline fallback for the working HTML placeholder.
 * This deliberately DOES NOT claim to be Vite. Run npm run dev:vite / build:vite
 * when genuine Vite can be installed; see docs/STATUS.md.
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import ts from 'typescript';
const root = resolve(import.meta.dirname, '..');
const dist = join(root,'dist');
const command = process.argv[2];
const transpile = source => {
  const { outputText, diagnostics } = ts.transpileModule(source, {fileName:'src/main.ts', reportDiagnostics:true, compilerOptions:{target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.ESNext, strict:true}});
  if(diagnostics?.length) throw new Error('TypeScript transpile diagnostics present');
  return outputText;
};
async function generatedIndex(){
  return (await readFile(join(root,'index.html'),'utf8'))
    .replace('href="/src/style.css"','href="./assets/style.css"')
    .replace('src="/src/main.ts"','src="./assets/main.js"');
}
async function build(){
  await rm(dist,{recursive:true,force:true});
  await mkdir(join(dist,'assets'),{recursive:true});
  await writeFile(join(dist,'index.html'),await generatedIndex());
  await writeFile(join(dist,'assets','style.css'),await readFile(join(root,'src/style.css')));
  await writeFile(join(dist,'assets','main.js'),transpile(await readFile(join(root,'src/main.ts'),'utf8')));
  console.log('PASS offline placeholder build: dist/index.html + assets. WARNING: not Vite output.');
}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
async function server(mode){
  const host='127.0.0.1'; const port=Number(process.env.PORT || (mode==='dev'?5173:4173));
  const handler=async (req,res)=>{
    try{
      const u=new URL(req.url??'/',`http://${host}:${port}`);
      const raw=u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname);
      if(raw.includes('..')||raw.includes('\\')){res.writeHead(400);res.end('Invalid path');return;}
      const allowed=mode==='dev'?new Set(['/index.html','/src/main.ts','/src/style.css']):new Set(['/index.html','/assets/main.js','/assets/style.css']);
      if(!allowed.has(raw)){res.writeHead(404);res.end('Not found');return;}
      let data=await readFile(join(mode==='dev'?root:dist,raw));
      let ext=extname(raw);
      if(mode==='dev'&&raw==='/src/main.ts'){data=Buffer.from(transpile(data.toString('utf8'))); ext='.js';}
      res.writeHead(200,{'Content-Type':types[ext]??'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      res.end(data);
    }catch(error){res.writeHead(500);res.end('Preview error');console.error(error);}
  };
  createServer(handler).listen(port,host,()=>console.log(`OFFLINE ${mode.toUpperCase()} FALLBACK http://${host}:${port}/ (not Vite)`));
}
if(command==='build')await build();
else if(command==='dev'||command==='preview')await server(command);
else{console.error('Expected build, dev, or preview');process.exitCode=2;}
