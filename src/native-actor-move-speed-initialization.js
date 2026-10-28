import {createNativeActorMoveSpeedReader} from './native-actor-move-speed.js';
const finite=v=>{if(!Number.isFinite(v))throw new TypeError('Finite decoded base speed required');return Math.fround(v);};
function origin(p){if(!['source-initialization-model','s5-explicit-adaptation','source-port'].includes(p?.kind)||typeof p.source!=='string'||!p.source.trim())throw new TypeError('Explicit initialization/writer provenance required');}

// Ctor513FC0: GT15 decoded into local-168,5153C3 writes that exact local
// to actor250/key15F3D94. This models initial state, not a live observation.
export function createNativeActorMoveSpeedBaseProfile({declaration,actorId,provenance}={}){
 if(declaration!=='FREE'||!['string','number'].includes(typeof actorId)||String(actorId).length===0)throw new TypeError('Explicit FREE declaration and actor identity required');origin(provenance);
 const writer={revision:0,value:1100,sourceSite:'513FC0:515289→515299→5152BA→5152BF→5153AD→5153BD→5153C3',provenance:{...provenance}};
 return {schema:'native-actor-move-speed-base-profile-v1',actorId,declaration:'FREE',currentBaseNative:1100,revision:0,writerLedger:[writer],
  sourceBinding:{ctor:'513FC0',writer:'5153C3',bag:'actor+250',key:'global15F3D94',registryIndex:21,registryField:'GAMETEMPO_actor_default_move_speed',reader:'51DB2C',
   peSha256:'6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017',xbnSha256:'170db9deb71847e98e2f4a6cea87e465ec0ef7f494a40a7d29f6564be41f7189'},
  constructorWriterVerified:true,nativeActorObserved:false,nativeRuntimeSelectionVerified:false,nativeReady:false};
}
export function writeNativeActorMoveSpeedBase(profile,{value,sourceSite,provenance}={}){
 if(profile?.schema!=='native-actor-move-speed-base-profile-v1'||typeof sourceSite!=='string'||!sourceSite.trim())throw new TypeError('Typed base profile and explicit writer site required');origin(provenance);
 profile.currentBaseNative=finite(value);profile.writerLedger.push({revision:++profile.revision,value:profile.currentBaseNative,sourceSite,provenance:{...provenance}});return profile;
}
// Caller owns this model's lifecycle and must use the writer for subsequent
// base changes; unknown predicates/conditions/properties are never defaulted.
export function createInitializedNativeActorMoveSpeedReader({baseProfile,readRemainingSnapshot,condition154}={}){
 if(baseProfile?.schema!=='native-actor-move-speed-base-profile-v1')throw new TypeError('Initialized base profile required');
 origin(readRemainingSnapshot?.provenance);
 if(typeof readRemainingSnapshot?.tick!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(readRemainingSnapshot.tick.constructor.name))throw new TypeError('Synchronous remaining-property snapshot required');
 const readSnapshot={provenance:{kind:'s5-explicit-adaptation',source:'S5 actor base property initialized from verified513FC0 writer; remaining properties separately qualified'},tick:context=>{
  const remaining=readRemainingSnapshot.tick(context);if(remaining?.then)throw new TypeError('Async actor snapshot unsupported');
  if(!remaining||'actorBase250Key15f3d94' in remaining)throw new TypeError('Base value is owned by typed base profile, not an implicit override');
  if(remaining.actorId!==baseProfile.actorId)throw new TypeError('Matching typed actor identity required');
  return {...remaining,provenance:{kind:'s5-explicit-adaptation',source:`Source-initialized actor${baseProfile.actorId} base revision${baseProfile.revision}; remaining: ${readRemainingSnapshot.provenance.source}`},actorBase250Key15f3d94:finite(baseProfile.currentBaseNative)};
 }};
 const reader=createNativeActorMoveSpeedReader({readSnapshot,condition154});
 return {...reader,baseSnapshot:()=>structuredClone(baseProfile)};
}
