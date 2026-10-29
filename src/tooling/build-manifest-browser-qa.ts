import type { VerifiedBuildManifest } from './build-manifest-contract';
declare global { interface Window { __LEGACY3_BUILD_MANIFEST_QA__?: {read:()=>Promise<VerifiedBuildManifest>; hash:(text:string)=>Promise<string>} } }
async function hash(text:string):Promise<string> { const bytes=new TextEncoder().encode(text);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join(''); }
async function read():Promise<VerifiedBuildManifest> { const result=await fetch('/build-manifest.json',{cache:'no-store'}); if(!result.ok)throw Error(`missing build manifest: ${result.status}`);return await result.json() as VerifiedBuildManifest; }
window.__LEGACY3_BUILD_MANIFEST_QA__=Object.freeze({read,hash});
document.documentElement.dataset.manifestQaReady='true';
