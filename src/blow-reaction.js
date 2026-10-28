import {nativeRequestedAnimationSpeed} from './native-animation-duration-speed.js';
import {SCN_TICKS_PER_SECOND} from './root-motion.js';
import {DOWN_DAMAGE_REACTION_POLICY,downDamageReactionAnimation} from './down-damage-reaction.js';

// Blow16 603A50/604660, Down14 809690, Standup15 8099A0.
// S32[88]=1000 observed in owned reference17; this does not qualify the
// S5 collision solver, input producer, wall rebound or remote actor route.
export const BLOW_REACTION_POLICY=Object.freeze({endMs:1000,recoveryMs:1000,nativeReady:false,physicsBasis:'S5 Controller.move contact'});
const clips=['00027','00026','00024','00021','00035'];
const f=Math.fround;
// Source42/170 has an additional actor-timer callback on entry;42/171 has
// extra receiver movement during Tick (distinct from attacker StaySky).
// Source42 is the attacker's CURRENT equipment, not a
// frozen attack tag. Only173 is independent of both unresolved special ports.
// Require a resolved declaration: an out-of-range Scythe contact must not
// inherit the generic hitProfile fallback merely because it is not171.
export function ordinaryBlowReactionContact(attack,contact){
 if(attack?.weapon!=='deathscythe')return true;
 return contact?.attribute==='ATTACKATTRIB_DEATH_SCYTHE_ATTACK_3'||contact?.attribute==='ATTACKATTRIB_DEATH_SCYTHE_ATTACK_3_ARCANE';
}
export function blowBeginTimerMs(ticks){
 if(!Number.isInteger(ticks)||ticks<0||ticks>0xffffffff)throw new RangeError('Unsigned source scene ticks required');
 return Math.trunc(f(f(Math.trunc(f(f(ticks)/f(4.8))))*f(.75)))>>>0;
}
export function createBlowReaction(avatar){
 const durations=clips.map(id=>avatar?.actions?.get(id)?.getClip()?.duration);
 if(durations.some(t=>!Number.isFinite(t)||t<=0))return null;
 return {stateId:16,phase:1,elapsedMs:0,age:0,phaseSerial:0,
  beginMs:blowBeginTimerMs(Math.round(durations[0]*SCN_TICKS_PER_SECOND)),
  recoveryMs:BLOW_REACTION_POLICY.recoveryMs};
}
function enter(state,stateId,phase=0){state.stateId=stateId;state.phase=phase;state.elapsedMs=0;state.age=0;state.phaseSerial++;}
export function advanceBlowReaction(state,dt){
 if(!Number.isFinite(dt)||dt<0)throw new RangeError('Nonnegative reaction step required');
 state.allowLanding=state.stateId===16&&state.phase===2;
 const dtMs=Math.round(dt*1000);state.age+=dt;
 state.elapsedMs=(state.elapsedMs+dtMs)>>>0;
 if(state.stateId===16){
  if(state.phase===1&&state.elapsedMs>state.beginMs)enter(state,16,2);
  else if(state.phase===3&&state.elapsedMs>BLOW_REACTION_POLICY.endMs)enter(state,14);
 }else if(state.stateId===20&&state.elapsedMs>DOWN_DAMAGE_REACTION_POLICY.durationMs){
  enter(state,14);
 }else if((state.stateId===14||state.stateId===15)&&state.recoveryMs>0&&state.elapsedMs>state.recoveryMs){
  if(state.stateId===14)enter(state,15);else return true;
 }
 return false;
}
// Explicit arena bridge after a NEW move: do not reuse a pre-pause grounded
// flag as if it were a native mode114 observation. Wall/Bound17 is not inferred.
export function blowReactionAfterMove(state,{grounded,velocity}){
 if(typeof grounded!=='boolean'||!velocity||!['x','y','z'].every(k=>Number.isFinite(velocity[k])))throw new TypeError('Explicit S5 movement result required');
 if(state?.stateId===16&&state.phase===2&&state.allowLanding===true&&grounded){
  enter(state,16,3);velocity.x=0;velocity.z=0;return true;
 }
 return false;
}
// Native configured inputs4/9/15 route Blow/Down to Standup, never directly
// to an attack. Button-edge admission here remains the S5 input policy.
export function requestBlowStandup(state,input){
 if(!state||![16,14].includes(state.stateId))return false;
 if(!(input?.lightPressed||input?.heavy||input?.jump))return false;
 enter(state,15);return true;
}
export function blowReactionAnimation(state,key){
 if(state.stateId===20)return downDamageReactionAnimation(state,key);
 const phase=state.stateId===16?state.phase:state.stateId===14?4:5;
 return {clip:clips[phase-1],speed:1,loop:phase===2||phase===4,
  key:`${key}/blow/${state.phaseSerial}`,phaseAge:state.age,
  blendTicks:[0,200,400,1000,0][phase-1],requestedMs:phase===5?state.recoveryMs:0};
}
export function blowReactionPlayback(avatar,state,animation){
 if(!state.blowReaction||!animation)return null;
 const clip=avatar.actions?.get(animation.clip)?.getClip();
 if(!clip||!Number.isFinite(clip.duration)||clip.duration<=0)return null;
 const speed=nativeRequestedAnimationSpeed({durationTicks:Math.round(clip.duration*SCN_TICKS_PER_SECOND),requestedMs:animation.requestedMs,luaAnimationSpeed:animation.speed});
 return {speed,time:animation.phaseAge*speed,fade:animation.blendTicks/SCN_TICKS_PER_SECOND};
}
