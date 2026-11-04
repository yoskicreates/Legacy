/** L3-044: accessible non-modal notifications. The component never touches gameplay or storage. */
import {h} from 'preact';
import {useId,useRef,useState} from 'preact/hooks';
import {makeToastNotice} from './toast-status-contract';
import type {ToastNotice,ToastEvent} from './toast-status-contract';

export interface ToastStackProps {
  readonly notices:readonly ToastNotice[];
  readonly onDismiss:(id:string)=>void;
}
/** Notifications do not steal focus or auto-dismiss while assistive technology is reading. */
export function ToastStack({notices,onDismiss}:ToastStackProps) {
  const headingId=useId();
  return h('aside',{class:'legacy-toast-stack','aria-labelledby':headingId,'data-toast-stack':'true'},[
    h('h2',{id:headingId,class:'legacy-toast-stack-heading'},'Notifications'),
    notices.map(item=>h('section',{key:item.id,class:`legacy-toast legacy-toast--${item.appearance}`,
      'data-toast-kind':item.appearance,'data-toast-id':item.id,'data-preview-only':String(item.previewOnly),
      role:item.urgency==='assertive'?'alert':'status','aria-live':item.urgency,
      'aria-atomic':'true'},[
      h('span',{class:'legacy-toast-mark','aria-hidden':'true'},item.appearance==='error'?'!':item.appearance==='locked'?'◈':item.appearance==='preview-saved'?'◇':'✓'),
      h('div',{class:'legacy-toast-copy'},[
        h('p',{class:'legacy-toast-title'},item.title),
        h('p',{class:'legacy-toast-detail'},item.detail),
      ]),
      h('button',{type:'button',class:'legacy-toast-dismiss',
        'aria-label':`Dismiss ${item.title}`,onClick:()=>onDismiss(item.id)},'×'),
    ])),
  ]);
}
/** This demo intentionally has no saved-state path; the Save example is explicitly a preview. */
export function ToastStatusGallery() {
  const [theme,setTheme]=useState<'dark'|'light'>('dark');
  const [notices,setNotices]=useState<readonly ToastNotice[]>([]);
  const [practiceActions,setPracticeActions]=useState(0);
  const sequence=useRef(0);
  const enqueue=(event:ToastEvent)=>{
    const id=`toast-${++sequence.current}`;
    setNotices(previous=>[...previous,makeToastNotice(id,event)].slice(-3));
  };
  const practice=()=>{setPracticeActions(current=>current+1);enqueue({type:'practice-complete',action:'choice'});};
  return h('main',{class:'legacy-kit legacy-toast-gallery','data-kit-theme':theme,'data-toast-gallery':'L3-044'},[
    h('header',{class:'legacy-kit-header'},[
      h('span',{class:'legacy-kit-eyebrow'},'LEGACY 3.0 / L3-044 PREVIEW'),
      h('h1',{},'Game notifications'),
      h('p',{class:'legacy-kit-description'},'Practice notifications only. Nothing on this page saves your game or changes a fighter.'),
      h('div',{class:'legacy-kit-theme-switch',role:'group','aria-label':'Preview appearance'},
        (['dark','light'] as const).map(t=>h('button',{type:'button',key:t,'aria-pressed':theme===t,onClick:()=>setTheme(t)},t==='dark'?'Dark preview':'Light preview'))),
    ]),
    h('section',{class:'legacy-toast-demo legacy-kit-card','aria-label':'Notification demonstrations'},[
      h('h2',{class:'legacy-kit-heading'},'Try a notification'),
      h('p',{class:'legacy-kit-description'},'Notifications say what actually happened. The save example clearly says it is not a real save.'),
      h('div',{class:'legacy-toast-demo-actions'},[
        h('button',{type:'button','data-demo-toast':'success',onClick:practice},'Complete practice choice'),
        h('button',{type:'button','data-demo-toast':'error',onClick:()=>enqueue({type:'preview-error'})},'See error example'),
        h('button',{type:'button','data-demo-toast':'locked',onClick:()=>enqueue({type:'preview-locked'})},'See locked example'),
        h('button',{type:'button','data-demo-toast':'saved',onClick:()=>enqueue({type:'preview-save'})},'Preview saved message'),
      ]),
      h('p',{class:'legacy-toast-demo-count','data-practice-actions':'true',role:'status','aria-live':'polite'},
        `Completed practice choices: ${practiceActions}. Real save operations: 0. No game data changed.`),
    ]),
    h(ToastStack,{notices,onDismiss:id=>setNotices(existing=>existing.filter(item=>item.id!==id))}),
    h('p',{class:'legacy-kit-footnote'},'L3-044 UI demo only · No purchases, fighter updates, real saves, or gameplay effects'),
  ]);
}
