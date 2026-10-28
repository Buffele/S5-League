import {createS5RuntimeShieldState,beginS5RuntimeShield,endS5RuntimeShield,inputS5RuntimeShield,advanceS5RuntimeShield,advanceS5RuntimeShieldActivation} from './s5runtime-skill-shield-kernel.js';
import {createS5RuntimeInvisibleState,resetS5RuntimeInvisible,beginS5RuntimeInvisible,endS5RuntimeInvisible,advanceS5RuntimeInvisible} from './s5runtime-skill-invisible-kernel.js';
import {s5runtimeSkillDefinition,S5RUNTIME_SKILL_DATA} from './s5runtime-skill-data.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';

const f=Math.fround,c=S5RUNTIME_SKILL_DATA.flyConstructorConstants;
const flyKeys=new Set([3020001,3020002,3020004]);
const shieldKeys=new Set([3050001,3050002]);
export const S5RUNTIME_SKILL_RUNTIME_GATES=Object.freeze({nativeReady:false,mainGameObserved:false,nativeCompared:false,
 blockers:Object.freeze(['Native actor pre-CFly gravity/bound and collision feedback not integrated','Both-sex clips, model, VFX and audio not integrated','Equipment enhancement modifiers not applied; passive numeric HP/SP bonuses unproved','Native comparison pending'])});
export function createS5RuntimeSkillState({itemKey=null}={}){
 const state={itemKey:null,serial:0};resetS5RuntimeSkill(state);if(itemKey!==null)equipS5RuntimeSkill(state,itemKey);return state;
}
// State-only reset: callers must consume endS5RuntimeSkillDiagnostic commands first.
export function resetS5RuntimeSkill(state){
 state.shield=createS5RuntimeShieldState({itemKey:shieldKeys.has(state.itemKey)?state.itemKey:3050001});state.shieldActivationContext=null;state.shieldBodyEntrySerial=null;state.invisibleDiagnosticContext=null;
 state.invisible=state.invisible?resetS5RuntimeInvisible(state.invisible):createS5RuntimeInvisibleState();state.active=false;state.flyState=0;state.elapsedMs=0;state.drainElapsedMs=0;state.nativeVelocityY=0;state.nativeAcceleration=0;state.nativeDamping=0;state.nativeMaximum=c.maximumVerticalSpeed;state.gravityScale=1;state.serial=(state.serial??0)+1;return state;
}
export function endS5RuntimeSkillDiagnostic(state,{nativeContext=null,reason='explicit-diagnostic-end',energy}={}){
 const commands={},events=[];
 if(state.shield?.active){
  // Resource variant and SP predicates come from the successful Begin, never
  // from a subsequently disabled or different equipment context.
  const nc=state.shieldActivationContext??nativeContext;
  const ended=endS5RuntimeShield(state.shield,{nativeContext:nc,reason});
  Object.assign(commands,ended.commands);if(!ended.active)events.push({type:'s5runtime-skill-ended',itemKey:state.itemKey,reason});
 }else if(state.invisible?.active){
  const nc=nativeContext?.enabled===true?nativeContext:state.invisibleDiagnosticContext;
  const nowMs=Number.isInteger(nc?.nowMs)?nc.nowMs:state.invisible.beganAtMs;
  Object.assign(commands,endS5RuntimeInvisible(state.invisible,{nowMs,reason}).commands,{invisiblePresentationReset:true});
  events.push({type:'s5runtime-skill-ended',itemKey:3030001,reason});
 }else if(state.flyState!==0){Object.assign(commands,{releaseFlightControl:true,physicsGravityScale:1});state.flyState=0;events.push({type:'s5runtime-skill-ended',itemKey:state.itemKey,reason});}
 state.active=!!(state.shield?.active||state.invisible?.active);
 return {commands,events,active:state.active,...(energy===undefined?{}:{energy}),reason,nativeReady:false};
}
export function equipS5RuntimeSkill(state,itemKey,{nativeContext=null}={}){
 const skill=itemKey===null?null:s5runtimeSkillDefinition(itemKey);
 if(itemKey!==null&&!skill)return {accepted:false,reason:'unknown-s5runtime-skill',itemKey:state.itemKey};
 const lifecycle=endS5RuntimeSkillDiagnostic(state,{nativeContext,reason:'equipment-changed'});
 resetS5RuntimeSkill(state);state.itemKey=skill?.itemKey??null;if(shieldKeys.has(state.itemKey))state.shield=createS5RuntimeShieldState({itemKey:state.itemKey});
 return {accepted:true,lifecycleCommands:lifecycle.commands,lifecycleEvents:lifecycle.events,itemKey:state.itemKey,skill,status:skill?'behavior-incomplete':'unequipped',nativeReady:false};
}

