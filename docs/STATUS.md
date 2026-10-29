# LEGACY 3.0 TASK STATUS

**L3-037 — Build iPhone safe-area shell: COMPLETE / ACCEPTED**  
**Progress: 37 accepted / 272**  
**Next: L3-038 — NOT STARTED**

L3-037 implements a reusable CSS env(safe-area-inset-*) host shell with viewport-fit=cover, stable 100svh/100dvh sizing, normal-flow padding, and an independent non-playable visual test page. Four QA presets simulate notch, Dynamic Island, neutral and landscape side-insets; these are **not actual device measurements**. The L3-035 palette and L3-036 typography are unchanged.

22 safe-area tests and seven deliberately invalid TypeScript cases passed. GitHub CI passed all 18 L3-020 through L3-037 review workflows including clean npm ci, genuine Vite dev/preview, build-manifest verification, and real Chromium QA across 375/390/402/430 CSS px in portrait and landscape (728 safe-area assertions). **Physical iPhone Safari: NOT_RUN**. Original full source and local Git history are in the immutable L3-037 checkpoint in Library `/LEGACY_3_0/`.

LEGACY 3.0 remains a non-playable development foundation. L3-038, full navigation, illustrated characters, and gameplay are not implemented.
