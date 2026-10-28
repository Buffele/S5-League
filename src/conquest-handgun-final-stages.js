import {SCN_SCENE_SCALE} from './root-motion.js';
import {ConquestHandgunEquipmentPower} from './conquest-handgun-equipment-power.js';
import {assertConquestPlayerDamageSource,conquestPawnDamageRecordFlags} from './conquest-player-monster-damage-record.js';

const f=Math.fround,receipts=new WeakMap();
const finite=(n,name)=>{if(!Number.isFinite(n)||!Number.isFinite(f(n)))throw Error('Explicit finite '+name+' required');return f(n);};
const vec=(v,name)=>{if(!Array.isArray(v)||v.length!==3)throw Error('Explicit native '+name+' vector required');return v.map(n=>finite(n,name));};
export const CONQUEST_HANDGUN_FINAL_STAGE_SOURCE=Object.freeze({damageApplyType:3,constantFloat33:.5,recordKind34Initial:0,
 attack17c8Initial:false,attack17d8Initial:false,attack17dbInitial:false,attack17ccInitial:0,
 playerRule12TargetMultiplier:1,sourceDistanceFunction:0x100b580,sourceDelivery:0x570890,
 constantSourceSha256:'170db9deb71847e98e2f4a6cea87e465ec0ef7f494a40a7d29f6564be41f7189',nativeReady:false});

// Original570E85..570F95. ApplyType2/3 use target center minus attack54,
// even when the contact's emitted point differs from that center. This is
// independent of the still-unidentified current virtual2C dropoff consumer.
export function conquestHandgunDeliveryDistance({applyType,targetCenter,attackStart54,contactPoint}={}){
 if(!Number.isInteger(applyType)||applyType<0||applyType>0xffffffff)throw Error('Explicit native damage apply type required');
 const center=vec(targetCenter,'target center'),start=vec(attackStart54,'attack54'),point=vec(contactPoint,'contact point'),base=applyType===2||applyType===3?start:point;
 const d=center.map((n,i)=>f(n-base[i]));
 return f(Math.sqrt(f(f(f(d[0]*d[0])+f(d[1]*d[1]))+f(d[2]*d[2]))));
}

// Instruction-block arithmetic only. These candidate fields never create a
// typed CDamageRecord or authorize HP. Scalar/workingPower owners are separate.
export function conquestHandgunCandidateRecordStorage({components,scalar,recordKind34}={}){
 if(![0,1].includes(recordKind34))throw Error('Explicit supported native recordKind34 required');
 const scale=finite(scalar,'actual scalar'),values=[0,1,2,3].map(i=>f(finite(components?.['component'+i],'component'+i)*scale)),index=recordKind34===1?2:0;
 return Object.freeze({candidate50:values[index],candidate5c:values[index+1],finalRecordQualified:false,nativeReady:false});
}

