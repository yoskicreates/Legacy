# LEGACY 3.0 — L3-042 Illustrated Selection-Card Control (provisional)

**Status:** IN DEVELOPMENT / NOT ACCEPTED. Accepted baseline: L3-041 merge `ddacc1a0bb09c02ed06758616c038e682cee1b7f` (41/272). L3-043 NOT STARTED.

## Limited scope

- Reusable `SelectionCard` is a group of 0–6 native, tap-friendly button choices, with typed immutable option IDs, labels, descriptions, decorative illustration tokens (`striking`, `grappling`, `balanced`) and an optional disabled state.
- Selected choice is announced through `aria-pressed` and a polite live status; all choices have their own visible label, individually associated description, and decorative `aria-hidden` SVG pictogram. Every enabled native button uses normal Tab/Enter/Space, without keyboard traps.
- On selection, `onSelect` can tell the host which option was pressed, but the component does not import career/combat/fighter state or write any persistence. The isolated gallery explicitly reports that its changes have **no gameplay consequences**.
- Original owner-approved fighter artwork and other previews remain untouched. The illustration tokens are **abstract UI symbols**, never replacement fighter sprites or new character designs. No sliders.
- Scoped dark/light CSS reuses the previously accepted navy, warm gold, text colors, type scale and iPhone safe-area shell. A selected border and visible text state do not rely on color alone. Forced-colors and reduced motion are respected.
- Gallery includes three working selectable choices, a disabled preview choice, empty state, theme switching, and prop replacement to verify stale selection IDs do not reappear.

## Pre-acceptance checks

Run clean pinned npm installation, strict and seven negative TypeScript cases, 20+ focused contract tests, all inherited L3-020 through L3-041 regressions, genuine Vite dev/build/preview, manifest verification, and real Chromium on 375/390/402/430 CSS px in dark/light with keyboard/touch/accessible names/description, simulated safe areas, 200% text, landscape, and no horizontal overflow. Preserve complete source/Git history, screenshots, and QA evidence as new numbered checkpoints. Physical iPhone Safari remains a separate real-device check.

No merge, deployment, acceptance or L3-043 without explicit owner authorization.
