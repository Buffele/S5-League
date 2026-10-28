// Offline diagnostic harness: actual Controller body route and S5 solver,
// sourced skill kernels, explicit unported/native-context callbacks.
import {Controller} from './controller.js';
import {applyNativePushCollision} from './native-push-collision.js';
import {normalizeComparisonActorMpProfile} from './comparison-actor-mp-profile.js';
import {createS5RuntimeNativeMpProfile,setS5RuntimeNativeMpRegeneration} from './s5runtime-skill-native-mp.js';
import {advanceS5RuntimeShieldActivation} from './s5runtime-skill-shield-kernel.js';
import {composeS5RuntimeBindActorPolicy,s5runtimeBindNativeInputVector,queryS5RuntimeBindNativeConditions} from './s5runtime-skill-bind-kernel.js';
import {NATIVE_FRAME_TAIL_STAGES,validateNativeFrameTailDiagnostic,runNativeFrameTailDiagnostic,nativeMpRecoveryStage,nativeBindExpiryStage} from './native-frame-tail-diagnostic.js';
import {realizedFeetVelocities} from './movement-comparison.js';

const requiredPort=(port,name)=>{if(typeof port?.tick!=='function'||typeof port.provenance?.source!=='string'||!port.provenance.source||!['source-port','explicit-no-op-unverified','external-unverified'].includes(port.provenance.kind))throw new TypeError('Explicit callback/provenance required: '+name);};
export function createShieldFrameComparisonHarness(options){
 const {world,itemKey,actorProfile:rawProfile,mpRecoveryFields,readMpNativeContext,readComponentNativeContext,readBodyRawContext,bodyProfile,lifecyclePorts,physics,baseBody,lowerEnter,lowerTick,otherCurrentState,intermediates,tailCallbacks,conditions,readConditionNativeContext,actorPolicy,readLogicalVelocityNative}=options??{};
 const actorProfile=normalizeComparisonActorMpProfile(rawProfile);
 if(![3050001,3050002].includes(itemKey)||!world||!Array.isArray(conditions)||typeof readMpNativeContext!=='function'||typeof readComponentNativeContext!=='function'||typeof readBodyRawContext!=='function'||typeof readConditionNativeContext!=='function'||typeof readLogicalVelocityNative!=='function')throw new TypeError('Complete explicit Shield/actor/context profile required');
 for(const [name,port] of Object.entries({physics,baseBody,lowerEnter,lowerTick,otherCurrentState,intermediates}))requiredPort(port,name);
 for(const name of ['savedReturnStateId','weaponType','nativeBeginAnimationDurationMs','bodyCompletionDurationMs','bodyActivationDurationMs'])if(!Number.isInteger(bodyProfile?.[name])||bodyProfile[name]<0||bodyProfile[name]>0xffffffff)throw new TypeError('Explicit source/diagnostic body profile required: '+name);
 if(!Array.isArray(bodyProfile.actorPositionNative)||bodyProfile.actorPositionNative.length!==3||!bodyProfile.actorPositionNative.every(Number.isFinite))throw new TypeError('Explicit body audio position in native units required');
 for(const name of ['baseEnter','initializeBodyFields','lowerEnter','createBodyAudio','baseLeave','lowerLeave','destroyBodyAudio','restoreEquipmentModels'])if(typeof lifecyclePorts?.[name]!=='function'||!lifecyclePorts.provenance?.[name])throw new TypeError('Explicit lifecycle port/provenance required: '+name);
 const actor=new Controller(world,{sex:actorProfile.sex,skill:itemKey});actor.setComparisonActorMpDiagnosticProfile(actorProfile);
 const mpProfile=createS5RuntimeNativeMpProfile({...mpRecoveryFields,actorId:actorProfile.id,currentMp:actorProfile.currentMp,maximumMp:actorProfile.maximumMp});
 actor.s5runtimeSkillSpRegenerationEnabled=mpProfile.regenerationEnabled;
 const shield=actor.s5runtimeSkill.shield,samples=[],commands=[],inputEvents=[],contextRecords=[],controllerLifecycleRecords=[],initialMpRecoveryProfile={...mpProfile};let elapsedMs=0,tickIndex=0,lastTail=null,phaseEvents=[];
 const shared={actor,mpProfile,conditions,actor70:delta=>applyNativePushCollision(actor,delta,{actorPolicy:composeS5RuntimeBindActorPolicy(conditions,actorPolicy)}),bindInput:vector=>s5runtimeBindNativeInputVector(vector,conditions)};
 const readContext=(kind,reader,...args)=>{const value=reader(...args);contextRecords.push({tickIndex,kind,measured:false,value:structuredClone(value)});return value;};
 const componentContext=()=>readContext('component',readComponentNativeContext,shared);
 const consume=(result,reason)=>{
  if(result.energy!==undefined){mpProfile.currentMp=result.energy;actor.energy=result.energy;}
  if(typeof result.commands?.spRegenerationEnabled==='boolean')setS5RuntimeNativeMpRegeneration(mpProfile,result.commands.spRegenerationEnabled);
  // Controller already consumed facade commands/events exactly once. Only
  // mirror the source MP profile and capture a separate diagnostic record.
  commands.push({tickIndex,phase:reason,...result.commands});
 };
 const callbacks={...tailCallbacks};
 callbacks.mpRecovery=nativeMpRecoveryStage({profile:mpProfile,readNativeContext:()=>readContext('mp',readMpNativeContext,shared),consumeCommands:(value,result)=>{actor.energy=mpProfile.currentMp;commands.push({tickIndex,phase:'mp-prepass',...value,reason:result.reason});},provenance:{kind:'source-port',source:'competences/native-mp/source-proof.json; supplied raw predicates unverified'}});
 callbacks.shield={provenance:{kind:'source-port',source:'Controller.advanceS5RuntimeShieldComponent -> skill facade -> competences/shield/native/component_tick.c'},tick:dtMs=>{phaseEvents.push('shield-component');const result=actor.advanceS5RuntimeShieldComponent(dtMs,componentContext());consume(result,'shield-component');return result;}};
 callbacks.conditions=nativeBindExpiryStage({conditions,readNativeContext:condition=>readContext('condition',readConditionNativeContext,condition,shared),onConditionEnded:(condition,result)=>{conditions.splice(conditions.indexOf(condition),1);commands.push({tickIndex,phase:'conditions',...result.commands});},provenance:{kind:'source-port',source:'competences/bind/native/source-proof.json; explicit Bind-only collection'}});
 validateNativeFrameTailDiagnostic({enabled:true,dtMs:0,callbacks});
 const tail=dtMs=>{phaseEvents.push('mp-and-component-tail');lastTail=runNativeFrameTailDiagnostic({enabled:true,afterCurrentStateTick:true,dtMs,callbacks,shared});return lastTail;};
 const physicsTick=dtMs=>{phaseEvents.push('physics');return physics.tick(dtMs,shared);};
 const configuration={...bodyProfile,lifecyclePorts,provenance:{kind:'s5-explicit-adaptation',source:'Explicit diagnostic fixture body/timers/ports; actual native profiles remain required'},physicsTick,
  ports:{baseTick:dtMs=>{phaseEvents.push('body-base');return baseBody.tick(dtMs,shared);},readFrameContext:()=>readContext('body',readBodyRawContext,shared),
   activationTick:(dtMs,raw)=>{phaseEvents.push('body-activation');if(typeof raw.bodyActivationTimerBlocked!=='boolean')throw new TypeError('Explicit activation timer blocked flag required');if(raw.bodyActivationTimerBlocked)return {componentBegin:false};return advanceS5RuntimeShieldActivation(shield,dtMs,{nativeContext:{...componentContext(),actorSlot3c:raw.actorSlot3c,bodyActivationTimerBlocked:raw.bodyActivationTimerBlocked,bodyStateConfirmed:true}});},
   componentBegin:()=>{phaseEvents.push('component-begin');const result=actor.activateS5RuntimeShieldBodyComponent(componentContext());consume(result,'body-component-begin');return result;},
   lowerEnter:type=>lowerEnter.tick(type,shared),lowerTick:dtMs=>{phaseEvents.push('body-lower');return lowerTick.tick(dtMs,shared);}},afterCurrentStateTick:tail};
 const snapshot=(route='initial')=>({t:elapsedMs/1000,position:{...actor.position},energy:mpProfile.currentMp,maximumMp:mpProfile.maximumMp,regenerationEnabled:mpProfile.regenerationEnabled,shieldActive:shield.active,activationElapsedMs:shield.activationElapsedMs,activationAttempted:actor.s5runtimeShieldBodyState?.tick.activationAttempted??null,bodyStateId:actor.s5runtimeShieldBodyState?.actorStateId??null,bodyEntrySerial:actor.s5runtimeShieldBodyState?.bodyEntrySerial??null,bodyPhase:actor.s5runtimeShieldBodyState?.tick.pose.phase??null,bindActive:queryS5RuntimeBindNativeConditions(conditions,1),logicalVelocityNativeDiagnostic:{...readLogicalVelocityNative(shared)},controllerVelocity:{...actor.velocity},route,phases:[...phaseEvents],tailStageOrder:lastTail?.timeline.map(stage=>stage.id)??[],mpPrepassReason:lastTail?.timeline.find(stage=>stage.id==='mpRecovery')?.result.reason??null});
 samples.push(snapshot());
 return {actor,mpProfile,conditions,samples,commands,inputEvents,
  requestEntry(nativeInputCode,nativeContext){
   const result=actor.requestS5RuntimeShieldInput(nativeInputCode,nativeContext);inputEvents.push({tickIndex,kind:'explicit-native-code-request',nativeInputCode,nativeContext:structuredClone(nativeContext),measured:false,result});
   if(!result.bodyRequest)return result;
   const installed=actor.enterS5RuntimeShieldBodyState(result.bodyRequest,configuration);commands.push({tickIndex,phase:'body-entry',commands:actor.consumeS5RuntimeShieldBodyCommands()});return {...result,installed};
  },
  endFromBodyInput(nativeInputCode,nativeContext){
   const result=actor.requestS5RuntimeShieldInput(nativeInputCode,nativeContext);inputEvents.push({tickIndex,kind:'explicit-body-input-request',nativeInputCode,nativeContext:structuredClone(nativeContext),measured:false,result});
   if(result.componentEnd)consume(actor.advanceS5RuntimeShieldComponent(0,{...componentContext(),componentBegin:false,componentEnd:true}),'body-input-end-before-tick');
   // The caller owns scheduling the returned state request. This method never
   // silently invents native queue commit timing from an input request.
   return result;
  },
  step(dtMs){
   if(!Number.isInteger(dtMs)||dtMs<=0||dtMs>33)throw new RangeError('Exact engine Tick1..33ms required');
   validateNativeFrameTailDiagnostic({enabled:true,dtMs,callbacks});phaseEvents=[];
   const route=actor.s5runtimeShieldBodyState?'body34':'explicit-other-state';
   if(route==='explicit-other-state')actor.setNativeJumpDiagnosticContext({enabled:true,actorAcceptsPhysics:true,readPhysicalVelocityNative:()=>readLogicalVelocityNative(shared),physicsTick,betweenPhysicsAndState:dt=>intermediates.tick(dt,shared),intermediateProvenance:intermediates.provenance.kind==='source-port'?'source-port':'explicit-no-op-unverified',resolveCurrentStateTick:()=>dt=>{phaseEvents.push('other-current-state');otherCurrentState.tick(dt,shared);},tail:{enabled:true,callbacks,shared}});
   actor.step(dtMs/1000,{});elapsedMs+=dtMs;
   if(route==='explicit-other-state')lastTail=actor.nativeFrameTailDiagnosticFrame;
   commands.push({tickIndex,phase:'body-pose',commands:actor.consumeS5RuntimeShieldBodyCommands()});
   controllerLifecycleRecords.push({tickIndex,frames:actor.consumeS5RuntimeSkillLifecycleCommands()});
   const sample=snapshot(route);samples.push(sample);tickIndex++;return {sample,tail:lastTail,nativeReady:false};
  },
  report(){const velocities=realizedFeetVelocities(samples);return {schema:'shield-frame-diagnostic-v1',itemKey,actorProfile,world,bodyProfile,initialMpRecoveryProfile,contextRecords,controllerLifecycleRecords,nativeReady:false,nativeCompared:false,observedInBrowser:false,sourceOrderScope:'physics-callback -> actual body34 Tick -> MP prepass -> Shield component -> Bind subset expiry',lifecycleProvenance:{...lifecyclePorts.provenance},callbackProvenance:Object.fromEntries([...Object.entries({physics,baseBody,lowerEnter,lowerTick,otherCurrentState,intermediates}),...Object.entries(callbacks)].map(([key,port])=>[key,port.provenance])),samples:samples.map((s,i)=>({...s,velocity:velocities[i],velocityChannel:'realized-feet-difference'})),commands,inputEvents,limits:['Physics/base/lower and raw predicates are supplied, not native measured','Body timer values are explicit post-conversion diagnostic parameters, not raw animation ticks','Bind-only condition collection does not port other conditions','Body input return request scheduling remains caller-owned; no commit timing inferred','Actor global callbacks after conditions remain outside scope','Logical velocity diagnostic is an explicit callback channel, never Controller command velocity relabeled F0']};},
 };
}
