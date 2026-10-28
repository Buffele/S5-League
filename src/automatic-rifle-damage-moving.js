// Scoped original-source kernels, not automatic HP→reaction admission.
// Proof: automatic-rifle-reactions-20261017/executable-consumers-20261023.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const uint=(value,name)=>{if(!Number.isInteger(value)||value<0||value>0xffffffff)throw TypeError(`Explicit unsigned ${name} required`);return value;};
const byte=(value,name)=>{uint(value,name);if(value>255)throw TypeError(`Explicit byte ${name} required`);return value;};
export const AUTOMATIC_RIFLE_DAMAGE_ATTRIBUTES=freeze({
 semirifle:{attributeId8:34,sourceName:'ATTACKATTRIB_SMG2',duration28:0,damageMovingE8:1},
 submachinegun:{attributeId8:8,sourceName:'ATTACKATTRIB_SUBMACHINE_GUN',duration28:0,damageMovingE8:1},
 assaultrifle:{attributeId8:85,sourceName:'ATTACKATTRIB_CLASSICRIFLE',duration28:0,damageMovingE8:1},
 smashrifle:{attributeId8:57,sourceName:'ATTACKATTRIB_SMG3_GUN',duration28:0,damageMovingE8:1},
});
export const AUTOMATIC_RIFLE_PLAYER_PARTIAL_ATTRIBUTE=freeze({clip:'00016',riseMs:30,fallMs:100,amplitude:.2,nativeReady:false});
export const AUTOMATIC_RIFLE_RECIPIENT_DISPATCH=freeze({
 0x13aafdc:{recipient:'player',recordReceiver:0x520600,recordConsumer:0x527d50,numericReceiver:0x519390,partialVirtual260:0x5206b0},
 0x13c1c14:{recipient:'player',recordReceiver:0x520600,recordConsumer:0x527d50,numericReceiver:0x519390,partialVirtual260:0x5206b0},
 0x13f0244:{recipient:'monster',recordReceiver:0xa03a80,recordConsumer:0xa05a80,numericReceiver:0xa041f0,partialVirtual260:null},
});

// Full60BCE0: missing record/attribute PRESERVES fields, never invents false.
// E8 is an enum: only ENABLE1 is true; DISABLE2/UNKNOWN0 are both false.
// The record mode30 changes158 only for1..4. Attribute10 is retained in18C.
export function automaticRifleDamageAttributeStep({state158,state180,state18c,record}={}){
 const next={state158:uint(state158,'state158'),state180:byte(state180,'state180'),state18c:uint(state18c,'state18C')};
 if(record===null)return Object.freeze(next);
 if(!record||typeof record!=='object')throw TypeError('Explicit logical record or null required');
 const mode=uint(record.mode30,'record30');if(mode>=1&&mode<=4)next.state158=mode;
 if(record.attribute===null)return Object.freeze(next);
 if(!record.attribute||typeof record.attribute!=='object')throw TypeError('Explicit attribute lookup result or null required');
 next.state180=uint(record.attribute.damageMovingE8,'attributeE8')===1?1:0;
 next.state18c=uint(record.attribute.field10,'attribute10');return Object.freeze(next);
}

// Original input/query wrappers use byte!=0 after the attribute setter. These
// events name exact lower-router ports; no velocity or collision is produced.
export function automaticRifleLowerMovementPlan({enabled180,operation,input,lowerResult}={}){
 const enabled=byte(enabled180,'state180')!==0,calls=[];let result=null;
 if(operation==='input'){
  uint(input,'input');calls.push({address:0x501d40,ownerOffset:0,args:[input]});
  if(enabled)calls.push({address:0x62a3e0,ownerOffset:0x16c,args:[input]});
 }else if(operation==='input16'){
  uint(input,'input');if(enabled)calls.push({address:0x62a510,ownerOffset:0x16c,args:[input&0xffff]});
 }else if(operation==='query'){
  if(enabled){uint(lowerResult,'lower result');calls.push({address:0x62a4c0,ownerOffset:0x16c,args:[]});result=lowerResult<<16>>16;}else result=-1;
 }else throw TypeError('Qualified lower operation input/input16/query required');
 return freeze({calls,result,physicalDisplacementProduced:false,nativeReady:false});
}

// Bounded52924B..52939C AFTER actor3C has returned and earlier receiver gates
// have admitted this branch. This does not authorize arrival from accepted HP.
// Both actor3C values take the same duration0 route, then source-peer callback
// BEFORE partialVirtual260(attribute). Full state518E20 is never requested.
export function automaticRifleZeroDurationPlayerPlan({recipientVtable,weapon,actor3C,sourcePeerId10}={}){
 const profile=AUTOMATIC_RIFLE_RECIPIENT_DISPATCH[recipientVtable],attribute=AUTOMATIC_RIFLE_DAMAGE_ATTRIBUTES[weapon];
 if(profile?.recipient!=='player'||!attribute)throw TypeError('Qualified player table and explicit automatic rifle required');
 if(typeof actor3C!=='boolean'||!Array.isArray(sourcePeerId10)||sourcePeerId10.length!==2)throw TypeError('Explicit actor3C and two source peer DWORDs required');
 sourcePeerId10.forEach(v=>uint(v,'source peer'));
 return freeze({calls:[{address:0x520bb0,args:[...sourcePeerId10]},{address:profile.partialVirtual260,virtualOffset:0x260,args:[attribute.attributeId8]}],
  fullDamageStateRequested:false,damageMovingStateEntered:false,physicalDisplacementProduced:false,
  upstreamAdmissionQualified:false,nativeReady:false});
}
