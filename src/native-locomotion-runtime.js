// Actual Lua locomotion banks and numerical Run selection, not fixture clips.
import {NATIVE_LOCOMOTION_SOURCE_FUNCTIONS,NATIVE_LOCOMOTION_GAME_TEMPOS} from './native-locomotion-source-data.js';
import {nativeRunDirectionalSelection,nativeRunSideCrossY} from './native-locomotion-state.js';
const f=Math.fround;
const scalar=(v,n)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw TypeError(`Explicit native float ${n} required`);return f(v);};
const uint=(v,n)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw TypeError(`Explicit uint32 ${n} required`);return v;};
const vector=v=>{if(!Array.isArray(v)||v.length!==3)throw TypeError('Explicit native XYZ required');return v.map(n=>scalar(n,'component'));};
const bool=(v,n)=>{if(typeof v!=='boolean')throw TypeError(`Explicit boolean ${n} required`);return v;};
const clone=v=>structuredClone(v);

export const NATIVE_LOCOMOTION_STATE_IDS=Object.freeze({normal:5,run:6,jump:8});
export const NATIVE_LOCOMOTION_SOURCE_DIRECTIONS=Object.freeze(['front','leftFront','left','leftBack','rightFront','right','rightBack','back']);

function sourceFunction(name){
 if(typeof name!=='string'||!name.trim())throw TypeError('Explicit source locomotion function required');
 const matches=Object.entries(NATIVE_LOCOMOTION_SOURCE_FUNCTIONS).filter(([key,value])=>key===name||value.name===name);
 if(matches.length!==1)throw Error(`Source locomotion function missing or ambiguous: ${name}`);
 const [key,definition]=matches[0];
 if(!definition.fullyExtracted)throw Error(`Unported source operations in ${key}: ${definition.remainingStatements.join('; ')}`);
 return {key,...definition};
}
function parameters(name){
 const definition=sourceFunction(name),records={};
 for(const operation of definition.operations){
  const index=uint(operation.parameterIndex,'parameter index'),args=operation.arguments;
  if(operation.method==='SetAnim'){
   if(args.length!==7||typeof args[0]!=='string'||!args[0]||args[0].includes('\0'))throw TypeError('Complete source SetAnim required');
   records[index]={name:args[0],durationOverrideMs:uint(args[1],'durationOverrideMs'),blendTicks:uint(args[2],'blendTicks'),nextFadePaddingTicks:uint(args[3],'nextFadePaddingTicks'),loop:bool(args[4],'loop'),speed:scalar(args[5],'speed'),reset:bool(args[6],'reset'),sourceFunction:definition.name,source:definition.source,sourceSha256:definition.sourceSha256};
  }else if(operation.method==='SetAniNameForHuman'){
   if(!records[index]||args.length!==3||args.slice(0,2).some(v=>typeof v!=='string'||!v)||args[2]!==true)throw Error('Unqualified source human animation policy');
   records[index].humanNames={male:args[0],female:args[1],sourceFlag:true};
  }else throw Error(`Unported source animation operation ${operation.method}`);
 }
 return {sourceKey:definition.key,records};
}

// The actual caller chooses weapon/skin functions; no weapon name heuristic
// or global last-definition override is applied. Every required rig clip is
// checked before the bank can be used for either sex.
export function createNativeLocomotionParameterBank({normalFunction,runFunction,clipsBySex}={}){
 const banks={normal:parameters(normalFunction),run:parameters(runFunction),jump:parameters('ActorState_Jump')};
 for(const sex of ['male','female']){
  const available=clipsBySex?.[sex];if(!Array.isArray(available)||available.some(name=>typeof name!=='string'))throw TypeError(`Explicit actual ${sex} clip inventory required`);
  const set=new Set(available);
  for(const [kind,bank]of Object.entries(banks))for(const [index,parameter]of Object.entries(bank.records)){
   const name=parameter.humanNames?.[sex]??parameter.name;if(!set.has(name))throw Error(`Required source ${kind}[${index}] ${name} missing on ${sex}`);
  }
 }
 if(!Object.hasOwn(banks.normal.records,0)||Array.from({length:16},(_,i)=>i).some(i=>!Object.hasOwn(banks.run.records,i))||Array.from({length:6},(_,i)=>i).some(i=>!Object.hasOwn(banks.jump.records,i)))throw Error('Complete source Normal/Run/Jump parameter banks required');
 return Object.freeze({
  read(kind,index,sex){if(!['male','female'].includes(sex))throw TypeError('Explicit actor sex required');const parameter=banks[kind]?.records[uint(index,'parameter index')];if(!parameter)throw Error(`Unqualified source ${kind} parameter ${index}`);return {...clone(parameter),name:parameter.humanNames?.[sex]??parameter.name};},
  snapshot:()=>clone(banks),qualification:{sourceDeclarationsVerified:true,bothRigInventoriesVerified:true,nativePlaybackCompared:false,nativeReady:false}
 });
}

