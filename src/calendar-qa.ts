import {h,render} from 'preact';
import {CalendarPreview} from './ui/calendar-preview';
const host=document.querySelector('#calendar-root');
if(!host)throw new Error('Missing calendar host');
render(h(CalendarPreview,{}),host);
