// Current source-owned BLAST2 state. This is an explicit local S5 authority,
// not a claim that native network damage/round-reset authority is reproduced.
import {createMapDestructibleState} from './map-destructible-state.js';
import {bindNativeBlast2SourceWorld} from './native-registration-profile-blast2.js';
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);
const text=value=>typeof value==='string'&&value.trim().length>0;
const token=value=>text(value)||Number.isSafeInteger(value)&&value>=0;
const invoke=(fn,...args)=>{const value=fn(...args);if(value&&typeof value.then==='function')throw TypeError('Synchronous BLAST2 authority and restoration queries required');return value;};

// Require the source fields explicitly even where their source value is ''.
// Missing sounds/sequences cannot silently become an empty effect collection.
export function compileNativeBlast2StateProfiles({profile}={}){
 if(profile?.schema!=='native-blast2-registration-profile-v1'||!Array.isArray(profile.instances)||!(profile.bindings instanceof Map))throw TypeError('Authenticated BLAST2 registration profile required');
 const variants=profile.bundle?.variants?.filter(value=>value.id===profile.nativeMapId);
 if(variants?.length!==1)throw TypeError('Unique BLAST2 source variant required');
 const configs=variants[0].configs?.filter(value=>value.path===variants[0].bginfo&&value.status==='verified');
 if(configs?.length!==1||!Array.isArray(configs[0].entries))throw TypeError('Verified BLAST2 source entries required');
 const entries=configs[0].entries;
 function field(section,key){
  const rows=entries.filter(value=>value.section===section&&value.key===key);
  if(rows.length!==1||typeof rows[0].value!=='string')throw TypeError(`Explicit unique source ${section}.${key} required`);
  return {value:rows[0].value,line:rows[0].line};
 }
 function integer(section,key){const row=field(section,key);if(!/^\d+$/.test(row.value)||Number(row.value)>0xffffffff)throw TypeError(`Source uint32 ${section}.${key} required`);return Number(row.value);}
 const hpRecoveryMs=integer('BLASTINFO','HPRecoveryTime'),rebirthTexture=field('BLASTINFO','RebirthTexture'),rebirthSound=field('BLASTINFO','RebirthSound');
 const profiles=[],effects=new Map(),bySection=new Map();
 for(const instance of profile.instances){
  if(!bySection.has(instance.section)){
   const name=field(instance.section,'name');if(name.value!==instance.profile)throw TypeError('BLAST2 section/profile identity changed');
   const value=Object.freeze({key:instance.section,hp:integer(instance.section,'hp'),hpRecoveryMs,rebirthMs:integer(instance.section,'rebirthtime')});
   profiles.push(value);bySection.set(instance.section,value);
   effects.set(instance.section,Object.freeze({sequence:field(instance.section,'sequence'),sound:field(instance.section,'sound'),material:integer(instance.section,'material'),rebirthTexture,rebirthSound}));
  }
 }
 const ids=new Set(),keys=new Set();
 const instances=profile.instances.map(instance=>{
  if(!Number.isInteger(instance.ownerId)||instance.ownerId<0||instance.ownerId>0xffffffff||!text(instance.instanceKey)||ids.has(instance.ownerId)||keys.has(instance.instanceKey))throw TypeError('Unique original owner IDs and instance keys required');
  ids.add(instance.ownerId);keys.add(instance.instanceKey);
  return {instanceKey:instance.instanceKey,profileKey:instance.section,sourceRecord:{source:instance.source,sourceNodeIndex:instance.sourceNodeIndex,name:instance.name,ownerId:instance.ownerId,section:instance.section,profile:instance.profile}};
 });
 return {profiles,instances,effects,source:{path:configs[0].path,hpRecoveryLine:field('BLASTINFO','HPRecoveryTime').line},nativeReady:false};
}

