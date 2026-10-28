// Decoded actor51EAB0 tail51F508..51FF92. This includes the position
// postconditions and timers beyond the old eleven-stage diagnostic segment.
// Reached source component/lifecycle routines remain mandatory implementations.
const f=Math.fround;
const uint=(v,n)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw TypeError(`Explicit uint32 ${n} required`);return v;};
const byte=(v,n)=>{uint(v,n);if(v>255)throw TypeError(`Explicit byte ${n} required`);return v;};
const scalar=(v,n)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw TypeError(`Explicit finite float32 ${n} required`);return f(v);};
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);
const xyz=v=>{if(!Array.isArray(v)||v.length!==3)throw TypeError('Explicit source vector required');return v.map(n=>scalar(n,'vector component'));};
const timer=v=>{if(!v||typeof v.paused!=='boolean')throw TypeError('Explicit source tail timer required');return {count:uint(v.count,'timer count'),limit:uint(v.limit,'timer limit'),elapsed:uint(v.elapsed,'timer elapsed'),paused:v.paused};};
export const NATIVE_ACTOR_FRAME_TAIL_SOURCE=Object.freeze({start:0x51f508,endExclusive:0x51ff92});
export function nativeActorTypeAdmission({metadata,reference}={}){
 const index=uint(reference?.index,'reference type index'),maximum=uint(metadata?.maxIndex,'type max index');
 if(index>maximum)return false;
 if(!Array.isArray(metadata.ids))throw TypeError('Explicit source ancestor ID array required');
 return uint(metadata.ids[index],'ancestor ID')===uint(reference.value,'reference ancestor ID');
}
export function createNativeActorFrameTail({source,actorHandle,ports}={}){
 if(typeof source!=='string'||!source.trim()||uint(actorHandle,'source actor handle')===0)throw TypeError('Explicit source tail provenance and nonnull actor identity required');
 return (engineDtMs,api)=>{
  let dtMs=uint(engineDtMs,'engine delta');const trace=[];
  const invoke=(name,args={})=>{
   if(!sync(ports?.[name]))throw TypeError(`Reached synchronous source tail port ${name} required`);
   const result=ports[name]({...args,dtMs,api});if(result&&typeof result.then==='function')throw TypeError(`Source tail port ${name} must complete synchronously`);
   trace.push({port:name,...args});if(result?.qualified!==true)throw Error(result?.reason??`${name}-unqualified`);return result;
  };
  const value=(name,args)=>invoke(name,args).value;
  const field=offset=>uint(value('readActorUInt',{offset}),`actor${offset.toString(16)}`);
  const actorVirtual=slot=>uint(value('readActorVirtual',{slot}),`actor slot${slot.toString(16)}`);
  const currentState=()=>field(0x1c);
  const stateVirtual=(slot,state)=>uint(value('readStateVirtual',{state,slot}),`state slot${slot.toString(16)}`);
  const typeMatches=(state,indexAddress,idsAddress)=>{
   const metadata=value('readStateMetadata',{state});
   const reference=value('readTypeReference',{indexAddress,idsAddress});
   return nativeActorTypeAdmission({metadata,reference});
  };
  const readTimer=(offset,indirect=false)=>timer(value('readTimer',{offset,indirect}));
  function advanceTimer(offset,{indirect=false,bounded=false}={}){
   const before=readTimer(offset,indirect);
   if(bounded&&before.elapsed>before.limit)return {skippedExpired:true,active:false,timer:before};
   if(before.paused)return {skippedExpired:false,active:true,timer:before};
   const after={...before,count:(before.count+1)>>>0,elapsed:(before.elapsed+dtMs)>>>0};
   invoke('writeTimer',{offset,indirect,value:after});return {skippedExpired:false,active:after.limit>=after.elapsed,timer:after};
  }
  const result=reason=>({qualified:true,source,trace,reason,localDtMs:dtMs,sourceRange:NATIVE_ACTOR_FRAME_TAIL_SOURCE,nativeReady:false,nativeExecutionCompared:false,calledRoutineImplementationsVerified:false});
  if(field(0x274)!==0)invoke('transition518E20',{target:field(0x274)});
  invoke('tick52ACA0');
  const zero=scalar(value('readFloat',{index:0}),'Float0'),slotC8=scalar(value('readActorFloat',{slot:0xc8}),'actor slotC8');
  const sum=f(slotC8+zero);if(!Number.isFinite(sum))throw RangeError('Source tail slotC8 adjustment overflow');
  invoke('writeActorSlotC4',{value:sum});
  invoke('tickMp52B110');
  for(const [offset,target]of [[0x2a0,0xb88d50],[0x2a8,0xb808d0],[0x2b8,0xb84e50],[0x2ac,0xb85f10],[0x2b0,0xb868a0],[0x2bc,0xb874c0],[0x208,0x54ade0]])invoke('tickComponent',{offset,target,component:field(offset)});
  const frameContext=uint(value('readFrameContext7EF870'),'7EF870 context');
  let state=currentState();
  if(state!==0&&typeMatches(state,0x165afa0,0x165afa4)){
   state=currentState();if(state===0)throw Error('Source state disappeared before slotBC');
   if(byte(stateVirtual(0xbc,state),'state slotBC')!==0){
    const previous=xyz(value('readActorPlainVector',{offset:0x2fc})),position=xyz(value('readActorPlainVector',{offset:0x2f0}));
    invoke('invokeB7DB20',{component:field(0x308),frameContext,argument:0,position,previous});
   }
  }
  //52F9A0 is typed by THIS: source actor+A8, then plain snapshot2FC.
  const protectedA8=xyz(value('readActorProtectedVector',{offset:0xa8}));
  invoke('writeActorPlainVector',{offset:0x2fc,value:protectedA8});
  invoke('tickB7E030',{component:field(0x308),frameContext});
  state=currentState();
  if(state!==0&&typeMatches(state,0x165afa0,0x165afa4)){
   state=currentState();if(state===0)throw Error('Source state disappeared before second slotBC');
   if(byte(stateVirtual(0xbc,state),'state slotBC')!==0){
    const position=xyz(value('readActorProtectedVector',{offset:0x74}));
    const query=invoke('queryB7E1F0',{component:field(0x308),frameContext,position,vector:[0,0,0],byteInitialKnown:false});
    invoke('writeActorProtectedVector',{offset:0x74,value:xyz(query.position)});
   }
  }
  invoke('actorSlot15C');invoke('actor527570');invoke('actor986FE0');
  if(field(0x1a4)!==0)invoke('tickActor1A4Slot1C',{component:field(0x1a4)});
  invoke('endCollisionScope7B4E60');
  if(field(0x364)!==0)invoke('tickA375C0',{component:field(0x364),actor:actorHandle});
  invoke('tick6D60A0',{component:field(0x368)});
  advanceTimer(0x1ec,{indirect:true,bounded:true});
  //52B740 receives an ADDRESS to this function's local dt argument. Its
  // returned explicit dt is used by the remaining timers only.
  dtMs=uint(invoke('invoke52B740',{value:dtMs}).dtMs,'post52B740 local delta');
  invoke('invoke7C0200',{component:field(0x298)});
  if(byte(actorVirtual(0x180),'actor slot180')===1)advanceTimer(0x48c,{bounded:true});
  if(field(0x42c)>0){
   const advanced=advanceTimer(0x428);
   if(!advanced.active){
    invoke('writeActorUInt',{offset:0x420,value:0});invoke('writeActorUInt',{offset:0x424,value:0});
    const current=readTimer(0x428);invoke('writeTimer',{offset:0x428,indirect:false,value:{...current,count:0,limit:0,elapsed:0}});
   }
  }
  if(actorVirtual(0xfc)===0x25&&field(0x290)!==0){
   const first=uint(value('readB99CF0',{component:field(0x290)}),'B99CF0 object');
   if(first!==0){
    const object=uint(value('readB99CF0',{component:field(0x290)}),'current B99CF0 object');if(object===0)throw Error('B99CF0 object disappeared before source6C read');
    if(byte(value('readObjectByte',{object,offset:0x6c}),'object6C')!==0&&currentState()!==0){
     state=currentState();
     if(stateVirtual(0x44,state)>3){
      let preserve=false;
      state=currentState();if(state===0)throw Error('Source state disappeared before type query');
      if(typeMatches(state,0x165eca0,0x165eca4)){
       const substate=uint(value('readState636E90',{state:currentState()}),'636E90 state');if(substate===0)throw Error('Source substate required before metadata dereference');
       if(typeMatches(substate,0x165dcd4,0x165dcd8)&&uint(value('readStateUInt',{state:substate,offset:0x24c}),'substate24C')===1)preserve=true;
      }
      if(preserve)return result('special-state-preserved');
      const next=uint(value('findState503800',{id:0x36}),'state lookup36');if(next!==0)invoke('transition518E20',{target:next});
     }
    }
   }
  }
  if(uint(value('readGlobalActor110'),'global actor110')===actorHandle&&field(0x244)>0){
   const advanced=advanceTimer(0x240);if(!advanced.active){const current=readTimer(0x240);invoke('writeTimer',{offset:0x240,indirect:false,value:{...current,count:0,limit:0,elapsed:0}});}
  }
  return result('complete-tail-control-flow');
 };
}
