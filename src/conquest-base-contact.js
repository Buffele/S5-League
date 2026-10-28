import {siegeObbOverlap} from './siege-zone.js';
const u32=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
// A1DCF0 consumes the LOW signed16 bits of the event's32-bit damage field.
export function conquestBaseDamageSigned16(raw){
 if(!u32(raw))throw Error('Explicit Conquest damage DWORD required');
 return (raw<<16)>>16;
}
// Predicate prefix of71EB00. Gate selector/health are qualified in base-gate;
// monster+68 points to the selected team's record (decoded byte at+8).
export function conquestBaseContactAdmitted({playing,isHost,gate,monster}={}){
 if(typeof playing!=='boolean'||typeof isHost!=='boolean')throw Error('Explicit native Conquest phase/host required');
 if(!playing||!isHost)return null;
 if(!gate||!Number.isInteger(gate.field30)||!Number.isInteger(gate.field28)||!Number.isInteger(gate.field2C))throw Error('Explicit native gate fields required');
 if(gate.field30<=0)return null;
 if(typeof monster?.eligibleVirtual44!=='boolean')throw Error('Explicit native monster predicate required');
 if(!monster.eligibleVirtual44)return null;
 // 71EC14 calls monster virtual38; its result+8 is decoded by4CA260.
 // 71EC3E/49 compare the byte widened to64 bits with gate+28/+2C.
 if(!Number.isInteger(monster?.identityByte8)||monster.identityByte8<0||monster.identityByte8>255)throw Error('Explicit decoded native monster identity byte required');
 if(gate.field28!==monster.identityByte8||gate.field2C!==0)return null;
 if(!siegeObbOverlap(gate.obb,monster.obb))return null;
 if(!Number.isFinite(monster.hp))throw Error('Explicit native monster HP required');
 if(monster.hp<=0)return null;
 return true;
}
export function conquestBaseDamageEvent({gate,monster,timeTokenRaw}){
 if(typeof gate.name!=='string'||!gate.name||!u32(monster.attribute150)||!Number.isInteger(timeTokenRaw)||timeTokenRaw< -0x80000000||timeTokenRaw>0xffffffff)throw Error('Explicit native base name/damage/time token required');
 // kind6 is the legacy S5 local discriminator, never a native wire type.
 // Original vtable13EFD50+0C→6E5300 returns12;9FFB00 is a no-op.
 // Source9FCBB0 stores the timestamp at+14 (not+4). CPU evidence lives in
 // base-volume-20261022/source.json; keep the logical timestamp unaltered.
 return {kind:6,nativeEventType:12,timeTokenRaw:timeTokenRaw>>>0,baseName:gate.name,damageRaw:monster.attribute150,
  damageSigned16:conquestBaseDamageSigned16(monster.attribute150),factory:'9FFCE0',queue:'A23F80',serverAccepted:false};
}
// Diagnostic pure intent; actual actor mutation/lookup/enqueue order is owned
// by ConquestRuntimeBridge.executeBaseContact, not a manufactured ACK.
export function conquestBaseContactIntent(source={}){
 if(!conquestBaseContactAdmitted(source))return null;
 const {monster}=source;
 if(typeof monster.aiScriptRegistered!=='boolean')throw Error('Explicit native AI resource lookup result required');
 // A0D620 loads Resources.ai_lua into row+19C. This is not a base-name lookup.
 const intent={actorChanges:{nativeHealth:0,nativeField33C:2},event:null};
 if(!monster.aiScriptRegistered)return intent;
 intent.event=conquestBaseDamageEvent(source);
 return intent;
}