// Actor51F377 integrates old velocity before CFly::Tick51F5DF/B808D0 updates
// native velocity. This supports old-v*dt while the source physics gate is on
// and Enter1 has zeroed actor gravity (B7F880 ->97DF70; getter97F9E0).
// Damping is per native Tick; converting it into exponential dt damping would
// change the source. Caller owns collision and the ordinary actor physics pass.
export function s5runtimeFlyVerticalStep({velocityY,acceleration,damping,minimum=c.minimumVerticalSpeed,maximum=c.maximumVerticalSpeed},dtMs){
 if(![velocityY,acceleration,damping,minimum,maximum,dtMs].every(Number.isFinite)||dtMs<0||minimum>maximum||damping<0||damping>1)throw Error('Invalid native flight step');
 const seconds=f(f(dtMs)*f(c.secondsPerMs));
 const next=f(f(Math.min(maximum,Math.max(minimum,f(f(velocityY)+f(f(acceleration)*seconds)))))*f(1-f(damping)));
 return {nativeVelocityY:next,verticalVelocity:next*SCN_SCENE_SCALE,verticalDisplacement:velocityY*seconds*SCN_SCENE_SCALE};
}

function enterFly(state,code,skill,events){
 const previous=state.flyState;
 // Native SetState calls old Leave before new Enter (B81850).
 if(previous===3){state.nativeVelocityY=0;state.nativeAcceleration=0;state.nativeMaximum=c.maximumVerticalSpeed;}
 if(previous===1)state.nativeMaximum=c.maximumVerticalSpeed;
 state.flyState=code;state.elapsedMs=0;
 state.animationIndex=code===3&&previous===1?1:0;
 state.active=[1,2,3].includes(code);
 if(code===1){state.nativeVelocityY=Number(skill.action.Float.Float_Value2);state.nativeAcceleration=0;state.nativeDamping=c.launchDamping;state.nativeMaximum=c.activeMaximumVerticalSpeed;state.gravityScale=0;}
 if(code===3){state.nativeVelocityY=Number(skill.action.Float.Float_Value3);state.nativeAcceleration=Number(skill.action.Float.Float_Value3);state.nativeDamping=c.sustainDamping;state.nativeMaximum=c.activeMaximumVerticalSpeed;}
 if(code===2)state.nativeDamping=c.releaseDamping;
 if(code===4||code===5||code===0)state.gravityScale=1;
 events.push({type:'s5runtime-skill-phase',itemKey:state.itemKey,flyState:code,serial:++state.serial});
}

