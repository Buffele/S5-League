import {s5runtimeSkillDefinition} from './s5runtime-skill-data.js';
const f=Math.fround;
// Authenticated constant_info float[3]/float[128], consumed by these functions.
const secondsPerMs=.001,millisecondsPerSecond=1000;
const keys=new Set([3050001,3050002]);
export function createS5RuntimeShieldState({itemKey=3050001}={}){if(!keys.has(itemKey))throw Error('Unsupported Shield item');return {itemKey,active:false,serial:0,pendingEnd:false,drainElapsedMs:0,drainPeriodMs:0,drainCounter:0,drainTimerBlocked:false,activationElapsedMs:0,activationRequested:false};}
export function resetS5RuntimeShield(state){Object.assign(state,createS5RuntimeShieldState({itemKey:state.itemKey}),{serial:state.serial+1});return state;}
function contextReady(nc){return nc?.enabled===true&&[0,1].includes(nc.actorByte6c)&&typeof nc.actorSlot40==='boolean'&&(nc.actorByte6c!==0||typeof nc.nativeSpWritePermitted==='boolean');}
export function s5runtimeShieldNativeEligibility(state,energy,{actorByte6c,currentStateExists=false,actorStateId}={}){
 if(!Number.isFinite(energy)||energy<0||![0,1].includes(actorByte6c))return false;
 if(actorByte6c===1)return true;
 if(state.active&&currentStateExists&&![34,4].includes(actorStateId))return false;
 if(!state.active&&state.pendingEnd)return false;
 return energy>=Number(s5runtimeSkillDefinition(state.itemKey).action.ability.required_mp);
}
export function beginS5RuntimeShield(state,{energy,nativeContext}={}){
 if(!Number.isFinite(energy)||energy<0)throw Error('Invalid Shield SP');
 if(state.active)return {accepted:false,energy,reason:'already-active',commands:{},nativeReady:false};
 if(!contextReady(nativeContext)||nativeContext.eligibilityConfirmed!==true)return {accepted:false,energy,reason:'explicit-native-shield-context-required',commands:{},nativeReady:false};
 const cost=nativeContext.actorByte6c===0?Number(s5runtimeSkillDefinition(state.itemKey).action.ability.required_mp):0;
 if(energy<cost)return {accepted:false,energy,reason:'insufficient-energy',commands:{},nativeReady:false};
 if(nativeContext.actorByte6c===0&&nativeContext.nativeSpWritePermitted)energy=f(f(energy)-f(cost));
 state.active=true;state.pendingEnd=false;state.serial++;
 // Native Begin does not reset the timer at+0C/+10/+14; ctor defaults period0.
 return {accepted:true,energy,commands:{shieldObjectRequest:nativeContext.actorSlot40?'AA2E50':'7FC250',...(nativeContext.actorByte6c===0?{spRegenerationEnabled:false}:{})},nativeReady:false};
}
export function endS5RuntimeShield(state,{nativeContext,reason='explicit-native-component-end'}={}){
 if(!contextReady(nativeContext))return {active:state.active,reason:'explicit-native-shield-context-required',commands:{},nativeReady:false};
 if(!state.active)return {active:false,reason:'inactive',commands:{},nativeReady:false};
 state.active=false;state.serial++;
 return {active:false,reason,commands:{shieldObjectRemove:nativeContext.actorSlot40?'AA2EE0':'7F7800/891CC0',...(nativeContext.actorByte6c===0?{spRegenerationEnabled:true}:{})},nativeReady:false};
}
export function inputS5RuntimeShield(state,nativeInputCode,{slot0ActionType,slot1ActionType,currentStateExists,actorStateId}={}){
 if(!Number.isInteger(nativeInputCode))throw Error('Explicit native Shield input code required');
 const match=(slot0ActionType===4&&nativeInputCode===20)||(slot1ActionType===4&&nativeInputCode===22);
 if(!state.active){if(!match)state.pendingEnd=false;}
 else if(currentStateExists===true&&actorStateId!==34&&match)state.pendingEnd=true;
 return {pendingEnd:state.pendingEnd,nativeReady:false};
}
export function s5runtimeShieldNativeDrainRate({itemRate=10,flat=0,percent=0}={}){if(![itemRate,flat,percent].every(Number.isFinite))throw Error('Invalid Shield attribute15E');return Math.max(0,f(f(f(itemRate)-f(flat))-f(f(itemRate)*f(percent))));}
export function advanceS5RuntimeShield(state,dtMs,{energy,nativeContext}={}){
 if(!Number.isFinite(dtMs)||dtMs<0||!Number.isFinite(energy)||energy<0)throw Error('Invalid Shield frame');
 const commands={},events=[];
 const result=reason=>({energy,active:state.active,reason,commands,events,nativeReady:false});
 if(!contextReady(nativeContext))return result('explicit-native-shield-context-required');
 if(!state.active)return result('inactive');
 if(nativeContext.actorByte6c===0){
  if(!state.drainTimerBlocked){state.drainCounter++;state.drainElapsedMs+=dtMs;}
  if(!state.drainTimerBlocked&&state.drainElapsedMs>state.drainPeriodMs){
   state.drainCounter=0;state.drainElapsedMs=0;
   const itemRate=Number(s5runtimeSkillDefinition(state.itemKey).action.ability.decrement_mp);
   const rate=s5runtimeShieldNativeDrainRate({itemRate,...nativeContext.attribute15E});
   const cost=f(rate*f(f(dtMs)*f(secondsPerMs)));
   if(energy<cost){Object.assign(commands,endS5RuntimeShield(state,{nativeContext,reason:'energy-exhausted'}).commands);events.push({type:'s5runtime-shield-ended',reason:'energy-exhausted'});return result('insufficient-energy');}
   if(nativeContext.nativeSpWritePermitted)energy=f(f(energy)-cost);
  }
 }
 if(state.pendingEnd){Object.assign(commands,endS5RuntimeShield(state,{nativeContext,reason:'native-input-end-flag'}).commands);events.push({type:'s5runtime-shield-ended',reason:'native-input-end-flag'});}
 return result('diagnostic-native-shield-component');
}
export function advanceS5RuntimeShieldActivation(state,dtMs,{nativeContext}={}){
 if(!Number.isFinite(dtMs)||dtMs<0)throw Error('Invalid Shield body frame');
 if(nativeContext?.enabled!==true||nativeContext.actorByte6c!==0||nativeContext.bodyStateConfirmed!==true)return {componentBegin:false,reason:'native-body-context-required',nativeReady:false};
 // CSkillShieldState::Tick649660: actor vslot3C gates this block; +154
 // blocks the activation timer. Neither predicate is inferred from input.
 if(typeof nativeContext.actorSlot3c!=='boolean'||typeof nativeContext.bodyActivationTimerBlocked!=='boolean')return {componentBegin:false,reason:'native-body-timer-predicates-required',nativeReady:false};
 if(nativeContext.actorSlot3c||nativeContext.bodyActivationTimerBlocked)return {componentBegin:false,reason:'native-body-timer-blocked',nativeReady:false};
 if(state.active||state.activationRequested)return {componentBegin:false,nativeReady:false};
 state.activationElapsedMs+=dtMs;
 const delayMs=Number(s5runtimeSkillDefinition(state.itemKey).action.Float.Float_Value1)*millisecondsPerSecond;
 if(state.activationElapsedMs>delayMs){state.activationRequested=true;return {componentBegin:true,nativeReady:false};}
 return {componentBegin:false,nativeReady:false};
}
