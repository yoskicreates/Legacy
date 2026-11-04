/** L3-046 isolated calendar fixture; game clock is the sole source of relative days. */
import type {GameCalendarClock} from '../domain/core/clock';
export interface PreviewEvent { readonly id:string; readonly dayIndex:number; readonly title:string; readonly detail:string; }
export interface CalendarPreviewData { readonly source:'fixture'; readonly epochIso:string; readonly clock:GameCalendarClock; readonly events:readonly PreviewEvent[]; }
const isoPattern=/^\d{4}-\d{2}-\d{2}$/;
export function dayAt(epochIso:string,dayIndex:number):string {
  if(!isoPattern.test(epochIso)||!Number.isSafeInteger(dayIndex)||dayIndex<0)throw new RangeError('Invalid game calendar input');
  const epoch=new Date(`${epochIso}T00:00:00.000Z`);
  if(Number.isNaN(epoch.getTime())||epoch.toISOString().slice(0,10)!==epochIso)throw new RangeError('Invalid fixture epoch');
  const timestamp=epoch.getTime()+dayIndex*86400000;
  if(!Number.isSafeInteger(timestamp)||timestamp>8640000000000000)throw new RangeError('Game date out of range');
  return new Date(timestamp).toISOString().slice(0,10);
}
export function validateCalendar(data:CalendarPreviewData):true {
  if(!data||data.source!=='fixture'||!data.clock||!Array.isArray(data.events))throw new TypeError('Only valid fictional preview events are supported');
  dayAt(data.epochIso,data.clock.dayIndex);
  const ids=new Set<string>();
  for(const event of data.events){
    if(!event||typeof event.id!=='string'||typeof event.title!=='string'||typeof event.detail!=='string'||!event.id.trim()||!event.title.trim()||!event.detail.trim()||ids.has(event.id))throw new TypeError('Invalid or duplicate event');
    ids.add(event.id);
    if(event.dayIndex<data.clock.dayIndex)throw new RangeError('Upcoming events cannot precede the game clock');
    dayAt(data.epochIso,event.dayIndex);
  }
  return true;
}
export const SAMPLE_CALENDAR:CalendarPreviewData={
  source:'fixture',epochIso:'2027-03-08',clock:{dayIndex:0},events:[
    {id:'gym',dayIndex:1,title:'Gym orientation',detail:'Fictional gym introduction. No session is booked.'},
    {id:'coach',dayIndex:3,title:'Meet the coach',detail:'Example calendar event. No relationship changes.'},
    {id:'review',dayIndex:7,title:'Training review',detail:'Sample milestone. No training is performed.'},
  ],
};
