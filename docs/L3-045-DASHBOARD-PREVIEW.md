# L3-045 — Game Dashboard Shell (S01 PROVISIONAL)

**Official starting point**: accepted L3-044 after PR #29 merge at `8c9ebc9ca63fc9d9d5be88884414843570b45f07`, 44/272 milestones accepted. This is an independent preview, not the playable game.

## What was built

A responsive dashboard fixture presenting (1) fighter overview, (2) fictional game day, (3) sample cash balance, (4) example notifications, and (5) a next action that updates only the screen's preview counter. It does not load a real save, advance the clock, pay a bill, trigger a fight, purchase anything or schedule training. All sections explicitly identify sample data. The fighter illustration is intentionally an empty marked placement slot, **not a replacement of owner-approved fighter artwork**.

Uses approved L3-035 navy, warm gold, soft white palette, existing L3-036 typography, L3-037 phone safe areas and L3-041 panel styling. All preview choices are native buttons, no sliders, no new characters or gameplay. Controls can switch dark/light previews and show the empty notification case.

## Required checks

- Pure fixture model rejects invalid dates, negative money, duplicate notifications, invalid data sources.
- Strict TypeScript + **eight deliberately invalid data contract fixtures**.
- Clean pinned npm installation, L3-020–044 inherited regressions, lint, Vite build and hashed manifest.
- Actual dev/preview Chromium at 375/390/402/430 CSS pixels, both themes, regular/forced-colors and reduced-motion, 200% text, keyboard, no overflow, zero JS errors; screenshot evidence.
- Preserve full local Git history, save non-overwriting source and QA archives. No claim of a physical iPhone Safari test: `NOT_RUN`, deferred by owner until approximately task 136.

**Acceptance:** L3-045 remains `planned` in the official task register until all checks actually pass; no automatic merge prior to verified acceptance. Do not start L3-046 or deploy.
