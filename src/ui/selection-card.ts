/** L3-042 — actual reusable Preact selection control. No saves, game effects or sliders. */
import {h} from 'preact';
import {useId,useLayoutEffect,useState} from 'preact/hooks';
import {validateSelectionOptions} from './selection-card-contract';
import type {SelectionCardOption,SelectionCardProps,SelectionIllustration} from './selection-card-contract';

/** Original abstract pictograms, not new fighter character artwork or SVG mannequins. */
function ChoiceIllustration({kind}:{readonly kind:SelectionIllustration}) {
  const common={stroke:'currentColor',strokeWidth:5,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,fill:'none'};
  const interior=kind==='striking'?
    [h('circle',{cx:64,cy:43,r:21,fill:'none',stroke:'currentColor',strokeWidth:3,key:'strike-ring'}),
     h('path',{d:'M29 58 L49 35 L64 49 L89 21',...common,key:'strike-path'}),
     h('path',{d:'M75 21 H89 V35',...common,key:'strike-tip'})]:
    kind==='grappling'?
    [h('path',{d:'M29 34 C29 15 58 16 58 35 C58 58 86 58 86 35 C86 14 61 12 61 35 C61 59 31 61 29 34',...common,key:'grapple-path'}),
     h('circle',{cx:29,cy:34,r:6,fill:'currentColor',key:'grapple-start'}),
     h('circle',{cx:86,cy:35,r:6,fill:'currentColor',key:'grapple-end'})]:
    [h('path',{d:'M58 13 L91 25 V50 C91 65 69 74 58 78 C47 74 25 65 25 50 V25 Z',...common,key:'balance-shield'}),
     h('path',{d:'M58 25 V65 M40 46 H76',...common,key:'balance-line'})];
  return h('svg',{class:'legacy-selection-illustration',viewBox:'0 0 120 88','aria-hidden':'true',focusable:'false'},[
    h('rect',{x:1,y:1,width:118,height:86,rx:19,fill:'none',stroke:'currentColor',strokeOpacity:0.35,strokeWidth:2,key:'frame'}),
    ...interior,
  ]);
}

/** Each choice is a native button. Tab reaches every enabled choice; Enter/Space choose.
 * aria-pressed announces mutually exclusive selection to assistive technology.
 * Optional callback communicates intent to the caller but this component never
 * changes the player's character, career, finances or persisted game state.
 */
export function SelectionCard({title,description,options,initialSelectedId,onSelect,emptyMessage='No choices available.'}:SelectionCardProps) {
  const headingId=useId();
  const detailsId=useId();
  const optionIdBase=useId();
  if(!title.trim())throw new RangeError('SelectionCard heading must be non-empty');
  validateSelectionOptions(options);
  if(initialSelectedId && !options.some(option=>option.id===initialSelectedId&&!option.disabled)){
    throw new RangeError('SelectionCard initial choice must exist and be enabled');
  }
  const [chosenId,setChosenId]=useState<string|null>(initialSelectedId??null);
  const optionIdentity=JSON.stringify(options.map(option=>[option.id,Boolean(option.disabled)]));
  // Remove old state when options are replaced, disabled or removed and later reintroduced.
  useLayoutEffect(()=>{
    setChosenId(previous=>previous&&options.some(option=>option.id===previous&&!option.disabled)?previous:null);
  },[optionIdentity]);
  const selected=options.find(option=>option.id===chosenId&&!option.disabled);
  const currentId=selected?.id??null;
  const select=(option:SelectionCardOption)=>{
    if(option.disabled||option.id===currentId)return;
    setChosenId(option.id);
    onSelect?.(option.id);
  };
  return h('section',{class:'legacy-selection-component legacy-kit-card',role:'group','aria-labelledby':headingId,'data-selection-component':'choice-group','data-selection-selected':currentId??'none'},[
    h('h2',{id:headingId,class:'legacy-kit-heading'},title),
    description?h('p',{id:detailsId,class:'legacy-kit-description'},description):null,
    options.length?h('div',{class:'legacy-selection-options',role:'group','aria-label':`Select one ${title.toLowerCase()} option`},options.map((option,index)=>{
      const isSelected=option.id===currentId;
      const descriptionId=`${optionIdBase}-description-${index}`;
      return h('button',{key:option.id,type:'button',class:'legacy-selection-option',disabled:option.disabled??false,
        'data-selection-choice':option.id,'data-selection-illustration':option.illustration,
        'aria-pressed':isSelected,'aria-describedby':descriptionId,
        onClick:()=>select(option)},[
        h(ChoiceIllustration,{kind:option.illustration}),
        h('span',{class:'legacy-selection-copy'},[
          h('span',{class:'legacy-selection-label'},option.label),
          h('span',{id:descriptionId,class:'legacy-selection-description'},option.description),
          h('span',{class:'legacy-selection-state','aria-hidden':'true'},option.disabled?'Unavailable':isSelected?'Selected':'Choose option'),
        ]),
        h('span',{class:'legacy-selection-check','aria-hidden':'true'},isSelected?'✓':'○'),
      ]);
    })):h('p',{class:'legacy-kit-description legacy-selection-empty','data-selection-empty':'true'},emptyMessage),
    h('p',{class:'legacy-selection-live',role:'status','aria-live':'polite','aria-atomic':'true'},
      selected?`${selected.label} selected for this preview only. No game data changed.`:'No selection made. This is a presentation-only preview.'),
  ]);
}

