import {Vector3} from 'three';
import {SCN_SCENE_SCALE} from './root-motion.js';
import {resolveRifleShots} from './rifle-contact.js';
import {rangedSourceQueryProfile} from './ranged-source-query.js';
import {conquestPawnNativeEllipsoidRayContact} from './conquest-handgun-pawn-ray-contact.js';
import {assertConquestHandgunPawnVariant} from './conquest-handgun-pawn-variant.js';
import {assertConquestPawnActorRuntime} from './conquest-pawn-actor-runtime.js';
import {ConquestPlayerMonsterCombat,assertConquestMonsterHealth,createConquestPlayerMonsterDamageRecord} from './conquest-player-monster-combat.js';
import {assertConquestPlayerDamageSource,assertConquestPawnDamageState,conquestPawnDamageRecordFlags} from './conquest-player-monster-damage-record.js';
import {assertConquestKingDamageNotification} from './conquest-king-damage-notification.js';
import {ConquestSmgCriticalPreparation} from './conquest-smg-critical-preparation.js';
import {ConquestSmgEquipmentPower,CONQUEST_SMG_PLAIN_ITEM_POLICY} from './conquest-smg-equipment-power.js';
import {ConquestSmgDamageComponents} from './conquest-smg-damage-components.js';
import {CONQUEST_SMG_SOURCE_DATA as data} from './conquest-smg-source-data.js';

const f=Math.fround;
export const CONQUEST_SMG_NPC_SHOT_POLICY=Object.freeze({id:'s5-conquest-smg2010001-plain-free2-linear-dropoff',itemKey:2010001,weaponType:2,attackAttribute:8,propertyPower:7,tempoDamage34:2,recordKind34:0,scalar:1,dropoff:'declared-S5-source-linear4000-8000-min0.2',queryArbitration:'s5-nearest-center-on-source-null134-ellipsoid',nativeDeliveryQualified:false,nativeReady:false});
const peer=words=>{if(!Array.isArray(words)||words.length!==2||words.some(v=>!Number.isInteger(v)||v<0||v>0xffffffff)||(words[1]>>>16&7)!==1)throw Error('Actual attacking player-kind1 peer required');return [...words];};
const sync=fn=>typeof fn==='function'&&fn.constructor.name==='Function';
// Source declaration's explicit S5 numerical policy; the native virtual2C
//consumer/current attack allocation and live final-record parity remain open.
export function conquestSmgDeclaredDropoff(distance){if(!Number.isFinite(distance)||distance<0)throw Error('Finite nonnegative native SMG distance required');return f(distance<=4000?1:Math.max(.2,1-(distance-4000)/4000*.8));}
function sourceDistance(actor,origin){const start=origin.toArray().map(n=>f(n/SCN_SCENE_SCALE)),center=[f(actor.positionNative.x),f(actor.positionNative.y+f(actor.height*f(.5))),f(actor.positionNative.z)],delta=center.map((n,i)=>f(n-start[i]));return f(Math.sqrt(f(f(f(delta[0]*delta[0])+f(delta[1]*delta[1]))+f(delta[2]*delta[2]))));}
function notification(binding,amount){
 const runtime=binding.runtime,current=runtime.manager.current,variant=assertConquestHandgunPawnVariant({actor:binding.actor,runtime});
 if(current===null)return {sourceCallbackQualified:true,currentStatePresent:false,transitionQueued:false,nativeReady:false};
 const candidates=[runtime.normal,runtime.run,runtime.damage,runtime.blow,runtime.death,runtime.attack,...(runtime.attacks??[])].filter(Boolean);
 const stateId=candidates.includes(current)?current.stateId:null,vtable=variant.stateTables[stateId];
 return {sourceCallbackQualified:stateId!==null&&Number.isInteger(vtable),stateId,vtable:vtable??null,inputAmount:amount,operation:0xa13c90,virtual44:stateId!==null&&vtable?0x7563f0:null,sourceNoop:stateId!==null&&!!vtable,transitionQueued:false,nativeReady:false};
}

