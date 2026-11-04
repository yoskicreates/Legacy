/** L3-045: typed, fixture-only dashboard information. Never reads or writes a real save. */
export const DASHBOARD_VERSION = 'L3-045.S01' as const;
export interface DashboardFighter {
  readonly name: string;
  readonly division: string;
  readonly record: string;
  readonly gym: string;
}
export interface DashboardNotice {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly kind: 'info' | 'upcoming';
}
export interface DashboardData {
  readonly source: 'fixture';
  readonly fighter: DashboardFighter;
  readonly gameDate: string; // YYYY-MM-DD, in the fictional game calendar
  readonly cashUsd: number;
  readonly notifications: readonly DashboardNotice[];
  readonly nextAction: Readonly<{label:string;description:string}>;
}
export const SAMPLE_DASHBOARD:DashboardData=Object.freeze({
  source:'fixture',
  fighter:Object.freeze({name:'Example Fighter',division:'Lightweight',record:'0–0',gym:'Demo Training Center'}),
  gameDate:'2027-03-08',
  cashUsd:2450,
  notifications:Object.freeze([
    Object.freeze({id:'orientation',title:'Training session',detail:'Sample event for the dashboard preview.',kind:'upcoming' as const}),
    Object.freeze({id:'coach',title:'Coach notes',detail:'Example notification, not a real message.',kind:'info' as const}),
  ]),
  nextAction:Object.freeze({label:'Review training plan',description:'Preview the next step of a career. No training is scheduled by this button.'}),
});
const isNonempty=(value:string)=>typeof value==='string'&&value.trim().length>0;
export function validateDashboardData(data:DashboardData):true {
  if(data.source!=='fixture')throw new TypeError('L3-045 dashboard accepts fixture data only');
  if(!isNonempty(data.fighter.name)||!isNonempty(data.fighter.division)||!isNonempty(data.fighter.record)||!isNonempty(data.fighter.gym))throw new TypeError('A demo fighter needs readable details');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(data.gameDate))throw new TypeError('Game date must use YYYY-MM-DD');
  const parsed=new Date(`${data.gameDate}T12:00:00Z`);
  if(Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==data.gameDate)throw new RangeError('Game date is invalid');
  if(!Number.isFinite(data.cashUsd)||data.cashUsd<0||Math.round(data.cashUsd*100)!==data.cashUsd*100)throw new RangeError('Demo money must be finite, nonnegative dollars/cents');
  if(data.notifications.length>4||new Set(data.notifications.map(n=>n.id)).size!==data.notifications.length)throw new RangeError('Notification IDs must be unique; maximum four');
  if(data.notifications.some(n=>!isNonempty(n.id)||!isNonempty(n.title)||!isNonempty(n.detail)||!['info','upcoming'].includes(n.kind)))throw new TypeError('Dashboard notifications need valid fields');
  if(!isNonempty(data.nextAction.label)||!isNonempty(data.nextAction.description))throw new TypeError('Next action needs a label and description');
  return true;
}
export function formatGameDate(iso:string):string {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))throw new TypeError('Invalid game date');
  const date=new Date(`${iso}T12:00:00Z`);
  if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==iso)throw new RangeError('Invalid game date');
  return new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(date);
}
export function formatCashUsd(amount:number):string {
  if(!Number.isFinite(amount)||amount<0||Math.round(amount*100)!==amount*100)throw new RangeError('Invalid fixture amount');
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(amount);
}
