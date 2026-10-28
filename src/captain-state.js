// Native rule10 score consumers:1104480/1104550/1104660/11046A0/1104790.
// Round orchestration and health balancing below are reference-server policies,
// not an observed original-server match. XML selected option is5points/9rounds.
export const CAPTAIN_RULES=Object.freeze({scoreLimit:5,roundLimit:9,roundSeconds:180,intermissionSeconds:5,resultAnnouncementSeconds:10,normalHealth:100});
export const CAPTAIN_NATIVE_FIELDS=Object.freeze({kills:0xa4,killAssists:0xa8,healAssists:0xac,deaths:0xb0,teamKills:0xb4,teamDeaths:0xb8,suicides:0xbc,captainKills:0xc0,roundsWon:0xc4,captainDeaths:0xc8,isCaptain:0xcc,opaqueD0:0xd0});
export function captainReferenceHealth(counts,scores={alpha:0,beta:0}){
 if(!['alpha','beta'].every(team=>Number.isInteger(counts[team])&&counts[team]>0))throw Error('Captain requires both teams');
 const max=Math.max(counts.alpha,counts.beta),health={alpha:500,beta:500};
 for(const team of ['alpha','beta'])if(counts[team]<max){
  const scaled=Math.fround(Math.fround(max*500)/counts[team]),hundreds=Math.fround(scaled/100),other=team==='alpha'?'beta':'alpha';
  health[team]=(scores[team]>scores[other]?Math.floor(hundreds):Math.ceil(hundreds))*100;
 }
 return health;
}
export class CaptainState{
 constructor({team='alpha',participants=['local','bot','bot2'],timeoutTie='reference-beta',...options}={}){
  if(!['alpha','beta'].includes(team)||!['reference-beta','draw'].includes(timeoutTie)||!Array.isArray(participants))throw Error('Invalid Captain setup');
  this.people=participants.map((p,i)=>typeof p==='string'?{id:p,team:i===0?team:team==='alpha'?'beta':'alpha'}:{...p});
  if(this.people.length<2||new Set(this.people.map(p=>p.id)).size!==this.people.length||this.people.some(p=>typeof p.id!=='string'||!p.id||!['alpha','beta'].includes(p.team))||!['alpha','beta'].every(t=>this.people.some(p=>p.team===t)))throw Error('Distinct Captain participants on both teams required');
  this.ids=this.people.map(p=>p.id);this.timeoutTie=timeoutTie;this.rules={...CAPTAIN_RULES,...options};
  for(const key of ['scoreLimit','roundLimit'])if(!Number.isSafeInteger(this.rules[key])||this.rules[key]<1)throw Error('Invalid Captain limit');
  for(const key of ['roundSeconds','intermissionSeconds','normalHealth'])if(!Number.isFinite(this.rules[key])||this.rules[key]<=0)throw Error('Invalid Captain duration/health');
  if(!Number.isFinite(this.rules.resultAnnouncementSeconds)||this.rules.resultAnnouncementSeconds<0)throw Error('Invalid Captain result duration');
  this.reset();
 }
 reset(){
  this.mode='captain';this.players=new Map(this.people.map(p=>[p.id,{...p,alive:true,score:0,...Object.fromEntries(Object.keys(CAPTAIN_NATIVE_FIELDS).map(key=>[key,key==='isCaptain'?false:0]))}]));
  this.events=[];this.serial=0;this.scores={alpha:0,beta:0};this.round=0;this.winner=null;this.outcome=null;this.playingDelta=0;this.beginRound();
 }
 emit(type,data={}){this.events.push({serial:++this.serial,type,...data});if(this.events.length>64)this.events.shift();}
 beginRound(){
  const counts=Object.fromEntries(['alpha','beta'].map(team=>[team,[...this.players.values()].filter(p=>p.team===team).length]));
  this.health=captainReferenceHealth(counts,this.scores);this.round++;this.remaining=this.rules.roundSeconds;this.pause=0;this.phase='playing';
  for(const p of this.players.values()){p.alive=true;p.isCaptain=true;p.maxHealth=this.health[p.team];}
  this.emit('round-start',{round:this.round,health:{...this.health}});
 }
 captainCounts(){return Object.fromEntries(['alpha','beta'].map(team=>[team,[...this.players.values()].filter(p=>p.team===team&&p.alive&&p.isCaptain).length]));}
 eliminate(victimId,killerId=null,{assistId=null,targetKind='avatar'}={}){
  if(this.phase!=='playing'||targetKind!=='avatar')return false;
  const victim=this.players.get(victimId),killer=this.players.get(killerId),assist=this.players.get(assistId);
  if(!victim?.alive||killerId!==null&&(!killer?.alive||killer===victim||killer.team===victim.team)||assistId!==null&&(!killer||!assist||assist===killer||assist===victim||assist.team!==killer.team))return false;
  const captain=victim.isCaptain;victim.alive=false;victim.isCaptain=false;
  if(killer){killer[captain?'captainKills':'kills']++;killer.score+=captain?5:2;victim[captain?'captainDeaths':'deaths']++;if(assist){assist.killAssists++;assist.score++;}}
  else{victim.suicides++;if(victim.score>0)victim.score--;}
  this.emit('kill',{victim:victimId,killer:killerId,assist:assistId,captain});
  const counts=this.captainCounts();if(counts.alpha===0||counts.beta===0)this.endRound('captains-eliminated');return true;
 }
 receiveHealAssist(id){const p=this.players.get(id);if(this.phase!=='playing'||!p)return false;p.healAssists++;p.score++;this.emit('heal-assist',{id});return true;}
 respawn(id){const p=this.players.get(id);if(this.phase!=='playing'||!p||p.alive)return false;p.alive=true;p.isCaptain=false;p.maxHealth=this.rules.normalHealth;this.emit('respawn',{id});return true;}
 endRound(reason='timeout'){
  if(this.phase!=='playing')return false;
  const counts=this.captainCounts(),winner=counts.alpha===counts.beta?(this.timeoutTie==='reference-beta'?'beta':null):counts.alpha>counts.beta?'alpha':'beta';
  this.outcome={reason,winner,captainCounts:counts};
  if(winner){this.scores[winner]++;for(const p of this.players.values())if(p.team===winner){p.roundsWon++;p.score+=5;}}
  this.emit('round-end',{...this.outcome,round:this.round});
  if(this.round>=this.rules.roundLimit||Math.max(this.scores.alpha,this.scores.beta)>=this.rules.scoreLimit)this.finish();
  else{this.phase='intermission';this.pause=this.rules.intermissionSeconds;}
  return true;
 }
 finish(){
  if(!['playing','intermission'].includes(this.phase))return false;
  this.phase='result-countdown';this.pause=this.rules.resultAnnouncementSeconds;this.emit('finishing');if(this.pause===0)this.completeResult();return true;
 }
 completeResult(){this.phase='result';this.pause=0;this.playingDelta=0;this.winner=this.scores.alpha===this.scores.beta?null:this.scores.alpha>this.scores.beta?'alpha':'beta';this.emit('result',{winner:this.winner});}
 tick(dt){
  if(!Number.isFinite(dt)||dt<0)throw Error('Invalid Captain delta');this.playingDelta=0;if(this.phase==='result')return null;let transition=null;
  while(true){
   const timer=this.phase==='playing'?'remaining':'pause',elapsed=Math.min(dt,this[timer]);this[timer]=Math.max(0,this[timer]-elapsed);dt=Math.max(0,dt-elapsed);
   if(this.phase==='playing')this.playingDelta+=elapsed;
   if(this[timer]>0)return transition;
   if(this.phase==='playing'){this.endRound('timeout');this.playingDelta=0;transition=this.phase==='result'?'result':this.phase==='result-countdown'?'finishing':'round-end';}
   else if(this.phase==='intermission'){this.beginRound();this.playingDelta=0;transition='new-round';}
   else if(this.phase==='result-countdown'){this.completeResult();return 'result';}
   if(this.phase==='result'||dt===0)return transition;
  }
 }
 nativeCounters(id){const p=this.players.get(id);return p?Object.fromEntries(Object.entries(CAPTAIN_NATIVE_FIELDS).map(([key,offset])=>[offset,p[key]])):null;}
}
