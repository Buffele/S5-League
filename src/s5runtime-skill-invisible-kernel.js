import {s5runtimeSkillDefinition} from './s5runtime-skill-data.js';
const clock=t=>Number.isInteger(t)&&t>=0&&t<=0xffffffff;
const f=Math.fround,skill=s5runtimeSkillDefinition(3030001);
// Native component actor+2A0, not a keyboard or body-state adapter.
export function createS5RuntimeInvisibleState(){return {active:false,serial:0,drainElapsedMs:0,pulseElapsedMs:0,pulseDurationMs:0,pulseFlag:true,targetParameter:1,fadeAnchor:1,beganAtMs:0,endedAtMs:0};}
export function resetS5RuntimeInvisible(state){Object.assign(state,createS5RuntimeInvisibleState(),{serial:state.serial+1});return state;}
export function s5runtimeInvisibleNativeTarget({observerSlot38EqualsActorSlot38,observerSlot174Result,native1192290Result}){
 if(![observerSlot38EqualsActorSlot38,observerSlot174Result,native1192290Result].every(v=>typeof v==='boolean'))throw Error('Explicit native observer predicates required');
 return observerSlot38EqualsActorSlot38||observerSlot174Result?f(.25):native1192290Result?f(.01):f(.0075);
}
export function s5runtimeInvisibleNativeDrainRate({flat=0,percent=0,itemRate=Number(skill.action.ability.decrement_mp)}={}){
 if(![flat,percent,itemRate].every(Number.isFinite))throw Error('Invalid native Invisible modifier15D');
 return Math.max(0,f(f(f(itemRate)-f(flat))-f(f(itemRate)*f(percent))));
}
export function beginS5RuntimeInvisible(state,{energy,nowMs,nativeContext}={}){
 if(!Number.isFinite(energy)||energy<0||!clock(nowMs))throw Error('Invalid Invisible Begin');
 if(nativeContext?.enabled!==true||nativeContext.actorKindLow3!==1||![0,1].includes(nativeContext.actorByte6c)||nativeContext.eligibilityConfirmed!==true)return {accepted:false,energy,reason:'explicit-native-component-context-required',commands:{},nativeReady:false};
 const required=nativeContext.actorByte6c===0?Number(skill.action.ability.required_mp):0;
 if(required&&typeof nativeContext.nativeSpWritePermitted!=='boolean')return {accepted:false,energy,reason:'native-sp-write-predicate-required',commands:{},nativeReady:false};
 if(energy<required)return {accepted:false,energy,reason:'insufficient-energy',commands:{},nativeReady:false};
 Object.assign(state,{active:true,drainElapsedMs:0,pulseElapsedMs:0,pulseDurationMs:0,pulseFlag:true,beganAtMs:nowMs,serial:state.serial+1});
 return {accepted:true,energy:required&&nativeContext.nativeSpWritePermitted?f(f(energy)-f(required)):energy,commands:nativeContext.actorByte6c===0?{spRegenerationEnabled:false}:{},nativeReady:false};
}
export function endS5RuntimeInvisible(state,{nowMs,reason='explicit-component-end'}={}){
 if(!clock(nowMs))throw Error('Invalid Invisible End');
 const wasActive=state.active;
 if(wasActive){state.active=false;state.targetParameter=1;state.endedAtMs=nowMs;state.serial++;}
 return {active:false,reason,commands:wasActive?{spRegenerationEnabled:true}:{},nativeReady:false};
}
export function s5runtimeInvisibleNativeRenderStep(state,dtMs,{nowMs,currentModelParameter}={}){
 if(![dtMs,currentModelParameter].every(Number.isFinite)||dtMs<0||!clock(nowMs))throw Error('Native model parameter and wall clock required');
 const target=f(state.targetParameter);
 if(currentModelParameter===target)return currentModelParameter;
 let next;
 if(state.active){const age=(nowMs-state.beganAtMs)>>>0;
  if(age<3000){const t=f(Math.min(1,f(f(age)/f(3000))));next=f(f(f(1-t)*f(.8))+f(target*t));}
  else {const delta=f(f(dtMs)*f(.0025));next=currentModelParameter<target?Math.min(target,f(f(currentModelParameter)+delta)):Math.max(target,f(f(currentModelParameter)-delta));}
  state.fadeAnchor=next;
 }else{const t=f(Math.min(1,f(f((nowMs-state.endedAtMs)>>>0)/f(500))));next=f(f(f(1-t)*f(state.fadeAnchor))+f(target*t));}
 return next;
}
export function advanceS5RuntimeInvisible(state,dtMs,{energy,nowMs,currentModelParameter,nativeContext}={}){
 if(![dtMs,energy,currentModelParameter].every(Number.isFinite)||dtMs<0||energy<0||!clock(nowMs))throw Error('Invalid Invisible component frame');
 const commands={},events=[];
 const result=reason=>({energy,active:state.active,reason,commands,events,nativeReady:false});
 if(nativeContext?.enabled!==true||nativeContext.actorKindLow3!==1||![0,1].includes(nativeContext.actorByte6c))return result('explicit-native-component-context-required');
 if(!Number.isInteger(nativeContext.actorStateId)||typeof nativeContext.observerSlot38Flag8!=='boolean')return result('native-state-and-observer-predicate-required');
 // B88D50 death28 path sets both parameters1 and returns, without clearingactive.
 if(nativeContext.actorStateId===28){state.pulseElapsedMs=0;state.pulseDurationMs=0;state.targetParameter=1;state.fadeAnchor=1;commands.nativeModelParameterTarget=1;return result('native-state28-fields-reset-render-skipped');}
 if(state.active){
  state.targetParameter=s5runtimeInvisibleNativeTarget(nativeContext);
  if(nativeContext.actorByte6c===0){
  if(typeof nativeContext.nativeSpWritePermitted!=='boolean')return result('native-sp-write-predicate-required');
  state.drainElapsedMs+=dtMs;
  const delay=nativeContext.decrementDelayMs??Number(skill.action.ability.decrement_mp_delay)*1000;
  if(!Number.isFinite(delay)||delay<0)throw Error('Invalid native decrement delay');
  if(state.drainElapsedMs>delay){const cost=f(s5runtimeInvisibleNativeDrainRate(nativeContext.attribute15D)*f(f(dtMs)*f(.001)));
   if(energy<cost){Object.assign(commands,endS5RuntimeInvisible(state,{nowMs,reason:'energy-exhausted'}).commands);events.push({type:'s5runtime-invisible-ended',reason:'energy-exhausted'});}
   else if(nativeContext.nativeSpWritePermitted)energy=f(f(energy)-cost);
  }
 }
 }
 if(state.active&&nativeContext.observerSlot38Flag8&&!nativeContext.observerSlot38EqualsActorSlot38){
  if([5,7].includes(nativeContext.actorStateId)){
   if(state.pulseFlag){state.pulseFlag=false;state.pulseElapsedMs=0;state.pulseDurationMs=0;state.targetParameter=0;}
  }else{
   state.pulseElapsedMs+=dtMs;
   if(state.pulseElapsedMs>state.pulseDurationMs){
    if(state.pulseFlag){state.targetParameter=0;state.pulseFlag=false;state.pulseDurationMs=Math.trunc(Number(skill.action.Float.Float_Value2));}
    else{state.targetParameter=nativeContext.native1192290Result?f(.01):f(.0075);state.pulseFlag=true;state.pulseDurationMs=Math.trunc(Number(skill.action.Float.Float_Value1));}
    state.pulseElapsedMs=0;
   }
  }
 }
 commands.nativeModelParameterTarget=state.targetParameter;
 commands.nativeModelParameter=s5runtimeInvisibleNativeRenderStep(state,dtMs,{nowMs,currentModelParameter});
 return result('diagnostic-native-component');
}
