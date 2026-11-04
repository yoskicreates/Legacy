/** L3-042 — typed, presentation-only, mutually exclusive illustrated choices. */
import {PANEL_KIT_PALETTES, assertPanelKitContrast} from './panel-kit-contract';

export const SELECTION_CARD_VERSION='L3-042.V1' as const;
export const SELECTION_ILLUSTRATIONS=['striking','grappling','balanced'] as const;
export type SelectionIllustration=typeof SELECTION_ILLUSTRATIONS[number];
export interface SelectionCardOption {
  readonly id:string;
  readonly label:string;
  readonly description:string;
  readonly illustration:SelectionIllustration;
  readonly disabled?:boolean;
}
export interface SelectionCardProps {
  readonly title:string;
  readonly description?:string;
  readonly options:readonly SelectionCardOption[];
  readonly initialSelectedId?:string;
  readonly onSelect?:(id:string)=>void;
  readonly emptyMessage?:string;
}

/** Validate IDs and visible text once per render; never accept ambiguous or hidden choices. */
export function validateSelectionOptions(options:readonly SelectionCardOption[]):true {
  if(options.length>6)throw new RangeError('SelectionCard supports at most six choices');
  const ids=new Set<string>();
  for(const option of options){
    if(!option.id.trim()||!option.label.trim()||!option.description.trim())
      throw new RangeError('SelectionCard choice ID, label and description must be non-empty');
    if(ids.has(option.id))throw new RangeError('SelectionCard choice IDs must be unique');
    if(!SELECTION_ILLUSTRATIONS.includes(option.illustration))
      throw new RangeError('SelectionCard illustration token is unsupported');
    ids.add(option.id);
  }
  return true;
}

/** Reuse the accepted navy/gold and scoped light palettes, including AA contrast pairs. */
export const SELECTION_CARD_PALETTES=PANEL_KIT_PALETTES;
export function assertSelectionCardContrast():true {
  assertPanelKitContrast('dark');
  assertPanelKitContrast('light');
  return true;
}
