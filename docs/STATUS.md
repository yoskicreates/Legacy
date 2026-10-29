# LEGACY 3.0 TASK STATUS

**L3-040 — Build nested navigation: COMPLETE / ACCEPTED (review branch; merge pending)**  
**Progress: 40 accepted / 272**  
**Next: L3-041 — NOT STARTED**

L3-040 adds ten honest non-playable two-level detail previews (two each under Career, Fighter, Fight, Life, Finances) to the accepted L3-039 mobile navigation. Native breadcrumb buttons return to the actual parent or section root, Back/Forward traverse route-scoped detail history, and switching tabs preserves each section’s last in-memory detail selection without touching saves. Browser reload clears all preview detail state deliberately. The existing L3-023 top-level route reducer, L3-038 home controls, L3-035 tokens, L3-036 typography, L3-037 safe-area shell and independent PixiJS renderer remain intact.

**Verified review:** PR #21 commit `76d943dafa5cdf0bc1b4995878c81e6adc2dad13` passed **21/21 GitHub workflows**, including clean pinned `npm ci`, strict TypeScript, seven intentionally invalid type cases, 17 dedicated nested contract tests, lint/domain boundaries, all inherited L3-020–039 regressions, genuine Vite production build, independently verified hashed build manifest and real Chromium on genuine Vite dev/preview at 375, 390, 402 and 430 CSS pixels. Nested navigation passed **1,416 browser assertions** across eight responsive runs; inherited bottom navigation passed **1,104 browser assertions**. No browser exceptions, horizontal overflow, or broken Back/Forward/keyboard/heading focus/safe-area interactions. Device Safari: **NOT_RUN** (simulated insets are not physical measurements).

The accepted source, full original Git-history repository, Vite static preview, QA screenshots/logs and numbered integrity audit must be saved to `/LEGACY_3_0/` before merge. LEGACY 3.0 remains a non-playable UI foundation. No fighter, combat, financial, relationship, save or gameplay changes occurred. **L3-041 remains planned and untouched.**
