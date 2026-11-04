import {newFight,tick,setCornerTactic,type Fight,type Tactic} from './fast-track-engine';
const root=document.querySelector<HTMLElement>('#fight-root');
if(!root)throw new Error('Missing fight root');
let fight:Fight=newFight();
let running=false;
let speed=1;
let careerWins=0;
let careerLosses=0;
let elapsed=0;
function bar(label:string,value:number){return '<label>'+label+' <meter min="0" max="100" value="'+value.toFixed(1)+'">'+value.toFixed(0)+'</meter></label>';}
function fighter(index:0|1){const f=fight.fighters[index];return '<section class="fighter '+(index===0?'left':'right')+'" aria-label="'+f.id+'"><div class="silhouette" aria-hidden="true"><div class="head"></div><div class="torso"></div><div class="arm a"></div><div class="arm b"></div><div class="legs"></div></div><h2>'+f.id+'</h2>'+bar('Health',f.health)+bar('Stamina',f.stamina)+bar('Guard',f.guard)+'<p>Strikes: '+f.landed+'/'+f.strikes+'</p></section>';}
function render(){
 const m=String(Math.floor(fight.secondsRemaining/60)).padStart(2,'0'),s=String(fight.secondsRemaining%60).padStart(2,'0');
 root!.innerHTML='<header><h1>LEGACY <small>COMBAT LAB</small></h1><p>Prototype silhouettes only — approved fighter artwork not yet connected</p></header><div class="score"><strong>ROUND '+fight.round+' / 3</strong><output aria-live="off">'+m+':'+s+'</output><span>'+fight.phase+'</span></div><div class="arena">'+fighter(0)+fighter(1)+'</div><div class="controls"><button data-action="play">'+(running?'Pause':'Play')+'</button><button data-action="step">Advance 1s</button><button data-action="speed">Speed '+speed+'×</button><button data-action="restart">New fight</button></div>'+(fight.phase==='corner'?'<section class="corner"><h2>Between rounds — select tactics</h2>'+(['balanced','pressure','counter'] as Tactic[]).map(t=>'<button data-tactic="'+t+'">'+t+'</button>').join('')+'</section>':'')+(fight.phase==='finished'?'<section class="result"><h2>Winner: '+fight.winner+'</h2><p>Career exhibition record: '+careerWins+'–'+careerLosses+'</p></section>':'')+'<section class="events"><h2>Fight events</h2><ol>'+fight.log.slice(-5).map(l=>'<li>'+l+'</li>').join('')+'</ol></section>';
 root!.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.addEventListener('click',()=>{
 const action=b.dataset.action;
 if(action==='play'&&fight.phase==='fighting')running=!running;
 if(action==='step'){running=false;advance();}
 if(action==='speed')speed=speed===1?2:speed===2?5:10;
 if(action==='restart'){running=false;fight=newFight((Date.now()>>>0));elapsed=0;}
 if(b.dataset.tactic){fight=setCornerTactic(fight,b.dataset.tactic as Tactic);}
 render();
 }));
}
function advance(){const previous=fight.phase;fight=tick(fight);elapsed++;if(fight.phase!=='fighting')running=false;if(previous!=='finished'&&fight.phase==='finished'){if(fight.winner==='player')careerWins++;if(fight.winner==='opponent')careerLosses++;}}
setInterval(()=>{if(running&&fight.phase==='fighting'){for(let i=0;i<speed&&fight.phase==='fighting';i++)advance();render();}},1000);
render();
