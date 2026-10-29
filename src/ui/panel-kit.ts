/** L3-041 — reusable, semantic presentation elements, no side effects. */
import {h, type ComponentChildren, type VNode} from 'preact';
import {useId,useState} from 'preact/hooks';
import {PANEL_KIT_CATALOG, PANEL_KIT_VERSION, assertPanelKitContrast, type PanelKitTheme} from './panel-kit-contract';

export interface TextCardProps {readonly title:string;readonly body:string;readonly eyebrow?:string}
export interface StatPanelProps {readonly label:string;readonly value:string;readonly detail?:string}
export interface ActionTileProps {readonly label:string;readonly description:string;readonly onActivate:()=>void;readonly disabled?:boolean}
export interface PanelListItem {readonly id:string;readonly label:string;readonly description?:string}
export interface PanelListProps {readonly title:string;readonly items:readonly PanelListItem[]}

export function TextCard({title,body,eyebrow}:TextCardProps):VNode {
  return h('article',{class:'legacy-kit-card legacy-kit-text','aria-label':title,'data-kit-component':'text'},[
    eyebrow?h('span',{class:'legacy-kit-eyebrow'},eyebrow):null,
    h('h2',{class:'legacy-kit-heading'},title),h('p',{class:'legacy-kit-description'},body),
  ]);
}
export function StatPanel({label,value,detail}:StatPanelProps):VNode {
  return h('section',{class:'legacy-kit-card legacy-kit-stat','aria-label':label,'data-kit-component':'stat'},[
    h('dl',{},[h('div',{},[
      h('dt',{class:'legacy-kit-eyebrow'},label),
      h('dd',{class:'legacy-kit-value'},value),
    ])]),detail?h('p',{class:'legacy-kit-description'},detail):null,
  ]);
}
export function ActionTile({label,description,onActivate,disabled=false}:ActionTileProps):VNode {
  const descriptionId=useId();
  return h('button',{class:'legacy-kit-card legacy-kit-action',type:'button',onClick:onActivate,disabled,'aria-label':label,'aria-describedby':descriptionId,'data-kit-component':'action'},[
    h('span',{class:'legacy-kit-action-content'},[
      h('span',{class:'legacy-kit-action-title'},label),
      h('span',{class:'legacy-kit-description',id:descriptionId},description),
    ]),h('span',{class:'legacy-kit-arrow','aria-hidden':'true'},'→'),
  ]);
}
export function PanelList({title,items}:PanelListProps):VNode {
  return h('section',{class:'legacy-kit-card legacy-kit-list','aria-label':title,'data-kit-component':'list'},[
    h('h2',{class:'legacy-kit-heading'},title),
    h('ul',{},items.length?items.map(item=>h('li',{key:item.id},[
      h('span',{class:'legacy-kit-list-title'},item.label),
      item.description?h('span',{class:'legacy-kit-description'},item.description):null,
    ])):h('li',{},'No preview items.')),
  ]);
}
export function PanelKitGallery():VNode {
  const [theme,setTheme]=useState<PanelKitTheme>('dark');
  const [actionCount,setActionCount]=useState(0);
  assertPanelKitContrast(theme);
  return h('main',{class:'legacy-kit','data-kit-theme':theme,'data-panel-kit-version':PANEL_KIT_VERSION,'aria-label':'LEGACY shared UI kit preview'},[
    h('header',{class:'legacy-kit-header'},[
      h('span',{class:'legacy-kit-eyebrow'},'LEGACY 3.0 · COMPONENT FOUNDATION'),
      h('h1',{id:'kit-title',tabIndex:-1},'Panel & Card Kit'),
      h('p',{class:'legacy-kit-description'},'Presentation-only component previews. No fighter, save, career or financial data is created or changed.'),
      h('div',{class:'legacy-kit-theme-switch',role:'group','aria-label':'Preview color theme'},[
        ...(['dark','light'] as const).map(t=>h('button',{type:'button',key:t,id:`kit-theme-${t}`,'aria-pressed':theme===t,onClick:()=>setTheme(t)},t==='dark'?'Dark preview':'Light preview')),
      ]),
    ]),
    h('div',{class:'legacy-kit-grid'},[
      h(TextCard,{eyebrow:'TEXT CARD · PREVIEW',title:'Your Legacy starts here',body:'Reusable descriptive panel with semantic heading, legible body copy and no simulated game results.'}),
      h(StatPanel,{label:'FIGHTER RATING · PREVIEW',value:'—',detail:'Unavailable until a fighter is created in a future milestone.'}),
      h(ActionTile,{label:'Explore preview action',description:'Tap or press Enter / Space. This does not change game state.',onActivate:()=>setActionCount(n=>n+1)}),
      h(PanelList,{title:'Preview milestones',items:[
        {id:'one',label:'Career',description:'Summary placeholder only'},
        {id:'two',label:'Fighter',description:'Attributes placeholder only'},
        {id:'three',label:'Fight',description:'No opponent or fight simulation'},
      ]}),
    ]),
    h('p',{id:'kit-action-result',role:'status','aria-live':'polite',class:'legacy-kit-status','data-activation-count':String(actionCount)},actionCount?`Preview action acknowledged (${actionCount}). No game data changed.`:'Preview action has not been selected.'),
    h('small',{class:'legacy-kit-footnote'},`${PANEL_KIT_CATALOG.length} reusable components · no sliders · no gameplay`),
  ]);
}
export type KitChildren = ComponentChildren;
