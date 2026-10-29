# LEGACY 3.0 TASK STATUS

**L3-039 — Build bottom navigation: COMPLETE / ACCEPTED (merge pending)**  
**Progress: 39 accepted / 272**  
**Next: L3-040 — NOT STARTED**

The mobile Preact navigation includes **Career**, **Fighter**, **Fight**, **Life**, and **Finances** tabs. They adapt to the existing L3-023 immutable route-state contracts: `career`, `character`, `fight`, `social`, and `economy`. Back, Forward, Home and active-tab states work without introducing a competing router. Focus is managed on route changes, with semantic native buttons and keyboard outlines.

All five tab destinations are explicitly **non-playable previews**; there is no career, created fighter, active fight, relationship, balance, purchase, save mutation, or gameplay. The L3-038 home Start/Continue/Settings panels and all L3-035–037 visual/safe-area tokens remain intact; PixiJS is still independently mounted.

**Acceptance evidence:** GitHub PR #20 review commit `5b001aa31a7d8c0fd2446067c89b3cf57a967177` passed all 20 GitHub Actions workflows, including clean npm ci, strict TypeScript, seven negative type cases, dedicated navigation tests, lint/domain boundaries, unit tests, genuine Vite build, verified hashed build manifest, and all inherited L3-020–038 workflows. Real Chromium on both Vite dev and preview passed at 375, 390, 402, 430 CSS pixels: 8/8 successful navigation runs and **1,104 assertions**, with zero page exceptions and no horizontal overflow. Includes touch targets, keyboard focus, Back/Forward/Home, 200% text sizing, simulated safe insets, landscape and reload.

Physical iPhone Safari: **NOT_RUN**. Simulated safe-area insets are not hardware measurements. The code milestone is accepted for review; merge only after the acceptance-documentation commit itself passes all checks and the verified numbered source/repository/static-preview/QA checkpoints are saved to Library `/LEGACY_3_0/`.

LEGACY 3.0 remains a non-playable visual foundation. **Do not begin L3-040 or other future milestones here.**
