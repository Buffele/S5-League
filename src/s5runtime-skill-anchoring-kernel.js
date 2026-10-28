import {s5runtimeSkillDefinition} from './s5runtime-skill-data.js';
const f=Math.fround,keys=new Set([3010001,3010002]);
const bodyVtable=0x13b6884;
function definition(itemKey){if(!keys.has(itemKey))throw Error('Unsupported Anchoring item');const skill=s5runtimeSkillDefinition(itemKey);if(Number(skill.action.resources.type)!==0)throw Error('Anchoring source type mismatch');return skill;}
function finiteFloat(value,label){if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw Error('Finite float32 '+label+' required');return f(value);}
function gate(nc){return nc?.enabled===true&&nc.bodyVtable===bodyVtable&&typeof nc.actorSlot3c==='boolean';}
function result(extra){return {...extra,nativeReady:false,nativeCompared:false};}

// 6399A0: SSE subtract/multiply/subtract followed by clamp to zero.
// Flat/percent are raw outputs of attribute15A after its native query, not UI percentages.
export function s5runtimeAnchoringRequiredSp({itemKey,attribute15A={}}={}){
 const skill=definition(itemKey),base=finiteFloat(attribute15A.itemRequired??Number(skill.action.ability.required_mp),'required SP');
 const flat=finiteFloat(attribute15A.flat??0,'attribute15A flat'),percent=finiteFloat(attribute15A.percent??0,'attribute15A percent');
 const value=f(f(base-flat)-f(base*percent));if(!Number.isFinite(value))throw Error('Anchoring required SP arithmetic overflow');return Math.max(0,value);
}
export function evaluateS5RuntimeAnchoringEligibility({itemKey,energy,nativeContext}={}){
 definition(itemKey);
 if(!gate(nativeContext)||typeof nativeContext.selectedActionPresent!=='boolean')return result({eligible:false,reason:'explicit-native-anchoring-identity-and-action-context-required'});
 if(!nativeContext.selectedActionPresent)return result({eligible:false,reason:'selected-action-absent'});
 if(nativeContext.actorSlot3c)return result({eligible:true,reason:'source-slot3c-bypass'});
 if(typeof nativeContext.actorSlot224!=='boolean'||typeof nativeContext.actorSlot164Type3!=='boolean')return result({eligible:false,reason:'raw-slot224-and-slot164-type3-required'});
 if(!nativeContext.actorSlot224)return result({eligible:false,reason:'source-slot224-refused'});
 if(nativeContext.actorSlot164Type3)return result({eligible:false,reason:'source-slot164-type3-active'});
 const mp=finiteFloat(energy,'current MP');if(mp<0)throw Error('Nonnegative MP required');
 const requiredSp=s5runtimeAnchoringRequiredSp({itemKey,attribute15A:nativeContext.attribute15A});
 return result({eligible:mp>=requiredSp,requiredSp,reason:mp>=requiredSp?'source-eligibility-satisfied':'insufficient-energy'});
}

// Caller invokes once at a REAL Enter or primary-phase2 commit. This pure
// calculation does not install body32, infer a valid target or spend on keydown.
export function s5runtimeAnchoringCostWrite({itemKey,energy,stage,nativeContext}={}){
 definition(itemKey);if(!['body-enter','primary-phase2'].includes(stage))throw Error('Explicit Anchoring cost stage required');
 const mp=finiteFloat(energy,'current MP');if(mp<0)throw Error('Nonnegative MP required');
 if(!gate(nativeContext))return result({accepted:false,energy:mp,reason:'explicit-native-anchoring-identity-required',commands:{}});
 if(nativeContext.actorSlot3c)return result({accepted:true,energy:mp,cost:0,writeApplied:false,reason:'source-slot3c-skips-cost',commands:{}});
 if(typeof nativeContext.stateProperty4!=='boolean')return result({accepted:false,energy:mp,reason:'raw-state-property4-required',commands:{}});
 if(nativeContext.stateProperty4)return result({accepted:true,energy:mp,cost:0,writeApplied:false,reason:'source-state-property4-skips-cost',commands:{}});
 if(stage==='primary-phase2'){
  if(nativeContext.primaryPhase2CommitConfirmed!==true||typeof nativeContext.rawBody1a0!=='boolean')return result({accepted:false,energy:mp,reason:'real-phase2-commit-and-raw-body1a0-required',commands:{}});
  if(!nativeContext.rawBody1a0)return result({accepted:true,energy:mp,cost:0,writeApplied:false,reason:'source-body1a0-skips-phase2-cost',commands:{}});
 }
 if(typeof nativeContext.nativeSpWritePermitted!=='boolean')return result({accepted:false,energy:mp,reason:'raw-native-sp-write-predicate-required',commands:{}});
 const requiredSp=s5runtimeAnchoringRequiredSp({itemKey,attribute15A:nativeContext.attribute15A});
 const cost=f(requiredSp/f(2)); // authenticated constant_info float59=2.0
 const next=Math.max(0,f(mp-cost)),writeApplied=cost!==0&&nativeContext.nativeSpWritePermitted;
 return result({accepted:true,energy:writeApplied?next:mp,requiredSp,cost,writeApplied,reason:writeApplied?'source-half-cost-write':'source-write-restored-or-zero',commands:writeApplied?{nativeMpWrite:next}:{}});
}

