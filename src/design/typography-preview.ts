import { CSS_TYPOGRAPHY, TYPE_SCALE, TYPOGRAPHY_ROLES, TYPOGRAPHY_VERSION } from './typography';
import { DESIGN_TOKEN_VERSION } from './tokens';
const host=document.querySelector<HTMLElement>('#typography-status');
if (!host) throw new Error('Typography QA preview requires a status region');
host.textContent = `Type scale ${TYPOGRAPHY_VERSION} · Palette ${DESIGN_TOKEN_VERSION} · ${TYPOGRAPHY_ROLES.length} roles`; 
window.__LEGACY3_TYPOGRAPHY_QA__ = Object.freeze({version:TYPOGRAPHY_VERSION,roles:TYPOGRAPHY_ROLES,scale:TYPE_SCALE,css:CSS_TYPOGRAPHY,palette:DESIGN_TOKEN_VERSION});
document.documentElement.dataset.typographyQaReady='true';
declare global { interface Window { __LEGACY3_TYPOGRAPHY_QA__?: Readonly<{ version:typeof TYPOGRAPHY_VERSION;roles:typeof TYPOGRAPHY_ROLES;scale:typeof TYPE_SCALE;css:typeof CSS_TYPOGRAPHY;palette:typeof DESIGN_TOKEN_VERSION; }> } }
export {};
