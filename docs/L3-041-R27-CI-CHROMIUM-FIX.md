# LEGACY 3.0 — L3-041 R27: actual GitHub Chromium QA failure reconciliation

## Verified provenance

- R26 local commit: `7ba6184dc505efe9279f897d5ed4bda7d2474ac4`; remote R26 commit: `fb761e3254bc827959f1f9a4a21a48888dffe5dc`, both with identical tree `ea5fd4bb8091b845b41d19566994edb2a9308438`.
- GitHub R26 Actions run: `41707014698` (`L3-041 Panel and Card Kit Acceptance`): one job failed in `Real Chromium light/dark panel kit and all preceding browser regressions`. Clean npm ci, strict TypeScript/negative contracts, inherited regression tests, production Vite build, manifest verification, and Chromium install all passed before that step.
- All 21 other R26 workflows passed. The actual R26 runner artifact was downloaded as `L3-041-R26-GITHUB-QA.zip`, and `kit-dev/results.json` was inspected rather than guessing at the cause.

## Root cause and scoped correction

The browser assertion in `scripts/chromium-panel-kit-qa.py` expected `v['dl']==1`. Real Chromium observed `dl:2` at 375, 390, 402 and 430px because `PanelKitGallery` intentionally renders two `StatPanel`s: the normal fighter-rating card and the progress-variant preview. Each correctly renders a native HTML definition list.

R27 corrects the Chromium expected count to two and adds `tests/panel-kit-browser-contract.test.mjs` so a future gallery change cannot silently desynchronize the assertion. It does **not** reduce accessibility, contrast, interaction, or responsive requirements.

The R26 captured dark-theme initial-snapshot values also showed no overflow, no clipped or undersized controls, all eleven component types, 14 gallery cards, accessible headings and action labels, zero sliders, and minimum tested foreground/button contrast 7.55:1. This analysis of a previously failed snapshot is **not** a substitute for a clean complete interaction/browser run.

## Verification scope

- 13/13 dependency-free targeted Node regressions passed.
- 54/54 panel-kit Node unit/contract tests passed when using a globally installed TypeScript symlink (not a clean pinned npm ci).
- Custom project `npm run lint` passed; `npm run lint:domains` passed using globally linked TypeScript.
- `python -m py_compile` passed on the updated real Playwright runner.
- Local Chromium attempt was blocked by the sandbox's administrator URL policy (`net::ERR_BLOCKED_BY_ADMINISTRATOR`); **do not report it as passing local browser QA**.
- Full remote GitHub Actions on the R27 commit must still validate genuine Vite/Preact dev and preview interactions, strict TypeScript and mobile Chromium for full L3-041 acceptance.

## Restrictions

No acceptance, merge, deployment or L3-042 changes. The accepted main commit, PR #22/#23 and Copilot branch are not modified. Preserve original local R18–R27 Git ancestry in the numbered full-history bundle and matching source archive. Official progress remains 40/272 until every gate passes and owner reviews acceptance.
