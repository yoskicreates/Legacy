# L3-035 — Typed semantic design tokens and contrast specification

## Scope
Defines a pure TypeScript color contract (`src/design/tokens.ts`), synchronized CSS custom properties (`src/design/tokens.css`), and an isolated, non-playable mobile-friendly palette preview (`design-tokens-qa.html`). Existing Preact/Pixi boundaries and save/domain systems remain untouched. No fighter graphics, typography-scale system, menus, gameplay or L3-036 development are included.

## Core palette
Midnight navy `#101824`, dark blue-gray `#172433`, raised blue-gray `#223246`, warm gold `#DDBD82`, muted red `#D97B78`, and soft white `#F3F5F8`. Supplementary tones support borders and subdued labels. CSS variables `--legacy-*` are matched case-insensitively to every published semantic token by unit tests.

## Contrast rules
Normal-size text must have WCAG 2.x AA contrast ratio of at least 4.5:1 for each explicitly declared foreground/background pairing in `ACCESSIBLE_PAIRS`. Relative luminance applies sRGB linearization; ratio uses (Llight + 0.05)/(Ldark + 0.05). All 12 defined pairings are checked locally, during clean CI and in Chromium. This is not a blanket accessibility certification: future components and state combinations must get separate contrast, focus, keyboard and assistive-technology testing. Avoid red-on-gold and unsupported text/surface combinations.

## Mobile QA
The isolated preview has viewport-fit=cover, safe-area padding on all sides, a 48px contrast-check button, responsive surface/state cards and no horizontal overflow at 375/390/402/430 CSS px. The browser test checks computed CSS values and verifies the button twice (before/after a reload). The existing game placeholder is also checked by all inherited Chromium workflows.

## Non-goals
No mobile navigation layout beyond a preview, no changes to gameplay rules or career data, no final typography scale (L3-036), no screen-shell development (L3-037), and no native iPhone Safari acceptance (not available in CI). Tokens do not automatically guarantee real-world legibility for arbitrary combinations or future artwork.
