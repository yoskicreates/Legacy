#!/usr/bin/env bash
# LEGACY 3.0 L3-020 — network-enabled completion attempt. NOT evidence of prior success.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
echo "L3-020: installing official Vite 6.3.6. An npm registry connection is required."
node --version
npm --version
npm install --save-dev --save-exact vite@6.3.6
# Repoint the main commands only once real Vite has been installed and recorded.
node --input-type=module <<'NODE'
import fs from 'node:fs';
const f='package.json'; const p=JSON.parse(fs.readFileSync(f,'utf8'));
if (!p.devDependencies?.vite) throw new Error('Vite missing after npm install');
p.scripts.dev='vite --host 127.0.0.1';
p.scripts.build='vite build';
p.scripts.preview='vite preview --host 127.0.0.1';
p.scripts['install:clean']='npm ci --ignore-scripts';
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
NODE
npm ci --ignore-scripts
npm run check:vite
npm run typecheck
npm run test:types:negative
npm run lint
npm test
npm run build
node --input-type=module <<'NODE'
import fs from 'node:fs';
const html=fs.readFileSync('dist/index.html','utf8');
if (!html.includes('LEGACY')) throw new Error('Missing title in Vite production HTML');
if (!fs.existsSync('dist/assets') || !fs.readdirSync('dist/assets').some(f=>f.endsWith('.js'))) throw new Error('No genuine bundled JS asset');
console.log('Vite output checks passed');
NODE
# Both real Vite servers must respond with an index and JavaScript assets.
for kind in dev preview; do
  if [[ "$kind" == dev ]]; then port=5173; else port=4173; fi
  npm run "$kind" -- --strictPort >"/tmp/legacy3-l3-020-${kind}.log" 2>&1 & pid=$!
  trap 'kill "$pid" 2>/dev/null || true' EXIT
  success=0
  for i in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:${port}/" -o "/tmp/legacy3-${kind}.html"; then success=1; break; fi
    sleep 1
  done
  if [[ "$success" != 1 ]]; then cat "/tmp/legacy3-l3-020-${kind}.log"; exit 1; fi
  grep -q 'LEGACY' "/tmp/legacy3-${kind}.html"
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
  trap - EXIT
  echo "PASS: genuine Vite $kind HTTP endpoint"
done
echo 'L3-020 build/server checks passed. STILL REQUIRED: browser interaction, four mobile widths, screenshots, and independent checkpoint acceptance before closing L3-020.'
