/** L3-047 — accessible, deterministic visual states. No persistence or gameplay side effects. */
import {h} from 'preact';
export type PlaceholderState = 'loading' | 'no-save' | 'no-events' | 'missing-asset';
export interface PlaceholderView {readonly title:string;readonly detail:string;readonly action?:string;}
export const PLACEHOLDER_CONTENT:Readonly<Record<PlaceholderState,PlaceholderView>> = Object.freeze({
  loading:{title:'Preparing your career',detail:'Loading your career preview. No changes are being made.'},
  'no-save':{title:'No saved career yet',detail:'Your career will appear here once you create a fighter.',action:'Create fighter'},
  'no-events':{title:'Nothing scheduled',detail:'Upcoming training, fights, and events will appear here.'},
  'missing-asset':{title:'Illustration unavailable',detail:'This preview cannot display its illustration right now. Your career information is unaffected.'},
});
export function PlaceholderPanel({state,onAction}:{readonly state:PlaceholderState;readonly onAction?:()=>void}) {
  if(!Object.prototype.hasOwnProperty.call(PLACEHOLDER_CONTENT,state))throw new TypeError('Unknown placeholder state');
  const content=PLACEHOLDER_CONTENT[state];
  return h('section',{class:'legacy-placeholder legacy-kit-card','data-placeholder-state':state,'aria-busy':state==='loading','aria-label':content.title},[
    h('div',{class:'legacy-placeholder-mark','aria-hidden':'true'},state==='loading'?'…':state==='missing-asset'?'□':'—'),
    h('h2',{},content.title),
    h('p',{},content.detail),
    content.action&&onAction?h('button',{type:'button',onClick:onAction},content.action):null,
    state==='loading'?h('p',{class:'legacy-placeholder-status',role:'status','aria-live':'polite'},'Loading preview…'):null,
  ]);
}
