# L3-042 S03 — Real Chromium browser QA harness correction

**Status: PROVISIONAL. Official accepted milestones 41/272; L3-042 not yet accepted; L3-043 not started.** Preserve accepted main `ddacc1a0bb09c02ed06758616c038e682cee1b7f`, separate draft PR #27 and all source/Git history.

## Actual S02 evidence and root cause

S02 GitHub commit `9b736209fefddd51deab60418be2d76e248a4766` passed clean pinned npm installation, strict and negative TypeScript, all Node/unit regressions, genuine Vite production build, hashed manifest and Chromium tool installation. The *dedicated L3-042 browser interaction runner* failed at 375/390/402/430 CSS px. Downloaded GitHub artifact `13280700713` and inspected `selection-dev/results.json` and real captured failure screenshot: each width logged 53 assertions before interaction failure, zero JS errors, and a correct light-theme initial selection gallery with no choice selected.

The runner had two incorrect browser assumptions:

1. It checked a keyboard-only `:focus-visible` outline immediately after calling `striker.focus()` following a pointer click on a theme control. Chromium can remain in pointer modality. The test now uses true keyboard `Tab` and `Shift+Tab` navigation before verifying the focus indicator and keyboard activation.
2. The test clicked the `grappling` choice, swapped the option dataset and expected the choice to reset. But `grappling` is present in both datasets and should **remain selected** under the contract. The test now chooses `striking` immediately before the swap; this ID is absent from the alternate dataset, and selection must clear and not return after restoration.

No Preact application code, CSS, approved art, game logic, saves, or previous accepted files changed. The S03 commit changes only the browser QA script, two focused Node regression assertions, and this evidence report. Required: rerun full GitHub Actions on the new exact PR commit, preserve unmodified source and test evidence, and keep the PR draft/unmerged. Physical iPhone Safari NOT_RUN.
