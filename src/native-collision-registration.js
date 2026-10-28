// S5Runtime PE 6bea9d8c…: identical registration tables in706040/706B40.
// These are exact node-name rules, NOT an `oct_` prefix category heuristic.
// Native admission/partition, cached .oct files and runtime enable changes
// still require an explicit world-owner contract before use by a query.
const materials=['ground','stone','steel','wood','water','glass'];
const rows=[];
for(const [suffix,high] of [['',0x6000],['_@',0x4000],['_#',0x2000],['_@#',0]]){
 for(const [index,material] of materials.entries())rows.push([`oct_land_${material}${suffix}`,high|(1<<index),0,1]);
}
rows.push(['oct_weapon',0x40,0,0],['oct_weapon_wire',0x40,1,0],
 ['oct_block_actor',0x20000,0,1],['oct_block_aiactor',0x40000,0,1],
 ['oct_block_alpha',0x80000,0,1],['oct_block_beta',0x100000,0,1]);

export const NATIVE_STATIC_COLLISION_REGISTRATION=Object.freeze(rows.map(([name,raw10,raw14,builderArgument])=>Object.freeze({
 name,raw10,raw14,raw18:0,raw34Initial:1,builderArgument,
})));
const byName=new Map(NATIVE_STATIC_COLLISION_REGISTRATION.map(row=>[row.name,row]));
const crcTable=Uint32Array.from({length:256},(_,index)=>{
 let crc=index;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);return crc>>>0;
});

//733D8D ->10194F0, table15F68C8: byte CRC32, no case folding.
// Only ASCII source names have a qualified byte encoding here.
export function nativeCollisionOwnerId(name){
 if(typeof name!=='string')throw TypeError('Explicit source owner name required');
 if(/[^\x01-\x7f]/.test(name))return null;
 let crc=0xffffffff;for(let index=0;index<name.length;index++)crc=(crc>>>8)^crcTable[(crc^name.charCodeAt(index))&255];
 return (crc^0xffffffff)>>>0;
}

export function nativeStaticCollisionRegistration(name){return byName.get(name)??null;}

// LoadStaticScene6FBEB0 reads verified[STATIC] object_%u resources, then
//6FC335/6FC37C parent the loaded scene to root1A0. This identifies the owner,
// not admission in the current native octree or runtime enable34.
export function nativeMainStaticCollisionOwner(bundle,nativeMapId,source){
 if(!Array.isArray(bundle?.variants))return null;
 const variants=bundle.variants.filter(variant=>variant.id===nativeMapId);
 if(variants.length!==1)return null;
 const variant=variants[0];if(!Array.isArray(variant.scenes)||!Array.isArray(variant.configs))return null;
 const refs=variant.scenes.filter(ref=>ref.path===source);
 if(refs.length!==1)return null;
 const ref=refs[0];
 if(ref.section!=='STATIC'||!/^object_[1-9]\d*$/.test(ref.key)||typeof ref.reference!=='string'||!ref.reference||typeof ref.owner!=='string'||!Number.isInteger(ref.line)||ref.line<=0)return null;
 if(typeof variant.bginfo!=='string'||!variant.bginfo||ref.owner!==variant.bginfo)return null;
 if(ref.resolution!=='canonical-path'||ref.path!==`model/background/${ref.reference}`)return null;
 const configs=variant.configs.filter(config=>config.path===ref.owner);
 if(configs.length!==1||configs[0].status!=='verified'||!Array.isArray(configs[0].entries))return null;
 const entries=configs[0].entries.filter(entry=>entry.section===ref.section&&entry.key===ref.key);
 const target=Number(ref.key.slice(7));
 const staticEntries=configs[0].entries.filter(entry=>entry.section==='STATIC');
 if(!Number.isSafeInteger(target)||target>staticEntries.length)return null;
 // The native loop starts at1 and stops at the first empty/missing object.
 for(let index=1;index<=target;index++){
  const sequence=staticEntries.filter(entry=>entry.key===`object_${index}`);
  if(sequence.length!==1||typeof sequence[0].value!=='string'||!sequence[0].value.trim())return null;
 }
 return entries.length===1&&entries[0].value===ref.reference&&entries[0].line===ref.line?'main-static-root1A0':null;
}

export function nativeSourceCollisionMetadata(name,owner=null){
 if(owner!==null&&!['standby-root1A4','main-static-root1A0'].includes(owner))throw TypeError('Qualified native collision owner required');
 const registration=nativeStaticCollisionRegistration(name);
 return registration===null&&owner===null?null:Object.freeze({registration,owner,
  partition:owner==='standby-root1A4'?'worldC':owner==='main-static-root1A0'?'world8':null,
  partitionConfirmed:owner!==null,runtimeEnabled:null,
  registrationRuleVerified:registration!==null,nativeAdmissionVerified:false});
}

//734E70 ->7B64D0: destructible piece collider, world+8, type80.
// Raw14 is a forwarded caller byte and raw18 a native owner-name ID. Neither
// is inferred from the separate combat category8000 or S5 instanceKey.
export function nativeDestructibleCollisionMetadata({name,instanceKey,ownerSourceName,readEnabled,sourceGeometry}){
 if(typeof name!=='string'||!name.startsWith('oct_')||typeof instanceKey!=='string'||!instanceKey||typeof ownerSourceName!=='string'||!ownerSourceName||typeof readEnabled!=='function'||typeof sourceGeometry!=='boolean')throw TypeError('Qualified destructible source binding required');
 const id=nativeCollisionOwnerId(ownerSourceName);
 return Object.freeze({registration:Object.freeze({name,raw10:0x80,raw14:null,raw18:id,raw34Initial:1,builderArgument:0}),
  partition:'world8',partitionConfirmed:true,owner:'destructible-piece734E70',instanceKey,ownerSourceName,registrationRuleVerified:true,nativeAdmissionVerified:true,sourceGeometry,
  nativeRecordIdVerified:id!==null,get runtimeEnabled(){const enabled=readEnabled();if(typeof enabled!=='boolean')throw TypeError('Explicit collision enable state required');return enabled;}});
}
