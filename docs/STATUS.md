# LEGACY 3.0 TASK STATUS

**L3-025 — Seed deterministic random source: COMPLETE / ACCEPTED**  
**Progress: 25/272 tasks**  
**Next: L3-026 — Define domain events (NOT STARTED)**

Accepted October 28, 2026. Added a pure, headless, versioned Mulberry32 generator in `src/domain/core/random.ts`, with explicit uint32 seeds and immutable replayable state. 15/15 dedicated PRNG tests passed, including golden vector verification, 1,000-draw reproducibility, zero and max seeds, unit-interval normalization, independent streams, invalid snapshots and draw overflow.

Full npm CI, strict TypeScript (including negative fixtures), domain dependency checker, all Node tests, and genuine Vite production build passed in GitHub Actions. L3-020–L3-024 regression workflows all passed. Cloud PRNG acceptance: https://github.com/yoskicreates/Legacy/actions/runs/40777352852 ; earlier regressions: 40777352627, 40777352537, 40777352563, 40777352454, 40777352701.

Chromium real Vite development/preview checks at 375, 390, 402, 430, and 1280px: **20/20 PASS**, zero browser/HTTP errors. Physical iPhone Safari: **NOT_RUN**. No UI or player-input changes.

DEC-030 calendar experience, DEC-031 fight outcomes, DEC-035 dangerous/scandal event probabilities remain OPEN; no such rules are inferred here. Domain events, state schema, persistence, any RNG-driven gameplay, and L3-026 remain unimplemented. The site is **not playable**.

Complete numbered source checkpoint, full local Git history and cloud QA evidence are preserved in Library `/LEGACY_3_0/` with SHA-256/CRC verification; prior checkpoints were not overwritten.
