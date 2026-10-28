# LEGACY 3.0 — Genuine Vite Foundation

**L3-020 accepted — 20 of 272 tasks complete (October 28, 2026).** The next numbered task, L3-021, has **not started**.

This is an original, mobile-first MMA Career & Life Simulator project foundation. The current browser page is a **placeholder; it is not playable as a game**. Fighter creation, simulated fights, career progression and gameplay remain future tasks.

## Official development tooling

Pinned dev dependencies: **TypeScript 5.8.3** and **Vite 6.3.6**, installed via the committed npm lockfile.

```bash
npm ci
npm run check:vite
npm run typecheck
npm run test:types:negative
npm run lint
npm test
npm run build
npm run dev
npm run preview
```

`build`, `dev`, and `preview` use official Vite; production output appears in `dist/`. The historical temporary fallback (`scripts/web-pipeline.mjs`) remains for provenance and regression tests but is not the primary development pipeline.

## Acceptance results

The [successful L3-020 GitHub Actions run](https://github.com/yoskicreates/Legacy/actions/runs/40765111151) performed a clean npm installation, strict TypeScript checks, negative-type tests, lint, Node tests, genuine Vite build and both browser servers. Chromium tests passed at **375, 390, 402, 430 and 1280 pixels** against the dev and preview servers (10/10 checks), including button interaction, no horizontal overflow, no HTTP errors and no JavaScript errors. Its artifact contains screenshots and the built output.

The older ZIP checkpoints, including the original TypeScript 5.8.3 vendored tarball and historical local Git graph, are preserved in ChatGPT Library `/LEGACY_3_0/`. The new GitHub repository uses a fresh import history and npm registry-backed dependencies; its history is **not** claimed to include the full original Git history.

**Do not advance to L3-021 without a separate request.**