// Retained S5 shot/actor owner for the final NONNUMERIC source stages. The
// actual post-mixer S5 muzzle is an explicit attack54 adaptation, not a native
// attack pointer observation. No falloff multiplier or record50 is invented.
export class ConquestHandgunFinalStages{
 #config;#disposed=false;
 constructor(config={}){
  const {sourceState,playerId,playerActors,controller,equipmentPowerOwner}=config;
  assertConquestPlayerDamageSource({sourceState,playerId,playerActors,controller});
  if(!(equipmentPowerOwner instanceof ConquestHandgunEquipmentPower))throw Error('Actual Handgun equipment owner required');
  equipmentPowerOwner.assertSource({controller,defenseState:sourceState.defenseState});this.#config={...config};
 }
 #inputs({shot,actor,pawnState,runtime,equipmentPreparation}){
  if(this.#disposed)throw Error('Disposed Handgun final stages owner');
  const {sourceState,playerId,playerActors,controller,equipmentPowerOwner}=this.#config;
  assertConquestPlayerDamageSource({sourceState,playerId,playerActors,controller});
  equipmentPowerOwner.assertReceipt(equipmentPreparation,{controller,defenseState:sourceState.defenseState});
  if(shot!==controller.rifle?.lastShot||shot!==controller.rifle.lastResolvedShot||shot?.weapon!=='handgun'||shot.serial!==controller.rifle.shotSerial||shot.serial!==equipmentPreparation.shotSerial||!Number.isInteger(shot.serial)||shot.serial<=0||!shot.contact?.hit||shot.contact.target!==actor||shot.origin!==shot.contact.origin||![shot.origin,shot.contact.point,shot.contact.direction].every(v=>v?.isVector3))throw Error('Actual current resolved Handgun shot and final Pawn contact required');
  const flags=conquestPawnDamageRecordFlags({pawnState,runtime});runtime.assertActor(actor);
  if(!(pawnState.properties instanceof Map)||!pawnState.properties.has(0x15f458c)||typeof pawnState.properties.get(0x15f458c)!=='boolean')throw Error('Retained actual Pawn128 property owner required');
  const center=vec([actor.positionNative.x,f(actor.positionNative.y+f(actor.height*CONQUEST_HANDGUN_FINAL_STAGE_SOURCE.constantFloat33)),actor.positionNative.z],'current Pawn center');
  return {flags,center,start:vec(shot.origin.toArray().map(n=>n/SCN_SCENE_SCALE),'actual S5 muzzle'),point:vec(shot.contact.point.toArray().map(n=>n/SCN_SCENE_SCALE),'actual final contact'),direction:vec(shot.contact.direction.toArray(),'actual final direction'),invincible:pawnState.properties.get(0x15f458c)};
 }
 prepare(input={}){
  const x=this.#inputs(input),{shot,actor,pawnState,runtime,equipmentPreparation}=input;
  const geometry=Object.freeze({applyType:3,targetCenter:Object.freeze(x.center),attackStart54:Object.freeze(x.start),contactPoint:Object.freeze(x.point),
   distance:conquestHandgunDeliveryDistance({applyType:3,targetCenter:x.center,attackStart54:x.start,contactPoint:x.point}),
   sourceDistanceFormulaQualified:true,s5Attack54Adaptation:'current-post-mixer-muzzle',nativeAttack54ProducerQualified:false,nativeReady:false});
  const receipt=Object.freeze({geometry,recordKind34:0,flags:x.flags,attack17c8:false,attack17d8:false,attack17db:false,attack17cc:0,
   pawnInvincibility128:x.invincible,playerRule12TargetMultiplier:1,sourceConstructorAndRule12StagesQualified:true,
   currentNativeAttackInstanceQualified:false,dropoffMultiplier:null,record:null,
   unresolved:Object.freeze([...equipmentPreparation.unresolved,'native-attack54-world-geometry','handgun-current-virtual2C-linear-dropoff-consumer','handgun-570890-source6C-local-player-property-and-delivery-gates',...(x.invincible?['handgun-target-special-property128-branch']:[])]),nativeReady:false});
  receipts.set(receipt,{owner:this,input:{shot,actor,pawnState,runtime,equipmentPreparation},contact:shot.contact,origin:shot.origin,point:shot.contact.point,direction:shot.contact.direction,position:actor.positionNative,properties:pawnState.properties,x});return receipt;
 }
 assertReceipt(receipt){
  const r=receipts.get(receipt);if(r?.owner!==this)throw Error('Actual owned Handgun final stages receipt required');
  const x=this.#inputs(r.input),{shot,actor,pawnState}=r.input;
  if(shot.contact!==r.contact||shot.origin!==r.origin||shot.contact.point!==r.point||shot.contact.direction!==r.direction||actor.positionNative!==r.position||pawnState.properties!==r.properties||x.invincible!==r.x.invincible||['center','start','point','direction'].some(key=>x[key].some((n,i)=>n!==r.x[key][i]))||Object.keys(x.flags).some(key=>x.flags[key]!==r.x.flags[key]))throw Error('Stale/mutated Handgun shot or Pawn final stage owners');
  return receipt;
 }
 dispose(){this.#disposed=true;}
}
