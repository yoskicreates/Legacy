/** L3-041 — reusable, semantic presentation elements, no side effects. */
import {h, type ComponentChildren} from 'preact';
import {useId,useLayoutEffect,useState} from 'preact/hooks';
import {PANEL_KIT_CATALOG, PANEL_KIT_VERSION, assertPanelKitContrast, filterPanelListItems, filterComparisonDifferences, type PanelKitTheme} from './panel-kit-contract';

export interface TextCardProps {readonly title:string;readonly body:string;readonly eyebrow?:string}
export interface StatProgress {readonly label:string;readonly value:number;readonly max:number}
export interface StatPanelProps {readonly label:string;readonly value:string;readonly detail?:string;readonly progress?:StatProgress}
export interface ActionTileProps {readonly label:string;readonly description:string;readonly onActivate:()=>void;readonly disabled?:boolean}
export interface PanelListItem {readonly id:string;readonly label:string;readonly description?:string}
export interface PanelListProps {readonly title:string;readonly items:readonly PanelListItem[];readonly emptyMessage?:string}
/** Native details/summary keeps the card operable by keyboard and touch without storing game state. */
export interface DisclosureCardProps {readonly title:string;readonly body:string;readonly eyebrow?:string;readonly defaultOpen?:boolean}
/** Presentational notice. Parent owns dismissal; no persistence, domain state, or auto-announce. */
export interface NoticeCardProps {readonly title:string;readonly body:string;readonly tone?:'neutral'|'important';readonly onDismiss?:()=>void}
/** Search is local to the card. Never writes to saves or domain state. */
export interface SearchableListCardProps {readonly title:string;readonly items:readonly PanelListItem[];readonly searchLabel?:string;readonly noMatchesMessage?:string}
/** P5: independent presentation sections; selecting an option never changes game state. */
export interface InfoSection {readonly id:string;readonly label:string;readonly body:string}
export interface SegmentedInfoCardProps {readonly title:string;readonly sections:readonly InfoSection[];readonly initialSectionId?:string}
/** P6: independent, preview-only checklist; never persists to fighter or game state. */
export interface ChecklistItem {readonly id:string;readonly label:string;readonly description?:string}
export interface ChecklistCardProps {readonly title:string;readonly items:readonly ChecklistItem[];readonly emptyMessage?:string}
/** P7: ordered event summaries, with local-only selection; no calendar or career mutation. */
export interface TimelineEntry {readonly id:string;readonly label:string;readonly date:string;readonly description:string;readonly status:'completed'|'current'|'upcoming'}
export interface TimelineCardProps {readonly title:string;readonly entries:readonly TimelineEntry[];readonly emptyMessage?:string}
/** P8: presentation-only comparison. Does not select a game option or change any domain state. */
export interface ComparisonMetric {readonly id:string;readonly label:string;readonly left:string;readonly right:string}
export interface ComparisonCardProps {readonly title:string;readonly leftLabel:string;readonly rightLabel:string;readonly metrics:readonly ComparisonMetric[];readonly emptyMessage?:string}

