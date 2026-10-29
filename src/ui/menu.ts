/** L3-039 Preact shell: typed in-memory bottom tab routing, no persistence or gameplay. */
import { h, render } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { HOME_ACTIONS, HOME_PANELS, type HomeView, type HomeAction } from './home-contract';
import { BOTTOM_NAV_ITEMS, tabForRoute, routeForTab, type BottomTabId } from './bottom-nav-contract';
import { initialRouteState, reduceRoute, currentRoute, canGoBack, canGoForward, type RouteAction } from '../navigation/route-state';

export type RendererStatus = 'starting' | 'ready' | 'unavailable' | 'unmounted';
export interface MenuMount {
  readonly setRendererStatus: (status: RendererStatus) => void;
  readonly destroy: () => void;
}

function Menu({ rendererStatus }: { readonly rendererStatus: RendererStatus }) {
  const [verified, setVerified] = useState(false);
  const [view, setView] = useState<HomeView>('home');
  const [routeState, setRouteState] = useState(() => initialRouteState('home'));
  const activeRoute = currentRoute(routeState);
  const activeTab = tabForRoute(activeRoute);
  const previousRoute = useRef(activeRoute);
  const dispatchRoute = (action: RouteAction) => {
    setRouteState(old => reduceRoute(old, action));
    if (action.type === 'navigate' || action.type === 'back' || action.type === 'forward' || action.type === 'reset') setView('home');
  };
  const navigateTab = (id: BottomTabId) => dispatchRoute({type:'navigate', to:routeForTab(id)});
  const previousView = useRef<HomeView>('home');
  useLayoutEffect(() => {
    const previous = previousView.current;
    if (previous === view) return;
    previousView.current = view;
    // Move focus with the replaced content; restore the originating control on return.
    if (activeRoute !== 'home') return;
    const target = view === 'home' ? `home-${previous}` : 'page-title';
    document.getElementById(target)?.focus();
  }, [view, activeRoute]);
  useLayoutEffect(() => {
    if (previousRoute.current === activeRoute) return;
    previousRoute.current = activeRoute;
    document.getElementById('page-title')?.focus();
  }, [activeRoute]);
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
    h('section', { class: 'legacy-home', 'aria-label': activeRoute === 'home' ? 'LEGACY home screen' : 'LEGACY section preview', key: 'home', 'data-home-view': view, 'data-current-route': activeRoute }, [
      activeRoute !== 'home' && activeTab
        ? h('div', { class: 'legacy-route-preview', 'data-route-preview': activeTab.id, 'data-route-id': activeRoute }, [
            h('div', { class: 'legacy-route-toolbar' }, [
              h('button', { id: 'nav-back', type: 'button', class: 'legacy-route-back', disabled: !canGoBack(routeState), onClick: () => dispatchRoute({type:'back'}) }, '← Back'),
              h('button', { id: 'nav-forward', type: 'button', class: 'legacy-route-forward', disabled: !canGoForward(routeState), onClick: () => dispatchRoute({type:'forward'}) }, 'Forward →'),
              h('button', { id: 'nav-home', type: 'button', class: 'legacy-route-home', onClick: () => dispatchRoute({type:'navigate',to:'home'}) }, 'Home'),
            ]),
            h('span', { class: 'legacy-home-kicker' }, activeTab.eyebrow),
            h('h1', { id: 'page-title', tabIndex: -1, class:'legacy-route-title' }, activeTab.title),
            h('div', { class: 'legacy-route-detail' }, [
              h('span', { class: 'legacy-route-status' }, 'SECTION PREVIEW'),
              h('p', { id:'nav-panel-description', role:'status', 'aria-live':'polite' }, activeTab.description),
              h('p', { class: 'legacy-route-note' }, 'Navigation only · No save, career, economy or fight state changes.'),
            ]),
          ])
        : [
      view === 'home'
        ? h('div', { key: 'home-content' }, [
            h('div', { class: 'legacy-home-top' }, [
              h('span', { class: 'legacy-home-kicker' }, 'MMA CAREER & LIFE SIMULATOR'),
              h('span', { class: 'legacy-home-divider', 'aria-hidden': 'true' }),
              h('span', { class: 'legacy-home-subtitle' }, 'VISUAL FOUNDATION'),
            ]),
            h('h1', { id: 'page-title', tabIndex: -1, class: 'legacy-home-title' }, ['BUILD YOUR ', h('strong', {}, 'LEGACY.')]),
            h('p', { class: 'legacy-home-lede' }, 'Every champion has a beginning. Explore the home-screen design as the career simulator takes shape.'),
            h('div', { class: 'legacy-home-actions', 'aria-label': 'Home actions' }, HOME_ACTIONS.map(action => homeAction(action.id))),
            h('p', { class: 'legacy-home-footnote' }, 'PREVIEW BUILD · No career creation or gameplay is available yet.'),
          ])
        : h('div', { key: 'panel', class: 'legacy-home-panel', 'data-panel': view, 'aria-label': `${view} preview` }, [
            h('button', { id: 'home-back', class: 'legacy-home-back', type: 'button', onClick: () => setView('home') }, '← Back to Home'),
            h('span', { class: 'legacy-home-kicker' }, HOME_PANELS[view].note),
            h('h1', { id: 'page-title', tabIndex: -1, class: 'legacy-home-title' }, HOME_PANELS[view].title),
            h('p', { id: 'home-panel-description', role: 'status', 'aria-live': 'polite' }, HOME_PANELS[view].body),
            h('small', {}, 'No game or save state is changed in this preview.'),
          ]),
      ],
    ]),
    h('nav', { class:'legacy-bottom-nav', 'aria-label':'Primary game sections', key:'bottom-nav' }, [
      ...BOTTOM_NAV_ITEMS.map(item => h('button', {
        id:`nav-${item.id}`, key:item.id, type:'button', class:`legacy-tab${activeTab?.id===item.id?' legacy-tab--active':''}`,
        'aria-label':item.label, 'aria-current':activeTab?.id===item.id?'page':undefined,
        onClick:() => navigateTab(item.id),
      }, [
        h('span', {class:'legacy-tab-icon', 'aria-hidden':'true'}, item.icon),
        h('span', {class:'legacy-tab-label'}, item.label),
      ])),
    ]),
    h('section', { class: 'legacy-dev-check', 'aria-label': 'Development status', key: 'dev' }, [
      h('div', { class: 'intro' }, [
        h('div', { class: 'eyebrow' }, 'DEVELOPMENT DIAGNOSTIC'),
        h('p', { class: 'description' }, 'The Preact menu and PixiJS render surface remain separate. Character creation, fights, and career simulation are not implemented.'),
        h('div', { class: 'state' }, [
          h('span', { class: 'state-dot', 'aria-hidden': 'true' }),
          h('span', {}, ['FOUNDATION BUILD ', h('span', { class: 'state-secondary' }, '· L3-039')]),
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