// 639BF0 input; source phase changes are requests, never direct movement.
export function s5runtimeAnchoringInputRequests({primaryPhase,nativeInputCode,nativeContext}={}){
 if(!Number.isInteger(primaryPhase)||primaryPhase<0||primaryPhase>255||!Number.isInteger(nativeInputCode))throw Error('Explicit raw Anchoring phase/input required');
 if(!gate(nativeContext))return result({accepted:false,reason:'explicit-native-anchoring-identity-required',commands:{}});
 if(nativeContext.actorSlot3c)return result({accepted:true,forwardToBase:false,commands:{}});
 const commands={};
 if(primaryPhase===1&&[21,23].includes(nativeInputCode))commands.primaryPhaseRequest=2;
 else if([3,4].includes(primaryPhase)&&[15,4,9].includes(nativeInputCode)){commands.primaryPhaseRequest=5;commands.secondaryPhaseRequest=5;}
 return result({accepted:true,forwardToBase:true,nativeBaseInputFunction:'501D40',commands});
}
export function encodeS5RuntimeAnchoringState({primaryPhase,secondaryPhase,rawBody1a0}={}){
 if(![primaryPhase,secondaryPhase].every(v=>Number.isInteger(v)&&v>=0&&v<=255)||typeof rawBody1a0!=='boolean')throw Error('Raw Anchoring state bytes required');
 return ((primaryPhase<<24)|(secondaryPhase<<16)|(rawBody1a0?1:0))>>>0;
}
export function decodeS5RuntimeAnchoringState(value){
 if(!Number.isInteger(value)||value<0||value>0xffffffff)throw Error('Packed Anchoring uint32 required');
 return {primaryPhase:(value>>>24)&255,secondaryPhase:(value>>>16)&255,rawBody1a0:(value&0xffff)!==0};
}
export function createS5RuntimeAnchoringAimTimer({itemKey}={}){
 const skill=definition(itemKey),durationMs=Math.trunc(f(f(Number(skill.action.Float.Float_Value1))*f(1000)));
 if(!Number.isInteger(durationMs)||durationMs<0||durationMs>0xffffffff)throw Error('Invalid source Anchoring timer duration');
 return {counter:0,durationMs,elapsedMs:0,blocked:false};
}
// 639DF9..639E78: equality continues aim; only strictly exceeded requests phase2.
export function advanceS5RuntimeAnchoringAimTimer(timer,{dtMs,primaryPhase,nativeContext}={}){
 if(!Number.isInteger(dtMs)||dtMs<0||dtMs>0xffffffff||!Number.isInteger(primaryPhase))throw Error('Explicit raw phase and uint32 frame time required');
 if(!timer||![timer.counter,timer.durationMs,timer.elapsedMs].every(v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff)||typeof timer.blocked!=='boolean')throw Error('Raw Anchoring timer required');
 if(!gate(nativeContext))return result({accepted:false,shouldEvaluateAim:false,commands:{}});
 if(nativeContext.actorSlot3c||primaryPhase!==1)return result({accepted:true,shouldEvaluateAim:false,commands:{}});
 if(timer.blocked)return result({accepted:true,shouldEvaluateAim:true,commands:{}});
 timer.counter=(timer.counter+1)>>>0;timer.elapsedMs=(timer.elapsedMs+dtMs)>>>0;
 const expired=timer.elapsedMs>timer.durationMs;
 return result({accepted:true,shouldEvaluateAim:!expired,commands:expired?{primaryPhaseRequest:2}:{}});
}
function vector3(values,label){if(!values||values.length!==3)throw Error(label+' vector3 required');return Array.from(values,v=>finiteFloat(v,label));}
// 639E82..63A03E fragment only. Actor+74 is NOT a camera position.
// Input camera vector is the independently sourced camera+1FC vector, used raw.
export function s5runtimeAnchoringAimTargetFragment({itemKey,actorSlot7cVector,actorSlot6cFloat,globalAimPoint,camera1fcVector,nativeRange}={}){
 const skill=definition(itemKey),origin=vector3(actorSlot7cVector,'actorSlot7c'),point=vector3(globalAimPoint,'globalAimPoint'),camera=vector3(camera1fcVector,'camera1fc');
 origin[1]=f(origin[1]+f(finiteFloat(actorSlot6cFloat,'actorSlot6c')*f(.5))); // constant_float33
 const range=finiteFloat(nativeRange??Number(skill.action.Float.Float_Value6),'body184 range');if(range<0)throw Error('Nonnegative native range required');
 const delta=point.map((v,i)=>f(v-origin[i]));
 const square=f(f(f(delta[0]*delta[0])+f(delta[1]*delta[1]))+f(delta[2]*delta[2]));
 const distance=f(Math.sqrt(square));if(!Number.isFinite(distance))throw Error('Anchoring distance overflow');
 const rawBody1a0=distance<=range,excess=f(distance-range);
 const target=rawBody1a0?[...point]:point.map((v,i)=>f(v-f(camera[i]*excess)));
 if(!target.every(Number.isFinite))throw Error('Anchoring target overflow');
 return result({sourceAdjustedOrigin:origin,target,distance,range,rawBody1a0,fragment:'639E82..63A03E',finalAnchorTargetVerified:false,cameraDirectionNormalized:false,producerBindingVerified:false});
}

