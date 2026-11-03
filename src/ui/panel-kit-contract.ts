/** L3-041 — presentation-only shared UI kit. No game, save or route mutation. */
import { contrastRatio, SEMANTIC } from '../design/tokens';

export const PANEL_KIT_VERSION = 'L3-041.V1' as const;
export type PanelKitTheme = 'dark' | 'light';
export const PANEL_KIT_PALETTES = Object.freeze({
  dark: Object.freeze({
    canvas: SEMANTIC['surface-canvas'], panel: SEMANTIC['surface-panel'], raised: SEMANTIC['surface-raised'],
    ink: SEMANTIC['text-primary'], muted: SEMANTIC['text-secondary'], accent: SEMANTIC['accent-primary'],
    border: SEMANTIC['border-default'], onAccent: SEMANTIC['on-accent'], focus: SEMANTIC['focus-ring'],
  }),
  light: Object.freeze({
    canvas: '#F1F4F8', panel: '#FFFFFF', raised: '#E7ECF3',
    ink: '#182333', muted: '#35475B', accent: '#694516',
    border: '#718094', onAccent: '#FFFFFF', focus: '#68481A',
  }),
});
export const PANEL_KIT_TEXT_PAIRS = Object.freeze([
  ['ink','canvas'],['ink','panel'],['ink','raised'],['muted','panel'],['muted','raised'],
  ['accent','panel'],['accent','canvas'],['onAccent','accent'],
] as const);
export const PANEL_KIT_CATALOG = Object.freeze([
  {id:'text',label:'Text card',semantics:'article'},
  {id:'stat',label:'Stat panel',semantics:'description list'},
  {id:'action',label:'Action tile',semantics:'button'},
  {id:'list',label:'List panel',semantics:'section with native list'},
  {id:'disclosure',label:'Expandable card',semantics:'native details and summary'},
  {id:'notice',label:'Dismissible notice',semantics:'labelled note and optional button'},
  {id:'search-list',label:'Searchable list card',semantics:'labelled native search input and filtered list'},
  {id:'segmented-info',label:'Segmented information card',semantics:'native pressed buttons with labelled information region'},
  {id:'checklist',label:'Checklist card',semantics:'native checkboxes with progress and local-only state'},
  {id:'timeline',label:'Event timeline card',semantics:'ordered date list, accessible selection and local-only detail region'},
  {id:'comparison',label:'Comparison card',semantics:'native comparison table with accessible differences-only filter'},
] as const);
export type PanelKitId = typeof PANEL_KIT_CATALOG[number]['id'];
export function assertPanelKitContrast(theme: PanelKitTheme): true {
  const palette = PANEL_KIT_PALETTES[theme];
  if (!palette) throw new TypeError('Unknown panel kit theme');
  for (const [fg,bg] of PANEL_KIT_TEXT_PAIRS) {
    if (contrastRatio(palette[fg],palette[bg]) < 4.5) throw new Error(`L3-041 ${theme}: ${fg} on ${bg} fails WCAG AA`);
  }
  return true;
}

/** Pure, nonmutating filter for reusable, presentation-only list cards. */
export function filterPanelListItems<T extends {readonly label:string;readonly description?:string}>(items:readonly T[], query:string):readonly T[] {
  const needle=query.trim().normalize('NFKC').toLocaleLowerCase();
  if(!needle)return items;
  return items.filter(item=>`${item.label} ${item.description??''}`.normalize('NFKC').toLocaleLowerCase().includes(needle));
}

/** Presentation-only comparison filtering; returns existing items without mutating caller data. */
export function filterComparisonDifferences<T extends {readonly left:string;readonly right:string}>(metrics:readonly T[], differencesOnly:boolean):readonly T[] {
  return differencesOnly?metrics.filter(metric=>metric.left!==metric.right):metrics;
}