// Capture runs at EACH real Controller substep. Resolution runs once after
//Avatar evaluates its mixer, before ordinary effects drain pendingShots.
// This owner borrows Health and never advances/owns the Controller or actor.
export function createConquestSmgNpcShots(config={}){
 config=Object.freeze({...config});
 const {playerId,playerActors,controller,sourceState,equipmentPowerOwner,criticalPreparation,monsterActors,runtimes,worldOwner,renderOwner}=config;
 if(config.policy!==CONQUEST_SMG_NPC_SHOT_POLICY||!(equipmentPowerOwner instanceof ConquestSmgEquipmentPower)||!(criticalPreparation instanceof ConquestSmgCriticalPreparation)||!(monsterActors instanceof Map)||!(runtimes instanceof Map)||!sync(config.readPlayerPeerId))throw Error('Actual SMG owners/maps/peer producer and immutable2010001 policy required');
 const queryProfile=rangedSourceQueryProfile('submachinegun',{expectedFunction:'StandardSubmachine'});
 if(queryProfile.queryType!==4||queryProfile.queryMask!==0x210fc0||queryProfile.attackIds.length!==1||queryProfile.sourceSha256!==data.sources['script/weapon_submachine.lua'])throw Error('Authenticated actual SMG ray/attribute source required');
 const combat=new ConquestPlayerMonsterCombat(config),components=new ConquestSmgDamageComponents(config),bindings=new Map(),captures=new WeakMap(),consumed=new WeakSet();let disposed=false,busy=false,last=Object.freeze([]),captureCount=0,deliveryCount=0;
 const live=()=>{if(disposed)throw Error('Disposed SMG NPC shot owner');assertConquestPlayerDamageSource({sourceState,playerId,playerActors,controller});equipmentPowerOwner.assertSource({controller,defenseState:sourceState.defenseState});criticalPreparation.assertSource({controller,defenseState:sourceState.defenseState});};
 const idle=()=>{live();if(busy)throw Error('Nonreentrant SMG binding/capture lifecycle required');};
 const bindingLive=actor=>{
  const b=bindings.get(actor);if(!b||monsterActors.get(actor.id)!==actor||actor.model!==b.model||runtimes.get(actor.id)!==b.runtime)throw Error('Current bound SMG NPC identity/runtime required');
  if(b.factoryOwner){assertConquestPawnActorRuntime(b.factoryOwner,{actor,model:b.model,runtime:b.runtime});if(b.factoryOwner.disposed)throw Error('Released SMG target factory');}
  b.runtime.assertActor(actor);assertConquestHandgunPawnVariant({actor,runtime:b.runtime});assertConquestPawnDamageState({pawnState:b.pawnState,actor,monsterActors});assertConquestMonsterHealth(b.health,{...config,actor});
  if(actor.spawnStats.monsterKey===1500)assertConquestKingDamageNotification(b.damageNotification,{actor,health:b.health,runtime:b.runtime,runtimes});return b;
 };
 const bind=({actor,pawnState,runtime,health,damageNotification,factoryOwner=null}={})=>{
  idle();if(bindings.has(actor)||monsterActors.get(actor?.id)!==actor||runtimes.get(actor.id)!==runtime)throw Error('Distinct current actual SMG target binding required');runtime.assertActor(actor);assertConquestHandgunPawnVariant({actor,runtime});assertConquestPawnDamageState({pawnState,actor,monsterActors});assertConquestMonsterHealth(health,{...config,actor});
  if(actor.spawnStats.monsterKey===1500)assertConquestKingDamageNotification(damageNotification,{actor,health,runtime,runtimes});else if(damageNotification!==undefined)throw Error('King-only numeric notification owner required');
  combat.bindMonster(actor,{receiver:health,ownership:'borrowed'});bindings.set(actor,{actor,model:actor.model,pawnState,runtime,health,damageNotification,factoryOwner});return actor;
 };
 const contactRay=({origin,direction,range})=>{
  live();const shape=Object.freeze({type:4,origin:Object.freeze(origin.toArray().map(n=>n/SCN_SCENE_SCALE)),direction:Object.freeze(direction.toArray()),length:range/SCN_SCENE_SCALE});let nearest=null;
  for(const [actor]of bindings){bindingLive(actor);const contact=conquestPawnNativeEllipsoidRayContact({origin:shape.origin,direction:shape.direction,length:shape.length,position80:['x','y','z'].map(k=>actor.positionNative[k]),width68:actor.width,height6c:actor.height,eligible44:actor.eligibleVirtual44,detailedVolume134:null});if(contact&&(!nearest||contact.centerDistance<nearest.contact.centerDistance))nearest={actor,contact};}
  if(!nearest)return null;return {target:nearest.actor,point:new Vector3().fromArray(nearest.contact.point).multiplyScalar(SCN_SCENE_SCALE),geometryPolicy:config.policy.queryArbitration,smgContact:nearest.contact,shape,fullQueryArbitrationQualified:false,nativeReady:false};
 };
 const contactTokens=new WeakMap();
 const assertGeometry=(geometry,actor)=>{const r=contactTokens.get(geometry);if(!r||r.actor!==actor||geometry.target!==actor||geometry.smgContact!==r.contact||geometry.shape!==r.shape||actor.model!==r.model||actor.width!==r.width||actor.height!==r.height||actor.eligibleVirtual44!==r.eligible||['x','y','z'].some((key,i)=>actor.positionNative[key]!==r.position[i]))throw Error('Actual current unmodified SMG NPC geometry required');};
 const consume=(shot,contact)=>{
  if(consumed.has(shot))throw Error('Actual SMG job already consumed');
  consumed.add(shot);const equipment=captures.get(shot);
  if(!contact.hit)return Object.freeze({shot,contact,delivered:false,status:'smg-no-npc-contact',nativeReady:false});
  if(!equipment)return Object.freeze({shot,contact,delivered:false,status:'smg-historical-activation-equipment-unavailable',nativeReady:false});
  equipmentPowerOwner.assertReceipt(equipment,{controller,defenseState:sourceState.defenseState});
  if(equipment.itemPolicy!==CONQUEST_SMG_PLAIN_ITEM_POLICY||equipment.itemKey!==2010001||equipment.weaponType!==2||equipment.attackAttribute!==8||equipment.propertyPower!==7||equipment.s5TempoDamage34!==2||equipment.critical.probabilityFactor!==1||equipment.arguments.additionalPower!==0)throw Error('Actual supported SMG2010001 no-wear FREE2 preparation required');
  const actor=contact.target,b=bindingLive(actor),geometry=contact.practiceContact;
  if(!geometry||!contactTokens.has(geometry)||geometry.target!==actor||!geometry.smgContact||contact.weapon!=='submachinegun')throw Error('Actual final SMG NPC ray contact required');assertGeometry(geometry,actor);const original={origin:contact.origin,point:contact.point,direction:contact.direction,from:contact.origin.toArray(),to:contact.point.toArray(),ray:contact.direction.toArray()};const actual=()=>{assertGeometry(geometry,actor);if(contact.target!==actor||contact.practiceContact!==geometry||contact.origin!==original.origin||contact.point!==original.point||contact.direction!==original.direction||['from','to','ray'].some((key,i)=>[contact.origin,contact.point,contact.direction][i].toArray().some((n,j)=>n!==original[key][j])))throw Error('SMG final contact changed during delivery');};
  if(!(b.pawnState.properties instanceof Map)||typeof b.pawnState.properties.get(0x15f458c)!=='boolean')throw Error('Actual target invincibility128 property required');
  if(b.pawnState.properties.get(0x15f458c))return Object.freeze({shot,contact,delivered:false,status:'smg-target-special-property-blocked',nativeReady:false});
  const sourcePeerId=peer(config.readPlayerPeerId({playerId,record:playerActors.get(playerId),controller}));live();bindingLive(actor);actual();
  const flags=conquestPawnDamageRecordFlags({pawnState:b.pawnState,runtime:b.runtime}),receipt=components.prepare({actor,pawnState:b.pawnState,equipmentReceipt:equipment,sourcePeerId,hitPart:geometry.smgContact.part});components.assertReceipt(receipt);actual();
  const distance=sourceDistance(actor,contact.origin),dropoff=conquestSmgDeclaredDropoff(distance),damage50=f(receipt.components.component0*dropoff),record=createConquestPlayerMonsterDamageRecord({attributeId:8,sourcePeerId10:sourcePeerId,creditOwnerPeerId78:sourcePeerId,damage50,...flags}),king=actor.spawnStats.monsterKey===1500;
  const delivery=combat.consumeWeaponContact(contact,{produceRecord:()=>{actual();return record;},...(king?{damageNotification:b.damageNotification,runtime:b.runtime,runtimes}:{})}),stateNotification=delivery.delivered&&['monster-hp-written','monster-hp-rejected'].includes(delivery.result.status)?(king?delivery.result.stateNotification??null:notification(b,delivery.result.stateNotificationInput)):null;
  if(delivery.delivered)deliveryCount++;
  return Object.freeze({shot,contact,equipmentPreparation:equipment,componentReceipt:receipt,record,delivery,notification:stateNotification,sourceDistance:distance,dropoff,delivered:delivery.delivered,status:'s5-provisional-smg-record-delivered',policy:config.policy.id,nativeFinalRecordQualified:false,nativeLiveCompared:false,nativeReady:false,provisionalStages:Object.freeze(['S5 selected2010001 plain item/no-wear/FREE2','S5 source-linear dropoff','S5 post-mixer muzzle/current aim geometry and nearest center','Record kind0 scalar1 and shooter credit','Native current-attack/delivery side effects not closed'])});
 };
 const api=Object.freeze({
  bindMonster:bind,
  bindActor(owner){idle();assertConquestPawnActorRuntime(owner,{actor:owner.actor,model:owner.model,runtime:owner.runtime});if(owner.disposed)throw Error('Live SMG target factory required');return bind({actor:owner.actor,pawnState:owner.damageState,runtime:owner.runtime,health:owner.health,damageNotification:owner.actor.spawnStats.monsterKey===1500?owner.damageNotification:undefined,factoryOwner:owner});},
  unbindActor(value){idle();const actor=value?.actor??value;if(!bindings.has(actor))return false;bindingLive(actor);combat.unbindMonster(actor);bindings.delete(actor);return true;},
  captureStep(){idle();const pending=controller.rifle.pendingShots,job=pending.at(-1);let captured=0;
   if(controller.events.includes('shot')&&job&&!captures.has(job)&&!job.contact){if(job.mapAttackSource!==controller.rifle.mapAttackSource||job.mapAttackSource?.weaponKey!=='submachinegun')throw Error('Actual current Controller SMG activation job required');const receipt=equipmentPowerOwner.prepare({criticalPreparation,shot:job});captures.set(job,receipt);captureCount++;captured++;}
   return Object.freeze({captured,pendingJobs:pending.length,unavailableJobs:pending.filter(job=>!job.contact&&!captures.has(job)).length,nativeReady:false});
  },
  resolveShots(avatar){idle();if(avatar?.weapon!=='submachinegun'||!avatar.group?.isObject3D||playerActors.get(playerId)?.model?.group!==avatar.group)throw Error('Actual current player SMG post-mixer avatar required');const pending=controller.rifle.pendingShots.filter(shot=>!shot.contact&&shot.delayRemaining<=0);if(!pending.length){last=Object.freeze([]);return last;}busy=true;const results=[];
   try{const geometry={contactRay:ray=>{const value=contactRay(ray);if(value){const actor=value.target;contactTokens.set(value,{actor,contact:value.smgContact,shape:value.shape,model:actor.model,width:actor.width,height:actor.height,eligible:actor.eligibleVirtual44,position:['x','y','z'].map(k=>actor.positionNative[k])});}return value;}};resolveRifleShots(controller,avatar,geometry,contact=>{const job=pending.find(shot=>shot.contact===contact);if(!job||contact.weapon!=='submachinegun')throw Error('Actual final SMG pending job/contact required');results.push(consume(job,contact));});last=Object.freeze(results);return last;}finally{busy=false;}
  },
  snapshot(){live();return {policy:config.policy.id,actorCount:bindings.size,capturedJobs:captureCount,deliveredRecords:deliveryCount,last:last.map(r=>({status:r.status,delivered:r.delivered,shotSerial:r.equipmentPreparation?.shotSerial??null,damage50:r.record?.damage50??null,nativeReady:false})),nativeReady:false};},
  dispose(){if(disposed)return;if(busy)throw Error('Cannot release delivering SMG shots');combat.dispose();components.dispose();bindings.clear();last=Object.freeze([]);disposed=true;},
 });live();return api;
}