export function advanceS5RuntimeSkill(state,dtMs,{activatePressed=false,held=true,fallPressed=false,endPressed=false,nativeInputCode=null,energy,actorDead=false,interrupted=false,nativeContext=null}={}){
 if(!Number.isFinite(dtMs)||dtMs<0||!Number.isFinite(energy)||energy<0)throw Error('Invalid skill frame');
 const events=[],commands={};const skill=s5runtimeSkillDefinition(state.itemKey);
 const result=reason=>({energy,active:state.active,flyState:state.flyState,events,commands,reason,allowedActions:{equip:true,activate:!!skill&&(flyKeys.has(skill.itemKey)||shieldKeys.has(skill.itemKey)||skill.itemKey===3030001)&&nativeContext?.enabled===true},nativeReady:false,blockers:S5RUNTIME_SKILL_RUNTIME_GATES.blockers});
 const invisibleEquipped=state.itemKey===3030001,shieldEquipped=shieldKeys.has(state.itemKey);
 // Generic action/death inputs belong to Flying. Component skills require
 // their explicit native End or diagnostic context teardown.
 if((!invisibleEquipped&&!shieldEquipped&&(actorDead||interrupted))||nativeContext?.enabled!==true){
  if(state.flyState!==0||state.invisible?.active||state.shield?.active){
   const ended=endS5RuntimeSkillDiagnostic(state,{reason:nativeContext?.enabled!==true?'diagnostic-context-disabled':actorDead?'dead':'interrupted'});
   Object.assign(commands,ended.commands,{diagnosticTeardown:true});events.push(...ended.events);resetS5RuntimeSkill(state);
  }
  return result(nativeContext?.enabled===true?'inactive':'native-context-required');
 }
 if(!skill)return result('no-skill-equipped');
 if(shieldEquipped){
  const nc=nativeContext;
  if(nc.bodyStateConfirmed===true){
   if(!Number.isInteger(nc.bodyEntrySerial)||nc.bodyEntrySerial<0)return result('native-shield-body-entry-serial-required');
   if(state.shieldBodyEntrySerial!==nc.bodyEntrySerial){state.shieldBodyEntrySerial=nc.bodyEntrySerial;state.shield.activationElapsedMs=0;state.shield.activationRequested=false;}
  }
  const rawCode=nc.nativeInputCode??nativeInputCode;
  if(rawCode!==null&&rawCode!==undefined)inputS5RuntimeShield(state.shield,rawCode,{slot0ActionType:nc.slot0ActionType??Number(skill.action.resources.type),slot1ActionType:nc.slot1ActionType,currentStateExists:nc.currentStateExists,actorStateId:nc.actorStateId});
  if(nc.componentEnd===true){const ended=endS5RuntimeSkillDiagnostic(state,{nativeContext:nc,reason:'explicit-native-component-end'});Object.assign(commands,ended.commands);events.push(...ended.events);}
  else {
   const activation=advanceS5RuntimeShieldActivation(state.shield,dtMs,{nativeContext:nc});
   if((nc.componentBegin===true||activation.componentBegin)&&!state.shield.active){
    const before=energy,begun=beginS5RuntimeShield(state.shield,{energy,nativeContext:nc});
    if(!begun.accepted)return result(begun.reason);
    state.shieldActivationContext={...nc};energy=begun.energy;Object.assign(commands,begun.commands);events.push({type:'s5runtime-skill-activated',itemKey:state.itemKey,cost:before-energy});
   }
  }
  const frame=advanceS5RuntimeShield(state.shield,dtMs,{energy,nativeContext:nc});energy=frame.energy;state.active=frame.active;state.flyState=0;Object.assign(commands,frame.commands);events.push(...frame.events.map(e=>({...e,itemKey:state.itemKey})));
  return result(frame.reason);
 }
 if(skill.itemKey===3030001){
  // Component Begin/End are explicit native requests; keyboard/held mapping is
  // not inferred from type2 or its display name. Caller owns body-state timing.
  const nc=nativeContext;
  const clockReady=Number.isInteger(nc.nowMs)&&nc.nowMs>=0&&nc.nowMs<=0xffffffff;
  if(!clockReady||!Number.isFinite(nc.currentModelParameter))return result('native-invisible-clock-and-model-parameter-required');
  const predicates=['observerSlot38EqualsActorSlot38','observerSlot174Result','native1192290Result','observerSlot38Flag8'];
  if(nc.actorKindLow3!==1||![0,1].includes(nc.actorByte6c)||!Number.isInteger(nc.actorStateId)||predicates.some(k=>typeof nc[k]!=='boolean')||(nc.actorByte6c===0&&typeof nc.nativeSpWritePermitted!=='boolean'))return result('native-invisible-actor-and-observer-predicates-required');
  state.invisibleDiagnosticContext={...nc};
  if(nc.componentEnd===true&&state.invisible.active){const ended=endS5RuntimeInvisible(state.invisible,{nowMs:nc.nowMs});Object.assign(commands,ended.commands);events.push({type:'s5runtime-skill-ended',itemKey:3030001,reason:'explicit-native-component-end'});}
  else if(nc.componentBegin===true&&nc.componentEnd!==true&&!state.invisible.active){
   const beforeEnergy=energy,begun=beginS5RuntimeInvisible(state.invisible,{energy,nowMs:nc.nowMs,nativeContext:nc});
   if(!begun.accepted)return result(begun.reason);energy=begun.energy;Object.assign(commands,begun.commands);events.push({type:'s5runtime-skill-activated',itemKey:3030001,cost:beforeEnergy-energy});
  }
  const frame=advanceS5RuntimeInvisible(state.invisible,dtMs,{energy,nowMs:nc.nowMs,currentModelParameter:nc.currentModelParameter,nativeContext:nc});
  energy=frame.energy;state.active=frame.active;state.flyState=0;Object.assign(commands,frame.commands);
  for(const event of frame.events)events.push({...event,type:'s5runtime-skill-ended',itemKey:3030001});
  return result(frame.reason);
 }
 if(!flyKeys.has(skill.itemKey))return result(skill.action?'effect-semantics-unverified':'action-source-missing');
 const ability=skill.action.ability;
 if(nativeInputCode!==null&&!Number.isInteger(nativeInputCode))throw Error('Invalid native flight input code');
 const slot0ActionType=nativeContext.slot0ActionType??Number(skill.action.resources?.type);
 const code=nativeInputCode??((fallPressed||endPressed)?17:activatePressed?20:(!held&&state.active&&state.flyState!==2)?21:null);
 const beforeInput=state.flyState;let inputRefusal=null;
 if([1,2,3].includes(beforeInput)&&(code===17||code===18)){
  enterFly(state,5,skill,events);commands.verticalVelocity=state.nativeVelocityY*SCN_SCENE_SCALE;
  events.push({type:'s5runtime-skill-ended',reason:'native-flight-end-input',nativeInputCode:code});
 }else if([1,3].includes(beforeInput)&&(code===21||code===23)){
  enterFly(state,2,skill,events);commands.resetHorizontalVelocity=beforeInput===3;
 }else if(beforeInput===2&&((code===20&&slot0ActionType===1)||(code===22&&nativeContext.slot1ActionType===1))){
  enterFly(state,3,skill,events);commands.resetHorizontalVelocity=true;
 }else if(beforeInput===2&&(code===20||code===22)){
  inputRefusal='native-slot-action-type-required';events.push({type:'s5runtime-skill-input-refused',reason:inputRefusal,nativeInputCode:code,slot:code===20?0:1,actionType:code===20?slot0ActionType:nativeContext.slot1ActionType??null});
 }
 if(activatePressed&&!state.active){
  if(code===17||code===18)return result('native-flight-ending');
  const required=Number(ability.required_mp);
  if(energy<required)return result('insufficient-energy');
  // CFly::Begin B81930 deducts required SP, rather than threshold-only.
  energy=f(Math.max(0,f(energy)-f(required)));state.drainElapsedMs=0;enterFly(state,1,skill,events);
  commands.resetHorizontalVelocity=true;events.push({type:'s5runtime-skill-activated',itemKey:state.itemKey,cost:required});
 }
 if(!state.active){
  if(state.flyState===4||state.flyState===5){
   commands.releaseFlightControl=true;commands.physicsGravityScale=1;
   const ending=state.flyState;state.elapsedMs+=dtMs;
   if(state.elapsedMs>(ending===4?1000:500))enterFly(state,ending===4?5:0,skill,events);
   return result(state.flyState?'native-flight-ending':'inactive');
  }
  return result('inactive');
 }
 // Source actor physics runs before CFly drain/velocity update. Even an
 // insufficient-SP tick has already translated old velocity natively.
 const oldDisplacement=state.nativeVelocityY*f(f(dtMs)*f(c.secondsPerMs))*SCN_SCENE_SCALE;
 state.drainElapsedMs+=dtMs;
 const delayMs=nativeContext.decrementDelayMs??f(f(Number(ability.decrement_mp_delay))*f(c.delayMillisecondsPerSecond));
 if(!Number.isFinite(delayMs)||delayMs<0)throw Error('Invalid explicit native drain delay');
 if(state.drainElapsedMs>delayMs){
  // B808D0 uses full tick dt after crossing the delay, not only the excess.
  // Item-specific enhancement multipliers are left to a verified caller.
  const multiplier=nativeContext.decrementMultiplier??1;
  if(!Number.isFinite(multiplier)||multiplier<0)throw Error('Invalid drain modifier');
  const cost=f(f(f(Number(ability.decrement_mp))*f(multiplier))*f(f(dtMs)*f(c.secondsPerMs)));
  if(energy<cost){const accel=state.nativeAcceleration;enterFly(state,5,skill,events);Object.assign(commands,{flightControl:true,applyInputMotion:false,verticalDisplacement:oldDisplacement,verticalVelocity:state.nativeVelocityY*SCN_SCENE_SCALE,nativeAcceleration:accel,physicsGravityScale:1});events.push({type:'s5runtime-skill-ended',reason:'energy-exhausted'});return result('insufficient-energy');}
  energy=f(Math.max(0,f(energy)-cost));
 }
 const launch=state.flyState===1,nativeAcceleration=state.nativeAcceleration;
 const step=s5runtimeFlyVerticalStep({velocityY:state.nativeVelocityY,acceleration:nativeAcceleration,damping:state.nativeDamping,maximum:state.nativeMaximum},dtMs);
 state.nativeVelocityY=step.nativeVelocityY;
 Object.assign(commands,{...step,flightControl:true,applyInputMotion:true,nativeAcceleration,physicsGravityScale:state.gravityScale,movementScale:Number(skill.action.Float.Float_Value1),integrationStatus:'source-supported-flight-native-comparison-pending'});
 state.elapsedMs+=dtMs;
 if(state.flyState===3&&state.animationIndex===0&&state.elapsedMs>500)state.animationIndex=1;
 if(launch&&state.elapsedMs>500){enterFly(state,3,skill,events);commands.verticalVelocity=state.nativeVelocityY*SCN_SCENE_SCALE;commands.resetHorizontalVelocity=true;}
 // Native contact flag + actorMode2 must be supplied explicitly. A generic
 // S5 grounded flag does not prove this native downward collision predicate.
 if(nativeContext.nativeGroundContact===true&&nativeContext.nativeActorMode===2){
  const target=state.flyState===2?4:state.flyState===3?5:null;
  if(target!==null){enterFly(state,target,skill,events);commands.verticalVelocity=state.nativeVelocityY*SCN_SCENE_SCALE;commands.physicsGravityScale=1;}
 }
 return result(inputRefusal??'diagnostic-flight');
}