// Primary setter points only: phase1 63BF30..63BF97; phase2 63C2FE..63C529.
// Phase2 sets 1A0 only for STRICTLY inside range and otherwise preserves it.
// This differs from phase1 Tick's <= predicate; no inferred failed-target reset.
export function s5runtimeAnchoringPhasePointWrites({itemKey,primaryPhase,nativeContext,actorSlot7cVector,actorSlot7cWriteVector,actorSlot6cFloat,globalAimPoint,camera1fcVector,nativeRange}={}){
 definition(itemKey);if(![1,2].includes(primaryPhase))throw Error('Source primary phase1/2 point preparation required');
 if(!gate(nativeContext)||nativeContext.primaryEntryEffectsConfirmed!==true||typeof nativeContext.rawBody1a0!=='boolean')return result({accepted:false,commands:{},reason:'actual-primary-entry-and-raw-body-bit-required'});
 if(nativeContext.actorSlot3c)return result({accepted:true,commands:{},reason:'source-slot3c-skips-local-point-writes'});
 //Source calls Slot7C again at63BF48/63C4DA AFTER calculating target.
 //The write snapshot must be supplied independently; no stability inferred.
 const writeOrigin=vector3(actorSlot7cWriteVector,'second actorSlot7c write snapshot');
 const prepared=s5runtimeAnchoringAimTargetFragment({itemKey,actorSlot7cVector,actorSlot6cFloat,globalAimPoint,camera1fcVector,nativeRange});
 const rawBody1a0=primaryPhase===2&&prepared.distance<prepared.range?true:nativeContext.rawBody1a0;
 return result({accepted:true,commands:{actor2d8Vector:writeOrigin,actor2e4Vector:prepared.target,
  ...(primaryPhase===2&&prepared.distance<prepared.range?{rawBody1a0:true}:{})},rawBody1a0,
  pointWriterFragmentVerified:true,actorSlot7cReadConsistencyVerified:false,globalAimProducerVerified:false,secondaryPointUpdatesVerified:false,finalAnchorTargetVerified:false});
}

//97DF40(0) gates actor vslot1F8 prepass via97DFD0/51F359; it does NOT
// disable body actor70 movement. Each local phase branch also zeroes F0.
export function s5runtimeAnchoringPrimaryPhysicsRequests({primaryPhase,nativeContext}={}){
 if(!Number.isInteger(primaryPhase)||primaryPhase<0||primaryPhase>5)throw Error('Source primary phase0..5 required');
 if(!gate(nativeContext)||nativeContext.primaryEntryEffectsConfirmed!==true)return result({accepted:false,commands:{},reason:'actual-primary-entry-effects-required'});
 if(nativeContext.actorSlot3c)return result({accepted:true,commands:{}});
 //63C58F raw1A0false jumps DIRECTLY to63C8FF, which still executes
 //97DF40(0) and F0zero. The raw bit gates the earlier cost, not physics.
 return result({accepted:true,commands:{actorPhysicsPrepassEnabled:false,actorVelocityNative:[0,0,0]},actor70EnabledUnchanged:true});
}
//Leave6396D9 first requests primary0 and secondary0, then removes model;
// only AFTER those operations639717 enables prepass and639728 sets raw114=2.
export function s5runtimeAnchoringLeavePhysicsRequests({nativeContext}={}){
 if(!gate(nativeContext)||nativeContext.bodyLeaveConfirmed!==true)return result({accepted:false,commands:{},reason:'actual-body-leave-required'});
 return result({accepted:true,commands:nativeContext.actorSlot3c?{}:{actorPhysicsPrepassEnabled:true,rawActor114:2},
  requiredPriorOperations:['primaryPhaseReset0','secondaryPhaseReset0','helper63F2A0'],rawActor114SemanticVerified:false});
}
