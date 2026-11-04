/** L3-021 integration: Preact and PixiJS share only a narrow host lifecycle. */
import { mountMenu, type MenuMount, type RendererStatus } from '@ui/menu';
import { mountRendererViewport, type RendererMount } from '@renderer/viewport';
import { DEFAULT_SETTINGS, parseSettings, SETTINGS_STORAGE_KEY, textScale } from '@ui/settings-contract';

// Apply persisted interface preferences before the first menu render.
let initialPreferences = DEFAULT_SETTINGS;
try { initialPreferences = parseSettings(window.localStorage.getItem(SETTINGS_STORAGE_KEY)); }
catch { /* Private browsing can deny storage; defaults remain safe. */ }
document.documentElement.dataset.legacyMotion = initialPreferences.motion;
document.documentElement.dataset.legacyAudio = initialPreferences.audio;
document.documentElement.style.setProperty('--legacy-user-text-scale', String(textScale(initialPreferences.textSize)));


function requireHost(selector: string): HTMLElement {
  const host = document.querySelector<HTMLElement>(selector);
  if (host === null) throw new Error(`LEGACY3: missing host ${selector}`);
  return host;
}
const menuHost = requireHost('#menu-root');
const rendererHost = requireHost('#renderer-root');
if (menuHost === rendererHost) {
  throw new Error('LEGACY3: independent menu and renderer hosts are required');
}

let status: RendererStatus = 'starting';
let menu: MenuMount | null = mountMenu(menuHost, status);
let renderer: RendererMount | null = null;
let generation = 0;

function updateStatus(next: RendererStatus) {
  status = next;
  menu?.setRendererStatus(status);
  rendererHost.dataset.rendererState = next;
}

async function startRenderer(): Promise<void> {
  const localGeneration = ++generation;
  updateStatus('starting');
  try {
    const mounted = await mountRendererViewport(rendererHost);
    if (localGeneration !== generation) {
      mounted.destroy();
      return;
    }
    renderer = mounted;
    updateStatus('ready');
  } catch (error) {
    if (localGeneration !== generation) return;
    console.warn('Renderer initialization failed; Preact UI remains available.', error);
    updateStatus('unavailable');
  }
}

function stopRenderer() {
  generation++;
  renderer?.destroy();
  renderer = null;
  updateStatus('unmounted');
}

/** Boundary probe tests independence; does not expose game state or storage. */
interface BoundaryProbe {
  readonly snapshot: () => { menu: boolean; renderer: boolean; state: RendererStatus };
  readonly unmountMenu: () => void;
  readonly remountMenu: () => void;
  readonly unmountRenderer: () => void;
  readonly remountRenderer: () => Promise<void>;
}
declare global {
  interface Window {
    __LEGACY3_BOUNDARY__?: BoundaryProbe;
  }
}
window.__LEGACY3_BOUNDARY__ = {
  snapshot: () => ({
    menu: menuHost.dataset.uiMounted === 'true',
    renderer: rendererHost.dataset.rendererMounted === 'true',
    state: status,
  }),
  unmountMenu() {
    menu?.destroy();
    menu = null;
  },
  remountMenu() {
    if (menu === null) menu = mountMenu(menuHost, status);
  },
  unmountRenderer: stopRenderer,
  async remountRenderer() {
    stopRenderer();
    await startRenderer();
  },
};
document.documentElement.dataset.jsReady = 'true';
void startRenderer();

export {};
