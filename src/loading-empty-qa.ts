import {h,render} from 'preact';
import {useState} from 'preact/hooks';
import {PlaceholderPanel} from './ui/loading-empty-states';
import type {PlaceholderState} from './ui/loading-empty-states';
const states:PlaceholderState[]=['loading','no-save','no-events','missing-asset'];
function Preview(){
 const [state,setState]=useState<PlaceholderState>('no-save');
 const [actionCount,setActionCount]=useState(0);
 return h('main',{class:'legacy-kit','data-kit-theme':'dark'},[
  h('h1',{},'Loading and empty states — fictional QA'),
  h('nav',{'aria-label':'Preview state'},states.map(item=>h('button',{type:'button','data-switch-state':item,'aria-pressed':state===item,onClick:()=>setState(item)},item))),
  h(PlaceholderPanel,{state,onAction:()=>setActionCount(count=>count+1)}),
  h('output',{'data-action-count':String(actionCount)},'Demo action clicks: '+actionCount),
  h('p',{},'Preview only. No save or career data changes.'),
 ]);
}
const host=document.querySelector('#loading-empty-root');
if(!host)throw new Error('Missing placeholder QA host');
render(h(Preview,{}),host);
