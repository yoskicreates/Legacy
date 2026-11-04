/** Experimental fast-track combat engine. Isolated from accepted career/save systems. */
export type Corner = 'red' | 'blue';
export type Tactic = 'balanced' | 'aggressive' | 'defensive';
export type Action = 'jab' | 'cross' | 'block' | 'rest';
export interface Fighter { name:string; health:number; stamina:number; guard:number; strikes:number; }
export interface Fight { red:Fighter; blue:Fighter; round:number; secondsLeft:number; phase:'fighting'|'corner'|'finished'; winner:Corner|'draw'|null; log:string[]; }
export const ROUND_SECONDS=300;
export const MAX_ROUNDS=3;
export function newFight(redName='Player',blueName='Opponent'):Fight {
 const fighter=(name:string):Fighter=>({name,health:100,stamina:100,guard:100,strikes:0});
 return {red:fighter(redName),blue:fighter(blueName),round:1,secondsLeft:ROUND_SECONDS,phase:'fighting',winner:null,log:[]};
}
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
function hit(attacker:Fighter,defender:Fighter,action:Action,blocked:boolean):void {
 if(action==='rest'){attacker.stamina=clamp(attacker.stamina+7);return;}
 if(action==='block'){attacker.guard=clamp(attacker.guard+5);attacker.stamina=clamp(attacker.stamina+2);return;}
 const cost=action==='cross'?10:6;
 const power=action==='cross'?12:7;
 const fatigue=attacker.stamina<cost?0.4:1;
 attacker.stamina=clamp(attacker.stamina-cost);
 const damage=power*fatigue*(blocked?0.25:1);
 defender.health=clamp(defender.health-damage);
 defender.guard=clamp(defender.guard-(blocked?5:12));
 attacker.strikes++;
}
export function opponentAction(fight:Fight):Action {
 if(fight.blue.stamina<16)return 'rest';
 if(fight.blue.health<35 && fight.blue.guard<45)return 'block';
 return fight.secondsLeft%4===0?'cross':'jab';
}
export function stepFight(current:Fight,playerAction:Action,tactic:Tactic='balanced',elapsed=1):Fight {
 if(current.phase!=='fighting')return current;
 if(!Number.isInteger(elapsed)||elapsed<1||elapsed>300)throw new RangeError('elapsed must be 1..300 whole seconds');
 const fight:Fight={...current,red:{...current.red},blue:{...current.blue},log:[...current.log]};
 const ai=opponentAction(fight);
 const effectiveAction=tactic==='defensive'&&playerAction==='cross'?'block':playerAction;
 hit(fight.red,fight.blue,effectiveAction,ai==='block');
 if(fight.blue.health>0)hit(fight.blue,fight.red,ai,effectiveAction==='block');
 fight.log.push('R'+fight.round+' '+effectiveAction+' vs '+ai);
 fight.log=fight.log.slice(-30);
 fight.secondsLeft=Math.max(0,fight.secondsLeft-elapsed);
 if(fight.red.health<=0||fight.blue.health<=0){fight.phase='finished';fight.winner=fight.red.health===fight.blue.health?'draw':fight.red.health>fight.blue.health?'red':'blue';}
 else if(fight.secondsLeft===0){fight.phase=fight.round===MAX_ROUNDS?'finished':'corner';if(fight.phase==='finished')fight.winner=fight.red.health===fight.blue.health?'draw':fight.red.health>fight.blue.health?'red':'blue';}
 return fight;
}
export function nextRound(current:Fight,tactic:Tactic):Fight {
 if(current.phase!=='corner')throw new Error('Not between rounds');
 const recovery=tactic==='defensive'?25:tactic==='aggressive'?10:18;
 return {...current,round:current.round+1,secondsLeft:ROUND_SECONDS,phase:'fighting',red:{...current.red,stamina:clamp(current.red.stamina+recovery)},blue:{...current.blue,stamina:clamp(current.blue.stamina+18)}};
}
