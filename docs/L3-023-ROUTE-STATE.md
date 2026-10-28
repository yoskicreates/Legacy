# LEGACY 3.0 — L3-023 Route State Model

**Status:** COMPLETE / ACCEPTED (23/272). GitHub Actions route and preceding regressions verified, immutable ZIP checkpoint validated.

## Blueprint traceability

- **L3-023:** Implement route state model.
- **Build:** Define typed menu routes and navigation history.
- **Test:** Route transitions can be unit-tested without rendering.
- **Dependency:** L3-022 accepted (six domain-module contracts and import rules).
- **Next:** L3-024 game clock — out of scope, not started.

## Scope and design

Pure module: `src/navigation/route-state.ts`. It has no imports. It never reads or mutates HTML, Preact, PixiJS, `window.history`, URL, localStorage, IndexedDB, clock, random state, or a gameplay domain. All state lives only in an immutable in-memory snapshot supplied by the caller. There is deliberately no app-menu wiring until a later task authorizes UI navigation.

The provisional route identifiers are `home`, `character`, `career`, `training`, `fight`, `social`, `economy`, and `settings`. These strings are typed placeholders for future navigation, **not built screens, approved visual labels, enabled gameplay, or finalized information architecture**. No route-specific pages are rendered.

### State and actions

`RouteState = { entries: readonly MenuRoute[]; cursor: number }` is frozen with its entry array. `MENU_ROUTE_IDS` is a typed tuple; `MenuRoute` is its union. `RouteAction` is a discriminated union, so invalid actions and targets fail strict TypeScript checks. Runtime calls reject unrecognized route identifiers. `currentRoute`, `canGoBack`, and `canGoForward` derive state without mutation.

| Action | Effect | No-op behavior |
|---|---|---|
| `navigate` | Push target after current entry; discard future after going back | Same active route returns identical snapshot |
| `replace` | Replace only active entry; preserve backward and forward positions | Same active route returns identical snapshot |
| `back` | Move cursor back one, without changing entries | At first entry, return identical snapshot |
| `forward` | Move cursor forward one | At final entry, return identical snapshot |
| `reset` | Clear history to one target route | If already exactly that single route, return identical snapshot |

History is bounded to 32 entries. When a push exceeds 32, discard the oldest entry; the active cursor remains on the newest entry. This is a technical memory cap for transient history, **not a persistence or game-save policy**.

### Deterministic headless example

```ts
let state = initialRouteState(); // ['home'] @0
state = reduceRoute(state, { type: 'navigate', to: 'character' });
state = reduceRoute(state, { type: 'navigate', to: 'career' });
state = reduceRoute(state, { type: 'back' }); // 'character'
state = reduceRoute(state, { type: 'navigate', to: 'fight' }); // drops 'career' forward history
// entries: ['home', 'character', 'fight']; cursor: 2
```

### Verification scope

- L3-023 new: `node --test tests/route-state.test.mjs` — 10 headless transition tests; runtime input validation, history immutability, back/forward, branching, replace, reset, 32-entry cap, determinism, AST no-DOM/no-import checks.
- Type safety: `src/tooling/route-types-smoke.ts` tests valid discriminated route actions and intentional invalid assignments using `@ts-expect-error`; `tsc --noEmit` is mandatory.
- Prior regressions: `npm run lint:domains`, `npm run lint`, `npm run test:types:negative`, `npm test`, genuine `npm run build`, existing Chromium scripts for Preact/Pixi mounting and original setup button at 375/390/402/430/1280 CSS pixels on development and preview servers.
- Physical iPhone Safari test: NOT_RUN; browser Chromium emulation is not a physical device test.
- Existing UI entrypoints, CSS, PixiJS rendering and approved L3-022 domain contracts are intentionally unchanged.

### Decisions and exclusions

Applicable approved: DEC-001 (new source; no LEGACY V1/V2 imports), DEC-002 (one task, verified checkpoints), DEC-003 (mobile-first target). Rejected DEC-012 (no old SVG rigs or old code). DEC-020 (portrait-first navigation) remains PROPOSED; route IDs and this pure model do not approve or implement any creative menu design. Other OPEN/PROPOSED creative decisions remain unchanged.

Explicitly excluded: L3-024 game clock, L3-025 PRNG, L3-026 domain events, L3-027 save schemas, L3-028 IndexedDB, HTML History API integration, menu button wiring, user-facing navigation, character creator, fight simulation, and any gameplay.

Source of truth: the immutable `LEGACY_3_0_L3-022_COMPLETE_SOURCE.zip` parent, SHA-256 `ebf0c7e815a3dfd794f8c13daba6922b7875957d2fda07460e213d0d08b65cca`. The full 272-row task register, blueprint and Decision Log are retained in the immutable source checkpoint.

**Verified cloud CI:** https://github.com/yoskicreates/Legacy/actions/runs/40773054871 (all stages PASS); independent L3-020/L3-021/L3-022 regression workflows also PASS.
