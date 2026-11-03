# L3-042 — S01 provisional source and QA handoff

Baseline: accepted GitHub `main` merge `ddacc1a0bb09c02ed06758616c038e682cee1b7f`, tree `3d59dccd58d381b865c8a8346c9649c6a6ed68f5`; L3-041 accepted, 41/272. Local R28 checkpoint was checked against that tree. The full original local Git ancestry is retained separately, never rewritten. Master Blueprint task row: implement accessible illustrated selection-card control, with touch, keyboard and screen reader states; no sliders. Governance: L3-016 nine gates G0–G8.

Changes in this isolated S01:
- `src/ui/selection-card.ts` — reusable Preact native-button, single-choice illustrated selection control with state pruning, disabled/empty state and callback.
- `src/ui/selection-card-contract.ts` — immutable option types, validation, inherited palette/contrast contract.
- `src/ui/selection-card.css` — 375/390/402/430 responsive layout, explicit focus, selected state, high-contrast and reduced-motion behavior.
- `src/selection-card-qa.ts`, `selection-card-qa.html` — standalone review page, no modifications to game mount or fighter artwork.
- `tsconfig.selection-card*.json`, `tests/ui/selection-card-negative.ts`, Node contracts, dedicated browser Playwright runner, GitHub Actions QA workflow and pinned package scripts.

Exclusions: no new fighter character artwork; abstract SVG pictograms only. No gameplay, fight system, persistence, character mutation, route changes, sliders, L3-043, merge or deployment.

Local checks at S01 before push:
- 36/36 focused Node source/contract tests passed with globally installed TypeScript 5.8.3, not clean `npm ci`.
- `npm run lint` passed (repository format/syntax consistency only, not ESLint).
- Domain boundary check passed.
- Seven intentionally invalid TS cases rejected under temporary local Preact declaration shims; NOT a clean strict TypeScript dependency verification.
- Dedicated TS typecheck passed under the same temporary shims; NOT a genuine pinned npm install.
- `python -m py_compile scripts/chromium-selection-card-qa.py` passed (syntax only); NO local genuine browser run yet.
- `npm ci` failed with npm 'Exit handler never called' in the restricted local sandbox. Genuine npm, strict types, Vite dev/build/preview, Chromium mobile/contrast/accessibility and full regressions remain NOT_RUN here and must be validated by GitHub Actions on the exact integration tree.

Status: PARTIAL — source implemented, independent remote verification required. Never mark L3-042 accepted without explicit owner authorization. Physical iPhone Safari NOT_RUN.