export function TextCard({title,body,eyebrow}:TextCardProps) {
  const headingId=useId();
  return h('article',{class:'legacy-kit-card legacy-kit-text','aria-labelledby':headingId,'data-kit-component':'text'},[
    eyebrow?h('span',{class:'legacy-kit-eyebrow'},eyebrow):null,
    h('h2',{class:'legacy-kit-heading',id:headingId},title),h('p',{class:'legacy-kit-description'},body),
  ]);
}
export function StatPanel({label,value,detail,progress}:StatPanelProps) {
  const labelId=useId();
  const progressId=useId();
  if(progress && (!Number.isFinite(progress.value)||!Number.isFinite(progress.max)||progress.max<=0||progress.value<0||progress.value>progress.max)) {
    throw new RangeError('StatPanel progress must be finite and within 0..max');
  }
  return h('section',{class:'legacy-kit-card legacy-kit-stat','aria-labelledby':labelId,'data-kit-component':'stat'},[
    h('dl',{},[h('div',{},[
      h('dt',{class:'legacy-kit-eyebrow',id:labelId},label),
      h('dd',{class:'legacy-kit-value'},value),
    ])]),
    progress?h('div',{class:'legacy-kit-progress','data-kit-progress':'true'},[
      h('div',{class:'legacy-kit-progress-label'},[
        h('span',{id:progressId},progress.label),
        h('span',{class:'legacy-kit-progress-count','aria-hidden':'true'},`${progress.value} / ${progress.max}`),
      ]),
      h('progress',{'aria-labelledby':progressId,value:progress.value,max:progress.max},''),
    ]):null,
    detail?h('p',{class:'legacy-kit-description'},detail):null,
  ]);
}
export function ActionTile({label,description,onActivate,disabled=false}:ActionTileProps) {
  const labelId=useId();
  const descriptionId=useId();
  return h('button',{class:'legacy-kit-card legacy-kit-action',type:'button',onClick:onActivate,disabled,'aria-labelledby':labelId,'aria-describedby':descriptionId,'data-kit-component':'action'},[
    h('span',{class:'legacy-kit-action-content'},[
      h('span',{class:'legacy-kit-action-title',id:labelId},label),
      h('span',{class:'legacy-kit-description',id:descriptionId},description),
    ]),h('span',{class:'legacy-kit-arrow','aria-hidden':'true'},'→'),
  ]);
}
/** Stable list keys prevent unrelated rows being reused after parent data changes. */
function assertUniquePanelListIds(items:readonly PanelListItem[]):void {
  if(items.some(item=>!item.id.trim()||!item.label.trim())||new Set(items.map(item=>item.id)).size!==items.length){
    throw new RangeError('Panel list items require unique non-empty IDs and labels');
  }
}
export function PanelList({title,items,emptyMessage='No items available.'}:PanelListProps) {
  assertUniquePanelListIds(items);
  const headingId=useId();
  return h('section',{class:'legacy-kit-card legacy-kit-list','aria-labelledby':headingId,'data-kit-component':'list'},[
    h('h2',{class:'legacy-kit-heading',id:headingId},title),
    items.length?h('ul',{},items.map(item=>h('li',{key:item.id},[
      h('span',{class:'legacy-kit-list-title'},item.label),
      item.description?h('span',{class:'legacy-kit-description'},item.description):null,
    ]))):h('p',{class:'legacy-kit-description legacy-kit-empty','data-kit-empty':'true'},emptyMessage),
  ]);
}
export function DisclosureCard({title,body,eyebrow,defaultOpen=false}:DisclosureCardProps) {
  return h('details',{class:'legacy-kit-card legacy-kit-disclosure',open:defaultOpen,'data-kit-component':'disclosure'},[
    h('summary',{class:'legacy-kit-disclosure-summary'},[
      h('span',{class:'legacy-kit-disclosure-heading'},[
        eyebrow?h('span',{class:'legacy-kit-eyebrow'},eyebrow):null,
        h('span',{class:'legacy-kit-heading'},title),
      ]),
      h('span',{class:'legacy-kit-disclosure-chevron','aria-hidden':'true'},'⌄'),
    ]),
    h('p',{class:'legacy-kit-description legacy-kit-disclosure-body'},body),
  ]);
}
/** Accessible informational region. Only a supplied callback enables dismissal. */
export function NoticeCard({title,body,tone='neutral',onDismiss}:NoticeCardProps) {
  const titleId=useId();
  const bodyId=useId();
  return h('aside',{class:'legacy-kit-card legacy-kit-notice',role:'note','aria-labelledby':titleId,'aria-describedby':bodyId,'data-kit-component':'notice','data-kit-tone':tone},[
    h('div',{class:'legacy-kit-notice-top'},[
      h('span',{class:'legacy-kit-eyebrow'},tone==='important'?'IMPORTANT · PREVIEW':'INFORMATION · PREVIEW'),
      onDismiss?h('button',{type:'button',class:'legacy-kit-notice-dismiss',onClick:onDismiss,'aria-label':`Dismiss ${title}`},'Dismiss'):null,
    ]),
    h('h2',{id:titleId,class:'legacy-kit-heading'},title),
    h('p',{id:bodyId,class:'legacy-kit-description'},body),
  ]);
}
/** Searchable, keyboard-native list. Filters only the caller's supplied presentation data. */
export function SearchableListCard({title,items,searchLabel='Search items',noMatchesMessage='No matching items.'}:SearchableListCardProps) {
  assertUniquePanelListIds(items);
  const headingId=useId();
  const inputId=useId();
  const [query,setQuery]=useState('');
  const matches=filterPanelListItems(items,query);
  return h('section',{class:'legacy-kit-card legacy-kit-search-list','aria-labelledby':headingId,'data-kit-component':'search-list'},[
    h('h2',{class:'legacy-kit-heading',id:headingId},title),
    h('label',{class:'legacy-kit-search-label',htmlFor:inputId},searchLabel),
    h('input',{class:'legacy-kit-search-input',id:inputId,type:'search',value:query,autoComplete:'off',onInput:(event:Event)=>setQuery((event.currentTarget as HTMLInputElement).value)}),
    h('p',{class:'legacy-kit-search-count',role:'status','aria-live':'polite','aria-atomic':'true'},`${matches.length} of ${items.length} items shown`),
    matches.length?h('ul',{class:'legacy-kit-search-results'},matches.map(item=>h('li',{key:item.id},[
      h('span',{class:'legacy-kit-list-title'},item.label),
      item.description?h('span',{class:'legacy-kit-description'},item.description):null,
    ]))):h('p',{class:'legacy-kit-description legacy-kit-empty','data-kit-search-empty':'true'},noMatchesMessage),
  ]);
}
/** Native pressed-buttons group rather than ARIA tabs: every option uses normal Tab + Enter/Space.
 * Caller supplies 2–4 information sections; selections are local-only presentation state.
 */
