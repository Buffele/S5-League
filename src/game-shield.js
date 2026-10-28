import {TUNING} from './controller.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {createShieldLowerSourceProfile} from './shield-body-locomotion-profile.js';
import {createShieldLocomotionChildren} from './shield-body-locomotion-children.js';
import {applyNativePushCollision} from './native-push-collision.js';
import {createS5RuntimeShieldDurationProfile,selectS5RuntimeShieldBodyDuration} from './s5runtime-skill-shield-duration.js';
import {advanceS5RuntimeShieldActivation} from './s5runtime-skill-shield-kernel.js';
import {createNativeActorMoveSpeedBaseProfile,createInitializedNativeActorMoveSpeedReader} from './native-actor-move-speed-initialization.js';

export const GAME_SHIELD_POLICY=Object.freeze({id:'s5-local-shield-host-v1',kind:'s5-explicit-adaptation',
 source:'Source FREE constructor/body/timers/lower algorithms; explicit S5 input, neutral actor modifiers, dispatcher, collision feedback and renderer mask policies. Native gameplay equivalence unverified.'});
const carriers={male:'d9953bde346c6b242e8d45d4ea885a581203c3999a78ab13d60aa7ea3997dba5',female:'98caac4c4f8ee8900a9b28b050e7900fbb8c4c1b65a5f968a20110ae7653d465'};
const groundClips=[['I0004','DD005','DD006','DD007','DD011','DD008','DD009','DD012','DD010'],['IB000','IB008_1','IB009_1','IB010','IB014','IB011_1','IB012','IB015','IB013']];
// Until the native lower air parameter carrier is bound, this mask adapter
// explicitly selects S5's ordinary source jump clips. No missing-clip fallback.
const airClips=['00000','00001','00002','00003'];
const q=tick=>({tick,provenance:{kind:'explicit-unverified',source:GAME_SHIELD_POLICY.source}});

