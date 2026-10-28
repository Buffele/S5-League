// Logical control flow of521510..522554, the first callback in51EAB0.
// Native property/rule/equipment storage and unported called routines are
// explicit qualified ports. Their effects must execute synchronously, inside
// the owning actor frame; no display-only or no-op replacement is inferred.
const f=Math.fround;
const uint=(n,label)=>{if(!Number.isInteger(n)||n<0||n>0xffffffff)throw TypeError(`Explicit uint32 ${label} required`);return n;};
const byte=(n,label)=>{uint(n,label);if(n>255)throw TypeError(`Explicit byte ${label} required`);return n;};
const number=(n,label)=>{if(!Number.isFinite(n)||!Number.isFinite(f(n)))throw TypeError(`Finite float32 ${label} required`);return f(n);};
const boolean=(n,label)=>{if(typeof n!=='boolean')throw TypeError(`Explicit boolean ${label} required`);return n;};
const synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);
const timer=value=>{
 if(!value||typeof value.paused!=='boolean')throw TypeError('Explicit source timer344 required');
 return {count:uint(value.count,'timer344 count'),limit:uint(value.limit,'timer344 limit'),elapsed:uint(value.elapsed,'timer344 elapsed'),paused:value.paused};
};
class Unqualified extends Error{}
export const NATIVE_FRAME_PROPERTIES_SOURCE=Object.freeze({start:0x521510,endExclusive:0x522554});
export const NATIVE_FRAME_PROPERTIES_KEYS=Object.freeze({slot94Cap:0x15f4578});

