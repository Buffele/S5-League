// Browser rules adapted from S5Runtime local reference rules, without wire codecs.
// DM: local-modes.mjs rule 1. Chaser: native-chaser-round.mjs and
// native-mode-protocol.mjs (0x1094530 timing, survivor rewards).
export const COMBAT_MODE_RULES={deathmatch:{scoreLimit:80,halfSeconds:600,halfPause:35,respawnSeconds:4},chaser:{matchSeconds:1200,intermissionSeconds:5,firstPreparation:7,preparation:4}};
export class CombatModeState{
 constructor(mode,{team='alpha',participants=['local','bot'],...options}={}){
  if(!Object.hasOwn(COMBAT_MODE_RULES,mode))throw Error('Unknown combat mode');
  if(new Set(participants).size!==participants.length||participants.length<2)throw Error('At least two distinct participants required');
  this.mode=mode;this.team=team;this.ids=participants;this.rules={...COMBAT_MODE_RULES[mode],...options};this.reset();
 }
 reset(){
  this.players=new Map(this.ids.map((id,i)=>[id,{id,team:i===0?this.team:this.team==='alpha'?'beta':'alpha',alive:true,kills:0,deaths:0,teamKills:0,teamDeaths:0,score:0,normalPoints:0,bonusPoints:0,winPoints:0,survivalPoints:0,damage:0,attackDamage:0,received:0,healing:0,assists:0,wins:0,roundDamage:0,roundAttackDamage:0,roundPoints:0}]));
  this.events=[];this.eventSerial=0;this.contributors=new Map();this.bonus=null;this.lastRound=null;this.playingDelta=0;
  this.scores={alpha:0,beta:0};this.half=1;this.round=0;this.serial=0;this.winner=null;this.outcome=null;this.pause=0;this.phase='playing';this.remaining=this.mode==='deathmatch'?this.rules.halfSeconds:this.rules.matchSeconds;
  if(this.mode==='chaser')this.beginRound();
 }
 beginRound(){
  this.chaser=this.ids[this.round%this.ids.length];this.round++;for(const p of this.players.values()){p.alive=true;p.roundDamage=0;p.roundAttackDamage=0;p.roundPoints=0;}
  this.initial=this.ids.filter(id=>id!==this.chaser);this.survivors=[...this.initial];this.roundRemaining=60+Math.max(0,this.ids.length-6)*10;
  this.phase='preparation';this.pause=this.round===1?this.rules.firstPreparation:this.rules.preparation;this.serial++;
  this.contributors.clear();this.emit('role',{id:this.chaser});this.selectBonus();
 }
 emit(type,data={}){this.events.push({serial:++this.eventSerial,type,...data});if(this.events.length>64)this.events.shift();}
 selectBonus(){
  // S5Runtime rule confirmed by the user: highest score outside the Chaser.
  // Only living survivors are eligible; tie order remains stable in S5.
  const previous=this.bonus;
  this.bonus=this.rules.bonusTargets===false?null:[...this.survivors].filter(id=>id!==this.chaser&&this.players.get(id)?.alive).sort((a,b)=>this.players.get(b).score-this.players.get(a).score)[0]??null;
  if(this.bonus&&this.bonus!==previous)this.emit('target',{id:this.bonus});
 }
 award(id,category,points){const p=this.players.get(id);p[category]+=points;p.score+=points;p.roundPoints+=points;this.emit('points',{id,category,points});if(this.mode==='chaser'&&['preparation','playing'].includes(this.phase)&&id!==this.chaser)this.selectBonus();}
 recordDamage(sourceId,victimId,amount){
  if(this.mode!=='chaser'||this.phase!=='playing'||!Number.isFinite(amount)||amount<=0)return false;
  const source=this.players.get(sourceId),victim=this.players.get(victimId);
  if(!source?.alive||!victim?.alive||source===victim||(sourceId!==this.chaser&&victimId!==this.chaser))return false;
  source.damage+=amount;source.roundDamage+=amount;victim.received+=amount;
  if(victimId===this.chaser){source.attackDamage+=amount;source.roundAttackDamage+=amount;}
  if(!this.contributors.has(victimId))this.contributors.set(victimId,new Set());this.contributors.get(victimId).add(sourceId);return true;
 }
 recordHeal(id,amount){const p=this.players.get(id);if(this.mode!=='chaser'||this.phase!=='playing'||!p?.alive||!Number.isFinite(amount)||amount<=0)return false;p.healing+=amount;return true;}
 eliminate(victimId,killerId=null){
  if(this.phase!=='playing')return false;const victim=this.players.get(victimId),killer=this.players.get(killerId);
  if(!victim?.alive||(killerId!==null&&(!killer?.alive||killer===victim)))return false;
  if(this.mode==='chaser'&&killer&&killerId!==this.chaser&&victimId!==this.chaser)return false;
  const teamKill=this.mode==='deathmatch'&&killer&&killer.team===victim.team;
  victim.alive=false;
  // Native RMI3035 ->EE3BD0 ->DM11031F0 increments separate team-kill
  // (+B4) and team-death (+B8) counters; normal kills/deaths stay unchanged.
  // This consumes an actual lethal contact, not a new friendly-fire policy.
  if(teamKill){victim.teamDeaths++;killer.teamKills++;}
  else{victim.deaths++;if(killer)killer.kills++;}
  if(this.mode==='deathmatch'){
   if(killer&&!teamKill){killer.score+=2;this.scores[killer.team]++;}
   if(Math.max(...Object.values(this.scores))>=this.rules.scoreLimit)this.finish();
   else if(this.half===1&&Math.max(...Object.values(this.scores))>=Math.floor(this.rules.scoreLimit/2))this.halftime();
  }else{
   for(const helper of this.contributors.get(victimId)||[])if(helper!==killerId&&this.players.get(helper)?.alive)this.players.get(helper).assists++;
   this.contributors.delete(victimId);
   const bonus=victimId===this.bonus;
   this.survivors=this.survivors.filter(id=>id!==victimId);
   if(victimId!==this.chaser){if(!killer||killerId===this.chaser)this.award(this.chaser,bonus?'bonusPoints':'normalPoints',bonus?4:2);}
   this.emit('kill',{victim:victimId,killer:killerId,bonus});
   if(victimId===this.chaser)this.endRound('chaser-killed');else if(!this.survivors.length)this.endRound('chaser-victory');
   else if(bonus)this.selectBonus();
  }
  this.serial++;return true;
 }
 respawn(id){if(this.mode!=='deathmatch'||this.phase!=='playing')return false;const p=this.players.get(id);if(!p)return false;p.alive=true;return true;}
 halftime(){this.phase='halftime';this.pause=this.rules.halfPause;this.serial++;}
 endRound(outcome){
  if(this.phase!=='playing')return;this.outcome=outcome;
  if(outcome!=='chaser-victory'){for(const id of this.initial)this.award(id,'winPoints',5);for(const id of this.survivors){this.award(id,'survivalPoints',10);this.players.get(id).wins++;}}
  else this.players.get(this.chaser).wins++;
  this.lastRound={round:this.round,chaser:this.chaser,outcome,players:[...this.players.values()].map(p=>({id:p.id,points:p.roundPoints,damage:p.roundDamage,alive:p.alive}))};
  this.bonus=null;this.emit('round-end',{outcome});
  this.phase='intermission';this.pause=this.rules.intermissionSeconds;this.serial++;
 }
 finish(){
  this.phase='result';this.bonus=null;
  if(this.mode==='deathmatch')this.winner=this.scores.alpha===this.scores.beta?null:this.scores.alpha>this.scores.beta?'alpha':'beta';
  else{const ranked=[...this.players.values()].sort((a,b)=>b.score-a.score);this.winner=ranked[0].score===ranked[1].score?null:ranked[0].id;}
  this.serial++;
 }
 tick(dt){
  if(!Number.isFinite(dt)||dt<0)throw Error('Invalid mode delta');this.playingDelta=0;if(this.phase==='result')return null;
  return this.mode==='chaser'?this.tickChaser(dt):this.tickDeathmatch(dt);
 }
 tickDeathmatch(dt){
  // Spend each part of the frame once. A halftime restart must not give
  // controllers time that was spent paused, or discard its playable excess.
  let transition=null;
  while(true){
   if(this.phase==='halftime'){
    const elapsed=Math.min(dt,this.pause);this.pause=Math.max(0,this.pause-elapsed);dt=Math.max(0,dt-elapsed);
    if(this.pause>0)return transition;
    this.half=2;this.remaining=this.rules.halfSeconds;for(const p of this.players.values())p.alive=true;
    this.phase='playing';this.playingDelta=0;transition='restart';
   }else{
    const elapsed=Math.min(dt,this.remaining);this.remaining=Math.max(0,this.remaining-elapsed);dt=Math.max(0,dt-elapsed);this.playingDelta+=elapsed;
    if(this.remaining>0)return transition;
    this.playingDelta=0;
    if(this.half===2){this.finish();return 'result';}
    this.halftime();transition='halftime';
   }
   if(dt===0)return transition;
  }
 }
 tickChaser(dt){
  // Native1094530 initializes one round clock to duration+preparation.
  // Spending an entire render delta on preparation and discarding its excess
  // extends that clock. Consume each interval once, including crossed phases.
  // playingDelta describes only the current round's playable part of this tick;
  // the combat adapter must never simulate preparation as combat time.
  let transition=null;
  while(true){
   const timer=this.phase==='playing'?'roundRemaining':'pause';
   const elapsed=Math.min(dt,this.remaining,this[timer]);
   this.remaining=Math.max(0,this.remaining-elapsed);this[timer]=Math.max(0,this[timer]-elapsed);dt=Math.max(0,dt-elapsed);
   if(this.phase==='playing')this.playingDelta+=elapsed;
   if(this.remaining===0){if(this.phase==='playing')this.endRound('time-limit');this.playingDelta=0;this.finish();return 'result';}
   if(this[timer]>0)return transition;
   if(this.phase==='preparation'){this.phase='playing';transition=transition==='new-round'?transition:'start-round';}
   else if(this.phase==='playing'){this.endRound('timeout');this.playingDelta=0;transition='round-end';}
   else{this.beginRound();this.playingDelta=0;transition='new-round';}
   if(dt===0)return transition;
  }
 }
}
