const f=Math.fround;
const uint=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
const finite=(value,name)=>{if(!Number.isFinite(value))throw new TypeError('Explicit finite '+name+' required');return f(value);};
const bool=(value,name)=>{if(typeof value!=='boolean')throw new TypeError('Explicit native '+name+' required');return value;};
const peer=value=>{if(!Array.isArray(value)||value.length!==2||!value.every(uint))throw new TypeError('Two native peer DWORDs required');return Object.freeze([...value]);};
export const CONQUEST_PLAYER_DAMAGE_PROFILES=Object.freeze({
 0x13aafdc:Object.freeze({vtable:0x13aafdc,recordReceiver:0x520600,recordConsumer:0x527d50,numericReceiver:0x519390}),
 0x13c1c14:Object.freeze({vtable:0x13c1c14,recordReceiver:0x520600,recordConsumer:0x527d50,numericReceiver:0x519390})
});
const records=new WeakSet();

// damage50 is the actual post-component, post-contact-scale logical field.
// No rawPower/AP/base_attack fallback is permitted at this boundary.
export function createConquestMonsterDamageRecord({attributeId,sourcePeerId10,creditOwnerPeerId78,damage50,field44,field47,field4a,field4d}){
 if(!uint(attributeId))throw new TypeError('Native attack attribute required');
 const record=Object.freeze({attributeId8:attributeId,sourcePeerId10:peer(sourcePeerId10),creditOwnerPeerId78:peer(creditOwnerPeerId78),damage50:finite(damage50,'record50'),
  field44:bool(field44,'record44'),field47:bool(field47,'record47'),field4a:bool(field4a,'record4A'),field4d:bool(field4d,'record4D'),nativeReady:false});
 records.add(record);return record;
}

// 520600's output flag is independent of whether player B8 actually changed HP.
export function conquestPlayerRecordReceiptFlag({field4a,field44,field47}){
 return !bool(field4a,'record4A')&&!bool(field44,'record44')&&bool(field47,'record47');
}

// The Conquest branch is proven through PLAYER B8=519390, whose special
// pre-HP exclusion is rule20 only. Rule12 reaches 97FA20 at5194B3. The HP
// arithmetic below is its shared base implementation, not a Sentry F0 port.
export function conquestPlayerNumericDamage({vtable,ruleId,hp94,maxHp9c,slot44,slot4c,attributeId8,damage50}){
 if(!CONQUEST_PLAYER_DAMAGE_PROFILES[vtable])throw new TypeError('Qualified player vtable required');
 if(ruleId!==12)throw new TypeError('Conquest rule12 required; other player B8 branches are separate');
 const hp=finite(hp94,'playerHP94'),maxHp=finite(maxHp9c,'playerMaxHP9C'),amount=finite(damage50,'record50');
 bool(slot44,'actor44');bool(slot4c,'actor4C');if(!uint(attributeId8))throw new TypeError('Native attribute8 required');
 if(hp<=0||!slot44||(attributeId8!==0x12&&slot4c))return {accepted:false,hpBefore:hp,hpAfter:hp,amountConsumed:0,nativeReady:false};
 const consumed=amount<hp?amount:hp,next=f(hp-consumed),after=next>=maxHp?maxHp:next;
 return {accepted:true,hpBefore:hp,hpAfter:after,amountConsumed:consumed,nativeReady:false};
}

// A concrete receiver for the S5 health owner. The caller supplies the source
// actor gates/class and maxHP explicitly; accepted records change target.hp.
// Reactions/conditions/UI notifications are not fabricated by this HP layer.
export class ConquestPlayerDamageReceiver{
 constructor({target,vtable,ruleId,maxHp,slot44,slot4c}){
  if(!target||!Number.isFinite(target.hp))throw new TypeError('Actual target health owner required');
  if(!CONQUEST_PLAYER_DAMAGE_PROFILES[vtable]||ruleId!==12)throw new TypeError('Qualified Conquest player profile required');
  this.target=target;this.profile={vtable,ruleId};this.maxHp=finite(maxHp,'player maximum HP');this.slot44=bool(slot44,'actor44');this.slot4c=bool(slot4c,'actor4C');this.currentRecord=null;this.lastDamage=null;
 }
 receive(record){
  if(record===null)return {accepted:false,status:'null-record',recordReceiptFlag:null,nativeReady:false};
  if(!records.has(record))throw new TypeError('Authenticated typed Conquest damage record required');
  this.currentRecord=record;
  const recordReceiptFlag=conquestPlayerRecordReceiptFlag(record);
  // 520600 stores actor158, then virtual268 dispatches527D50. Its counter
  // branch4A and guard branch44 are different consumers. Record47=false
  // skips both numericB8 calls; damage is never inferred from the attribute.
  if(record.field4a)return {accepted:false,status:'counter-branch-not-implemented',recordReceiptFlag,nativeReady:false};
  if(record.field44)return {accepted:false,status:'guard-branch-not-implemented',recordReceiptFlag,nativeReady:false};
  if(!record.field47)return {accepted:false,status:'record47-no-numeric-damage',recordReceiptFlag,nativeReady:false};
  if(record.field4d)return {accepted:false,status:'record4d-consumer-not-implemented',recordReceiptFlag,nativeReady:false};
  const decision=conquestPlayerNumericDamage({...this.profile,hp94:this.target.hp,maxHp9c:this.maxHp,slot44:this.slot44,slot4c:this.slot4c,attributeId8:record.attributeId8,damage50:record.damage50});
  if(decision.accepted){
   this.target.hp=decision.hpAfter;
   // Keep S5's existing health-owner boolean consistent, without selecting
   // a death clip, inventing a reaction or altering any native damage gate.
   if(typeof this.target.dead==='boolean')this.target.dead=decision.hpAfter<=0;
   // Native97FC31..4C retain source peer10 and attribute8, not credit owner78.
   this.lastDamage=Object.freeze({sourcePeerId:[...record.sourcePeerId10],attributeId:record.attributeId8,amountConsumed:decision.amountConsumed});
  }
  return {...decision,status:decision.accepted?'player-hp-written':'player-hp-rejected',sourcePeerId:[...record.sourcePeerId10],recordReceiptFlag,recordSideEffectsComplete:false};
 }
}