export function SegmentedInfoCard({title,sections,initialSectionId}:SegmentedInfoCardProps) {
  const headingId=useId();
  const contentId=useId();
  const choiceBaseId=useId();
  if(sections.length<2||sections.length>4||sections.some(x=>!x.id.trim()||!x.label.trim()||!x.body.trim())||new Set(sections.map(x=>x.id)).size!==sections.length) {
    throw new RangeError('SegmentedInfoCard requires 2–4 distinct, non-empty sections');
  }
  const [selectedId,setSelectedId]=useState(initialSectionId&&sections.some(x=>x.id===initialSectionId)?initialSectionId:sections[0]!.id);
  const matchingIndex=sections.findIndex(x=>x.id===selectedId);
  const fallbackIndex=initialSectionId?sections.findIndex(x=>x.id===initialSectionId):-1;
  const selectedIndex=matchingIndex>=0?matchingIndex:Math.max(0,fallbackIndex);
  const selected=sections[selectedIndex]!;
  const selectedButtonId=`${choiceBaseId}-option-${selectedIndex}`;
  return h('section',{class:'legacy-kit-card legacy-kit-segmented','aria-labelledby':headingId,'data-kit-component':'segmented-info'},[
    h('h2',{class:'legacy-kit-heading',id:headingId},title),
    h('div',{class:'legacy-kit-segmented-controls',role:'group','aria-label':`Choose ${title} information`},sections.map((section,index)=>h('button',{
      key:section.id,id:`${choiceBaseId}-option-${index}`,type:'button',class:'legacy-kit-segmented-option',
      'aria-pressed':selected.id===section.id,'aria-controls':contentId,onClick:()=>setSelectedId(section.id),
    },section.label))),
    h('div',{class:'legacy-kit-segmented-content',id:contentId,role:'region','aria-labelledby':selectedButtonId,'data-kit-active-section':selected.id},[
      h('p',{class:'legacy-kit-description'},selected.body),
    ]),
  ]);
}
/** Native checkboxes make progress review accessible by touch and keyboard.
 * Checkmarks and counts are strictly local to this component, not domain progress.
 */
