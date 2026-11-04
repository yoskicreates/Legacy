/** LEGACY fast-track: deterministic, side-effect-free spectator combat prototype.
 * Provisional branch only. Does not change the official task register.
 */
export type Tactic = 'balanced' | 'pressure' | 'counter';
export type Phase = 'fighting' | 'corner' | 'finished';
export interface Fighter {
  id: 'player' | 'opponent';
  health: number;
  stamina: number;
  guard: number;
  strikes: number;
  landed: number;
  knockdowns: number;
}
export interface Fight {
  phase: Phase;
  round: number;
  secondsRemaining: number;
  fighters: [Fighter, Fighter];
  playerTactic: Tactic;
  opponentTactic: Tactic;
  seed: number;
  winner: Fighter['id'] | 'draw' | null;
  log: string[];
}
const clamp=(v:number)=>Math.max(0,Math.min(100,v));
const random=(seed:number):[number,number]=>{
  const next=(Math.imul(seed,1664525)+1013904223)>>>0;
  return [next,next/4294967296];
};
export function newFight(seed=12345):Fight {
  const fighter=(id:Fighter['id']):Fighter=>({id,health:100,stamina:100,guard:100,strikes:0,landed:0,knockdowns:0});
  return {phase:'fighting',round:1,secondsRemaining:300,fighters:[fighter('player'),fighter('opponent')],playerTactic:'balanced',opponentTactic:'balanced',seed:seed>>>0,winner:null,log:['Fight started']};
}
function resolve(fight:Fight):Fight {
  const [p,o]=fight.fighters;
  const winner=p.health===o.health?(p.landed===o.landed?'draw':p.landed>o.landed?'player':'opponent'):p.health>o.health?'player':'opponent';
  return {...fight,phase:'finished',winner,secondsRemaining:Math.max(0,fight.secondsRemaining),log:[...fight.log.slice(-24),`Decision: ${winner}`]};
}
export function setCornerTactic(fight:Fight,tactic:Tactic):Fight {
  if(fight.phase!=='corner')throw new Error('Tactics can only change between rounds');
  if(!(['balanced','pressure','counter'] as string[]).includes(tactic))throw new Error('Invalid tactic');
  return {...fight,playerTactic:tactic,round:fight.round+1,secondsRemaining:300,phase:'fighting',fighters:fight.fighters.map(f=>({...f,stamina:clamp(f.stamina+18),guard:clamp(f.guard+12)})) as [Fighter,Fighter],log:[...fight.log.slice(-24),`Round ${fight.round+1}: ${tactic}`]};
}
export function tick(fight:Fight,seconds=1):Fight {
  if(!Number.isInteger(seconds)||seconds<1||seconds>300)throw new Error('Invalid tick duration');
  let state=fight;
  for(let i=0;i<seconds&&state.phase==='fighting';i++){
    let seed=state.seed;
    const fighters=state.fighters.map(f=>({...f})) as [Fighter,Fighter];
    const log=[...state.log];
    for(let attacker=0;attacker<2;attacker++){
      const a=attacker===0?fighters[0]:fighters[1];
      const d=attacker===0?fighters[1]:fighters[0];
      const tactic=attacker===0?state.playerTactic:state.opponentTactic;
      let r;[seed,r]=random(seed);
      const frequency=tactic==='pressure'?.42:tactic==='counter'?.23:.32;
      if(r>=frequency)continue;
      a.strikes++;
      a.stamina=clamp(a.stamina-(tactic==='pressure'?2.2:1.4));
      [seed,r]=random(seed);
      const accuracy=(tactic==='counter'?.62:.52)*(0.55+0.45*a.stamina/100);
      if(r>=accuracy)continue;
      a.landed++;
      [seed,r]=random(seed);
      const damage=(3+r*4)*(tactic==='counter'?1.18:1)*(0.6+0.4*a.stamina/100);
      d.guard=clamp(d.guard-damage*.65);
      d.health=clamp(d.health-damage*(d.guard>15?.45:.9));
      log.push(`${a.id} lands strike in round ${state.round}`);
    }
    for(const f of fighters)f.stamina=clamp(f.stamina+.3);
    state={...state,seed,fighters,log:log.slice(-25),secondsRemaining:state.secondsRemaining-1};
    if(fighters.some(f=>f.health<=0)){state=resolve(state);break;}
    if(state.secondsRemaining===0){
      if(state.round===3)state=resolve(state);
      else state={...state,phase:'corner',log:[...state.log,`End of round ${state.round}`].slice(-25)};
    }
  }
  return state;
}
