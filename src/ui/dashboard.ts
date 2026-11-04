/** L3-045: presentation-only fighter dashboard, intentionally using demo fixtures. */
import {h} from 'preact';
import {useId,useState} from 'preact/hooks';
import {formatCashUsd,formatGameDate,SAMPLE_DASHBOARD,validateDashboardData} from './dashboard-contract';
import type {DashboardData} from './dashboard-contract';

export interface DashboardProps {
  readonly data:DashboardData;
  readonly onNextPreview?:()=>void;
}
/** No persistence, career state, clock mutation, purchases, or live fighter portrait. */
export function Dashboard({data,onNextPreview}:DashboardProps) {
  validateDashboardData(data);
  const fighterId=useId();
  const cashId=useId();
  const nextId=useId();
  const noticesId=useId();
  const [previewCount,setPreviewCount]=useState(0);
  const activate=()=>{setPreviewCount(count=>count+1);onNextPreview?.();};
  return h('div',{class:'legacy-dashboard','data-dashboard-source':data.source,'data-dashboard':'L3-045'},[
    h('header',{class:'legacy-dashboard-top'},[
      h('div',{class:'legacy-dashboard-brand'},[
        h('span',{class:'legacy-dashboard-brand-name'},'LEGACY'),
        h('span',{class:'legacy-dashboard-brand-detail'},'CAREER HEADQUARTERS'),
      ]),
      h('span',{class:'legacy-dashboard-demo-tag'},'SAMPLE DATA · NO LIVE SAVE'),
    ]),
    h('div',{class:'legacy-dashboard-date-row'},[
      h('span',{class:'legacy-kit-eyebrow'},'YOUR CAREER DAY · DEMO'),
      h('time',{dateTime:data.gameDate,'data-dashboard-date':'true'},formatGameDate(data.gameDate)),
    ]),
    h('div',{class:'legacy-dashboard-main'},[
      h('section',{class:'legacy-dashboard-hero legacy-kit-card','aria-labelledby':fighterId},[
        h('div',{class:'legacy-dashboard-fighter'},[
          h('span',{class:'legacy-kit-eyebrow'},'FIGHTER OVERVIEW · SAMPLE'),
          h('h1',{id:fighterId},data.fighter.name),
          h('p',{class:'legacy-dashboard-division'},data.fighter.division),
          h('dl',{class:'legacy-dashboard-record'},[
            h('div',{},[h('dt',{},'Record'),h('dd',{},data.fighter.record)]),
            h('div',{},[h('dt',{},'Gym'),h('dd',{},data.fighter.gym)]),
          ]),
        ]),
        h('div',{class:'legacy-dashboard-art-slot',role:'img','aria-label':'Fighter portrait is not connected in this dashboard preview'},[
          h('span',{class:'legacy-dashboard-art-mark','aria-hidden':'true'},'◇'),
          h('span',{},'APPROVED FIGHTER ART'),
          h('small',{},'Not connected to this preview'),
        ]),
      ]),
      h('section',{class:'legacy-dashboard-money legacy-kit-card','aria-labelledby':cashId},[
        h('span',{class:'legacy-kit-eyebrow'},'FINANCES · SAMPLE'),
        h('h2',{id:cashId},'Available money'),
        h('p',{class:'legacy-dashboard-amount','data-dashboard-cash':'true'},formatCashUsd(data.cashUsd)),
        h('p',{class:'legacy-kit-description'},'Example balance only. This screen cannot spend or save money.'),
      ]),
      h('section',{class:'legacy-dashboard-next legacy-kit-card','aria-labelledby':nextId},[
        h('span',{class:'legacy-kit-eyebrow'},'UP NEXT · PREVIEW'),
        h('h2',{id:nextId},data.nextAction.label),
        h('p',{class:'legacy-kit-description'},data.nextAction.description),
        h('button',{class:'legacy-dashboard-next-button',type:'button','data-dashboard-next':'true',onClick:activate},[
          'Preview next action',h('span',{'aria-hidden':'true'},'→'),
        ]),
        h('p',{class:'legacy-dashboard-action-feedback',role:'status','aria-live':'polite','data-dashboard-preview-count':'true'},
          `Preview visits: ${previewCount}. No training, purchase, save, or gameplay action was completed.`),
      ]),
      h('section',{class:'legacy-dashboard-alerts legacy-kit-card','aria-labelledby':noticesId},[
        h('span',{class:'legacy-kit-eyebrow'},'INBOX · SAMPLE'),
        h('h2',{id:noticesId},'Notifications'),
        data.notifications.length?h('ul',{},data.notifications.map(item=>h('li',{key:item.id,'data-dashboard-notice':item.id},[
          h('span',{class:'legacy-dashboard-notice-bullet','aria-hidden':'true'},item.kind==='upcoming'?'◇':'•'),
          h('div',{},[h('strong',{},item.title),h('span',{},item.detail)]),
        ]))):h('p',{class:'legacy-kit-description','data-dashboard-empty':'true'},'No sample notifications.'),
        h('p',{class:'legacy-dashboard-alerts-footnote'},'Examples only — no live game messages.'),
      ]),
    ]),
    h('footer',{class:'legacy-dashboard-footnote'},'L3-045 dashboard layout preview · All values are fictional examples · No fighter, save, or career has been loaded'),
  ]);
}
export function DashboardGallery() {
  const [theme,setTheme]=useState<'dark'|'light'>('dark');
  const [showEmpty,setShowEmpty]=useState(false);
  const data=showEmpty?{...SAMPLE_DASHBOARD,notifications:[] as const}:SAMPLE_DASHBOARD;
  return h('main',{class:'legacy-kit legacy-dashboard-gallery','data-kit-theme':theme,'data-dashboard-gallery':'L3-045'},[
    h('div',{class:'legacy-dashboard-preview-controls',role:'group','aria-label':'Dashboard preview settings'},[
      h('button',{type:'button','aria-pressed':theme==='dark',onClick:()=>setTheme('dark')},'Dark appearance'),
      h('button',{type:'button','aria-pressed':theme==='light',onClick:()=>setTheme('light')},'Light appearance'),
      h('button',{type:'button','aria-pressed':showEmpty,'data-dashboard-toggle-notices':'true',onClick:()=>setShowEmpty(current=>!current)},showEmpty?'Show sample notifications':'Show empty inbox'),
    ]),
    h(Dashboard,{data}),
  ]);
}
