# LEGACY 3.0 — L3-020 browser placeholder / Vite setup pending

This is **not playable as a game**. The browser placeholder is the first small functioning web page. No fighter, career, UI framework, renderer, save system, or simulated fight exists.

## Network-limited L3-020 status

**PARTIAL / BLOCKED:** `vite.config.mjs` establishes Vite aliases, development server, and production-build settings. However, genuine Vite is not installed in this offline environment; the npm registry could not be resolved. `npm run dev:vite` and `npm run build:vite` are **NOT VERIFIED** and cannot be claimed as passing. The placeholder below was built using the already-installed local TypeScript compiler and a clearly labeled temporary Node fallback, **not Vite**. The task remains L3-020 until the actual Vite pipeline passes.

## Verified, reproducible commands

```sh
npm run install:clean       # offline install of vendored TypeScript 5.8.3
npm run lint
npm run typecheck           # strict tsc --noEmit
npm run test:types:negative # intentionally invalid types rejected
npm test                    # Node unit tests
npm run build              # offline fallback outputs dist/index.html and assets
npm run dev                # offline development fallback on http://127.0.0.1:5173
npm run preview            # offline build preview on http://127.0.0.1:4173
npm run verify
```

Future Vite commands, only after installing genuine Vite with a pin and lockfile:

```sh
npm run dev:vite
npm run build:vite
npm run preview:vite
```

The `dist` folder's static site is deployable as a visual **placeholder**, but does not demonstrate Vite bundling, HMR, Preact, PixiJS, fights, career systems, or iPhone Safari validation. The offline fallback is removable once Vite is available. No old LEGACY code or art has been imported.
