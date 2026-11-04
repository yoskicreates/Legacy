/** L3-046 fixture-only calendar; selecting events changes only visible details. */
import {h} from 'preact';
import {useState} from 'preact/hooks';
import {dayAt,SAMPLE_CALENDAR,validateCalendar} from './calendar-preview-contract';
import type {CalendarPreviewData} from './calendar-preview-contract';
const format=(iso:string)=>new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${iso}T12:00:00Z`));
export function CalendarPreview({data=SAMPLE_CALENDAR}:{readonly data?:CalendarPreviewData}){
  validateCalendar(data);
  const [selected,setSelected]=useState<string|null>(null);
  const events=[...data.events].sort((a,b)=>a.dayIndex-b.dayIndex);
  const chosen=events.find(event=>event.id===selected);
  return h('section',{class:'legacy-calendar legacy-kit-card','data-calendar-source':'fixture'},[
    h('p',{class:'legacy-kit-eyebrow'},'CAREER CALENDAR · FICTIONAL PREVIEW'),
    h('h1',{},'Upcoming events'),
    h('p',{},['Game date: ',h('time',{dateTime:dayAt(data.epochIso,data.clock.dayIndex),'data-game-date':'true'},format(dayAt(data.epochIso,data.clock.dayIndex)))]),
    events.length?h('ul',{class:'legacy-calendar-events'},events.map(event=>h('li',{key:event.id},
      h('button',{type:'button','aria-pressed':selected===event.id,onClick:()=>setSelected(event.id),'data-event-id':event.id},[
        h('time',{dateTime:dayAt(data.epochIso,event.dayIndex)},format(dayAt(data.epochIso,event.dayIndex))),
        h('strong',{},event.title),
      ])))):h('p',{},'No upcoming sample events.'),
    h('section',{'aria-live':'polite','data-event-details':'true'},chosen?[
      h('h2',{},chosen.title),h('p',{},chosen.detail),
      h('p',{},`Fictional date: ${format(dayAt(data.epochIso,chosen.dayIndex))}. No game data was changed.`),
    ]:h('p',{},'Select an example event to see its details.')),
    h('p',{},'Preview only. No real events, saved career, or game clock have been changed.'),
  ]);
}
