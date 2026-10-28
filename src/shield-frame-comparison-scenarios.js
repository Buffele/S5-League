import {createShieldFrameComparisonHarness} from './shield-frame-comparison.js';
import {NATIVE_FRAME_TAIL_STAGES} from './native-frame-tail-diagnostic.js';
import {createS5RuntimeBindCondition,applyS5RuntimeBindCondition} from './s5runtime-skill-bind-kernel.js';

// Controlled S5 fixtures only. Numeric actor/body/clock predicates below are
// explicit diagnostic assumptions, never an observed native profile.
export const SHIELD_FRAME_SCENARIOS=Object.freeze([3050001,3050002].flatMap(itemKey=>['male','female'].flatMap(sex=>['activation-body-input-return-free','bind-expiry-wall-floor','energy-exhaustion-floor'].map(kind=>({id:`shield-${itemKey}-${sex}-${kind}`,itemKey,sex,kind})))));
const unverified=source=>({kind:'explicit-no-op-unverified',source});
export function prepareShieldFrameScenario(scenario){
 if(!SHIELD_FRAME_SCENARIOS.some(s=>s.id===scenario?.id))throw new Error('Known controlled Shield diagnostic scenario required');
 const floor={minX:-100,maxX:100,minY:-1,maxY:0,minZ:-100,maxZ:100},withBind=scenario.kind==='bind-expiry-wall-floor',exhaustion=scenario.kind==='energy-exhaustion-floor';
 const world={spawn:{x:0,y:scenario.kind.endsWith('free')?2:.1,z:0},colliders:[floor,...(withBind?[{minX:1,maxX:1.1,minY:0,maxY:10,minZ:-10,maxZ:10}]:[])]};
 const actorProfile={schema:'comparison-actor-mp-profile-v1',id:`s5-fixture-${scenario.sex}-${exhaustion?'cap1':'cap100'}-v1`,version:1,sex:scenario.sex,weapon:'dagger',currentMp:exhaustion?1:100,maximumMp:exhaustion?1:100};
 const conditions=[];if(withBind){const bind=createS5RuntimeBindCondition({id:'fixture-bind',ownerId:actorProfile.id,sourceId:'fixture-source',durationMs:100,packetFlag:true});applyS5RuntimeBindCondition(bind,{nativeContext:{enabled:true,conditionOwnerConfirmed:true}});conditions.push(bind);}
 const logicalVelocityNative=withBind||exhaustion?{x:1000,y:-500,z:0}:{x:100,y:-50,z:0};
 const nc={enabled:true,actorByte6c:0,actorSlot40:false,nativeSpWritePermitted:true,eligibilityConfirmed:true,dispatcherEligibilityConfirmed:true,actorSlot3c:false,slot0ActionType:4};
 const noOp=name=>({tick:()=>null,provenance:unverified('Controlled fixture omits '+name+'; not a source implementation')});
 const lifecycleNames=['baseEnter','initializeBodyFields','lowerEnter','createBodyAudio','baseLeave','lowerLeave','destroyBodyAudio','restoreEquipmentModels'];
 const lifecyclePorts={...Object.fromEntries(lifecycleNames.map(name=>[name,()=>null])),provenance:Object.fromEntries(lifecycleNames.map(name=>[name,'Explicit S5 fixture omission; no native audio/model/base/lower consumer for '+name]))};
 const tailCallbacks=Object.fromEntries(NATIVE_FRAME_TAIL_STAGES.filter(s=>!['mpRecovery','shield','conditions'].includes(s.id)).map(s=>[s.id,noOp(s.id)]));
 const harness=createShieldFrameComparisonHarness({world,itemKey:scenario.itemKey,actorProfile,
  mpRecoveryFields:{regenerationEnabled:true,rawRecoveryRate:10,gameTempoFlat1:0,gameTempoPercent1:0},
  readMpNativeContext:({actor})=>({enabled:true,currentStateExists:true,conditionType400:false,conditionQuery200:false,native527650Result:false,native52c2f0Result:false,actorSlotD4:true,currentStateSlotB0:true,shieldActive:actor.s5runtimeSkill.shield.active,nativeItemTypes:[]}),
  readComponentNativeContext:()=>({...nc}),
  readBodyRawContext:()=>({...nc,weaponType:0,bodyActivationTimerBlocked:false,bodyCompletionTimerBlocked:false,bodyAnimationTimerBlocked:false}),
  bodyProfile:{savedReturnStateId:6,weaponType:0,nativeBeginAnimationDurationMs:400,bodyCompletionDurationMs:500,bodyActivationDurationMs:250,actorPositionNative:[world.spawn.x,world.spawn.y,world.spawn.z].map(v=>Math.fround(v/.006))},lifecyclePorts,
  physics:{provenance:{kind:'external-unverified',source:'Controlled constant native-unit logical velocity; S5 solver bridge, gravity/native feedback unported'},tick:(dtMs,{actor70})=>actor70([logicalVelocityNative.x,logicalVelocityNative.y,logicalVelocityNative.z].map(v=>v*dtMs*.001))},
  baseBody:noOp('body5617F0'),lowerEnter:noOp('lower62A270'),lowerTick:noOp('lower62A330'),otherCurrentState:noOp('returned state full Tick'),intermediates:noOp('global intermediate callbacks'),tailCallbacks,conditions,
  readConditionNativeContext:()=>({enabled:true,conditionOwnerConfirmed:true}),actorPolicy:{horizontalBlocked:false,horizontalMultiplier:1,maxDistance:1000},readLogicalVelocityNative:()=>logicalVelocityNative});
 return {harness,entryContext:{...nc,currentStateExists:true,actorStateId:6},bodyInputContext:{...nc,currentStateExists:true,actorStateId:34,bodySavedReturnStateId:6},actorProfile,world};
}
export function runShieldFrameScenario(scenario,{tickDeltasMs=Array(80).fill(10)}={}){
 const {harness,entryContext,bodyInputContext}=prepareShieldFrameScenario(scenario);
 const entry=harness.requestEntry(20,entryContext);if(!entry.installed?.accepted)throw new Error('Controlled body entry was not committed');
 let elapsedMs=0,endedByInput=false;const inputSchedule=[];
 for(const dtMs of tickDeltasMs){
  const nativeInputCodes=elapsedMs===0?[20]:[];
  if(!endedByInput&&scenario.kind!=='energy-exhaustion-floor'&&elapsedMs>=500){harness.endFromBodyInput(20,bodyInputContext);endedByInput=true;nativeInputCodes.push(20);}
  inputSchedule.push({t:elapsedMs/1000,dtMs,nativeInputCodes});
  harness.step(dtMs);elapsedMs+=dtMs;
 }
 const report=harness.report();return {...report,scenario:scenario.id,dataKind:'s5-controlled-diagnostic-fixture',clockOrigin:{event:'explicit-operation-input-start',measured:false,sourceTimeSeconds:0},inputSchedule,tickDeltasMs:[...tickDeltasMs],entry,sourceActorProfileMeasured:false,sourceBodyTimerMeasured:false,limits:[...report.limits,'Fixture raw predicates/rates/body timings must be replaced by authenticated actor source/live profiles before native comparison','Input20 here is an explicit diagnostic request, not proof of native key delivery','Returned body input state request is left for the following inactive-component Tick; native commit timing is not certified']};
}
export function checkShieldFrameScenario(report){
 const checks=[],add=(key,passed)=>checks.push({key,passed,scope:'controlled S5 diagnostic only'}),begin=report.commands.filter(c=>c.phase==='body-component-begin');
 let cumulative=0,expectedBeginTick=-1;for(const [i,dt] of report.tickDeltasMs.entries()){cumulative+=dt;if(cumulative>250){expectedBeginTick=i;break;}}
 add('committed-body-entry',report.entry.installed?.accepted===true);
 add('single-strict-activation-crossing',begin.length===1&&begin[0].tickIndex===expectedBeginTick&&!!begin[0].shieldObjectRequest);
 add('actor-current-cap-profile-retained',report.samples.every(s=>s.maximumMp===report.actorProfile.maximumMp&&s.energy>=0&&s.energy<=s.maximumMp));
 add('full-body-return-and-component-end',report.samples.at(-1).bodyStateId===null&&report.samples.at(-1).shieldActive===false);
 add('solver-no-floor-traversal',report.samples.every(s=>s.position.y>=-1e-6));
 const expectedOrder=NATIVE_FRAME_TAIL_STAGES.map(stage=>stage.id);
 add('tail-order-retained',report.samples.slice(1).every(s=>JSON.stringify(s.tailStageOrder)===JSON.stringify(expectedOrder)));
 add('blocked-bind-xz-until-expiry-tick',report.samples.slice(1).every((s,i)=>!report.samples[i].bindActive||(s.position.x===report.samples[i].position.x&&s.position.z===report.samples[i].position.z)));
 return {checks,diagnosticChecksPassed:checks.every(c=>c.passed),comparisonPassed:null,nativeReady:false};
}
