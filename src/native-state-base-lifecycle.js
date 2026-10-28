// Source561590/561710 and locomotion Exit62CF30/634B80/624EE0.
// Required reached resource/object consumers are never replaced by empty work.
const f=Math.fround;
const uint=(v,n)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw TypeError(`Explicit uint32 ${n} required`);return v;};
const bool=(v,n)=>{if(typeof v!=='boolean')throw TypeError(`Explicit boolean ${n} required`);return v;};
const rawFloat=(v,n)=>{if(typeof v!=='number')throw TypeError(`Explicit source float ${n} required`);return f(v);};
const timer=(v,n)=>{if(!v||typeof v!=='object')throw TypeError(`Explicit timer ${n} required`);return {count:uint(v.count,n),limit:uint(v.limit,n),elapsed:uint(v.elapsed,n),paused:bool(v.paused,n)};};
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor.name);
function caller({source,ports}={},api){
 if(typeof source!=='string'||!source.trim())throw TypeError('Explicit base lifecycle source required');
 return (name,args={})=>{
  if(!sync(ports?.[name]))throw TypeError(`Explicit synchronous lifecycle port ${name} required`);
  const result=ports[name]({...args,api});
  if(result&&typeof result.then==='function')throw TypeError('Source lifecycle ports must complete synchronously');
  if(result?.qualified!==true)throw Error(result?.reason??`${name}-unqualified`);
  return result.value;
 };
}
// UCOMISS/LAHF/TEST AH,44/JNP skips ordered equality only.
const unequalOrUnordered=(a,b)=>a!==b;
const reset=(read,offset)=>{const current=timer(read('readTimer',{offset}),offset);read('writeTimer',{offset,value:{...current,count:0,elapsed:0}});};

export function createNativeStateBaseEnter(config={}){
 return api=>{
  const read=caller(config,api);read('objectEnter5015a0');
  if(!bool(read('readActorGate'),'actor3C'))reset(read,0x5c);
  reset(read,0x88);
  read('resetEffects561e30');read('resetSounds5624f0');
  const kind=uint(read('stateVirtualB8'),'state virtualB8');
  if(kind===1)read('stateAnimation564240');else if(kind===2)read('stateAnimation564330');
  const value=rawFloat(read('stateVirtual78'),'state virtual78'),literal=rawFloat(read('readLiteral14c904c'),'literal14C904C');
  if(unequalOrUnordered(value,literal)&&!bool(read('readActorGate'),'actor3C')){
   reset(read,0xbc);read('actorVirtual258',{value:false});
  }
  if(!bool(read('readActorGate'),'actor3C')){
   const vector=read('readStateVectorFc');
   if(!Array.isArray(vector)||vector.length!==3)throw TypeError('Explicit source stateFC XYZ required');
   read('world7eda00',{vector:vector.map(v=>rawFloat(v,'stateFC'))});
  }
  return {qualified:true,nativeReady:false};
 };
}

export function createNativeStateBaseExit(config={}){
 return api=>{
  const read=caller(config,api);read('objectExit501740');read('releaseEffects561ef0');
  const value=rawFloat(read('state561b30'),'state561B30'),literal=rawFloat(read('readLiteral14c904c'),'literal14C904C');
  if(unequalOrUnordered(value,literal)&&!bool(read('readActorGate'),'actor3C'))read('actorVirtual258',{value:true});
  if(!bool(read('readActorGate'),'actor3C'))read('world7eda00',{vector:[literal,literal,literal]});
  return {qualified:true,nativeReady:false};
 };
}

export function createNativeLocomotionStateExit({source,kind,ports}={}){
 if(!['normal','run','jump'].includes(kind))throw TypeError('Explicit supported locomotion Exit kind required');
 return api=>{
  const read=caller({source,ports},api);read('baseExit561710');
  if(kind==='run')read('runChildExit888210');
  read('writeActor214',{value:false});
  return {qualified:true,kind,nativeReady:false};
 };
}

//561E30 and5624F0 reset every entry's timer from its DECLARED duration,
// preserving pause bytes. Cursor advances before entry callbacks; end is live.
export function createNativeStateEntryTimerReset({source,kind,ports}={}){
 if(!['effects','sounds'].includes(kind))throw TypeError('Explicit effects/sounds reset kind required');
 const timerOffset=kind==='effects'?0x50:0x64,durationOffset=kind==='effects'?0x4c:0x60;
 return api=>{
  const read=caller({source,ports},api);let cursor=read('beginEntries'),resetCount=0;
  while(!bool(read('isEntriesEnd',{cursor}),'live entries end')){
   const entry=read('readEntry',{cursor});if(entry==null)throw TypeError('Explicit live source entry required');
   cursor=read('nextEntry',{cursor});
   const duration=uint(read('readEntryDuration',{entry,offset:durationOffset}),'declared duration');
   const current=timer(read('readEntryTimer',{entry,offset:timerOffset}),'entry timer');
   read('writeEntryTimer',{entry,offset:timerOffset,value:{...current,count:0,limit:duration,elapsed:0}});resetCount++;
  }
  return {qualified:true,resetCount,nativeReady:false};
 };
}

//561EF0 tests entry60 before manager AFE3D0 and then clears the owned
// reference through891CC0; it does not clear every effect unconditionally.
export function createNativeStateEffectRelease(config={}){
 return api=>{
  const read=caller(config,api),manager=read('readWorldEffectManager20');let cursor=read('beginEntries'),released=0;
  while(!bool(read('isEntriesEnd',{cursor}),'live entries end')){
   const entry=read('readEntry',{cursor});if(entry==null)throw TypeError('Explicit live source entry required');
   cursor=read('nextEntry',{cursor});
   if(uint(read('readEntry60',{entry}),'entry60')!==0){
    const handle=read('readEffect68',{entry});read('removeEffectAfe3d0',{manager,handle});
    read('assignEffect891cc0',{entry,handle:0});released++;
   }
  }
  return {qualified:true,released,nativeReady:false};
 };
}