export function ChecklistCard({title,items,emptyMessage='No checklist items available.'}:ChecklistCardProps) {
  const headingId=useId();
  const progressId=useId();
  const inputBaseId=useId();
  if(items.some(item=>!item.id.trim()||!item.label.trim())||new Set(items.map(item=>item.id)).size!==items.length){
    throw new RangeError('ChecklistCard requires unique non-empty IDs and labels');
  }
  const [checkedIds,setCheckedIds]=useState<readonly string[]>([]);
  // Prune missing IDs after a parent changes the checklist, even when the user
  // does not interact. Otherwise removed/reintroduced items silently regain
  // checks from an earlier preview dataset.
  const itemIds=items.map(item=>item.id);
  const itemIdentity=JSON.stringify(itemIds);
  useLayoutEffect(()=>{
    setCheckedIds(previous=>{
      const active=previous.filter(id=>itemIds.includes(id));
      return active.length===previous.length?previous:active;
    });
  },[itemIdentity]);
  // Checked IDs belong to the currently supplied preview items only.
  const activeCheckedIds=checkedIds.filter(id=>itemIds.includes(id));
  const count=activeCheckedIds.length;
  return h('section',{class:'legacy-kit-card legacy-kit-checklist','aria-labelledby':headingId,'data-kit-component':'checklist'},[
    h('h2',{class:'legacy-kit-heading',id:headingId},title),
    items.length?h('div',{class:'legacy-kit-checklist-body'},[
      h('div',{class:'legacy-kit-checklist-overview'},[
        h('span',{id:progressId},'Preview items reviewed'),
        h('span',{class:'legacy-kit-checklist-count','aria-hidden':'true'},`${count} / ${items.length}`),
      ]),
      h('progress',{value:count,max:items.length,'aria-labelledby':progressId},''),
      h('p',{class:'legacy-kit-checklist-status',role:'status','aria-live':'polite','aria-atomic':'true'},`${count} of ${items.length} preview items checked`),
      h('ul',{class:'legacy-kit-checklist-items'},items.map((item,index)=>h('li',{key:item.id},[
        h('label',{class:'legacy-kit-checklist-row',htmlFor:`${inputBaseId}-check-${index}`},[
          h('input',{id:`${inputBaseId}-check-${index}`,type:'checkbox',checked:activeCheckedIds.includes(item.id),onChange:()=>setCheckedIds(previous=>{
            const active=previous.filter(id=>items.some(item=>item.id===id));
            return active.includes(item.id)?active.filter(id=>id!==item.id):[...active,item.id];
          })}),
          h('span',{class:'legacy-kit-checklist-copy'},[
            h('span',{class:'legacy-kit-list-title'},item.label),
            item.description?h('span',{class:'legacy-kit-description'},item.description):null,
          ]),
        ]),
      ]))),
      count?h('button',{type:'button',class:'legacy-kit-checklist-reset',onClick:()=>setCheckedIds([])},'Reset preview checks'):null,
    ]):h('p',{class:'legacy-kit-description legacy-kit-empty','data-kit-checklist-empty':'true'},emptyMessage),
  ]);
}
/** Enforce real ISO calendar dates rather than accepting impossible day/month values. */
function isTimelineDate(value:string):boolean {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const [year,month,day]=value.split('-').map(Number);
  // Date.UTC treats years 0–99 as 1900–1999; setUTCFullYear avoids that coercion.
  const date=new Date(0);
  date.setUTCFullYear(year!,month!-1,day!);
  return date.getUTCFullYear()===year && date.getUTCMonth()+1===month && date.getUTCDate()===day;
}
/** Mobile event timeline. The supplied dates/statuses are presentation data, not scheduled events.
 * Selecting an entry only reveals its description; nothing is persisted or dispatched.
 */
