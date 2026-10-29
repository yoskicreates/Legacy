/** L3-039: five display tabs adapt to the already-approved L3-023 route IDs.
 * Life currently has only the provisional social route; Finances has economy.
 * No new page domain, network endpoint, history API or save behavior is created. */
import { MENU_ROUTE_IDS, type MenuRoute, isMenuRoute } from '../navigation/route-state';
export const BOTTOM_NAV_VERSION = 'L3-039.V1' as const;
export const BOTTOM_TABS = Object.freeze(['career','fighter','fight','life','finances'] as const);
export type BottomTabId = (typeof BOTTOM_TABS)[number];
export type TabDefinition = Readonly<{
  id: BottomTabId;
  label: string;
  icon: string;
  route: MenuRoute;
  eyebrow: string;
  title: string;
  description: string;
}>;
export const BOTTOM_NAV_ITEMS: readonly TabDefinition[] = Object.freeze([
  Object.freeze({id:'career', label:'Career', icon:'▤', route:'career', eyebrow:'YOUR JOURNEY', title:'Career overview', description:'Career timelines, contracts and rankings are planned. This is a navigation preview: no career exists.'}),
  Object.freeze({id:'fighter', label:'Fighter', icon:'◉', route:'character', eyebrow:'THE ATHLETE', title:'Fighter profile', description:'Your future fighter attributes, appearance and gym development will appear here. No fighter has been created.'}),
  Object.freeze({id:'fight', label:'Fight', icon:'◇', route:'fight', eyebrow:'THE OCTAGON', title:'Fight center', description:'Matchups, camps and simulated bouts will be added in future milestones. There is no active fight.'}),
  Object.freeze({id:'life', label:'Life', icon:'✦', route:'social', eyebrow:'OUTSIDE THE CAGE', title:'Life & relationships', description:'The provisional social route represents future life, family and social decisions. No relationships or events are simulated.'}),
  Object.freeze({id:'finances', label:'Finances', icon:'◫', route:'economy', eyebrow:'BUILD YOUR FUTURE', title:'Finances & assets', description:'The provisional economy route will eventually hold earnings, bills and investments. No balances or purchases are active.'}),
]);
export function assertBottomTab(id: string): BottomTabId {
  if (!(BOTTOM_TABS as readonly string[]).includes(id)) throw new TypeError('Unknown bottom-navigation tab');
  return id as BottomTabId;
}
export function routeForTab(tab: BottomTabId): MenuRoute {
  const def = BOTTOM_NAV_ITEMS.find(item => item.id === tab);
  if (!def || !isMenuRoute(def.route)) throw new TypeError('Invalid bottom-navigation route');
  return def.route;
}
export function tabForRoute(route: MenuRoute): TabDefinition | undefined {
  return BOTTOM_NAV_ITEMS.find(item => item.route === route);
}
export function validateBottomNavigation(): boolean {
  return BOTTOM_NAV_ITEMS.length === 5 && new Set(BOTTOM_NAV_ITEMS.map(x => x.id)).size === 5 &&
    new Set(BOTTOM_NAV_ITEMS.map(x => x.route)).size === 5 &&
    BOTTOM_NAV_ITEMS.every(x => (MENU_ROUTE_IDS as readonly string[]).includes(x.route) && !!x.description);
}
