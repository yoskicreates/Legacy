# L3-041 R26 — local QA and safe handoff (not accepted)

Source parent: R25 `937c1ee1261e170dbd62154f04e16da4ad684b8b`.
Origin of R25: verified R16 `19a92a2e98ad09b3f215846446240f4f42b70158`.

## Scoped changes

- ChecklistCard prunes removed preview item IDs when the parent's item ID sequence changes. A removed ID does not become checked again if its item later reappears without another interaction. Retains referentially identical state when no pruning is needed.
- Added three runnable source-updater regressions for item pruning and preserved R25 checklist tests.
- Reconciled L3-041 genuine Chromium QA script with the **11** integrated panel-kit components plus 3 gallery variant components. Checks real generated IDs instead of obsolete hardcoded selectors, native controls, focus, keyboard, theme, forms, contrast, mobile widths, safe-area simulation and portrait/landscape. This script requires genuine Vite/Preact dev/preview and was NOT run against either here.
- Restored a dependency-free offline attribute serializer helper required by an inherited contract test. It is NOT a substitute for a genuine Vite browser.
- Updated inherited source regression expectations to match R25's current, props-reconciled checklist state (without weakening native checkbox or status assertions).

## Executed checks

- `node --test tests/panel-kit-*.test.mjs`: **12/12 PASS**.
- `node --test tests/panel-kit.test.mjs`: **41/41 PASS**, with locally linked TypeScript 5.8.3 (NOT a clean npm ci installation).
- `npm run lint`: PASS, 114 source/JSON files; phase-tools syntax checks, not ESLint.
- `npm run lint:domains`: PASS, 15 TS modules in six domain boundaries, locally linked TypeScript 5.8.3.
- `python -m py_compile scripts/chromium-panel-kit-qa.py`: PASS (syntax only).
- `npm test`: **384 PASS / 6 FAIL out of 390** with locally linked TS 5.8.3; six TypeScript-compiler cases could not resolve missing earcut/estree type packages. This is NOT a full test pass.

## Blocked / not run

- `npm ci` timed out because network package registry was unreachable. Incomplete node_modules is NOT included in the archive.
- Clean strict TypeScript, negative cases, Vite build/dev/preview and genuine Chromium tests cannot be certified in this environment.
- The current Copilot remote reconciliation branch is separate and diverged from passing R16; never overwrite it or mark it accepted.
- R26 is only committed locally and has NOT been pushed to GitHub. The R19 remote branch remains at R16 baseline, not at this integration.
- GitHub Actions full acceptance and owner sign-off are required before merging L3-041. Do not deploy or start L3-042.
