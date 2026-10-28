import {PRACTICE_SOURCE_DATA} from './practice-source-data.js';
// Native Practice4: player+A4 and team score are incremented by mission
// notifications (DD6CB0 ->11062A0). Reference-server kill reward is also1.
// XML marks option254 UNLIMIT; other options50/75/100 are finite targets.
export const PRACTICE_RULES=Object.freeze({scoreLimit:254,matchSeconds:240,resultAnnouncementSeconds:10});
export class PracticeState{
 constructor(options={}){
  this.rules={...PRACTICE_RULES,...options};
  const sourceOption=PRACTICE_SOURCE_DATA.choices.find(choice=>Number(choice.score)===this.rules.scoreLimit);
  if(options.matchSeconds===undefined&&sourceOption)this.rules.matchSeconds=Number(sourceOption.time)*60;
  if(!Number.isSafeInteger(this.rules.scoreLimit)||this.rules.scoreLimit<1)throw Error('Invalid Practice score limit');
  for(const key of ['matchSeconds','resultAnnouncementSeconds'])if(!Number.isFinite(this.rules[key])||this.rules[key]<(key==='matchSeconds'?Number.MIN_VALUE:0))throw Error('Invalid Practice duration');
  this.reset();
 }
 reset(){this.mode='practice';this.phase='playing';this.remaining=this.rules.matchSeconds;this.pause=0;this.score=0;this.counter=0;this.referenceKills=0;this.missions=0;this.team='alpha';this.scores={alpha:0,beta:0};this.alive=true;this.deaths=0;this.winner=null;this.reason=null;this.playingDelta=0;this.serial=0;this.events=[];this.claimed=new Set();}
 get unlimited(){return this.rules.scoreLimit===254;}
 emit(type,data={}){this.events.push({serial:++this.serial,type,...data});if(this.events.length>64)this.events.shift();}
 receiveMission({id,increment=1}={}){return this.award('mission',id,increment);}
 receiveReferenceKill({id}={}){return this.award('reference-kill',id,1);}
 award(route,id,increment){
  if(this.phase!=='playing'||!this.alive||typeof id!=='string'||!id||this.claimed.has(id))return false;
  // Match reference producer1; arbitrary signed wire deltas are deliberately
  // not an externally callable gameplay API in S5.
  if(increment!==1)throw Error('Practice gameplay accepts source producer increment1 only');
  if(this.counter===0xffffffff)throw Error('Practice counter overflow');
  this.claimed.add(id);this.counter++;this.score++;this.scores.alpha++;
  if(route==='mission')this.missions++;else this.referenceKills++;
  this.emit(route,{id,increment});
  // _eu_gameinfo.x7 explicitly marks254 with score_string_key=UNLIMIT.
  // The native special predicate11063C0 independently tests option==FE.
  if(!this.unlimited&&this.counter>=this.rules.scoreLimit)this.finish('score-limit');return true;
 }
 die(){if(this.phase!=='playing'||!this.alive)return false;this.alive=false;this.deaths++;this.emit('death');return true;}
 respawn(){if(this.phase!=='playing'||this.alive)return false;this.alive=true;this.emit('respawn');return true;}
 finish(reason='time-limit'){
  if(this.phase!=='playing')return false;this.reason=reason;this.phase='result-countdown';this.pause=this.rules.resultAnnouncementSeconds;this.emit('finishing',{reason});if(this.pause===0)this.completeResult();return true;
 }
 completeResult(){this.phase='result';this.pause=0;this.winner=this.reason==='score-limit'?'alpha':null;this.emit('result',{winner:this.winner});}
 tick(dt){
  if(!Number.isFinite(dt)||dt<0)throw Error('Invalid Practice delta');this.playingDelta=0;
  if(this.phase==='result')return null;
  if(this.phase==='playing'){
   const elapsed=Math.min(dt,this.remaining);this.remaining=Math.max(0,this.remaining-elapsed);this.playingDelta=elapsed;dt-=elapsed;
   if(this.remaining>0)return null;this.finish();
  }
  if(this.phase==='result-countdown'){this.pause=Math.max(0,this.pause-dt);if(this.pause===0){this.completeResult();return 'result';}}
  return this.phase==='result-countdown'?'finishing':null;
 }
 nativeCounters(){return {164:this.counter};}
}
