// Native source: s5runtimegame.exe 6bea9d8c...c8017; work/map-destruction-audit/.
// Pure state only. Contacts, actor eligibility, collision queries, effects and
// network authority belong to the caller. No map buffers are changed here.
export const NATIVE_BLAST_DAMAGE_VALUES=Object.freeze([0,0,5,10,20,30,50,70,100,200,300,400]);
export const NATIVE_BLAST_CONSTANT_INDICES=Object.freeze([0,0,5,10,20,22,25,28,30,35,43,51]);
export const MAP_DESTRUCTIBLE_SOURCE=Object.freeze({
 binarySha256:'6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017',
 integerPopulationSha256:'affed78d80ceb89b91c3e0223220ca128910864242188cec813a8f0361fcd60c',
 integerCount:132,enumResolver:0x5f9410,bootInitializer:0x10501a0,
 ledger:0x731370,ledgerTick:0x732ad0,rebirthTick:0x72cc40,
 pieceRestore:0x734560,pieceTick:0x734730,restoreSafetyGate:0x734ec0,
 restoreFadeMs:500,occupiedRetryMs:500,
 clockPolicy:'Caller supplies integer milliseconds. Native865c20 uses the previously stored frame delta; S5 fixed steps/authority/overrides are separate bindings.',
 resetPolicy:'Explicit local S5 reset; native round-reset caller/authority is not certified.',
});
const UINT_MAX=0xffffffff;
function uint(value,label){
 if(!Number.isInteger(value)||value<0||value>UINT_MAX)throw new RangeError(label+' must be uint32');
 return value;
}
function safe(value,label){
 if(!Number.isSafeInteger(value)||value<0)throw new RangeError(label+' must be a nonnegative safe integer');
 return value;
}
function next(value,label){return safe(value+1,label);}
function text(value,label){if(typeof value!=='string'||!value.length)throw new TypeError(label+' must be a nonempty string');return value;}
function copy(value){return value===undefined?null:structuredClone(value);}
function add(a,b){return (a+b)>>>0;}

// Only the defined finite uint32 input range is supported. Out-of-range native
// CPU conversion behavior is not replaced with JavaScript modulo coercion.
export function toNativeDestructibleDamage(value){
 if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>=0x100000000)throw new RangeError('Damage must be finite in [0, 2^32)');
 return Math.trunc(value)>>>0;
}
export function resolveNativeBlastDamage(enumValue){
 if(!Number.isInteger(enumValue)||enumValue<0||enumValue>=NATIVE_BLAST_DAMAGE_VALUES.length)throw new RangeError('Unknown native blast damage enum');
 return NATIVE_BLAST_DAMAGE_VALUES[enumValue];
}