// readAuthority must identify this map generation and explicitly authorize a
// fresh intact local ledger. canRestore is a pure occupied-space query using
// the actual current actors/shape; unknown collections must refuse qualified.
// No callback runs for presentation: effects remain committed event records.
export function createNativeBlast2RuntimeState({profile,readAuthority,canRestore,source}={}){
 if(!sync(readAuthority)||!sync(canRestore)||!text(source))throw TypeError('Explicit BLAST2 source, live authority reader and pure restoration query required');
 const compiled=compileNativeBlast2StateProfiles({profile});
 const initial=invoke(readAuthority);
 if(initial?.qualified!==true||initial.active!==true||initial.authority!=='local-S5-explicit'||initial.initialize!=='fresh-intact'||!token(initial.generation)||!text(initial.evidence))throw TypeError('Qualified current generation and explicit fresh-intact local authority required');
 const generation=initial.generation,owners=new Map(profile.instances.map(value=>[value.ownerId,value])),bindings=new Set(profile.bindings.values());
 const state=createMapDestructibleState(compiled);let disposed=false,operation=false,authorityReading=false;
 function active(){
  if(disposed)throw Error('BLAST2 runtime disposed');
  if(authorityReading)throw Error('BLAST2 authority query cannot be reentered');
  authorityReading=true;
  try{
   const authority=invoke(readAuthority);
   if(authority?.qualified!==true||authority.active!==true||authority.authority!=='local-S5-explicit'||!Object.is(authority.generation,generation)||!text(authority.evidence))throw Error('BLAST2 current authority unavailable or generation changed');
   if(disposed)throw Error('BLAST2 runtime disposed during authority query');
  }finally{authorityReading=false;}
 }
 function mutate(action){
  if(operation||authorityReading)throw Error('BLAST2 runtime mutation cannot be reentered');
  operation=true;try{active();return action();}finally{operation=false;}
 }
 function owner(id){const value=owners.get(id);if(!value)throw TypeError('Unknown BLAST2 source owner ID');return value;}
 const runtime={
  source,profile,
  readEnabled(binding){
   // Registration queries get unknown on stale/unavailable authority, never an
   // invented true. Only the original profile binding object is authenticated.
   try{active();if(!bindings.has(binding))return undefined;return state.readInstanceState(binding.instanceKey)?.alive;}catch{return undefined;}
  },
  readOwner(ownerId){active();const value=owner(ownerId);return {ownerId,...state.readInstanceState(value.instanceKey),visual:state.readVisualState(value.instanceKey)};},
  tokenForOwner(ownerId){active();return {...state.tokenFor(owner(ownerId).instanceKey),ownerId,authorityGeneration:generation};},
  applyDamage(token,damage,detail){return mutate(()=>{
   if(!token||!Object.is(token.authorityGeneration,generation))return {accepted:false,reason:'stale-authority-generation'};
   const value=owners.get(token.ownerId);if(!value||value.instanceKey!==token.instanceKey)return {accepted:false,reason:'unknown-owner-token'};
   return state.applyDamage(token,damage,detail);
  });},
  advance(deltaMs){return mutate(()=>state.advance(deltaMs,{canRestore:view=>{
   const value=owner(view.sourceRecord.ownerId);
   const result=invoke(canRestore,{owner:value,state:view,authorityGeneration:generation,source});
   if(result?.qualified!==true||typeof result.allowed!=='boolean'||!text(result.evidence))throw TypeError('Qualified current actor/geometry restoration decision required');
   active();return result.allowed;
  }}));},
  snapshot(){active();return {...state.snapshot(),authorityGeneration:generation,source};},
  drainEvents(){active();if(operation)throw Error('BLAST2 events cannot drain during mutation');return state.drainEvents().map(event=>({...event,effects:structuredClone(compiled.effects.get(event.sourceRecord.section))}));},
  bindWorld(world){active();return bindNativeBlast2SourceWorld({world,profile,readEnabled:runtime.readEnabled,evidence:source});},
  dispose(){if(operation||authorityReading)throw Error('BLAST2 runtime cannot dispose during mutation or authority query');disposed=true;},
  qualification:{currentOwnerLedger:true,restorationTransaction:'owned-state-atomic; synchronous read-only queries; effects consumed after commit',nativeAuthorityVerified:false,nativeMovementCompared:false,defaultRuntimeActivated:false,nativeReady:false},
 };
 return Object.freeze(runtime);
}
