# L3-036 — Responsive typography scale (scoped visual foundation)

Single canonical implementation: `src/design/typography.ts`, paired with `src/design/typography.css`. Seven roles: display, headline, panel, body, label, caption, and numeric. Each role declares font-size, line-height, font-weight and letter-spacing with strict readonly TypeScript types. Display, headline and numeric sizes use bounded `clamp()` CSS values. Numeric text uses tabular lining figures for stable clocks, scores and balances. No external fonts and no typography size sliders.

## Acceptance

- Shared palette `src/design/tokens.ts` and all twelve L3-035 WCAG AA foreground/background pairings remain unchanged.
- Root CSS properties `--legacy-type-<role>-<property>` match the TypeScript contract byte-for-byte. Semantic classes give a reusable implementation.
- The existing non-playable shell and color preview consume the typography properties without disturbing gameplay or persistence.
- `/typography-qa.html` shows all seven roles, long label wrapping, 4:59 clock, career money and record, with no horizontal overflow at 375/390/402/430 CSS pixels.
- Browser test checks computed CSS, number tabularity, long-label bounds, text size/readability, 200% text resizing, reload stability, safe-area presence and all earlier regression fixtures in actual Vite dev and preview servers.
- All L3-020 through L3-035 workflows, strict TypeScript, seven negative fixtures, all unit tests, lint and Vite production build must pass before merge. Physical iPhone Safari has NOT been run.

**Out of scope:** L3-037 shell/safe area implementation, new navigation, character customization, fighter art, game simulation or data changes. This is a non-playable preview; fight data shown here is synthetic display text only.
