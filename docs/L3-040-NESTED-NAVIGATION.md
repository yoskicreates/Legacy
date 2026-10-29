# L3-040 — Nested preview navigation

## Scope and inheritance
L3-040 adds an immutable in-memory, route-scoped detail stack to the accepted L3-039 five-tab shell. The approved L3-023 `reduceRoute` remains the sole top-level menu history reducer; L3-039 tab route IDs and the accepted L3-038 home/Start/Continue/Settings controls are unchanged. No global URL/history changes, storage writes, gameplay, save changes, balances, fighters, or combat are implemented.

## Detail hierarchy
Career → Rankings → Ranking criteria; Fighter → Attributes → Attribute guide; Fight → Matchups → Matchup details; Life → Relationships → Relationship details; Finances → Budget → Budget details. All ten pages clearly disclose they are non-playable previews.

## Navigation rules
- Tap a detail action to open only a valid child of the selected parent; no cross-tab or skipped-level links.
- Back navigates to the active tab's prior detail level before returning to L3-023 top-level history. Forward replays that detail history before falling through to top-level history.
- Breadcrumb buttons rewind to an actual parent or section root while keeping Forward available; parent page remains accessible and correctly labelled.
- Switching tabs and returning preserves the last in-memory detail selection **per route**. Home does not discard it. The state resets on browser reload, deliberately and without persistence.
- Native semantic buttons use a keyboard-visible focus ring, large touch targets, an `aria-current` breadcrumb, and focus the destination heading.

## Acceptance contract
Required: clean npm ci and pinned genuine Vite 6 build; strict TypeScript plus seven intentionally invalid type cases; 17 dedicated nested contract tests; pre-existing home/bottom-nav and all prior L3-020–039 regressions; lint/domain checks; independently verified hashed build manifest; genuine Vite dev and preview with Chromium widths 375, 390, 402 and 430px. Browser test must cover all five tabs, both detail depths, breadcrumb rewind, Back/Forward, restored tab context, keyboard Tab/Enter, 200% root text, simulated safe insets, landscape, reload and zero horizontal overflow. Preserve full original Git history, source, preview and QA checkpoints as separate numbered, non-overwriting archives before merge. Device Safari NOT_RUN unless verified on physical device. Do not start L3-041.
