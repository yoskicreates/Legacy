# LEGACY 3.0 — Domain Boundary Foundation

**L3-022 accepted — 22 of 272 tasks complete (October 28, 2026).** Next task **L3-023 NOT STARTED**. The game is **not playable**; no gameplay or save data exists.

Six contract-only domains exist beneath `src/domain`: `core`, `combat`, `career`, `economy`, `social`, `persistence`. The shared `core` module imports no feature modules; other modules import only themselves or `core`. The imports are checked using a TypeScript AST, with strict allowlist JSON in [`docs/domain-dependencies.json`](docs/domain-dependencies.json) and rationale in [`docs/L3-022-DOMAIN-MODULE-BOUNDARIES.md`](docs/L3-022-DOMAIN-MODULE-BOUNDARIES.md). This does not implement L3-023 route navigation, L3-024 clock, combat, fighter art, domain events, or saves.

Commands: `npm ci`, `npm run lint:domains`, and `npm run verify`. L3-022 CI and earlier L3-020/L3-021 regression workflows passed including 20 responsive Chromium checks at 375/390/402/430/1280 CSS pixels on real Vite development and preview servers. Browser testing does **not** claim physical iPhone Safari verification.

Review: https://github.com/yoskicreates/Legacy/pull/3
Evidence: https://github.com/yoskicreates/Legacy/actions/runs/40771316904

The earlier independent Preact menu and PixiJS renderer remain isolated and unchanged; this is still a technical foundation, not a playable MMA simulator. Original checkpoint ZIPs and historical local Git objects are retained under ChatGPT Library `/LEGACY_3_0/`.

---

