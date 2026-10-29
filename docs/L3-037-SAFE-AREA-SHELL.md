# L3-037 — iPhone safe-area shell

The reusable `.legacy-safe-shell` class uses `env(safe-area-inset-*,0px)` on the **actual live host** with `viewport-fit=cover`. The host also has a minimum comfortable inset gutter and a `100svh` fallback before `100dvh`. Layout stays in normal flow rather than depending on fixed-position controls or an overflow-hiding trick. The existing Preact/PixiJS surfaces are unaffected.

`safe-area-qa.html` is a separate visual test page. Its four presets (neutral / notch / Dynamic Island / landscape sides) inject **simulated inset values** into the shell instance using typed `applySimulatedInsets`, and never report actual sensor/device data. The QA verifies minimum padding relative to simulated insets and no horizontal overflow or clipped buttons, plus landscape viewport rotation, reload and font enlargement in real headless Chromium (375, 390, 402, 430 CSS px). Browser simulation is not a physical iPhone Safari test; hardware testing is **NOT_RUN**. The simulator is not a navigation menu, fighter display, or gameplay feature.

Contrast is inherited from L3-035; typography is inherited from L3-036. Future work L3-038 remains excluded. No existing V1 state, serialization, seed, clocks, or IndexedDB data are changed.
