/** L3-021 integration: Preact and PixiJS share only a narrow host lifecycle. */
import { mountMenu, type MenuMount, type RendererStatus } from '@ui/menu';
import { mountRendererViewport, type RendererMount } from '@renderer/viewport';

const menuHost = document.querySelector<HTMLElement>('#menu-root');
const rendererHost = document.querySelector<HTMLElement>('#renderer-root');
if (!menuHost || !rendererHost || menuHost === rendererHost) {
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
