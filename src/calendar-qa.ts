import {h,render} from 'preact';
import {CalendarPreview} from './ui/calendar-preview';
import {SAMPLE_CALENDAR} from './ui/calendar-preview-contract';
const host=document.querySelector('#calendar-root');
if(!host)throw new Error('Missing calendar host');
render(h(CalendarPreview,{data:SAMPLE_CALENDAR}),host);
