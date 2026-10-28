/** L3-021: Preact exclusively owns the menu DOM; it never imports PixiJS. */
import { h, render } from 'preact';
import { useState } from 'preact/hooks';

export type RendererStatus = 'starting' | 'ready' | 'unavailable' | 'unmounted';

export interface MenuMount {
  readonly setRendererStatus: (status: RendererStatus) => void;
  readonly destroy: () => void;
}

function Menu({ rendererStatus }: { readonly rendererStatus: RendererStatus }) {
  const [verified, setVerified] = useState(false);
  const rendererDescription: Record<RendererStatus, string> = {
    starting: 'Initializing independent PixiJS renderer…',
    ready: 'Independent PixiJS canvas mounted.',
    unavailable: 'Renderer unavailable. Menu remains usable.',
    unmounted: 'Renderer has been unmounted independently.',
  };

  return h('div', { class: 'menu-boundary', 'data-menu-framework': 'preact' }, [
    h('header', { class: 'topbar', key: 'topbar' }, [
      h('span', { class: 'wordmark' }, ['LEGACY', h('span', { class: 'wordmark-dot' }, '.')]),
      h('span', { class: 'version' }, 'VERSION 3.0'),
    ]),
    h('section', { class: 'intro', 'aria-label': 'Development status', key: 'intro' }, [
      h('div', { class: 'eyebrow' }, 'MMA CAREER & LIFE SIMULATOR / VISUAL FOUNDATION'),
      h('h1', { id: 'page-title' }, ['A legacy starts ', h('em', {}, 'somewhere.')]),
      h('p', { class: 'description' },
        'The Preact menu and PixiJS render surface are separate. The game itself has not been built. Character creation, fights, and career systems will arrive in later tasks.'),
      h('div', { class: 'state' }, [
        h('span', { class: 'state-dot', 'aria-hidden': 'true' }),
        h('span', {}, ['FOUNDATION BUILD ', h('span', { class: 'state-secondary' }, '· L3-021')]),
      ]),
      h('button', {
        id: 'check-button', class: 'action', type: 'button',
        'aria-pressed': verified ? 'true' : 'false',
        onClick: () => setVerified(true),
      }, ['Verify browser setup ', h('span', { 'aria-hidden': 'true' }, '→')]),
      h('p', { id: 'check-result', role: 'status', 'aria-live': 'polite' },
        verified ? 'Browser module loaded and interaction verified.' : 'Browser script not checked yet.'),
    ]),
    h('footer', { class: 'footer', key: 'footer' }, [
      h('span', {}, 'ORIGINAL PROJECT · CLEAN REPOSITORY'),
      h('span', {}, 'NO GAMEPLAY IN THIS BUILD'),
    ]),
    h('p', { id: 'renderer-state', class: 'renderer-state', role: 'status', 'aria-live': 'polite' },
      rendererDescription[rendererStatus]),
  ]);
}

export function mountMenu(host: HTMLElement, initialStatus: RendererStatus): MenuMount {
  let currentStatus = initialStatus;
  let active = true;
  render(h(Menu, { rendererStatus: currentStatus }), host);
  host.dataset.uiMounted = 'true';
  return {
    setRendererStatus(status) {
      if (!active) return;
      currentStatus = status;
      render(h(Menu, { rendererStatus: currentStatus }), host);
    },
    destroy() {
      if (!active) return;
      active = false;
      render(null, host);
      delete host.dataset.uiMounted;
    },
  };
}
