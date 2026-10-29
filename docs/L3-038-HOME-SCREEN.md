# L3-038 — Home Screen Layout (visual foundation only)

- The real app's Preact-owned menu exposes Start Career, Continue, and Settings buttons; they open accessible preview panels with Back to Home. These are **not gameplay actions**.
- Start does not create a fighter or save. Continue does not fetch or modify existing career saves. Settings does not persist preferences; subsequent tasks own these capabilities.
- Preserves the existing `#check-button`, PixiJS renderer boundary, `#menu-root`, safe-area shell, WCAG-AA token palette and typography contract.
- The shell is responsive at 375/390/402/430 CSS px, including long labels, browser reload, large text, simulated notch insets, and landscape mode. The production browser tests distinguish CSS simulation from a physical iPhone.
- Use `npm run test:home`, `npm run typecheck:home`, and `npm run test:home:negative`; CI runs full inherited regressions, Vite dev/preview, and Playwright Chromium. No L3-039 navigation, fighters, careers, or gameplay.
- Physical iPhone Safari: **NOT_RUN**. Button activation does not constitute implemented career flow.

- Keyboard activation focuses the preview heading; Back to Home restores focus to the originating action. Chromium tests Enter, Shift+Tab, Space and visible focus rings for all three actions.
