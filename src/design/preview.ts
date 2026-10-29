import { assertDesignContrast, ACCESSIBLE_PAIRS, contrastRatio, SEMANTIC, DESIGN_TOKEN_VERSION } from './tokens';
const result = document.querySelector<HTMLElement>('#contrast-result');
const button = document.querySelector<HTMLButtonElement>('#contrast-check');
if (result === null || button === null) throw new Error('Design token QA preview missing required hosts');
button.addEventListener('click', () => {
  try {
    assertDesignContrast();
    const lowest = Math.min(...ACCESSIBLE_PAIRS.map(([a,b]) => contrastRatio(SEMANTIC[a], SEMANTIC[b])));
    result.textContent = `PASS: ${ACCESSIBLE_PAIRS.length} text combinations meet WCAG AA (${lowest.toFixed(2)}:1 minimum).`;
    result.dataset.contrastStatus = 'pass';
  } catch (error) {
    result.textContent = String(error);
    result.dataset.contrastStatus = 'fail';
  }
});
declare global { interface Window { __LEGACY3_DESIGN_TOKENS_QA__?: { readonly version: string; readonly colors: typeof SEMANTIC; readonly pairs: typeof ACCESSIBLE_PAIRS; readonly contrast: typeof contrastRatio; readonly check: typeof assertDesignContrast } } }
window.__LEGACY3_DESIGN_TOKENS_QA__ = Object.freeze({ version: DESIGN_TOKEN_VERSION, colors: SEMANTIC, pairs: ACCESSIBLE_PAIRS, contrast: contrastRatio, check: assertDesignContrast });
document.documentElement.dataset.designTokenQaReady = 'true';
export {};