export function nativeActorFramePropertiesTick({state,dtMs,ports}={}){
 const next={timer344:timer(state?.timer344)};dtMs=uint(dtMs,'engine delta');
 const trace=[],propertyWrites=[];
 function invoke(name,args={}){
  if(!synchronous(ports?.[name]))throw new TypeError(`Explicit synchronous source port ${name} required`);
  const result=ports[name]({...args,state:{timer344:{...next.timer344}}});
  if(result&&typeof result.then==='function')throw TypeError(`Source port ${name} must complete synchronously`);
  trace.push({name,...args});
  if(result?.qualified!==true)throw new Unqualified(result?.reason??`${name}-unqualified`);
  return result;
 }
 const publish=()=>invoke('publishState',{value:{timer344:{...next.timer344}}});
 const value=(name,args)=>invoke(name,args).value;
 const registry=index=>number(value('readFloat',{index}),`Float${index}`);
 const actorByte=slot=>byte(value('readActorByte',{slot}),`actor slot${slot.toString(16)}`);
 const mode=()=>byte(value('readRuleMode34'),'rule mode34');
 const result=reason=>({qualified:true,state:next,reason,trace,propertyWrites,sourceRange:NATIVE_FRAME_PROPERTIES_SOURCE,
  sourceControlFlowImplemented:true,calledRoutineImplementationsVerified:false,nativeExecutionCompared:false,nativeReady:false});
 const identityPair=(pair,label)=>{
  if(!Array.isArray(pair)||pair.length!==2)throw TypeError(`Explicit ${label} DWORD pair required`);
  return pair.map((n,i)=>uint(n,label+i));
 };
 const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
 function ordinaryCap(){
  let cap=registry(108);
  if(actorByte(0x3c)===0&&byte(value('readActor52D5D0'),'52D5D0 result')===1)cap=registry(117);
  return cap;
 }
 function cap94(cap){
  if(number(value('readActorFloat',{slot:0x94}),'slot94')>cap){
   invoke('writeProperty52DF70',{key:NATIVE_FRAME_PROPERTIES_KEYS.slot94Cap,value:cap});
   propertyWrites.push({key:NATIVE_FRAME_PROPERTIES_KEYS.slot94Cap,value:cap});
  }
 }
 function resetTimer(clearLimit){
  next.timer344.count=0;next.timer344.elapsed=0;if(clearLimit)next.timer344.limit=0;publish();
 }
 function violation(reason,details){
  // Source error sequence is synchronous BEFORE clearing timer344 fields.
  const text=invoke('readErrorTextFEAAE0',{id:0x259}).value;
  if(typeof text!=='string')throw TypeError('Explicit source error text required');
  invoke('sendMessage52DC40',{key:0xf8,text,flag:1,reason,details});
  const integer114=uint(value('readInteger',{index:114}),'Integer114');
  invoke('invokeCD2E40',{integer114,arg0:0,reason,details});resetTimer(true);
  return result(reason);
 }
 const lookup=key=>{
  const item=invoke('lookupItem4CA3C0',{key:uint(key,'equipment lookup key')});
  boolean(item.exists,'equipment item presence');
  if(item.exists)uint(item.handle,'equipment item handle');return item;
 };
 function ruleRejects(policy,item){
  if(!policy.exists)return true;
  const record=invoke('readItemRuleDataC4D470',{itemHandle:item.handle});
  if(!Object.hasOwn(record,'value')||record.value===undefined)throw TypeError('Explicit source item rule data required');
  const data=record.value;
  return boolean(value('testEquipmentRule10969A0',{policy14:policy.policy14,itemData:data}),'equipment rule result');
 }
 try{
  const rule=invoke('readRule');if(!boolean(rule.exists,'rule presence'))return result('no-rule');
  const initialMode=mode();if([0x10,0x11,0x12].includes(initialMode))return result('excluded-rule-mode');
  if(mode()===0x14){
   const id=identityPair(value('readActorIdentitySlot2C'),'actor identity');id[1]&=0xffff;
   const excluded=invoke('readMode14ExclusionsDC99E0');
   const first=identityPair(excluded.first,'mode14 first exclusion'),second=identityPair(excluded.second,'mode14 second exclusion');
   if(same(id,first)||same(id,second))return result('mode14-excluded-actor');
   if(uint(value('readMode14RuleSlot0C'),'mode14 rule slot0C')===2)return result('mode14-rule-slot2');
  }
  if(byte(value('readManager48'),'manager48')===0){
   if(mode()!==0x0a)cap94(ordinaryCap());
   else if(boolean(invoke('readRuleField10').exists,'rule10 field10 presence')){
    const id=identityPair(value('readActorIdentitySlot2C'),'actor identity');id[1]&=0xffff;
    if(boolean(value('testRuleContainsActor1090830',{identity:id}),'rule actor membership')){
     const cap=registry(140);
     if(number(value('readActorFloat',{slot:0x94}),'slot94')>cap){
      const refreshed=registry(140);invoke('writeProperty52DF70',{key:NATIVE_FRAME_PROPERTIES_KEYS.slot94Cap,value:refreshed});
      propertyWrites.push({key:NATIVE_FRAME_PROPERTIES_KEYS.slot94Cap,value:refreshed});
     }
    }else cap94(ordinaryCap());
   }
   const cap=ordinaryCap();
   if(number(value('readActorFloat',{slot:0xc8}),'slotC8')>cap)invoke('writeActorSlotC4',{value:cap});
  }
  if(actorByte(0x210)!==0)return result('actor-slot210');
  if(actorByte(0x3c)!==0)return result('actor-slot3c');
  if(next.timer344.limit===0)return result('timer344-disabled');
  if(next.timer344.paused)return result('timer344-paused');
  next.timer344.count=(next.timer344.count+1)>>>0;next.timer344.elapsed=(next.timer344.elapsed+dtMs)>>>0;publish();
  if(next.timer344.limit>=next.timer344.elapsed)return result('timer344-active');
  resetTimer(false);
  const policy=invoke('readEquipmentOwnerPolicy52DE90');boolean(policy.exists,'equipment owner policy presence');
  if(policy.exists)uint(policy.policy14,'equipment owner policy14');
  const equipment=invoke('readEquipmentDE0470');boolean(equipment.exists,'equipment context presence');
  if(equipment.exists)uint(equipment.handle,'equipment context handle');
  if(policy.exists&&equipment.exists){
   for(let index=0;index<2;index++){
    const slot=invoke('readEquipmentSlot',{equipmentHandle:equipment.handle,method:0xde4f20,index});
    uint(slot.aux,'equipment slot auxiliary DWORD');
    const item=lookup(slot.key);
    if(item.exists&&ruleRejects(policy,item))return violation('equipment-first-group-rejected',{index,itemHandle:item.handle});
   }
   const ids=[0,0,0];
   for(let index=0;index<3;index++){
    const slot=invoke('readEquipmentSlot',{equipmentHandle:equipment.handle,method:0xde4e50,index});
    uint(slot.aux,'equipment slot auxiliary DWORD');const item=lookup(slot.key);
    if(item.exists)ids[index]=uint(value('readItemId5304A0',{itemHandle:item.handle}),'equipment item id');
   }
   for(let index=0;index<3;index++){
    for(let other=index+1;other<3;other++)if(ids[index]!==0&&ids[other]!==0&&ids[index]===ids[other])return violation('equipment-duplicate-id',{index,other,id:ids[index]});
    const item=lookup(ids[index]);
    if(item.exists&&ruleRejects(policy,item))return violation('equipment-second-group-rejected',{index,itemHandle:item.handle});
   }
  }
  invoke('afterEquipment522560');return result('equipment-validation-complete');
 }catch(error){
  if(error instanceof Unqualified)return {qualified:false,state:null,reason:error.message,trace,propertyWrites:[],sourceRange:NATIVE_FRAME_PROPERTIES_SOURCE,nativeReady:false};
  throw error;
 }
}

export function createNativeActorFramePropertiesPort({source,containerKey,ports}={}){
 if(typeof source!=='string'||!source.trim()||typeof containerKey!=='string'||!containerKey.trim()||!ports||typeof ports!=='object')throw TypeError('Explicit521510 source, owned container key and ports required');
 return (dtMs,api)=>{
  const container=api.readStateContainer();
  if(!container||!Object.hasOwn(container,containerKey))throw TypeError('Explicit owned521510 state required');
  const bound=Object.fromEntries(Object.entries(ports).map(([key,fn])=>[key,synchronous(fn)?request=>fn({...request,api}):fn]));
  bound.publishState=({value})=>{
   const current=api.readStateContainer();if(!Object.hasOwn(current,containerKey))throw TypeError('Owned521510 state disappeared');
   api.writeStateContainer({...current,[containerKey]:value});return {qualified:true};
  };
  const result=nativeActorFramePropertiesTick({state:container[containerKey],dtMs,ports:bound});
  if(!result.qualified)throw Error(`Native521510 refused: ${result.reason}`);
  return {...result,source};
 };
}
