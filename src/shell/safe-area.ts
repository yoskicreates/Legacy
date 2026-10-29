/** L3-037: predictable safe-area contracts; QA values are simulated, never a device report. */
export const SAFE_AREA_VERSION = 'L3-037.V1' as const;
export const INSET_SIDES = ['top', 'right', 'bottom', 'left'] as const;
export type InsetSide = (typeof INSET_SIDES)[number];
export type PixelInset = `${number}px`;
export type SafeAreaInsets = Readonly<Record<InsetSide, PixelInset>>;
export const SAFE_AREA_SCENARIOS = Object.freeze({
  neutral: Object.freeze({ top:'0px', right:'0px', bottom:'0px', left:'0px' }),
  notch: Object.freeze({ top:'44px', right:'0px', bottom:'34px', left:'0px' }),
  island: Object.freeze({ top:'59px', right:'0px', bottom:'34px', left:'0px' }),
  landscape: Object.freeze({ top:'0px', right:'47px', bottom:'21px', left:'47px' }),
} as const satisfies Record<string, SafeAreaInsets>);
export type SafeAreaScenario = keyof typeof SAFE_AREA_SCENARIOS;
export const SAFE_AREA_SCENARIO_NAMES = Object.freeze(Object.keys(SAFE_AREA_SCENARIOS) as SafeAreaScenario[]);
export const SAFE_AREA_CLASS = 'legacy-safe-shell' as const;
export function scenarioInsets(scenario: SafeAreaScenario): SafeAreaInsets {
  if (!Object.hasOwn(SAFE_AREA_SCENARIOS, scenario)) throw new Error('Unsupported simulated inset scenario');
  return SAFE_AREA_SCENARIOS[scenario];
}
/** This helper is exclusive to QA previews: real production values come from CSS env(). */
export function applySimulatedInsets(host: HTMLElement, scenario: SafeAreaScenario): void {
  const insets = scenarioInsets(scenario);
  for (const side of INSET_SIDES) host.style.setProperty(`--legacy-safe-${side}`, insets[side]);
  host.dataset.simulatedInsets = scenario;
}
