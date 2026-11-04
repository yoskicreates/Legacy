import {h,render} from 'preact';
import {SettingsShell} from './ui/settings-shell';
const host=document.querySelector('#settings-root');
if(!host)throw new Error('Missing settings QA host');
render(h('main',{class:'legacy-kit','data-kit-theme':'dark'},[
 h('header',{class:'legacy-kit-header'},[h('span',{class:'legacy-kit-eyebrow'},'LEGACY 3.0 / L3-048'),h('h1',{},'Settings preview'),h('p',{},'Independent settings only; career data is not loaded.')]),
 h(SettingsShell,{storage:undefined})
]),host);
