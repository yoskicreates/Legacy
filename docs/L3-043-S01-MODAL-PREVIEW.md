# LEGACY 3.0 L3-043 — Confirmation pop-up (S01 provisional)

**Scope:** One reusable, accessible native HTML `<dialog>` with preview-only Cancel and Confirm actions. The Cancel and Escape paths never invoke the Confirm callback. Confirm invokes its host callback at most once per open. The isolated gallery increments local in-memory counters solely as test observations; it never changes game state, saves, characters or actual purchases.

**Visual rules:** Original midnight navy, warm gold, soft white; scoped light variant; 48px+ buttons, keyboard focus, 375/390/402/430 safe-area responsive layout, forced-colors and reduced-motion styling. No sliders and no fighter art modifications.

**Acceptance still required:** Clean npm ci, strict TypeScript, negative type tests, full inherited regressions and lint, genuine Vite dev/build/preview, real Chromium open/cancel/confirm/Escape/keyboard/focus/overflow with full evidence, verified source and full history ZIP/bundle. Physical iPhone Safari remains NOT_RUN by the owner's decision to defer device testing until approximately half the roadmap. This S01 build is NOT accepted, merged or deployed.
