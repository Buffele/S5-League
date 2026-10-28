// Source actor13AAFDC B0/B4 ->97F9A0/97F9E0, and51C2F0 condition ports.
// Decoded current property/condition storage is supplied by the runtime owner.
// A qualified property miss has the source zero default; unknown storage fails.
const f=Math.fround;
const number=(n,label)=>{if(!Number.isFinite(n)||!Number.isFinite(f(n)))throw TypeError(`Finite native ${label} required`);return f(n);};
const uint=(n,label)=>{if(!Number.isInteger(n)||n<0||n>0xffffffff)throw TypeError(`Explicit uint32 ${label} required`);return n;};
const sync=(fn,label)=>{if(typeof fn!=='function'||['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name))throw TypeError(`Synchronous ${label} port required`);return fn;};
const valueSync=value=>{if(value&&typeof value.then==='function')throw TypeError('Native property ports must complete synchronously');return value;};
export const NATIVE_ACTOR_PROPERTY_KEYS=Object.freeze({terminalSpeed:0x15f455c,gravity:0x15f4558});

export function createNativeActorPropertyPorts({source,readProperty,readConditionList,readFloat}={}){
 if(typeof source!=='string'||!source.trim())throw TypeError('Explicit property/condition source required');
 [readProperty,readConditionList,readFloat].forEach(fn=>sync(fn,'current property/condition/registry'));
 const registry=index=>number(valueSync(readFloat(index)),`Float${index}`);
 function property(key){
  // Both getters initialize the output to the image literal +0 before52DCA0.
  const lookup=valueSync(readProperty(key));
  if(lookup?.qualified!==true||typeof lookup.found!=='boolean')throw TypeError('Qualified current property lookup required');
  return lookup.found?number(lookup.value,'property value'):0;
 }
 function records(){
  const list=valueSync(readConditionList());
  if(list?.complete!==true||!Array.isArray(list.records))throw TypeError('Complete current actor208 condition list required');
  return list.records;
 }
 const active=record=>{
  const result=valueSync(sync(record?.isActive54,'condition54').call(record));
  if(typeof result!=='boolean')throw TypeError('Explicit condition active result required');return result;
 };
 const type=record=>uint(valueSync(sync(record?.getType60,'condition60').call(record)),'condition type');
 function hasType(wanted){
  //54B110 requires active54 BEFORE type60 and returns at the first match.
  for(const record of records())if(record!==null&&active(record)&&type(record)===wanted)return true;
  return false;
 }
 function hasGate(wanted){
  //54B1C0 queries active54 then gate50; it does not compare type60.
  for(const record of records())if(record!==null&&active(record)){
   const result=valueSync(sync(record?.testGate50,'condition50').call(record,wanted));
   if(typeof result!=='boolean')throw TypeError('Explicit condition gate result required');
   if(result)return true;
  }
  return false;
 }
 function firstType(wanted){
  //54B310 deliberately omits active54; an inactive first type can be selected
  // after hasType has found a different active condition of that same type.
  for(const record of records()){
   if(record===null)throw TypeError('Condition getter dereferences each source entry; null is unqualified');
   if(type(record)===wanted)return record;
  }
  return null;
 }
 return {
  source,
  readTerminalSpeed:()=>property(NATIVE_ACTOR_PROPERTY_KEYS.terminalSpeed),
  readGravity:()=>property(NATIVE_ACTOR_PROPERTY_KEYS.gravity),
  readActorPolicy:request=>{
   if(!Array.isArray(request?.displacement)||request.displacement.length!==3)throw TypeError('Current forwarded Actor70 displacement required');
   let [x,y,z]=request.displacement.map(n=>number(n,'displacement'));
   const horizontalBlocked=hasGate(1);
   if(horizontalBlocked){
    x=registry(0);z=registry(0);
    // nativePushActorWrites represents the measured +0 registry case. Do not
    // silently pass an unqualified nonzero Float0 through its Boolean gate.
    if(x!==0||z!==0)throw RangeError('Actor70 Boolean gate requires the qualified zero Float0 value');
   }
   let horizontalMultiplier=1;
   if(hasType(0x400)&&hasGate(4)){
    const condition=firstType(0x400);
    if(condition!==null){horizontalMultiplier=number(valueSync(sync(condition.readField40,'condition40').call(condition)),'condition40 multiplier');x=f(x*horizontalMultiplier);z=f(z*horizontalMultiplier);}
   }
   // A pure downward vector bypasses the cap and its registry reads. The
   // consumer accepts zero as an unused limit for that exact branch.
   const maxDistance=y<0&&x===0&&z===0?0:f(registry(108)*registry(42));
   if(!Number.isFinite(maxDistance)||maxDistance<0)throw RangeError('Nonnegative finite source actor cap required');
   return {horizontalBlocked,horizontalMultiplier,maxDistance};
  },
 };
}