export function TimelineCard({title,entries,emptyMessage='No timeline entries available.'}:TimelineCardProps) {
  const headingId=useId();
  const detailId=useId();
  const itemIdBase=useId();
  if(entries.some(entry=>!entry.id.trim()||!entry.label.trim()||!entry.description.trim()||
    !isTimelineDate(entry.date)||
    !['completed','current','upcoming'].includes(entry.status))||
    new Set(entries.map(entry=>entry.id)).size!==entries.length){
    throw new RangeError('TimelineCard needs unique IDs, valid ISO date text, descriptions and supported statuses');
  }
  const [selectedId,setSelectedId]=useState(entries.find(entry=>entry.status==='current')?.id??entries[0]?.id??'');
  // If callers replace the entries, never leave a stale selection with no pressed button.
  const matchingIndex=entries.findIndex(entry=>entry.id===selectedId);
  const selectedIndex=matchingIndex>=0?matchingIndex:Math.max(0,entries.findIndex(entry=>entry.status==='current'));
  const selected=entries[selectedIndex];
  return h('section',{class:'legacy-kit-card legacy-kit-timeline','aria-labelledby':headingId,'data-kit-component':'timeline'},[
    h('h2',{id:headingId,class:'legacy-kit-heading'},title),
    entries.length?h('div',{class:'legacy-kit-timeline-body'},[
      h('ol',{class:'legacy-kit-timeline-items'},entries.map((entry,index)=>h('li',{key:entry.id,'data-kit-entry-status':entry.status},[
        h('button',{type:'button',class:'legacy-kit-timeline-option',id:`${itemIdBase}-entry-${index}`,
          'aria-pressed':selected?.id===entry.id,'aria-controls':detailId,onClick:()=>setSelectedId(entry.id)},[
          h('span',{class:'legacy-kit-timeline-label'},entry.label),
          h('time',{class:'legacy-kit-timeline-date',dateTime:entry.date},entry.date),
          h('span',{class:'legacy-kit-timeline-status'},entry.status),
        ]),
      ]))),
      selected?h('div',{id:detailId,class:'legacy-kit-timeline-detail',role:'region',
        'aria-labelledby':`${itemIdBase}-entry-${selectedIndex}`,'data-kit-selected-entry':selected.id},[
        h('p',{class:'legacy-kit-description'},selected.description),
      ]):null,
    ]):h('p',{class:'legacy-kit-description legacy-kit-empty','data-kit-timeline-empty':'true'},emptyMessage),
  ]);
}
/** Read-only side-by-side comparison. The filter is local view state, not a choice or save. */
export function ComparisonCard({title,leftLabel,rightLabel,metrics,emptyMessage='No comparison details available.'}:ComparisonCardProps) {
  const headingId=useId();
  const tableId=useId();
  if(!title.trim()||!leftLabel.trim()||!rightLabel.trim()||metrics.some(metric=>
    !metric.id.trim()||!metric.label.trim()||!metric.left.trim()||!metric.right.trim())||
    new Set(metrics.map(metric=>metric.id)).size!==metrics.length){
    throw new RangeError('ComparisonCard requires nonempty labels and unique metric IDs');
  }
  const [differencesOnly,setDifferencesOnly]=useState(false);
  const visible=filterComparisonDifferences(metrics,differencesOnly);
  return h('section',{class:'legacy-kit-card legacy-kit-comparison','aria-labelledby':headingId,'data-kit-component':'comparison'},[
    h('h2',{id:headingId,class:'legacy-kit-heading'},title),
    metrics.length?h('div',{class:'legacy-kit-comparison-body'},[
      h('button',{type:'button',class:'legacy-kit-comparison-toggle','aria-pressed':differencesOnly,
        'aria-controls':tableId,onClick:()=>setDifferencesOnly(value=>!value)},'Differences only'),
      h('p',{class:'legacy-kit-comparison-count',role:'status','aria-live':'polite','aria-atomic':'true'},
        `${visible.length} of ${metrics.length} sample details shown`),
      h('table',{id:tableId,class:'legacy-kit-comparison-table'},[
        h('caption',{class:'legacy-kit-comparison-caption'},'Illustrative comparison — no option is selected'),
        h('thead',{},h('tr',{},[
          h('th',{scope:'col'},'Detail'),
          h('th',{scope:'col'},leftLabel),
          h('th',{scope:'col'},rightLabel),
        ])),
        h('tbody',{},visible.length?visible.map(metric=>h('tr',{key:metric.id},[
          h('th',{scope:'row'},metric.label),
          h('td',{},metric.left),
          h('td',{},metric.right),
        ])):h('tr',{},h('td',{colSpan:3,class:'legacy-kit-comparison-no-difference'},'No differences in these sample details.'))),
      ]),
    ]):h('p',{class:'legacy-kit-description legacy-kit-empty','data-kit-comparison-empty':'true'},emptyMessage),
  ]);
}
export function PanelKitGallery() {
  const titleId=useId();
  const variantsId=useId();
  const darkButtonId=useId();
  const lightButtonId=useId();
  const statusId=useId();
  const [theme,setTheme]=useState<PanelKitTheme>('dark');
  const [actionCount,setActionCount]=useState(0);
  const [noticeVisible,setNoticeVisible]=useState(true);
  assertPanelKitContrast(theme);
  return h('main',{class:'legacy-kit','data-kit-theme':theme,'data-panel-kit-version':PANEL_KIT_VERSION,'aria-labelledby':titleId},[
    h('header',{class:'legacy-kit-header'},[
      h('span',{class:'legacy-kit-eyebrow'},'LEGACY 3.0 · COMPONENT FOUNDATION'),
      h('h1',{id:titleId,tabIndex:-1,'data-kit-title':'true'},'Panel & Card Kit'),
      h('p',{class:'legacy-kit-description'},'Presentation-only component previews. No fighter, save, career or financial data is created or changed.'),
      h('div',{class:'legacy-kit-theme-switch',role:'group','aria-label':'Preview color theme'},[
        ...(['dark','light'] as const).map(t=>h('button',{type:'button',key:t,id:t==='dark'?darkButtonId:lightButtonId,'data-kit-theme-button':t,'aria-pressed':theme===t,onClick:()=>setTheme(t)},t==='dark'?'Dark preview':'Light preview')),
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
      h(DisclosureCard,{eyebrow:'EXPANDABLE CARD · PREVIEW',title:'Fighter development details',body:'A reusable space for future training explanations and career guidance. This demo contains no fighter statistics, progression, or save data.'}),
      noticeVisible?h(NoticeCard,{tone:'important',title:'Training guidance example',body:'This is sample guidance for the component kit. No training session, injury, or career event has occurred.',onDismiss:()=>setNoticeVisible(false)}):h('button',{type:'button',class:'legacy-kit-notice-restore',onClick:()=>setNoticeVisible(true),'data-kit-restore-notice':'true'},'Restore sample notice'),
      h(SearchableListCard,{title:'Explore preview topics',searchLabel:'Search preview topics',items:[
        {id:'training',label:'Training',description:'Illustrative guidance only'},
        {id:'career',label:'Career',description:'No contracts or rankings loaded'},
        {id:'fighter',label:'Fighter',description:'No saved fighter available'},
        {id:'combat',label:'Combat',description:'Fight simulation is not available here'},
      ]}),
      h(ChecklistCard,{title:'Preparation checklist · preview',items:[
        {id:'stance',label:'Review stance fundamentals',description:'Example review action, not training progress'},
        {id:'options',label:'Explore training options',description:'No drills are started or recorded'},
        {id:'goals',label:'Read future career goals',description:'Preview information only'},
      ]}),
      h(TimelineCard,{title:'Illustrative career timeline',entries:[
        {id:'orientation',label:'Review orientation',date:'2026-01-02',description:'A sample completed information step, not a real career event.',status:'completed'},
        {id:'training',label:'Explore training paths',date:'2026-01-09',description:'Review how future training events could be shown, without recording a training session.',status:'current'},
        {id:'career',label:'Future career options',date:'2026-01-16',description:'Preview-only next step; no fight offer or calendar event is scheduled.',status:'upcoming'},
      ]}),
      h(ComparisonCard,{title:'Training approach comparison · preview',leftLabel:'Technical',rightLabel:'Conditioning',metrics:[
        {id:'focus',label:'Focus',left:'Technique',right:'Endurance'},
        {id:'location',label:'Location',left:'Gym',right:'Gym'},
        {id:'method',label:'Example',left:'Drills',right:'Circuits'},
      ]}),
      h(SegmentedInfoCard,{title:'Preview information',sections:[
        {id:'training',label:'Training',body:'Training explanations can be shown here in the future. No training is performed.'},
        {id:'career',label:'Career',body:'Career guidance preview only. No rankings, offers, or contracts exist here.'},
        {id:'fighter',label:'Fighter',body:'Character description preview only. No fighter or appearance is generated.'},
      ]}),
    ]),
    h('section',{class:'legacy-kit-variants','aria-labelledby':variantsId},[
      h('h2',{id:variantsId,class:'legacy-kit-variants-title'},'Component states'),
      h('p',{class:'legacy-kit-description'},'Disabled actions and empty lists remain readable and accessible, without representing a real game state.'),
      h('div',{class:'legacy-kit-grid'},[
        h(ActionTile,{label:'Locked preview action',description:'Example of a disabled control. This button cannot change any state.',disabled:true,onActivate:()=>setActionCount(n=>n+1)}),
        h(PanelList,{title:'Empty collection example',items:[],emptyMessage:'No preview items have been added.'}),
        h(StatPanel,{label:'PROGRESS METER · PREVIEW',value:'3 / 5',progress:{label:'Sample progress towards a fictional goal',value:3,max:5},detail:'Display-only example. No training, career, or save progress has been recorded.'}),
      ]),
    ]),
    h('p',{id:statusId,'data-kit-status':'true',role:'status','aria-live':'polite',class:'legacy-kit-status','data-activation-count':String(actionCount)},actionCount?`Preview action acknowledged (${actionCount}). No game data changed.`:'Preview action has not been selected.'),
    h('small',{class:'legacy-kit-footnote'},`${PANEL_KIT_CATALOG.length} reusable components · no sliders · no gameplay`),
  ]);
}
export type KitChildren = ComponentChildren;
