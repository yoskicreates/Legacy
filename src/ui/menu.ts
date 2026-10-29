/** L3-038 Preact home: no navigation router, persistence reads or gameplay. */
import { h, render } from 'preact';
import { useState } from 'preact/hooks';
import { HOME_ACTIONS, HOME_PANELS, type HomeView, type HomeAction } from './home-contract';

export type RendererStatus = 'starting' | 'ready' | 'unavailable' | 'unmounted';
export interface MenuMount {
  readonly setRendererStatus: (status: RendererStatus) => void;
  readonly destroy: () => void;
}

function Menu({ rendererStatus }: { readonly rendererStatus: RendererStatus }) {
  const [verified, setVerified] = useState(false);
  const [view, setView] = useState<HomeView>('home');
  const rendererDescription: Record<RendererStatus, string> = {
    starting: 'Initializing independent PixiJS renderer…',
    ready: 'Independent PixiJS canvas mounted.',
    unavailable: 'Renderer unavailable. Menu remains usable.',
    unmounted: 'Renderer has been unmounted independently.',
  };

  const homeAction = (action: HomeAction) => {
    const item = HOME_ACTIONS.find(x => x.id === action);
    if (!item) throw new Error('Missing home action');
    return h('button', {
      id: `home-${action}`, key: action, type: 'button',
      class: `legacy-home-action${action === 'start' ? ' legacy-home-action--primary' : ''}`,
      onClick: () => setView(action),
      'aria-label': item.label,
    }, [
      h('span', {}, [
        h('span', { class: 'legacy-home-action-label' }, item.label),
        h('span', { class: 'legacy-home-action-desc' }, item.description),
      ]),
      h('span', { class: 'legacy-home-action-symbol', 'aria-hidden': 'true' }, '→'),
    ]);
  };

  return h('div', { class: 'menu-boundary', 'data-menu-framework': 'preact' }, [
    h('header', { class: 'topbar', key: 'topbar' }, [
      h('span', { class: 'wordmark' }, ['LEGACY', h('span', { class: 'wordmark-dot' }, '.')]),
      h('span', { class: 'version' }, 'VERSION 3.0 · FOUNDATION'),
    ]),
    h('section', { class: 'legacy-home', 'aria-label': 'LEGACY home screen', key: 'home', 'data-home-view': view }, [
      view === 'home'
        ? h('div', { key: 'home-content' }, [
            h('div', { class: 'legacy-home-top' }, [
              h('span', { class: 'legacy-home-kicker' }, 'MMA CAREER & LIFE SIMULATOR'),
              h('span', { class: 'legacy-home-divider', 'aria-hidden': 'true' }),
              h('span', { class: 'legacy-home-subtitle' }, 'VISUAL FOUNDATION'),
            ]),
            h('h1', { id: 'page-title', class: 'legacy-home-title' }, ['BUILD YOUR ', h('strong', {}, 'LEGACY.')]),
            h('p', { class: 'legacy-home-lede' }, 'Every champion has a beginning. Explore the home-screen design as the career simulator takes shape.'),
            h('div', { class: 'legacy-home-actions', 'aria-label': 'Home actions' }, HOME_ACTIONS.map(action => homeAction(action.id))),
            h('p', { class: 'legacy-home-footnote' }, 'PREVIEW BUILD · No career creation or gameplay is available yet.'),
          ])
        : h('div', { key: 'panel', class: 'legacy-home-panel', 'data-panel': view, 'aria-label': `${view} preview` }, [
            h('button', { id: 'home-back', class: 'legacy-home-back', type: 'button', onClick: () => setView('home') }, '← Back to Home'),
            h('span', { class: 'legacy-home-kicker' }, HOME_PANELS[view].note),
            h('h1', { id: 'page-title', class: 'legacy-home-title' }, HOME_PANELS[view].title),
            h('p', { id: 'home-panel-description', role: 'status', 'aria-live': 'polite' }, HOME_PANELS[view].body),
            h('small', {}, 'No game or save state is changed in this preview.'),
          ]),
    ]),
    h('section', { class: 'legacy-dev-check', 'aria-label': 'Development status', key: 'dev' }, [
      h('div', { class: 'intro' }, [
        h('div', { class: 'eyebrow' }, 'DEVELOPMENT DIAGNOSTIC'),
        h('p', { class: 'description' }, 'The Preact menu and PixiJS render surface remain separate. Character creation, fights, and career simulation are not implemented.'),
        h('div', { class: 'state' }, [
          h('span', { class: 'state-dot', 'aria-hidden': 'true' }),
          h('span', {}, ['FOUNDATION BUILD ', h('span', { class: 'state-secondary' }, '· L3-038')]),
        ]),
        h('button', {
          id: 'check-button', class: 'action', type: 'button',
          'aria-pressed': verified ? 'true' : 'false',
          onClick: () => setVerified(true),
        }, ['Verify browser setup ', h('span', { 'aria-hidden': 'true' }, '→')]),
        h('p', { id: 'check-result', role: 'status', 'aria-live': 'polite' },
          verified ? 'Browser module loaded and interaction verified.' : 'Browser script not checked yet.'),
      ]),
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
