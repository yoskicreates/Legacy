import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temp=mkdtempSync(join(tmpdir(),'legacy-settings-'));
try {
 execFileSync('tsc',['--target','ES2022','--module','commonjs','--moduleResolution','node','--skipLibCheck','--rootDir','src','--outDir',temp,'src/ui/settings-contract.ts'],{stdio:'pipe'});
 const compiled=readFileSync(join(temp,'ui','settings-contract.js'),'utf8');
 const file=join(temp,'settings-contract.cjs');writeFileSync(file,compiled);
 const {DEFAULT_SETTINGS,SETTINGS_STORAGE_KEY,parseSettings,serializeSettings,isSettingsPreferences,textScale}=await import(pathToFileURL(file).href);
 test('versioned independent settings storage',()=>assert.equal(SETTINGS_STORAGE_KEY,'legacy3.settings.v1'));
 test('defaults are valid and immutable',()=>{assert.equal(isSettingsPreferences(DEFAULT_SETTINGS),true);assert.equal(Object.isFrozen(DEFAULT_SETTINGS),true);});
 test('roundtrip all discrete settings',()=>{for(const audio of ['on','off'])for(const motion of ['full','reduced'])for(const textSize of ['normal','large','largest']){const p={audio,motion,textSize};assert.deepEqual(parseSettings(serializeSettings(p)),p);}});
 test('corrupt JSON falls back safely',()=>{for(const s of [null,'{','[]','false','null','42'])assert.deepEqual(parseSettings(s),DEFAULT_SETTINGS);});
 test('reject invalid settings and do not persist unexpected keys',()=>{for(const p of [{audio:'loud',motion:'full',textSize:'normal'},{audio:'on',motion:'fast',textSize:'normal'},{audio:'on',motion:'full',textSize:'gigantic'},null]){assert.equal(isSettingsPreferences(p),false);assert.throws(()=>serializeSettings(p));}});
 test('text scaling remains bounded',()=>{assert.equal(textScale('normal'),1);assert.equal(textScale('large'),1.125);assert.equal(textScale('largest'),1.25);});
 test('no game state mutation or network upload in settings shell',()=>{const s=readFileSync(new URL('../src/ui/settings-shell.ts',import.meta.url),'utf8');assert.doesNotMatch(s,/indexedDB|fetch\(|XMLHttpRequest|gameState|saveCareer/);assert.match(s,/URL\.createObjectURL/);assert.match(s,/URL\.revokeObjectURL/);});
 test('no sliders and accessible discrete controls',()=>{const s=readFileSync(new URL('../src/ui/settings-shell.ts',import.meta.url),'utf8');assert.doesNotMatch(s,/type:'range'|type="range"/);assert.match(s,/fieldset/);assert.match(s,/legend/);assert.match(s,/aria-pressed/);assert.match(s,/aria-live/);});
 test('Vite builds the QA entry',()=>assert.match(readFileSync(new URL('../vite.config.mjs',import.meta.url),'utf8'),/settingsQa/));
} finally {process.on('exit',()=>rmSync(temp,{recursive:true,force:true}));}