export function createMapDestructibleState({profiles,instances,initialGeneration=0}={}){
 safe(initialGeneration,'initialGeneration');
 if(!Array.isArray(profiles)||!Array.isArray(instances))throw new TypeError('profiles and instances arrays required');
 const profileMap=new Map();let states=new Map();
 for(const input of profiles){
  const key=text(input.key,'profile.key');if(profileMap.has(key))throw new Error('Duplicate profile '+key);
  profileMap.set(key,Object.freeze({key,hp:uint(input.hp,'profile.hp'),hpRecoveryMs:uint(input.hpRecoveryMs,'profile.hpRecoveryMs'),rebirthMs:uint(input.rebirthMs,'profile.rebirthMs')}));
 }
 for(const input of instances){
  const key=text(input.instanceKey,'instanceKey'),profile=profileMap.get(input.profileKey);
  if(states.has(key))throw new Error('Duplicate instance '+key);
  if(!profile)throw new Error('Unknown profile '+input.profileKey);
  states.set(key,{instanceKey:key,profile,sourceRecord:copy(input.sourceRecord),generation:initialGeneration,
   phase:'intact',alive:true,ledger:[],rebirthElapsedMs:0,retryElapsedMs:0,fadeElapsedMs:0,restoreCheckRequired:false});
 }
 let revision=0,collisionRevision=0,elapsedMs=0,eventSequence=0,events=[];
 let mutationActive=false;
 // Restore gates are synchronous, read-only queries. Stage all owned state so
 // a late throw/malformed gate cannot leave earlier pieces or events committed.
 // External callback effects cannot be rolled back and are forbidden here;
 // callers deliver visual/audio effects from committed drainEvents() only.
 function atomic(action){
  if(mutationActive)throw Error('Destructible mutation cannot be reentered');
  const previous={states,revision,collisionRevision,elapsedMs,eventSequence,events};
  states=new Map([...states].map(([key,state])=>[key,{...state,ledger:copy(state.ledger)}]));
  events=events.slice();mutationActive=true;
  try{return action();}
  catch(error){({states,revision,collisionRevision,elapsedMs,eventSequence,events}=previous);throw error;}
  finally{mutationActive=false;}
 }
 const keys=Object.freeze([...states.keys()]);
 function damageSum(state){return state.ledger.reduce((total,hit)=>add(total,hit.damage),0);}
 function view(state,includeLedger=true){
  const sum=damageSum(state);
  return {instanceKey:state.instanceKey,profileKey:state.profile.key,sourceRecord:copy(state.sourceRecord),generation:state.generation,
   phase:state.phase,alive:state.alive,hp:state.alive?Math.max(0,state.profile.hp-sum):0,configuredHp:state.profile.hp,activeDamage:sum,
   rebirthElapsedMs:state.rebirthElapsedMs,retryElapsedMs:state.retryElapsedMs,fadeElapsedMs:state.fadeElapsedMs,
   restoreCheckRequired:state.restoreCheckRequired,...(includeLedger?{ledger:copy(state.ledger)}:{})};
 }
 function emit(type,state,detail={}){
  events.push({sequence:next(eventSequence,'eventSequence'),revision,collisionRevision,elapsedMs,type,
   instanceKey:state.instanceKey,generation:state.generation,sourceRecord:copy(state.sourceRecord),...detail});
  eventSequence++;
 }
 function changeCollision(state,alive){
  state.alive=alive;state.generation=next(state.generation,'generation');collisionRevision=next(collisionRevision,'collisionRevision');
 }
 function destroy(state){
  state.ledger=[];state.phase='destroyed';state.rebirthElapsedMs=0;state.retryElapsedMs=0;state.fadeElapsedMs=0;state.restoreCheckRequired=false;
  changeCollision(state,false);emit('destroyed',state,{rebirthMs:state.profile.rebirthMs});
 }
 function tryRestore(state,canRestore){
  if(!canRestore){
   if(!state.restoreCheckRequired){state.restoreCheckRequired=true;emit('restore-check-required',state);}
   return false;
  }
  const allowed=canRestore(view(state,false));
  if(typeof allowed!=='boolean')throw new TypeError('canRestore must return a boolean');
  state.restoreCheckRequired=false;
  if(!allowed){state.phase='awaiting-space';state.retryElapsedMs=0;emit('restore-blocked',state,{retryMs:MAP_DESTRUCTIBLE_SOURCE.occupiedRetryMs});return false;}
  state.phase='restoring';state.ledger=[];state.rebirthElapsedMs=0;state.retryElapsedMs=0;state.fadeElapsedMs=0;
  changeCollision(state,true);emit('restored',state,{fadeMs:MAP_DESTRUCTIBLE_SOURCE.restoreFadeMs});return true;
 }
 function snapshot(){return {schema:'map-destructible-state-v1',revision,collisionRevision,elapsedMs,
  runtimeAuthority:'local-S5-explicit',nativeRuntimeParity:false,instances:[...states.values()].map(state=>view(state))};}
 return Object.freeze({
  get revision(){return revision;},get collisionRevision(){return collisionRevision;},get instanceKeys(){return keys;},
  snapshot,
  readInstanceState(key){const state=states.get(key);return state?{alive:state.alive,generation:state.generation,phase:state.phase}:null;},
  readVisualState(key){
   const state=states.get(key);if(!state)return null;
   const progress=state.alive?(state.phase==='restoring'?Math.min(1,state.fadeElapsedMs/MAP_DESTRUCTIBLE_SOURCE.restoreFadeMs):1):0;
   return {alive:state.alive,generation:state.generation,phase:state.phase,opacity:progress,progress};
  },
  tokenFor(key){const state=states.get(key);if(!state)return null;return {instanceKey:key,generation:state.generation,version:collisionRevision};},
  applyDamage(token,damage,detail={}){
   return atomic(()=>{
   const amount=toNativeDestructibleDamage(damage),state=states.get(token?.instanceKey);
   if(!state)return {accepted:false,reason:'unknown-instance'};
   if(!Number.isSafeInteger(token.generation)||token.generation!==state.generation)return {accepted:false,reason:'stale-generation'};
   if(!state.alive)return {accepted:false,reason:'not-alive'};
   const suppliedVersion=token.version,queryVersion=suppliedVersion===undefined?null:safe(suppliedVersion,'token.version');
   // Snapshot version is provenance, not a veto on other still-valid instances
   // from one native multi-hit list after an earlier instance was destroyed.
   revision=next(revision,'revision');
   state.ledger.push({damage:amount,durationMs:state.profile.hpRecoveryMs,elapsedMs:0,frameCount:0,
    attackId:copy(detail.attackId),damageSource:copy(detail.damageSource),queryVersion});
   const total=damageSum(state);emit('damage-applied',state,{damage:amount,activeDamage:total,attackId:copy(detail.attackId),queryVersion});
   const destroyed=total>=state.profile.hp;if(destroyed)destroy(state);
   return {accepted:true,damage:amount,destroyed,revision,collisionRevision};
   });
  },
  advance(deltaMs,{canRestore}={}){
   return atomic(()=>{
   uint(deltaMs,'deltaMs');if(canRestore!==undefined&&typeof canRestore!=='function')throw new TypeError('canRestore must be a function');
   safe(elapsedMs+deltaMs,'elapsedMs');revision=next(revision,'revision');elapsedMs+=deltaMs;
   // Native manager queue first, then each piece, then the damage ledgers.
   for(const state of states.values())if(state.phase==='destroyed'&&state.profile.rebirthMs!==0){
    state.rebirthElapsedMs=add(state.rebirthElapsedMs,deltaMs);
    if(state.rebirthElapsedMs>state.profile.rebirthMs)tryRestore(state,canRestore);
   }
   for(const state of states.values()){
    if(state.phase==='awaiting-space'){
     state.retryElapsedMs=add(state.retryElapsedMs,deltaMs);
     if(state.retryElapsedMs>MAP_DESTRUCTIBLE_SOURCE.occupiedRetryMs)tryRestore(state,canRestore);
    }else if(state.phase==='restoring'){
     state.fadeElapsedMs=add(state.fadeElapsedMs,deltaMs);
     if(state.fadeElapsedMs>MAP_DESTRUCTIBLE_SOURCE.restoreFadeMs){state.phase='intact';state.fadeElapsedMs=0;emit('restore-fade-complete',state);}
    }
    const expired=[];state.ledger=state.ledger.filter(hit=>{
     hit.frameCount=add(hit.frameCount,1);hit.elapsedMs=add(hit.elapsedMs,deltaMs);
     if(hit.elapsedMs>hit.durationMs){expired.push(hit);return false;}return true;
    });
    if(expired.length)emit('damage-expired',state,{count:expired.length,damage:expired.reduce((total,hit)=>add(total,hit.damage),0),activeDamage:damageSum(state)});
   }
   return {revision,collisionRevision};
   });
  },
  reset({reason}={}){
   return atomic(()=>{
   text(reason,'reset.reason');revision=next(revision,'revision');
   for(const state of states.values()){
    state.ledger=[];state.phase='intact';state.rebirthElapsedMs=0;state.retryElapsedMs=0;state.fadeElapsedMs=0;state.restoreCheckRequired=false;
    changeCollision(state,true);emit('reset-local-S5',state,{reason,nativeRoundCallerVerified:false});
   }
   return {revision,collisionRevision};
   });
  },
  drainEvents(){if(mutationActive)throw Error('Destructible events cannot drain during mutation');const result=events;events=[];return result;},
 });
}
