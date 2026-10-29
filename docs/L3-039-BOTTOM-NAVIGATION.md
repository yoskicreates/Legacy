# L3-039 — Mobile bottom navigation

## Scope
Five Preact-owned tabs anchored within the mobile viewport, beneath the existing L3-038 home screen in document order: Career, Fighter, Fight, Life, and Finances. Clicking a tab uses the existing L3-023 pure `reduceRoute` in-memory navigation state; the Back and Forward controls replay route history, and Home returns to the preserved L3-038 home screen. Each section has an honest, **non-playable** preview. The existing Start/Continue/Settings home panels still work unchanged.

## Route adapter

| Display tab | Existing provisional route |
|---|---|
| Career | career |
| Fighter | character |
| Fight | fight |
| Life | social |
| Finances | economy |

`social` and `economy` remain provisional route IDs, not life or finance gameplay implementations. No new router, URL history, persistent preferences, account state or gameplay is introduced. L3-040 nested routing remains unstarted.

## Acceptance
`npm ci`, strict typecheck, seven intentionally failing invalid tab types, unit contract/regression tests, lint/domain checks, Vite genuine build and manifest hashes; real Chromium dev and preview at 375/390/402/430px for route correctness, active state, touch targets, keyboard focus, Back/Forward, Home, landscape, simulated safe insets and 200% font-size reflow with no overflow or browser exceptions. The nav must remain visible in the initial viewport without scrolling, including landscape and simulated safe-area insets. All previous L3-020–038 regressions must also pass. Physical iPhone Safari NOT_RUN unless separately recorded from a device.
