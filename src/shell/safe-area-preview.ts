import { SAFE_AREA_SCENARIOS, SAFE_AREA_SCENARIO_NAMES, SAFE_AREA_VERSION, applySimulatedInsets, type SafeAreaScenario } from './safe-area';
const root = document.querySelector<HTMLElement>('#safe-area-demo');
const status = document.querySelector<HTMLElement>('#safe-area-status');
if (!root || !status) throw new Error('L3-037 safe-area QA hosts missing');
const host: HTMLElement = root;
const statusHost: HTMLElement = status;
function setScenario(value: SafeAreaScenario): void {
  applySimulatedInsets(host, value);
  for (const node of host.querySelectorAll<HTMLButtonElement>('[data-safe-scenario]')) {
    node.setAttribute('aria-pressed', String(node.dataset.safeScenario === value));
  }
  statusHost.textContent = `Simulated ${value} insets · ${SAFE_AREA_VERSION} · not measured from an iPhone`;
}
for (const button of host.querySelectorAll<HTMLButtonElement>('[data-safe-scenario]')) {
  button.addEventListener('click', () => {
    const name = button.dataset.safeScenario;
    if (name && SAFE_AREA_SCENARIO_NAMES.includes(name as SafeAreaScenario)) setScenario(name as SafeAreaScenario);
  });
}
setScenario('island');
window.__LEGACY3_SAFE_AREA_QA__ = Object.freeze({version:SAFE_AREA_VERSION,scenarioNames:SAFE_AREA_SCENARIO_NAMES,scenarios:SAFE_AREA_SCENARIOS,setScenario});
document.documentElement.dataset.safeAreaReady = 'true';
declare global {
  interface Window { __LEGACY3_SAFE_AREA_QA__?: Readonly<{version:typeof SAFE_AREA_VERSION;scenarioNames:typeof SAFE_AREA_SCENARIO_NAMES;scenarios:typeof SAFE_AREA_SCENARIOS;setScenario:(value:SafeAreaScenario)=>void}> }
}
export {};
