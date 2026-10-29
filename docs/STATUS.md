# LEGACY 3.0 TASK STATUS

**L3-038 — Build home screen layout: COMPLETE / ACCEPTED (merged on main)**  
**Progress: 38 accepted / 272**  
**Next: L3-039 — NOT STARTED**

L3-038 adds a polished, accessible Preact-owned mobile home screen with **Start Career**, **Continue** and **Settings** controls. Each opens a distinct informational preview, and **Back to Home** restores the menu and keyboard focus. These remain intentionally non-playable previews: Start does **not** create a career, Continue does **not** load a save, and Settings does **not** persist changes.

Preserves the L3-035 color tokens, L3-036 typography, L3-037 safe-area shell, the independent PixiJS renderer boundary and the existing check-button interaction. The 375/390/402/430 CSS-pixel browser suite verified touch targets, focus management, keyboard Tab/Enter/Space behavior, text reflow at 200%, simulated device insets, landscape, reload and zero horizontal overflow on genuine Vite dev/preview in Chromium.

**QA:** 19/19 GitHub workflows successful on review commit e611bb9da03bee5a559296f2d3d82a322bdfbe0d; 23 home contract tests and 7 expected invalid TypeScript cases passed; 8/8 Chromium home browser configurations passed with 1,064 assertions; previous L3-020–L3-037 regressions, clean npm ci, strict typing, lint, production build and verified build manifest passed. Physical iPhone Safari: **NOT_RUN**. See merged PR #19 (merge commit 21ae4ec1ae802d165c3fe7f08e8a14a5ff48fca5) and its GitHub Actions acceptance artifact.

Immutable checkpoint archives preserve the original Git history and evidence. Do not implement L3-039 in this task. LEGACY 3.0 remains a non-playable development foundation; fighter creation, full navigation and gameplay are future milestones.
