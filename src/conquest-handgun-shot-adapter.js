import {Vector3} from 'three';
import {SCN_SCENE_SCALE} from './root-motion.js';
import {resolveRifleShots} from './rifle-contact.js';
import {ConquestHandgunPawnRayContactProducer} from './conquest-handgun-pawn-ray-contact.js';
import {ConquestHandgunEquipmentPower} from './conquest-handgun-equipment-power.js';
import {ConquestHandgunCriticalPreparation} from './conquest-handgun-critical-preparation.js';
import {ConquestHandgunFinalStages} from './conquest-handgun-final-stages.js';
import {ConquestPlayerMonsterCombat} from './conquest-player-monster-combat.js';
import {assertConquestPlayerDamageSource,conquestPawnDamageRecordFlags,produceConquestPlayerPawnDamageRecord} from './conquest-player-monster-damage-record.js';
import {assertConquestHandgunPawnVariant} from './conquest-handgun-pawn-variant.js';

const synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor?.name);
// Composition point after Avatar's mixer, before pending-shot VFX consumption.
// Reuses the actual muzzle/dispersion/wall/shield resolver. Only its FINAL
// contact is staged; the preliminary center ray never delivers damage.
export class ConquestHandgunShotAdapter{
 #config;#ray;#finalStages;#finalReceipts=new WeakMap();#pawns=new Map();#disposed=false;
 constructor(config={}){
  const {playerId,playerActors,controller,sourceState,equipmentPowerOwner,criticalPreparation,combat,readPlayerPeerId}=config;
  assertConquestPlayerDamageSource({sourceState,playerId,playerActors,controller});
  if(!(equipmentPowerOwner instanceof ConquestHandgunEquipmentPower)||!(criticalPreparation instanceof ConquestHandgunCriticalPreparation)||(combat!==undefined&&!(combat instanceof ConquestPlayerMonsterCombat))||(readPlayerPeerId!==undefined&&!synchronous(readPlayerPeerId)))throw Error('Actual Handgun equipment/critical owners and synchronous optional record consumer/peer reader required');
  criticalPreparation.assertSource({controller,defenseState:sourceState.defenseState});
  equipmentPowerOwner.assertSource({controller,defenseState:sourceState.defenseState});
  this.#config={...config};this.#ray=new ConquestHandgunPawnRayContactProducer(config);this.#finalStages=new ConquestHandgunFinalStages(config);this.lastResults=Object.freeze([]);
 }
 #current(){
  if(this.#disposed)throw Error('Disposed Conquest Handgun shot adapter');
  const {sourceState,playerId,playerActors,controller,criticalPreparation,equipmentPowerOwner}=this.#config;
  assertConquestPlayerDamageSource({sourceState,playerId,playerActors,controller});
  criticalPreparation.assertSource({controller,defenseState:sourceState.defenseState});
  equipmentPowerOwner.assertSource({controller,defenseState:sourceState.defenseState});
 }
 bindPawn({actor,pawnState,runtime}={}){
  this.#current();if(this.#pawns.has(actor))throw Error('Pawn shot owners already bound');
  // Checks the private pawnState registry/model binding and runtime actor.
  conquestPawnDamageRecordFlags({pawnState,runtime});runtime.assertActor(actor);
  if(this.#config.monsterActors.get(actor.id)!==actor)throw Error('Current source Pawn shot owner required');assertConquestHandgunPawnVariant({actor,runtime});
  this.#pawns.set(actor,{pawnState,runtime});
 }
 releasePawn(actor){this.#pawns.delete(actor);}
 assertFinalStagesReceipt(receipt){
  this.#current();const r=this.#finalReceipts.get(receipt);
  if(!r||this.#pawns.get(r.actor)!==r.owners)throw Error('Current adapter-bound Pawn final stages receipt required');
  return this.#finalStages.assertReceipt(receipt);
 }
 #contactRay({origin,direction,range}){
  const shape=Object.freeze({type:4,origin:Object.freeze(origin.toArray().map(n=>n/SCN_SCENE_SCALE)),direction:Object.freeze(direction.toArray()),length:range/SCN_SCENE_SCALE});
  let closest=null;
  for(const [actor,{runtime}] of this.#pawns){
   runtime.assertActor(actor);
   const contact=this.#ray.queryCandidate({actor,shape});
   if(contact&&(!closest||contact.centerDistance<closest.contact.centerDistance))closest={actor,contact};
  }
  if(!closest)return null;
  return {target:closest.actor,point:new Vector3().fromArray(closest.contact.point).multiplyScalar(SCN_SCENE_SCALE),
   geometryPolicy:'source-Pawn'+closest.actor.spawnStats.monsterKey+'-null134-ellipsoid; S5-nearest-center-candidate',pawnContact:closest.contact,shape,
   fullQueryArbitrationQualified:false,shotGeometryProducerQualified:false,nativeReady:false};
 }
 resolveRifleShots(avatar){
  if(this.#disposed)throw Error('Disposed Conquest Handgun shot adapter');
  const {controller,equipmentPowerOwner,criticalPreparation,sourceState,combat,readPlayerPeerId,playerId,playerActors}=this.#config;
  if(controller.weapon!=='handgun'){this.lastResults=Object.freeze([]);return this.lastResults;}
  this.#current();
  const pending=controller.rifle.pendingShots.filter(shot=>!shot.contact&&shot.delayRemaining<=0);
  if(!pending.length){this.lastResults=Object.freeze([]);return this.lastResults;}
  if(pending.some(shot=>shot.weapon!=='handgun'))throw Error('Only actual Handgun pending shots may use the Conquest Handgun adapter');
  // Current equipment receipts cannot impersonate a historical queued shot.
  // Older shots retain their real geometry but their absent snapshot is gated.
  const equipment=new Map();
  for(const shot of pending)if(shot===controller.rifle.lastShot){
   const receipt=equipmentPowerOwner.prepare({criticalPreparation,shot});
   equipmentPowerOwner.assertReceipt(receipt,{controller,defenseState:sourceState.defenseState});equipment.set(shot,receipt);
  }
  const results=[],geometry={contactRay:ray=>this.#contactRay(ray)};
  resolveRifleShots(controller,avatar,geometry,contact=>{
   const shot=pending.find(candidate=>candidate.contact===contact);
   if(!shot||shot.weapon!=='handgun'||contact.weapon!=='handgun')throw Error('Actual final Handgun pending-shot contact required');
   const receipt=equipment.get(shot),unresolved=[];let stage=null,delivery=null;
   if(contact.hit){
    const candidate=contact.practiceContact,owners=this.#pawns.get(contact.target);
    if(!candidate||!owners)throw Error('Actual bound Pawn final ray contact required');
    this.#ray.assertContact(candidate.pawnContact,{actor:contact.target,shape:candidate.shape});
    let sourcePeerId;
    if(readPlayerPeerId){
     sourcePeerId=readPlayerPeerId({playerId,record:playerActors.get(playerId),controller});
     if(!Array.isArray(sourcePeerId)||sourcePeerId.length!==2||sourcePeerId.some(n=>!Number.isInteger(n)||n<0||n>0xffffffff)||(sourcePeerId[1]>>>16&7)!==1)throw Error('Actual synchronous native player-kind1 peer DWORDs required');
    }else unresolved.push('native-player-peer-identity-owner');
    this.#current();
    stage=produceConquestPlayerPawnDamageRecord({sourceState,...owners,sourcePeerId,hitPart:candidate.pawnContact.part,
     ...(receipt?{equipmentPowerOwner,equipmentPowerReceipt:receipt}:{})});
    unresolved.push(...stage.unresolved,'handgun-native-full-query-arbitration-and-shot-geometry');
    if(!receipt)unresolved.push('handgun-pending-shot-equipment-snapshot-unavailable');
    // No raw power/contact.damage conversion exists here. A future final
    // record must also close peer, geometry and current-delivery gates.
    if(stage.record!==null)throw Error('Handgun adapter final record gates have not been qualified');
    if(combat)delivery=combat.consumeWeaponContact(contact,{produceRecord:()=>stage.record});
    else unresolved.push('conquest-player-monster-final-record-consumer-unbound');
   }
   results.push({shot,contact,equipmentPreparation:receipt??null,stage,delivery,
    status:contact.hit?'handgun-final-record-producer-unresolved':'handgun-shot-no-pawn-contact',
    unresolved,nativeReady:false});
  });
  // The resolver publishes lastResolvedShot after its final-contact callback.
  // Bind FinalStages only now, to that actual completed current shot/contact.
  this.lastResults=Object.freeze(results.map(result=>{
   let finalStagesPreparation=null;
   if(result.contact.hit&&result.equipmentPreparation){
    const actor=result.contact.target,owners=this.#pawns.get(actor),candidate=result.contact.practiceContact;
    if(!owners||!candidate)throw Error('Current bound final Pawn contact required after shot resolution');
    this.#ray.assertContact(candidate.pawnContact,{actor,shape:candidate.shape});
    finalStagesPreparation=this.#finalStages.prepare({shot:result.shot,actor,...owners,equipmentPreparation:result.equipmentPreparation});
    this.#finalReceipts.set(finalStagesPreparation,{actor,owners});result.unresolved.push(...finalStagesPreparation.unresolved);
   }
   return Object.freeze({...result,finalStagesPreparation,unresolved:Object.freeze([...new Set(result.unresolved)])});
  }));return this.lastResults;
 }
 dispose(){this.#pawns.clear();this.#ray.dispose();this.#finalStages.dispose();this.#disposed=true;}
}