export function nativeLocomotionGameTempo(profileId,index){
 if(typeof profileId!=='string'||!Object.hasOwn(NATIVE_LOCOMOTION_GAME_TEMPOS,profileId))throw Error('Explicit existing source GameTempo profile required');
 const profile=NATIVE_LOCOMOTION_GAME_TEMPOS[profileId];index=uint(index,'GameTempo index');
 if(!Object.hasOwn(profile.values,index))throw Error(`Source GameTempo index ${index} absent from ${profileId}`);
 return scalar(profile.values[index],`GameTempo${index}`);
}

//624B33..624D39 copies GameTempo27/30/31/32 to Jump property118 indices
//0..3 then resets the three timers. Pause bytes are intentionally preserved.
export function nativeJumpEntryGameTempo({profileId,state}={}){
 if(!state||typeof state!=='object')throw TypeError('Explicit owned current Jump state required');
 if(!state.parameters118||Array.isArray(state.parameters118)||typeof state.parameters118!=='object')throw TypeError('Explicit complete current Jump property118 table required');
 const duration=i=>uint(nativeLocomotionGameTempo(profileId,i),`GameTempo${i} duration`);
 const flight=duration(30),preparation=duration(31),landing=duration(32);
 const reset=(value,limit)=>{if(!value||typeof value!=='object')throw TypeError('Explicit current Jump timer required');return {count:0,limit,elapsed:0,paused:bool(value.paused,'timer pause')};};
 const force=nativeLocomotionGameTempo(profileId,27);
 return {...clone(state),jumpParameter0:force,parameters118:{...clone(state.parameters118),0:force,1:flight,2:preparation,3:landing},duration150:flight,duration160:preparation,duration170:landing,timer14c:reset(state.timer14c,flight),timer15c:reset(state.timer15c,preparation),timer16c:reset(state.timer16c,landing)};
}

//100B180 dot/length product/division, acos rounded to float32; NaN maps0.
// Host sqrt/acos fidelity remains separately gated, as in the shared triangle
// kernel.634D9F checks forward+input squared length before this helper so the
// opposite direction selects the literal pi rather than an invalid angle.
export function nativeLocomotionVectorAngle(a,b){
 a=vector(a);b=vector(b);const dot=(x,y)=>f(f(f(x[0]*y[0])+f(x[1]*y[1]))+f(x[2]*y[2]));
 const length=v=>f(Math.sqrt(dot(v,v))),ratio=f(dot(a,b)/f(length(a)*length(b))),angle=f(Math.acos(ratio));return Number.isNaN(angle)?0:angle;
}
export function nativeRunDirectionFromVectors({forward8c,actorVector,float3,float0,float24,float41,float39,pi14c90b4}={}){
 const forward=vector(forward8c),input=vector(actorVector),sum=forward.map((v,i)=>f(v+input[i]));
 const squared=f(f(f(sum[0]*sum[0])+f(sum[1]*sum[1]))+f(sum[2]*sum[2]));
 const opposite=scalar(float3,'Float3')>squared,angle=opposite?scalar(pi14c90b4,'literal pi'):nativeLocomotionVectorAngle(forward,input);
 const crossY=nativeRunSideCrossY({forward8c:forward,actorVector:input});
 return {...nativeRunDirectionalSelection({angle,crossY,float0,float24,float41,float39,pi14c90b4}),angle,crossY,opposite,nativeReady:false,x87BitwiseParityVerified:false};
}

