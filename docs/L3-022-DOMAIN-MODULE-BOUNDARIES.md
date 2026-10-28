# L3-022 — Domain Module Boundaries

**Status:** In review. Exact Blueprint task: **Set domain module boundaries** (Phase 02, Foundation), dependent on accepted L3-021. Acceptance condition: **Imports respect published dependency rules.** No L3-023 route model or any later feature is implemented.

## Six contract-only modules

All six roots exist beneath `src/domain/`, each with a single typed `index.ts` public entry point. A boundary constant exposes only the stable module name and **`status: 'contracts-only'`**, with **`hasRuntimeSimulation: false`**. The modules have no timers, random generation, event bus, persistence code, storage APIs, behavior, fighters or gameplay.

| Module | Permitted import domains | Cannot import |
| --- | --- | --- |
| `core` | `core` (itself only) | Every other domain; UI/renderer/game; runtime libraries |
| `combat` | `combat`, `core` | `career`, `economy`, `social`, `persistence` |
| `career` | `career`, `core` | `combat`, `economy`, `social`, `persistence` |
| `economy` | `economy`, `core` | `combat`, `career`, `social`, `persistence` |
| `social` | `social`, `core` | `combat`, `career`, `economy`, `persistence` |
| `persistence` | `persistence`, `core` | `combat`, `career`, `economy`, `social` |

The graph is deliberately **acyclic**: `core` has no feature-domain imports. Feature modules can depend on shared core types but never on one another; future coordination belongs in a later approved composition/application layer, not direct feature-module dependencies. `persistence` is an empty contract boundary for now, not an authorized read/write implementation.

## Import syntax and enforcement

1. **Cross-module shared imports:** use `@domain/core` or `@domain/core/...`. Preact menus and PixiJS renderer have separate ownership from L3-021 and are never imported from a domain module.
2. **Local imports:** `./file` and other relative imports must remain inside their own module directory. A relative import into `core` or another domain is **not** an approved exception—use the alias.
3. **Static only:** the TypeScript AST checker evaluates `import`, type-only import, `export ... from`, and `import('...').Type` import types. It rejects dynamic `import(...)`, `require()`, and import-equals syntax because dependency edges otherwise evade static review.
4. **No external dependencies:** domain files cannot import `pixi.js`, `preact`, `node:*`, `@ui`, `@renderer`, `@game`, `@/main`, or unrelated npm packages (including type-only imports).
5. **Closed module registry:** any new directory or file directly beneath `src/domain` not listed in the six-domain policy fails checking. Any future change to the module graph requires an explicit future task and updated independent tests; L3-022 does not grant blanket approval.

**Machine-readable source of truth:** [`domain-dependencies.json`](./domain-dependencies.json).  **Enforcer:** `scripts/check-domain-boundaries.mjs`, run with `npm run lint:domains`. **Regression tests:** `tests/domain-dependencies.test.mjs` hard-code expected edges and exhaustively reject cross-feature links, alias traversal and unsafe imports. **Build aliases:** `tsconfig.json` and `vite.config.mjs` both map `@domain/` to `src/domain/`.

## Acceptance map

- **AC-01:** All six named modules exist, export typed contract-only boundaries, and compile under strict TypeScript.
- **AC-02:** Published policy declares six legal import sets and no unapproved module.
- **AC-03:** Static AST checks reject invalid direct, type-only, re-export, relative traversal, dynamic, and external imports; permitted same-module and core imports pass.
- **AC-04:** Existing Preact/Pixi module separation, browser button, Vite build, and mobile viewport behavior remain unchanged; 375/390/402/430 CSS px plus desktop regression captured from actual Vite dev and preview sessions when cloud CI runs.
- **AC-05:** Clean `npm ci`, typecheck, negative fixture, lint, unit tests, production build, domain checker and previous L3-020/L3-021 regression workflows pass.
- **AC-06:** Previous source data and Git history are preserved in a new, byte-verified immutable checkpoint, with SHA-256 manifest and CRC checked.

## Decisions, exclusions and honest test limits

APPROVED: **DEC-001** original clean restart, **DEC-002** task-by-task verified checkpoints, **DEC-003** mobile-first platform, **DEC-004** no crude approximation of approved illustrated art. **DEC-012** rejected legacy SVG rig imports are excluded. Unresolved art/rig and save UX choices stay **OPEN**, not approved. No monetization or age-rule implementation occurs.

Explicitly excluded: L3-023 routes, L3-024 clock, L3-025 RNG, L3-026 domain events, L3-027 state schema, L3-028+ storage, game mechanics, combat animations, artwork, and integrations. No user-owned business data or personal records. This deliverable is **architecture only**, not a playable game.

Physical iPhone Safari tests are **NOT_RUN** in this environment, even when Chromium checks pass. Cloud CI results and archived screenshots must be attached separately; do not claim them before an actual run.
