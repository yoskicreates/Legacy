/** L3-040: typed, route-scoped detail previews. L3-023 menu routes remain unchanged. */
import { isMenuRoute, type MenuRoute } from '../navigation/route-state';
import { BOTTOM_NAV_ITEMS } from './bottom-nav-contract';

export const NESTED_NAV_VERSION = 'L3-040.V1' as const;
export const NESTED_DETAILS = Object.freeze([
  { id:'career-rankings', route:'career', parent:null, title:'Rankings preview', description:'Future divisional rankings and contender movement will appear here. No rankings are calculated.' },
  { id:'career-ranking-rules', route:'career', parent:'career-rankings', title:'Ranking criteria', description:'A future explanation of ranking factors. No ranking logic or promotion data is active.' },
  { id:'fighter-attributes', route:'character', parent:null, title:'Attributes preview', description:'Future fighter attributes will appear here. No fighter exists or has been changed.' },
  { id:'fighter-attribute-guide', route:'character', parent:'fighter-attributes', title:'Attribute guide', description:'A future guide to fighter growth. No training or stat calculations are available.' },
  { id:'fight-matchups', route:'fight', parent:null, title:'Matchups preview', description:'Future opponents and matchmaking will appear here. No fight or opponent has been generated.' },
  { id:'fight-matchup-details', route:'fight', parent:'fight-matchups', title:'Matchup details', description:'A future breakdown of matchup styles. No prediction or bout simulation runs.' },
  { id:'life-relationships', route:'social', parent:null, title:'Relationships preview', description:'Future friends and family connections will appear here. No relationships are simulated.' },
  { id:'life-relationship-details', route:'social', parent:'life-relationships', title:'Relationship details', description:'Future relationship history will appear here. No social or life outcomes are affected.' },
  { id:'finances-budget', route:'economy', parent:null, title:'Budget preview', description:'Future income and bills will appear here. No cash balance or spending is calculated.' },
  { id:'finances-budget-details', route:'economy', parent:'finances-budget', title:'Budget details', description:'A future view of expense categories. No balance, transaction or game save is changed.' },
] as const);
export type NestedDetailId = (typeof NESTED_DETAILS)[number]['id'];
export type DetailDefinition = (typeof NESTED_DETAILS)[number];
export type DetailTrail = Readonly<{entries:readonly (NestedDetailId|null)[];cursor:number}>;
export type NestedState = Readonly<Partial<Record<MenuRoute,DetailTrail>>>;

export function detailDefinition(id: NestedDetailId): DetailDefinition {
  const detail = NESTED_DETAILS.find(x=>x.id === id);
  if(!detail) throw new TypeError('Unknown nested detail');
  return detail;
}
export function detailsForParent(route: MenuRoute, parent: NestedDetailId|null): readonly DetailDefinition[] {
  if(!isMenuRoute(route)) throw new TypeError('Unknown parent route');
  return NESTED_DETAILS.filter(x=>x.route===route && x.parent===parent);
}
export function initialNestedState(): NestedState { return Object.freeze({}); }
function emptyTrail(): DetailTrail {return Object.freeze({entries:Object.freeze([null]),cursor:0});}
export function trailForRoute(state:NestedState,route:MenuRoute):DetailTrail {
  if(!isMenuRoute(route)) throw new TypeError('Unknown parent route');
  return state[route] ?? emptyTrail();
}
export function currentDetail(state:NestedState,route:MenuRoute):NestedDetailId|null {
  const trail=trailForRoute(state,route),id=trail.entries[trail.cursor];
  if(id===undefined) throw new RangeError('Invalid nested navigation cursor');
  return id;
}
export function canDetailBack(state:NestedState,route:MenuRoute):boolean {return trailForRoute(state,route).cursor>0;}
export function canDetailForward(state:NestedState,route:MenuRoute):boolean {
  const t=trailForRoute(state,route);return t.cursor<t.entries.length-1;
}
function snapshot(state:NestedState,route:MenuRoute,entries:readonly (NestedDetailId|null)[],cursor:number):NestedState {
  return Object.freeze({...state,[route]:Object.freeze({entries:Object.freeze([...entries]),cursor})});
}
/** Opening a child requires the currently selected parent. No cross-tab detail is allowed. */
export function openDetail(state:NestedState,route:MenuRoute,id:NestedDetailId):NestedState {
  const detail=detailDefinition(id),trail=trailForRoute(state,route);
  if(detail.route!==route || detail.parent!==currentDetail(state,route)) throw new TypeError('Nested detail does not belong to the active parent');
  const next=[...trail.entries.slice(0,trail.cursor+1),id];
  return snapshot(state,route,next,trail.cursor+1);
}
export function detailBack(state:NestedState,route:MenuRoute):NestedState {
  const t=trailForRoute(state,route);
  return t.cursor===0?state:snapshot(state,route,t.entries,t.cursor-1);
}
export function detailForward(state:NestedState,route:MenuRoute):NestedState {
  const t=trailForRoute(state,route);
  return t.cursor===t.entries.length-1?state:snapshot(state,route,t.entries,t.cursor+1);
}
/** Breadcrumb navigation rewinds to a real ancestor; future entries remain available for Forward. */
export function rewindDetail(state:NestedState,route:MenuRoute,target:NestedDetailId|null):NestedState {
  const trail=trailForRoute(state,route);
  const index=trail.entries.slice(0,trail.cursor+1).lastIndexOf(target);
  if(index<0)throw new TypeError('Breadcrumb target is not an ancestor');
  return index===trail.cursor?state:snapshot(state,route,trail.entries,index);
}
export function detailBreadcrumbs(state:NestedState,route:MenuRoute): readonly (NestedDetailId|null)[] {
  const trail=trailForRoute(state,route);
  return Object.freeze(trail.entries.slice(0,trail.cursor+1));
}
export function validNestedCatalog():boolean {
  return NESTED_DETAILS.length===10 && new Set(NESTED_DETAILS.map(d=>d.id)).size===10 &&
    NESTED_DETAILS.every(d=>BOTTOM_NAV_ITEMS.some(x=>x.route===d.route) && d.description.length>30 &&
      (d.parent===null || NESTED_DETAILS.some(p=>p.id===d.parent && p.route===d.route && p.parent===null)));
}