//634D22..635218 and Run virtual54=635520. This is directly composable as
// the Run Tick selectDirection port. It reads the live source registry only
// on reached branches, selects source substate and executes its preface on a
// changed substate before storing the selected GameTempo rate.
export function createNativeRunDirectionSelector(p={}){
 const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor.name);
 const names=['readForward8c','readFloat','readGameTempo','readRunState','writeRunState','animationPreface'];
 if(typeof p.source!=='string'||!p.source.trim()||!names.every(n=>sync(p[n])))throw TypeError('Explicit synchronous source Run direction ports required');
 const call=(fn,...args)=>{const value=fn(...args);if(value&&typeof value.then==='function')throw TypeError('Source Run direction ports must complete synchronously');return value;};
 return (actorVector,api)=>{
  const input=vector(actorVector),forward=vector(call(p.readForward8c,api));
  //634D86 creates Float47 before constructing the sum; no Float47 value
  // getter is invoked. The numerical sum itself is full XYZ.
  const sum=forward.map((v,i)=>f(v+input[i])),squared=f(f(f(sum[0]*sum[0])+f(sum[1]*sum[1]))+f(sum[2]*sum[2]));
  const pi=scalar(p.pi14c90b4,'literal pi14C90B4'),opposite=scalar(call(p.readFloat,3,api),'Float3')>squared,angle=opposite?pi:nativeLocomotionVectorAngle(forward,input);
  let substate,rateIndex;
  const front=scalar(call(p.readFloat,24,api),'Float24');
  if(f(front*pi)>angle){substate=0;rateIndex=23;}
  else if(angle>=f(scalar(call(p.readFloat,41,api),'Float41')*pi)){substate=7;rateIndex=25;}
  else{
   const frontAgain=scalar(call(p.readFloat,24,api),'Float24'),step=scalar(call(p.readFloat,39,api),'Float39'),sectorFloat=f(f(angle-f(pi*frontAgain))/step);
   if(step===0||!Number.isFinite(sectorFloat)||sectorFloat>=2147483648||sectorFloat< -2147483648)throw TypeError('Unqualified source Run sector conversion');
   const sector=Math.trunc(sectorFloat),crossY=nativeRunSideCrossY({forward8c:forward,actorVector:input});
   substate=sector+(scalar(call(p.readFloat,0,api),'Float0')>crossY?1:4);rateIndex=24;
  }
  const state=call(p.readRunState,api),old=uint(state?.substate118,'Run substate118');
  if(substate<0||substate>=8)throw Error('Unqualified source Run directional substate');
  if(old!==substate){call(p.writeRunState,{...state,substate118:substate},api);call(p.animationPreface,api);}
  const storedRate=scalar(call(p.readGameTempo,rateIndex,api),'selected GameTempo rate');
  return {qualified:true,substate,rateIndex,opposite,angle,readRate:()=>storedRate,nativeReady:false,protectedStorageParityVerified:false};
 };
}

//518B20/518C90 operate on state handles, never raw state IDs.
// Restricted to the proved5/6/8 locomotion domain: actor state44/45-specific
// weapon guards cannot be silently omitted for other state types.
export function createNativeLocomotionLifecycle({source,enterState,exitState,resolveStateB9a850}={}){
 const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor.name);
 if(typeof source!=='string'||!source.trim()||![enterState,exitState,resolveStateB9a850].every(sync))throw TypeError('Explicit source lifecycle Enter/Exit/B9A850 consumers required');
 const call=(fn,...args)=>{const r=fn(...args);if(r&&typeof r.then==='function')throw TypeError('Native lifecycle must complete synchronously');return r;};
 function owned(api){const root=api.readStateContainer(),state=root.locomotion;if(!state||!state.records||typeof state.records!=='object')throw TypeError('Owned locomotion records required');return {root,state};}
 function record(state,handle){handle=uint(handle,'state handle');const value=state.records[handle];if(!value||value.handle!==handle||!Object.hasOwn(NATIVE_LOCOMOTION_STATE_IDS,value.kind)||value.stateId!==NATIVE_LOCOMOTION_STATE_IDS[value.kind])throw Error('Unqualified current source locomotion handle/type');return value;}
 function write(api,changes){const {root,state}=owned(api);api.writeStateContainer({...root,locomotion:{...state,...changes}});}
 return Object.freeze({
  request(handle,api){
   handle=uint(handle,'state target handle');if(handle===0)return {qualified:true,accepted:false,path:'null-target'};
   const {state}=owned(api);if(state.currentHandle!==0)record(state,state.currentHandle);
   const target=record(state,handle);if(!bool(target.enabled58,'target enabled58'))return {qualified:true,accepted:false,path:'disabled'};
   write(api,{pendingHandle:handle});return {qualified:true,accepted:true,path:'pending274',handle};
  },
  commit(handle,api){
   handle=uint(handle,'state target handle');if(handle===0)return {qualified:true,path:'null-target'};
   let {state}=owned(api);const target=record(state,handle);if(!bool(target.enabled58,'target enabled58'))return {qualified:true,path:'disabled'};
   if(state.currentHandle!==0){const previous=record(state,state.currentHandle);call(exitState,previous,api);}
   const resolved=call(resolveStateB9a850,handle,api);
   if(!resolved||resolved.qualified!==true||typeof resolved.found!=='boolean')throw TypeError('Qualified current source B9A850 state resolution required');
   const resolvedHandle=resolved.found?uint(resolved.handle,'resolved source handle'):0,destination=resolvedHandle!==0?resolvedHandle:handle;
   state=owned(api).state;record(state,destination);const previousHandle=uint(state.currentHandle,'current handle');
   write(api,{previousHandle,currentHandle:destination});call(enterState,record(owned(api).state,destination),api);
   return {qualified:true,path:'entered',previousHandle,currentHandle:destination,nativeReady:false};
  }
 });
}
