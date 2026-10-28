# LEGACY 3.0 — Typed Route State Foundation

**L3-023 accepted — 23 of 272 tasks complete (October 28, 2026).** Next: **L3-024 — Define game clock, NOT STARTED**. The project is **not playable**; no gameplay or saved career state exists.

## What is implemented

The Preact menu and PixiJS renderer (L3-021) remain independently mounted. The six domain-contract boundaries (L3-022) remain unchanged and guarded by the published [dependency policy](docs/domain-dependencies.json).

**L3-023** adds a pure, strongly typed, DOM-independent menu route state model at [`src/navigation/route-state.ts`](src/navigation/route-state.ts). It provides finite provisional route IDs and immutable bounded in-memory history with `navigate`, `replace`, `back`, `forward`, and `reset`. Navigation transitions are unit-tested without rendering. The route names are not implemented screens or owner-approved final menu art, labels, or layout. Browser History API, URL synchronization, UI route wiring, storage, game time and game simulation are not implemented.

The full [route contract and transition table](docs/L3-023-ROUTE-STATE.md) and [machine-readable acceptance report](docs/L3-023-ACCEPTANCE.json) describe boundary behavior and tests.

## Verification

```sh
npm ci
npm run test:routes
npm run lint:domains
npm run typecheck
npm run test:types:negative
npm run lint
npm test
npm run build
```

These commands passed in [GitHub Actions L3-023 run 40773054871](https://github.com/yoskicreates/Legacy/actions/runs/40773054871). Existing L3-020/L3-021/L3-022 workflows also passed. Chromium tested the unchanged existing Preact/PixiJS UI and setup button on actual Vite development and preview HTTP servers at 375/390/402/430/1280 CSS px: 20/20 checks PASS. These are not physical iPhone Safari tests (NOT_RUN).

The original L3-022 ZIP is immutable. Complete numbered source and historical local Git checkpoints are preserved in ChatGPT Library `/LEGACY_3_0/`. GitHub's separately created commit history is maintained on the [main branch](https://github.com/yoskicreates/Legacy).
