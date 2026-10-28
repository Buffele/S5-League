// Source-delimited pre-physics helpers for actor51EAB0. This is NOT the full
// prefix: all calls preceding51EFEB must execute before the timer suffix.
// Logical decoded DWORD/float values, no protected-storage or GUI operations.
const f=Math.fround;
const uint=(n,label)=>{if(!Number.isInteger(n)||n<0||n>0xffffffff)throw TypeError(`Explicit uint32 ${label} required`);return n;};
const sync=(fn,label)=>{if(typeof fn!=='function'||['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name))throw TypeError(`Synchronous ${label} required`);return fn;};
const valueSync=value=>{if(value&&typeof value.then==='function')throw TypeError('Native preface ports must complete synchronously');return value;};
const timer=(value,label)=>{
 if(!value||typeof value.paused!=='boolean')throw TypeError(`Explicit ${label} timer required`);
 return {count:uint(value.count,label+' count'),limit:uint(value.limit,label+' limit'),elapsed:uint(value.elapsed,label+' elapsed'),paused:value.paused};
};
const vector4=value=>{
 if(!Array.isArray(value)||value.length!==4||value.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Explicit finite actor vector178 required');
 return value.map(f);
};
export const NATIVE_ACTOR_PHYSICS_GATE_KEY=0x15f4550;
export const NATIVE_FRAME_PREFACE_TIMER_SOURCE=Object.freeze({start:0x51efeb,endExclusive:0x51f356});

export function copyNativeActorFramePrefaceTimers(state){
 if(!state)throw TypeError('Explicit frame preface timer state required');
 return {timer324:timer(state.timer324,'324'),timer334:timer(state.timer334,'334'),timer30c:timer(state.timer30c,'30C'),vector178:vector4(state.vector178)};
}
function advance(timer,dtMs){
 // Inline source timer update returns TRUE while paused; an unpaused timer
 // increments both count and elapsed (even dt0), and returns limit>=elapsed.
 if(timer.paused)return true;
 timer.count=(timer.count+1)>>>0;timer.elapsed=(timer.elapsed+dtMs)>>>0;
 return timer.limit>=timer.elapsed;
}
export function nativeActorFramePrefaceTimers({state,dtMs,actorId,localActorId}={}){
 const next=copyNativeActorFramePrefaceTimers(state);dtMs=uint(dtMs,'engine delta');actorId=uint(actorId,'actor identity');
 if(localActorId!==null)localActorId=uint(localActorId,'current local actor identity');
 const trace=[];
 //51EFF9..F238: expired at entry skips both the update and vector178 write.
 if(next.timer324.elapsed<=next.timer324.limit){
  const active=advance(next.timer324,dtMs);trace.push({offset:0x324,advanced:!next.timer324.paused,activeAfter:active});
  if(localActorId!==actorId)next.vector178=active?[f(.33),f(.33),f(.33),1]:[1,1,1,1];
 }else trace.push({offset:0x324,advanced:false,skippedExpired:true});
 //51F23B..F2DB:334 is also bounded by its PRE-update comparison.
 if(next.timer334.elapsed<=next.timer334.limit){
  const active=advance(next.timer334,dtMs);trace.push({offset:0x334,advanced:!next.timer334.paused,activeAfter:active});
 }else trace.push({offset:0x334,advanced:false,skippedExpired:true});
 //51F2E5..F34C:30C has NO entry timeout gate; its return value is discarded.
 const active=advance(next.timer30c,dtMs);trace.push({offset:0x30c,advanced:!next.timer30c.paused,activeAfter:active});
 return {qualified:true,state:next,trace,sourceRange:NATIVE_FRAME_PREFACE_TIMER_SOURCE,
  fullActorPrefaceImplemented:false,nativeExecutionCompared:false,nativeReady:false};
}

export function readNativeActorPhysicsGate({readProperty}={}){
 sync(readProperty,'current boolean property lookup');
 //97DFD9 initializes output AL byte to0. 52DDA0 finds the key and copies the
 // low byte of the decoded DWORD into it; a qualified miss leaves0 intact.
 const lookup=valueSync(readProperty(NATIVE_ACTOR_PHYSICS_GATE_KEY,{actorOffset:0x2c,storage:'uint32-low-byte'}));
 if(lookup?.qualified!==true||typeof lookup.found!=='boolean')throw TypeError('Qualified current gate property lookup required');
 const raw=lookup.found?uint(lookup.value,'gate property decoded DWORD'):0;
 const byte=raw&255;
 return {qualified:true,value:byte!==0,byte,found:lookup.found,key:NATIVE_ACTOR_PHYSICS_GATE_KEY,
  nativeExecutionCompared:false,nativeReady:false};
}

// Transactional facade for createNativeActorCollisionFrame. Earlier prefix
// callbacks remain mandatory source ports, and must finish through51EFE9.
// No default no-op prefix or invented timer state is supplied.
export function createNativeActorFramePrefacePorts({source,containerKey,runBeforeTimerSuffix,readActorIdentity,readGateProperty}={}){
 if(typeof source!=='string'||!source.trim()||typeof containerKey!=='string'||!containerKey.trim())throw TypeError('Explicit preface provenance and state-container key required');
 [runBeforeTimerSuffix,readActorIdentity,readGateProperty].forEach(fn=>sync(fn,'preface source port'));
 const entry=api=>{
  const container=api.readStateContainer();
  if(!container||!Object.hasOwn(container,containerKey))throw TypeError('Explicit owned preface container entry required');
  return container;
 };
 return {
  source,
  beforePhysics(dtMs,api){
   uint(dtMs,'engine delta');entry(api);
   const prefix=valueSync(runBeforeTimerSuffix(dtMs,api));
   if(prefix?.qualified!==true||typeof prefix.source!=='string'||!prefix.source.trim())throw TypeError('Qualified source implementation through51EFE9 required');
   // Re-read AFTER prefix callbacks: they may change timers, ownership or state.
   const container=entry(api),identity=valueSync(readActorIdentity(api));
   if(identity?.qualified!==true)throw TypeError('Qualified current actor identities required');
   const suffix=nativeActorFramePrefaceTimers({state:container[containerKey],dtMs,actorId:identity.actorId,localActorId:identity.localActorId});
   api.writeStateContainer({...container,[containerKey]:suffix.state});
   return {qualified:true,prefixSource:prefix.source,suffix,fullActorPrefaceImplemented:false,nativeReady:false};
  },
  resolveActorAcceptsPhysics(api){
   return readNativeActorPhysicsGate({readProperty:(key,options)=>readGateProperty(key,options,api)}).value;
  },
 };
}
