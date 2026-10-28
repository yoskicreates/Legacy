/** L3-020 readiness gate: refuse to certify Vite unless its actual CLI is available. */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const expected = ['vite'];
const found = [];
const missing = [];
for (const dep of expected) {
  try {
    const packagePath = require.resolve(`${dep}/package.json`);
    const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
    const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
    if (!lock.packages?.[`node_modules/${dep}`]) throw new Error('No locked dependency');
    found.push({ name: dep, version: pkg.version });
  } catch (error) { missing.push({ name: dep, reason: error.message }); }
}
if (missing.length) {
  console.error('BLOCKED: real Vite is absent or missing a lockfile entry.');
  for (const item of missing) console.error(`- ${item.name}: ${item.reason}`);
  console.error('To finish L3-020 when npm networking is available: npm install --save-dev --save-exact vite@6.3.6, then run npm run build:vite and npm run dev:vite.');
  process.exitCode = 2;
} else console.log(`READY: ${found.map(x => x.name + '@' + x.version).join(', ')}. Run genuine Vite build/dev tests before approving.`);
