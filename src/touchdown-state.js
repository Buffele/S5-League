import {TouchdownStatistics} from './touchdown-statistics.js';
// Reference timings/limits: tools/s5runtime-local/local-modes.mjs, rule 2.
// Spatial validation is owned by the S5 map adapter, never by a score packet.
export const TD_RULES=Object.freeze({scoreLimit:8,halfSeconds:600,goalPause:10,halfPause:35,respawnSeconds:4,returnSeconds:15});
// Native DDC1D0: ten-second transition announcement, then substate2 for25s.
//71A650/71A600 swap scene IDs1/2 in playing substates2 and3, not team scores.
export const TD_HALF_INTRO_SECONDS=10;
// Actual copied-S5Runtime sequence: score0 -> pickup2 -> human goal12. These
// objective contributions are separate from combat/assist contributions.
export const TD_OBJECTIVE_POINTS=Object.freeze({pickup:2,goal:10});
export class TouchdownState{
 constructor(options={}){this.rules={...TD_RULES,...options};this.reset();}
 reset(){this.scores={alpha:0,beta:0};this.goalsByPlayer=new Map();this.statistics=new TouchdownStatistics();this.half=1;this.remaining=this.rules.halfSeconds;this.phase='playing';this.pause=0;this.owner=null;this.ball='home';this.returnIn=0;this.scorer=null;this.scorerId=null;this.winner=null;this.serial=0;}
 // Counts every accepted goal since this match's reset, independently of team
 // totals. This is not the native individual points formula or a reward.
 goalCount(id){return this.goalsByPlayer.get(id)??0;}
 registerParticipant(id,team){return this.statistics.register(id,team);}
 participantStatistics(id){const counts=this.statistics.snapshot(id);if(!counts)return null;const objectivePoints=counts.picks*TD_OBJECTIVE_POINTS.pickup+this.goalCount(id)*TD_OBJECTIVE_POINTS.goal;
  // Recorded contributions only: goal/heal assists and peer-order ties stay open.
  return {...counts,objectivePoints,recordedPoints:objectivePoints+counts.combatPoints};}
 recordDamage(sourceId,victimId,amount){return this.phase==='playing'&&this.statistics.damage(sourceId,victimId,amount);}
 recordDefeat(victimId,sourceId=null){return this.phase==='playing'&&this.statistics.defeat(victimId,sourceId,this.owner?.id??null);}
 get sidesSwapped(){return this.half===2||(this.phase==='halftime'&&this.pause<=Math.max(0,this.rules.halfPause-TD_HALF_INTRO_SECONDS));}
 pickup(id,team){if(this.phase!=='playing'||this.owner||!['alpha','beta'].includes(team))return false;this.statistics.pickup(id,team);this.owner={id,team};this.ball='carried';this.returnIn=0;this.serial++;return true;}
 drop(){if(!this.owner)return false;this.owner=null;this.ball='dropped';this.returnIn=this.rules.returnSeconds;this.serial++;return true;}
 returnBall(){this.owner=null;this.ball='home';this.returnIn=0;this.serial++;}
 goal(id,defendingTeam){if(this.phase!=='playing'||this.owner?.id!==id||this.owner.team===defendingTeam||!['alpha','beta'].includes(defendingTeam))return false;
  this.scorer=this.owner.team;this.scorerId=this.owner.id;this.scores[this.scorer]++;this.goalsByPlayer.set(this.scorerId,this.goalCount(this.scorerId)+1);this.owner=null;this.ball='scored';this.phase='goal';this.pause=this.rules.goalPause;this.serial++;return true;}
 finish(){this.phase='result';this.winner=this.scores.alpha===this.scores.beta?null:this.scores.alpha>this.scores.beta?'alpha':'beta';this.returnBall();}
 tick(dt){
  if(!Number.isFinite(dt)||dt<0)throw Error('Invalid Touchdown delta');
  if(this.phase==='result')return null;
  this.statistics.advance(dt);
  if(this.phase==='goal'||this.phase==='halftime'){
   this.pause=Math.max(0,this.pause-dt);if(this.pause>0)return null;
   if(this.phase==='goal'){
    if(Math.max(...Object.values(this.scores))>=this.rules.scoreLimit){this.finish();return 'result';}
    if(this.half===1&&(this.remaining<=0||Math.max(...Object.values(this.scores))>=Math.floor(this.rules.scoreLimit/2))){this.phase='halftime';this.pause=Math.max(0,this.rules.halfPause-Math.min(this.rules.goalPause,TD_HALF_INTRO_SECONDS));this.returnBall();return 'halftime';}
    if(this.remaining<=0){this.finish();return 'result';}
   }else{this.half=2;this.remaining=this.rules.halfSeconds;}
   this.phase='playing';this.returnBall();return 'restart';
  }
  this.remaining=Math.max(0,this.remaining-dt);
  if(this.ball==='dropped'){this.returnIn=Math.max(0,this.returnIn-dt);if(this.returnIn===0)this.returnBall();}
  if(this.remaining===0){if(this.half===1){this.phase='halftime';this.pause=this.rules.halfPause;this.returnBall();return 'halftime';}this.finish();return 'result';}
  return null;
 }
}

// Swept player volume against a trigger in module-local space. The slab test
// catches dash crossings even when neither endpoint is inside the laser.
export function crossesBox(from,to,min,max){
 let lo=0,hi=1;
 for(const axis of ['x','y','z']){const delta=to[axis]-from[axis];if(Math.abs(delta)<1e-10){if(from[axis]<min[axis]||from[axis]>max[axis])return false;continue;}
  let a=(min[axis]-from[axis])/delta,b=(max[axis]-from[axis])/delta;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return false;
 }
 return true;
}