export function createGameShield({controller:c,getAvatar,presentation,onNotification=()=>{},actorLocked=()=>false}={}){
 if(!c||typeof getAvatar!=='function'||typeof presentation?.consume!=='function')throw TypeError('Actual Controller/avatar and prepared Shield presentation required');
 let input={},pending=[],lower=null,lowerSets=[],playbackSerial=0,lastAnimation=null,disposed=false;
 const ledger=[];const record=(kind,detail={})=>{ledger.push({kind,...detail});if(ledger.length>64)ledger.shift();};
 const actorId=`s5-local-${c.sex}`;
 const lowerProfile=createShieldLowerSourceProfile({declaration:'FREE',provenance:{source:GAME_SHIELD_POLICY.source}});
 const speedBase=createNativeActorMoveSpeedBaseProfile({declaration:'FREE',actorId,provenance:{kind:'source-initialization-model',source:'S5 actor selects authenticated FREE constructor initial speed'}});
 const speed=createInitializedNativeActorMoveSpeedReader({baseProfile:speedBase,condition154:{tick:({flat,percent})=>({flat,percent}),provenance:GAME_SHIELD_POLICY},readRemainingSnapshot:{provenance:GAME_SHIELD_POLICY,tick:()=>({
  actorId,registry:{float0:0,float35:1,gameTempo15Reads:[1100,1100,1100]},role:{manager124Present:false},standard:{manager238Byte9c:1},
  equipmentAtSecondLookup:{exists:true,parametersExist:true,moveSpeedRate15f4688:c.weaponMoveRate},actor368Flat1c:0,actor368Percenta0:0,actorProtected3c0AfterConditions:0,
 })}});
 const bodyContext=()=>({enabled:true,eligibilityConfirmed:true,dispatcherEligibilityConfirmed:true,...c.readS5RuntimeShieldActorContext({currentStateExists:true,actorStateId:5,currentStateSlotB0:false}),bodyStateConfirmed:!!c.s5runtimeShieldBodyState,bodyActivationTimerBlocked:false,bodyCompletionTimerBlocked:false,bodyAnimationTimerBlocked:false,weaponType:c.weapon==='ironboots'?43:0,bodySavedReturnStateId:c.s5runtimeShieldBodyState?.tick.savedReturnStateId});
 const nativePosition=()=>[c.position.x,c.position.y,c.position.z].map(v=>v/SCN_SCENE_SCALE);
 const actorMode=()=>c.grounded?0:c.velocity.y>0?1:2;
 function validateLoadout({avatar=getAvatar(),weapon=c.weapon}={}){
  const required=[...new Set(['I0003','I0004',...groundClips[weapon==='ironboots'?1:0],...airClips])],clips=avatar?.clips??[];
  const missing=required.filter(name=>!clips.some(clip=>clip.name===name));
  return missing.length?{accepted:false,reason:'shield-clips-missing',missing}:{accepted:true};
 }
 function inputFrame(tempoIndex=0x17){
  const forward=input.forward||0,side=input.side||0,length=Math.max(1,Math.hypot(forward,side)),facing=c.facing;
  const actorVector=[(Math.sin(facing)*forward-Math.cos(facing)*side)/length,0,(Math.cos(facing)*forward+Math.sin(facing)*side)/length];
  const crossY=Math.cos(facing)*actorVector[0]-Math.sin(facing)*actorVector[2];
  return {actorSlot3c:false,externalSkip:false,actorVector,angleNative:Math.acos(Math.max(-1,Math.min(1,forward/Math.max(Math.hypot(forward,side),1)))),crossYNative:crossY,
   speedFlag:false,actorSpeed51dae0Native:speed.tick(),groundProperty14:lowerProfile.groundProperty14,directionalRate:tempoIndex===0x19?lowerProfile.rates.backRate:tempoIndex===0x18?lowerProfile.rates.sideRate:lowerProfile.rates.frontRate,
   float3:lowerProfile.float3,actorMode114:actorMode(),airProperty28:lowerProfile.airProperty28,jumpMoveRate:lowerProfile.rates.jumpMoveRate,airProperty18:lowerProfile.airProperty18};
 }
 function setLower(command){
  const body=c.s5runtimeShieldBodyState;if(!body)return;
  const set=body.tick.weaponType===43?1:0,clip=command.child===0?groundClips[set][command.animationIndex]:airClips[command.animationIndex];
  if(!clip||!getAvatar().clips.some(a=>a.name===clip))throw Error('Shield lower clip missing: '+clip);
  lastAnimation={...command,clip};
  c.setS5RuntimeShieldLowerPresentationSnapshot({schema:'shield-lower-presentation-v1',bodyEntrySerial:body.bodyEntrySerial,lowerSet:set,child:command.child,phase:command.animationIndex,clip,
   loop:command.child===0, speed:command.method==='B78580'?command.argument:1,fadeSeconds:command.child===0?500/4800:0,playbackSerial:++playbackSerial,provenance:GAME_SHIELD_POLICY});
 }
 function makeLower(){
  lowerSets=[0,1].map(()=>createShieldLocomotionChildren({airState:lowerProfile.airState,ports:{
   readGroundFrame:q((kind,index)=>inputFrame(index)),readGroundAnimationContext:q(()=>({allChannels:lowerProfile.allChannels,normalBlendMs:lowerProfile.groundAnimationArgument24,speedNative:speed.tick(),gameTempo16:lowerProfile.animation.gameTempo16})),
   readGroundPostContext:q(()=>({channelPresent:!!c.s5runtimeShieldLowerPresentationSnapshot,channel30Ticks:Math.trunc((getAvatar().playbackTimes().lower||0)*4800)>>>0,actorMode114:actorMode()})),
   emitAnimation:q(setLower),emitGroundPostEvent:q(event=>record('ground-post-event',{event})),readAirFrame:q(()=>inputFrame()),
   actor70:q(delta=>applyNativePushCollision(c,delta,{actorPolicy:{horizontalBlocked:false,horizontalMultiplier:1,maxDistance:1000}})),
   writeLaunchF0:q(value=>{c.velocity.x=value[0]*SCN_SCENE_SCALE;c.velocity.y=value[1]*SCN_SCENE_SCALE;c.velocity.z=value[2]*SCN_SCENE_SCALE;c.grounded=false;record('launch-f0',{value});}),
   setActorMode:q(value=>record('source-mode-request',{value})),airPhase1Effects:q(event=>record('air-effects-unverified',{event})),airPhase3Effects:q(event=>record('air-effects-unverified',{event})),
   readActorSlot190:q(()=>1),readActorSlot194:q(()=>0),readActorSlot180:q(()=>false),readActorSlot3c:q(()=>false),requestActorSlot178:q(()=>record('special-request-unverified')),
   nativeChildInput:q(event=>record('native-child-input',{event})),switchChild:q(next=>lower.switchChild(next)),
  }}));
  lower=c.createS5RuntimeShieldLowerPorts({sets:{0:lowerSets[0],1:lowerSets[1]},readNativeContext:q(()=>({actorSlot3c:false,actorSlot180:false,actorMode114:actorMode()}))});
 }
 function consume(){
  for(const frame of c.consumeS5RuntimeSkillLifecycleCommands()){presentation.consume(frame,{actorId,itemKey:c.s5runtimeSkill.itemKey,ownerSlot1c4:bodyContext().actorSlot1c4});record('component-command',{reason:frame.reason,commands:frame.commands});}
  // The body graph consumes poses; queued channel commands are evidence only.
  for(const command of c.consumeS5RuntimeShieldBodyCommands())record('body-pose-command',{command});
 }
 function enter(request){
  makeLower();const duration=selectS5RuntimeShieldBodyDuration(createS5RuntimeShieldDurationProfile({sex:c.sex,carrierSourceSha256:carriers[c.sex],provenance:GAME_SHIELD_POLICY.source}),{clip:'I0003'});
  const names=['baseEnter','initializeBodyFields','createBodyAudio','baseLeave','destroyBodyAudio','restoreEquipmentModels'];
  const lifecyclePorts={provenance:Object.fromEntries(names.map(name=>[name,GAME_SHIELD_POLICY.source]))};
  for(const name of names)lifecyclePorts[name]=()=>{record('body-lifecycle',{name});return name==='createBodyAudio'?null:undefined;};
  const entered=c.enterS5RuntimeShieldBodyState(request,{lowerAdapter:lower,weaponType:c.weapon==='ironboots'?43:0,savedReturnStateId:5,nativeBeginAnimationDurationMs:duration.durationMs,bodyActivationDurationMs:250,bodyCompletionDurationMs:500,actorPositionNative:nativePosition(),lifecyclePorts,provenance:GAME_SHIELD_POLICY,
   physicsTick:dtMs=>{c.velocity.y=Math.max(-TUNING.terminal,c.velocity.y-TUNING.gravity*dtMs/1000);c.move(dtMs/1000);},
   ports:{baseTick:dtMs=>c.recoverEnergy(dtMs/1000),readFrameContext:bodyContext,activationTick:dtMs=>advanceS5RuntimeShieldActivation(c.s5runtimeSkill.shield,dtMs,{nativeContext:bodyContext()}),componentBegin:()=>c.activateS5RuntimeShieldBodyComponent(bodyContext())},afterCurrentStateTick:dtMs=>c.advanceS5RuntimeShieldComponent(dtMs,bodyContext())});
  if(entered.accepted){
   // The outgoing S5 walking command used velocity.x/z; discard it once.
   // Subsequent physical impulses remain distinct from lower actor70 writes.
   c.velocity.x=0;c.velocity.z=0;
   // Source ground Enter phase9 issues no animation; preserve explicit neutral
   // lower until the first selected command, rather than duplicating body pose.
   setLower({child:0,animationIndex:0,method:'B77CB0'});
   c.setS5RuntimeShieldBodyPresentationPolicy({kind:'s5-explicit-adaptation',id:GAME_SHIELD_POLICY.id,maskPolicy:'s5-avatar-upper-with-explicit-lower',clockPolicy:'s5-animation-player',playbackSpeed:1,fadeSeconds:{begin:300/4800,end:1000/4800}});
  }
  record('body-entry',{accepted:entered.accepted,bodyEntrySerial:c.s5runtimeShieldBodyState?.bodyEntrySerial});return entered;
 }
 function press(){
  if(actorLocked()||c.attack||c.dash>0||c.wallAction||c.fireball||(!c.s5runtimeShieldBodyState&&c.weaponRuntimeBusy))return {accepted:false,reason:'s5-actor-busy'};
  const result=c.requestS5RuntimeShieldInput(20,bodyContext());
  if(result.bodyRequest)return enter(result.bodyRequest);
  if(result.bodyReturnRequest){if(result.componentEnd)c.advanceS5RuntimeShieldComponent(0,{...bodyContext(),componentEnd:true});return c.returnS5RuntimeShieldBodyState(result.bodyReturnRequest);}
  return result;
 }
 return Object.freeze({
  validateLoadout,
  equip(itemKey){if(disposed||![null,3050001,3050002].includes(itemKey))return {accepted:false,reason:'unsupported-game-skill'};
   if(itemKey!==null){const validation=validateLoadout();if(!validation.accepted)return validation;
    if(!c.s5runtimeShieldActorProfile)c.configureS5RuntimeShieldActorProfile({actorId,sourceClass:'13C1C14',provenance:GAME_SHIELD_POLICY.source});}
   const result=c.equipS5RuntimeSkill(itemKey);consume();record('equipment',{itemKey,accepted:result.accepted});return result;},
  queueInput(code){if([20,21].includes(code))pending.push(code);},
  beforeTick(value={}){input=value;if(Number.isFinite(input.facing))c.facing=input.facing;for(const code of pending.splice(0)){if(code===20){const result=press();if(!result.accepted)onNotification(result.reason);}}
   if(c.s5runtimeShieldBodyState){if(input.jump)lower.input(27);else if(!c.grounded&&lower.snapshot().selectedChild===0)lower.switchChild(1);}
   consume();
  },
  afterTick(){if(actorLocked()&&(c.s5runtimeShieldBodyState||c.s5runtimeSkill.shield.active)){c.interruptS5RuntimeSkill();record('s5-actor-interruption');}consume();},
  interrupt(reason){pending=[];c.interruptS5RuntimeSkill();consume();record('s5-host-interruption',{reason});},
  snapshot(){return {policy:GAME_SHIELD_POLICY,itemKey:c.s5runtimeSkill.itemKey,active:c.s5runtimeSkill.shield.active,bodyEntrySerial:c.s5runtimeShieldBodyState?.bodyEntrySerial??null,bodyPhase:c.s5runtimeShieldBodyState?.tick.pose.phase??null,lower:lower?.snapshot()??null,children:lowerSets.map(set=>set.snapshot()),lastAnimation,energy:c.energy,spRegenerationEnabled:c.s5runtimeSkillSpRegenerationEnabled,ledger:[...ledger],speed:speed.snapshot(),nativeReady:false,nativeCompared:false};},
  dispose(){if(disposed)return;c.interruptS5RuntimeSkill();consume();presentation.dispose();disposed=true;},
 });
}
