# LEGACY 3.0 — L3-043 S02 QA integration

This is an **isolated pre-acceptance** change. The accepted 42/272 task register, previously approved art, gameplay, saves, navigation and unrelated components are unchanged.

## Task behavior

A native HTML `dialog` opens only in the confirmation preview. The Cancel button and Escape must never invoke `onConfirm` or change game state. Confirm invokes `onConfirm` at most once per open action, including duplicate clicks. The initial focus lands on Cancel. Dialog title, explanation and button labels are accessible. Standard and warning styles follow the navy/gold rules, offer light/forced-color alternatives, and allow reduced-motion users to avoid animation. No range sliders.

## Newly added checks

- `npm run typecheck:confirm-dialog` — strict production contract and component with pinned Preact.
- `npm run test:confirm-dialog:negative` — **exactly eight** intentional invalid TypeScript assignments must be rejected, with no unrelated errors.
- `npm run test:confirm-dialog` and `node --test tests/confirm-dialog-*.test.mjs` — component and QA contractual safeguards.
- `scripts/chromium-confirm-dialog-qa.py` on genuine Vite dev **and** preview, 375/390/402/430 CSS widths, dark and light, normal and forced-colors/reduced-motion; focus, keyboard, Cancel/Confirm/Escape, duplicate event guarding, 200%-font layout, touch targets, overflow and zero browser errors.
- All inherited regressions: existing GitHub Actions are also triggered by the PR and the new L3-043 workflow runs the Node unit suite and inherited type tests. Production manifest is independently generated and checked.

The previous S01 branch passed **23/23 inherited GitHub workflow runs**, but those did **not** include this dedicated L3-043 browser/negative-type acceptance. S02 adds that gap. Neither success on S01 nor a static-source test constitutes L3-043 acceptance.

## Limitations and decisions

Local sandbox cannot complete clean pinned `npm ci` because package downloads are blocked; local broad Node tests then fail dependency-loading. Do not claim local Vite or real browser execution passed. GitHub's clean dependency and real Chromium runs must validate this commit. The owner explicitly defers physical iPhone Safari testing until approximately milestone 136, so physical Safari remains **NOT_RUN** (not PASS). S02 remains review-only and must not be merged/accepted until all mandatory code and browser checks pass. No deployment.
