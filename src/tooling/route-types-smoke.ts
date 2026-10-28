/** Compile-time assertions for the L3-023 route discriminated union. */
import { initialRouteState, reduceRoute, currentRoute, type MenuRoute, type RouteAction } from '../navigation/route-state';

const valid: MenuRoute = 'career';
const action: RouteAction = { type: 'navigate', to: valid };
const result: MenuRoute = currentRoute(reduceRoute(initialRouteState(), action));
void result;

// @ts-expect-error Prove a fabricated route identifier is rejected statically.
const nonexistent: MenuRoute = 'purchase-boost';
void nonexistent;

// @ts-expect-error 'back' actions cannot supply a target route.
const malformed: RouteAction = { type: 'back', to: 'career' };
void malformed;

// @ts-expect-error 'navigate' requires a typed target.
const missing: RouteAction = { type: 'navigate' };
void missing;
