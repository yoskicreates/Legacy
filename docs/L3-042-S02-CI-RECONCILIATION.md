# L3-042 S02 — genuine CI regression reconciliation

Status: PROVISIONAL / NOT ACCEPTED; accepted baseline L3-041 merge `ddacc1a0bb09c02ed06758616c038e682cee1b7f`. No merge, deployment, game code or L3-043.

## Confirmed root cause

The initial S01 draft PR #27 (`c78ff95f97cc8ea6aad3c8dbe8d4d036701a414e`) triggered 23 GitHub Actions workflows. Clean pinned npm installation, L3-042 strict typecheck and seven negative cases, its focused unit tests, and inherited L3-041 checks passed in the new L3-042 workflow's first step. Multiple inherited workflows then failed during `npm test` with **413 of 414 tests passing**, solely at `tests/tooling.test.mjs` / `browser placeholder exists but gameplay is still absent`.

That legacy test asserted the exact contents of the `src/` root, but the new isolated `src/selection-card-qa.ts` file must exist for the genuine Vite L3-042 preview. The only observed difference in that directory listing was the new preview entry. The test was updated to explicitly include that approved preview while continuing to protect against unrelated root files; it still checks the original game index/README remains non-playable.

## S02 change and QA gate

Only one inherited test expectation changed; no selected-card application source or previous accepted game files changed. A separate S02 documentation record describes the reason and preserved regression coverage. Local targeted unit and syntax checks are rerun; full clean npm/Vite/Chromium and all 23 GitHub workflows on the **new S02 commit** must be checked independently. No acceptance until owner authorization.
