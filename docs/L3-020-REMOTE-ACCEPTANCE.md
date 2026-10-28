# L3-020: cloud-runner acceptance package (NOT YET EXECUTED)

This checkpoint adds **one** GitHub Actions workflow, `.github/workflows/l3-020-vite-acceptance.yml`,
and a browser test, `scripts/chromium-vite-qa.py`. No Vite build, GitHub Actions run, or official
Vite installation has succeeded in the offline ChatGPT runtime yet.

## Purpose

A connected GitHub account could host this preserved Git repository and execute the workflow
in a remote network-enabled GitHub Actions runner. The workflow runs the already-existing
`scripts/complete-vite-networked.sh`, installs browser testing requirements, and verifies
**both actual Vite development and production-preview HTTP servers** in headless Chromium at
375, 390, 402, 430, and 1280px. It exports the resulting `dist/`, screenshots, test logs,
and updated `package.json` / `package-lock.json` as a CI artifact.

## Unfinished gates

- GitHub connection and repository upload/creation: **pending**, no permission assumed.
- GitHub Actions execution: **not run**.
- Vite 6.3.6 download and package-lock update: **not run successfully**.
- `npm ci` with official Vite and real Vite build/serve/preview: **not verified**.
- Real Vite-served browser tests: **not verified**.
- Copy validated build/lockfile back into versioned source and final QA: **pending**.

Never mark L3-020 complete or start L3-021 until the user-approved L3-016 acceptance
contract is met. Existing offline fallback browser verification remains valid but does not
satisfy the genuine Vite gates.

## Exact source-of-truth

Preserve all earlier `/LEGACY_3_0/` checkpoint archives and existing Git commits. This
workflow adds no old LEGACY/V2 game code, and must not invent any game functionality.
