/**
 * LEGACY 3.0 L3-023 — pure menu routing state; no UI, renderer or browser history.
 * Route IDs are provisional navigation identifiers, NOT implemented game screens.
 */
export const MENU_ROUTE_IDS = [
  'home',
  'character',
  'career',
  'training',
  'fight',
  'social',
  'economy',
  'settings',
] as const;

export type MenuRoute = (typeof MENU_ROUTE_IDS)[number];

/** A bounded, immutable in-memory history; cursor points at the active entry. */
export interface RouteState {
  readonly entries: readonly MenuRoute[];
  readonly cursor: number;
}

export type RouteAction =
  | { readonly type: 'navigate'; readonly to: MenuRoute }
  | { readonly type: 'replace'; readonly to: MenuRoute }
  | { readonly type: 'back' }
  | { readonly type: 'forward' }
  | { readonly type: 'reset'; readonly to: MenuRoute };

/** Prevent unbounded transient route-history growth in a long-running browser tab. */
export const ROUTE_HISTORY_LIMIT = 32;

export function isMenuRoute(value: unknown): value is MenuRoute {
  return typeof value === 'string' && (MENU_ROUTE_IDS as readonly string[]).includes(value);
}

function assertRoute(route: unknown): asserts route is MenuRoute {
  if (!isMenuRoute(route)) throw new TypeError('LEGACY3: unknown menu route');
}

function snapshot(entries: readonly MenuRoute[], cursor: number): RouteState {
  return Object.freeze({ entries: Object.freeze([...entries]), cursor });
}

/** Always starts at exactly one valid route; does not inspect the URL or storage. */
export function initialRouteState(to: MenuRoute = 'home'): RouteState {
  assertRoute(to);
  return snapshot([to], 0);
}

export function currentRoute(state: RouteState): MenuRoute {
  const current = state.entries[state.cursor];
  if (current === undefined) throw new RangeError('LEGACY3: invalid route-history cursor');
  return current;
}

export function canGoBack(state: RouteState): boolean {
  return state.cursor > 0;
}

export function canGoForward(state: RouteState): boolean {
  return state.cursor < state.entries.length - 1;
}

/**
 * Pure transition: no DOM, Preact, PixiJS, clock, random source or persistence.
 * No-ops return the original snapshot. Navigation after back discards future
 * entries. Replace changes only the active entry, like history.replaceState.
 */
export function reduceRoute(state: RouteState, action: RouteAction): RouteState {
  switch (action.type) {
    case 'back':
      return canGoBack(state) ? snapshot(state.entries, state.cursor - 1) : state;
    case 'forward':
      return canGoForward(state) ? snapshot(state.entries, state.cursor + 1) : state;
    case 'reset':
      assertRoute(action.to);
      return state.entries.length === 1 && currentRoute(state) === action.to
        ? state : initialRouteState(action.to);
    case 'replace': {
      assertRoute(action.to);
      if (currentRoute(state) === action.to) return state;
      const entries = [...state.entries];
      entries[state.cursor] = action.to;
      return snapshot(entries, state.cursor);
    }
    case 'navigate': {
      assertRoute(action.to);
      if (currentRoute(state) === action.to) return state;
      const next = [...state.entries.slice(0, state.cursor + 1), action.to];
      if (next.length > ROUTE_HISTORY_LIMIT) {
        const entries = next.slice(-ROUTE_HISTORY_LIMIT);
        return snapshot(entries, entries.length - 1);
      }
      return snapshot(next, next.length - 1);
    }
    default: {
      const exhaustive: never = action;
      throw new TypeError(`LEGACY3: unrecognized route action ${String(exhaustive)}`);
    }
  }
}