/** Showcase remains isolated from live career/fighter UI and can never save. */
export function SelectionCardGallery() {
  const [theme,setTheme]=useState<'dark'|'light'>('dark');
  const [eventCount,setEventCount]=useState(0);
  const [alternate,setAlternate]=useState(false);
  const samples:readonly SelectionCardOption[]=[
    {id:'striking',label:'Striking focus',description:'Footwork, boxing and combinations.',illustration:'striking'},
    {id:'grappling',label:'Grappling focus',description:'Takedowns, positions and control.',illustration:'grappling'},
    {id:'balanced',label:'Balanced camp',description:'A measured mix of both disciplines.',illustration:'balanced'},
    {id:'later',label:'Future specialty',description:'Coming in a later milestone.',illustration:'balanced',disabled:true},
  ];
  return h('main',{class:'legacy-kit legacy-selection-gallery','data-kit-theme':theme,'data-selection-gallery':'L3-042'},[
    h('header',{class:'legacy-kit-header'},[
      h('span',{class:'legacy-kit-eyebrow'},'LEGACY 3.0 / L3-042 PREVIEW'),
      h('h1',{},'Illustrated choice controls'),
      h('p',{class:'legacy-kit-description'},'Tap or use Tab and Enter / Space to choose a training focus. These are UI previews, not fighter customization or game actions.'),
      h('div',{class:'legacy-kit-theme-switch',role:'group','aria-label':'Preview appearance'},(['dark','light'] as const).map(t=>
        h('button',{type:'button',key:t,'aria-pressed':theme===t,onClick:()=>setTheme(t)},`${t==='dark'?'Dark':'Light'} preview`))),
    ]),
    h('div',{class:'legacy-selection-container'},[
      h('button',{type:'button',class:'legacy-selection-swap','data-selection-swap':'true',onClick:()=>setAlternate(value=>!value)},alternate?'Restore preview choices':'Swap preview choices'),
      h(SelectionCard,{title:'Training focus',description:'Select one illustrated style. All changes remain in this local preview.',options:alternate?[
        {id:'mobility',label:'Mobility focus',description:'Movement and flexibility.',illustration:'balanced'},
        {id:'grappling',label:'Grappling focus',description:'Takedowns, positions and control.',illustration:'grappling'},
      ]:samples,onSelect:()=>setEventCount(count=>count+1)}),
      h('div',{class:'legacy-selection-feedback',role:'status','aria-live':'polite'},`Selection changes in this preview: ${eventCount}. No game state or saved data changed.`),
      h(SelectionCard,{title:'Empty choices example',options:[],emptyMessage:'No selection choices are configured yet.'}),
    ]),
    h('p',{class:'legacy-kit-footnote'},'L3-042 component QA only • Original character artwork is unchanged • No sliders, saves or gameplay consequences'),
  ]);
}
