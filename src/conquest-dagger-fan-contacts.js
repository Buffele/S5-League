import {Vector3} from 'three';
import {Controller} from './controller.js';
import {CombatState} from './combat-state.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestDaggerCutEquipmentPower} from './conquest-dagger-equipment-power.js';
import {assertConquestDaggerCutRuntime} from './conquest-dagger-player-profile.js';
import {assertConquestPlayerDamageSource,assertConquestPawnDamageState} from './conquest-player-monster-damage-record.js';
import {readConquestPlayerAttackProfile,assertConquestPlayerAttackFields,readConquestMonsterAttackFields} from './conquest-player-attack-profile.js';
import {assertConquestHandgunPawnVariant} from './conquest-handgun-pawn-variant.js';
import {assertConquestMonsterHealth} from './conquest-player-monster-combat.js';
import {assertConquestPawnActorRuntime} from './conquest-pawn-actor-runtime.js';
import {assertConquestAttackWorldQueries} from './conquest-attack-world-queries.js';
import {getSpyDaggerAttackProfile,SPY_DAGGER_ITEM} from './spy-dagger-data.js';
import {meleeFanContact,meleeShapeImpactPoint,worldMeleeFan} from './native-melee.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';

const f=Math.fround,receipts=new WeakMap(),contactOwners=new WeakMap();
const xyz=['x','y','z'],rootOf=node=>{while(node?.parent)node=node.parent;return node;};
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const nativePosition=actor=>xyz.map(k=>{const n=actor.positionNative[k];if(!Number.isFinite(n)||!Number.isFinite(f(n)))throw Error('Actual finite Dagger NPC position required');return n;});
const pointArray=value=>{if(!Array.isArray(value)||value.length!==3||value.some(n=>!Number.isFinite(n)))throw Error('Actual native Dagger obstruction point required');return Object.freeze([...value]);};

// Named S5 policy, not complete540950/x87/registry/qsort equivalence. Candidate
// topology is the actual owned Map; equal-distance contacts retain its order.
export const CONQUEST_DAGGER_FAN_CONTACT_POLICY=Object.freeze({id:'s5-conquest-dagger-primary-fan-source-bounds-js-map-stable',
 itemKey:2000006,shapeType:3,range:250,math:'existing-native-melee-JS-scalar-and-trig',
 roster:'complete-actual-monster-Map-insertion-order',equalDistanceOrder:'stable-Map-order',
 part:0,obstructionMask:0x2107c0,obstructionRawFlag:false,nativeReady:false});

export function createConquestDaggerFanContacts(config={}){
 config=Object.freeze({...config});
 const {playerId,playerActors,controller,sourceState,equipmentPowerOwner,monsterActors,runtimes,worldOwner,renderOwner,worldQueries,sideContext,playerAttackProfile}=config;
 const player=playerActors?.get(playerId),model=player?.model,position=controller?.position;
 if(config.policy!==CONQUEST_DAGGER_FAN_CONTACT_POLICY||!(playerActors instanceof Map)||!(monsterActors instanceof Map)||!(runtimes instanceof Map)||!(controller instanceof Controller)||player?.controller!==controller||!(player.combatState instanceof CombatState)||controller.world!==worldOwner||!model?.group?.isObject3D||!renderOwner?.isObject3D||rootOf(model.group)!==renderOwner||!(equipmentPowerOwner instanceof ConquestDaggerCutEquipmentPower))throw Error('Actual Dagger source/model/scene, owned Maps and immutable FAN policy required');
 const healthConfig={monsterActors,playerActors,worldOwner,renderOwner},bindings=new Map();let disposed=false,busy=false,revision=0;
 function source({attackFields=false}={}){
  if(disposed||playerActors.get(playerId)!==player||player.controller!==controller||controller.position!==position||controller.world!==worldOwner)throw Error('Current owned Dagger FAN source/model required');
  assertConquestPlayerDamageSource({sourceState,playerId,playerActors,controller});
  if(!attackFields)return null;
  if(controller.weapon!=='dagger'||player.combatState.dead||player.model!==model||rootOf(model.group)!==renderOwner)throw Error('Current living Dagger FAN attacker/model required');
  const fields=readConquestPlayerAttackProfile(playerAttackProfile);assertConquestPlayerAttackFields(fields,{controller,combatState:player.combatState,model});
  assertConquestAttackWorldQueries(worldQueries,{world:worldOwner});return fields;
 }
 function idle(){source();if(busy)throw Error('Nonreentrant Dagger FAN lifecycle required');}
 function target(actor){
  const b=bindings.get(actor);
  if(!b||!(actor instanceof ConquestMonsterActor)||monsterActors.get(actor.id)!==actor||actor.model!==b.model||b.model.group!==b.group||rootOf(b.group)!==renderOwner||runtimes.get(actor.id)!==b.runtime)throw Error('Current actual Dagger FAN NPC/model/runtime binding required');
  if(b.factoryOwner){assertConquestPawnActorRuntime(b.factoryOwner,{actor,model:b.model,runtime:b.runtime});if(b.factoryOwner.disposed)throw Error('Released Dagger FAN target owner');}
  assertConquestHandgunPawnVariant({actor,runtime:b.runtime});assertConquestPawnDamageState({pawnState:b.pawnState,actor,monsterActors});assertConquestMonsterHealth(b.health,{...healthConfig,actor});
  return b;
 }
 function coverage(){if(bindings.size!==monsterActors.size)throw Error('Complete actual Dagger FAN NPC roster required');for(const [id,actor]of monsterActors){if(actor.id!==id)throw Error('Actual Dagger FAN Map actor ID required');target(actor);}}
 function frame(b){
  b.group.updateWorldMatrix(true,true);
  const side=readConquestMonsterAttackFields({actorId:b.actor.id,actor:b.actor,monsterActors,sideContext}).fields.actor1aa;
  return {position:nativePosition(b.actor),width:b.actor.width,height:b.actor.height,eligible:b.actor.eligibleVirtual44,side,mixerTime:b.model.mixer.time,matrix:[...b.group.matrixWorld.elements]};
 }
 function assertFrame(actor,snapshot){const b=target(actor),current=frame(b);if(current.width!==snapshot.width||current.height!==snapshot.height||current.eligible!==snapshot.eligible||current.side!==snapshot.side||current.mixerTime!==snapshot.mixerTime||!same(current.position,snapshot.position)||!same(current.matrix,snapshot.matrix))throw Error('Current unmodified post-mixer Dagger FAN NPC geometry required');return b;}
 function sourceFrame(attack,equipmentReceipt,avatar,index){
  const fields=source({attackFields:true});
  if(index!==0||assertConquestDaggerCutRuntime(controller)!==attack||avatar!==model||avatar.weapon!=='dagger')throw Error('Actual current primary cut/index0 post-mixer avatar required');
  ConquestDaggerCutEquipmentPower.prototype.assertReceipt.call(equipmentPowerOwner,equipmentReceipt,{controller,defenseState:sourceState.defenseState});
  if(equipmentReceipt.itemKey!==SPY_DAGGER_ITEM.key||equipmentReceipt.weaponType!==24)throw Error('Current classic Dagger FAN equipment required');
  const facing=attack.facing??controller.facing;if(!Number.isFinite(facing))throw Error('Current finite Dagger cut facing required');
  avatar.group.updateWorldMatrix(true,true);
  return {attack,equipmentReceipt,avatar,index,sourceSide:fields.fields.actor1aa,position:xyz.map(k=>controller.position[k]),facing,time:attack.time,phase:attack.phase,mixerTime:avatar.mixer.time,matrix:[...avatar.group.matrixWorld.elements],revision};
 }
 function assertSourceFrame(s){const current=sourceFrame(s.attack,s.equipmentReceipt,s.avatar,s.index);if(s.revision!==revision||current.sourceSide!==s.sourceSide||current.facing!==s.facing||current.time!==s.time||current.phase!==s.phase||current.mixerTime!==s.mixerTime||!same(current.position,s.position)||!same(current.matrix,s.matrix))throw Error('Current unmodified Dagger FAN activation/source pose required');}
 function bindMonster({actor,pawnState,runtime,health,factoryOwner=null}={}){
  idle();if(bindings.has(actor)||monsterActors.get(actor?.id)!==actor||runtimes.get(actor.id)!==runtime)throw Error('Distinct actual current Dagger FAN NPC binding required');
  const b={actor,pawnState,runtime,health,model:actor.model,group:actor.model.group,factoryOwner};bindings.set(actor,b);
  try{target(actor);}catch(error){bindings.delete(actor);throw error;}revision++;return actor;
 }
 function publish(s,contacts,blocked,frames,status,details={}){
  const receipt=Object.freeze({status,contacts:Object.freeze(contacts),blocked:Object.freeze(blocked),policy:config.policy.id,...details,nativeReady:false});
  receipts.set(receipt,{owner:api,s,frames,revision});for(const contact of contacts)contactOwners.set(contact,{owner:api,receipt,actor:contact.target,frame:frames.get(contact.target),point:contact.point.toArray()});return receipt;
 }
 const api=Object.freeze({
  bindMonster,
  bindActor(owner){idle();assertConquestPawnActorRuntime(owner,{actor:owner.actor,model:owner.model,runtime:owner.runtime});if(owner.disposed)throw Error('Live actual Dagger target factory required');return bindMonster({actor:owner.actor,pawnState:owner.damageState,runtime:owner.runtime,health:owner.health,factoryOwner:owner});},
  unbindActor(value){idle();const actor=value?.actor??value;if(!bindings.has(actor))return false;target(actor);bindings.delete(actor);revision++;return true;},
  query({attack,index,equipmentReceipt,avatar}={}){
   idle();busy=true;
   try{
    coverage();const s=sourceFrame(attack,equipmentReceipt,avatar,index),shape=getSpyDaggerAttackProfile('cut',{range:config.policy.range}).contacts[0].shape;
    const pose={position:{x:s.position[0],y:s.position[1],z:s.position[2]},facing:s.facing},fan=worldMeleeFan(shape,pose),origin=fan.anchor.map(n=>n/SCN_SCENE_SCALE),frames=new Map(),candidates=[];
    for(const actor of monsterActors.values()){
     const b=target(actor),v=frame(b);frames.set(actor,v);
     if(!v.eligible||v.side===s.sourceSide)continue;
     const victim={position:{x:v.position[0]*SCN_SCENE_SCALE,y:v.position[1]*SCN_SCENE_SCALE,z:v.position[2]*SCN_SCENE_SCALE}},body={width:v.width*SCN_SCENE_SCALE,height:v.height*SCN_SCENE_SCALE};
     if(!meleeFanContact(shape,pose,victim,body))continue;
     const p=meleeShapeImpactPoint(shape,pose,victim,body),delta=[f(v.position[0]-f(s.position[0]/SCN_SCENE_SCALE)),f(f(v.position[1]+f(v.height*.5))-f(s.position[1]/SCN_SCENE_SCALE)),f(v.position[2]-f(s.position[2]/SCN_SCENE_SCALE))];
     candidates.push({actor,snapshot:v,point:new Vector3(p.x,p.y,p.z),distance:f(f(f(delta[0]*delta[0])+f(delta[1]*delta[1]))+f(delta[2]*delta[2])),order:candidates.length});
    }
    candidates.sort((a,b)=>a.distance-b.distance||a.order-b.order);
    const contacts=[],blocked=[];
    for(const entry of candidates){
     assertSourceFrame(s);assertFrame(entry.actor,entry.snapshot);
     const to=[entry.snapshot.position[0],origin[1],entry.snapshot.position[2]],result=worldQueries.probeSegment({source:'575BA0(type3)->5F5AD0',coordinateSpace:'native',from:[...origin],to,queryMask:0x2107c0,rawQueryFlag:false,shapeType:3});
     assertSourceFrame(s);assertFrame(entry.actor,entry.snapshot);
     // Publish only after a final linear roster check. Revalidating every NPC
     // after every candidate's query would reintroduce quadratic matrix work.
     if(result===null){coverage();for(const [actor,v]of frames)assertFrame(actor,v);return publish(s,[],[],frames,'dagger-fan-obstruction-unresolved');}
     if(typeof result?.blocked!=='boolean')throw Error('Actual typed Dagger FAN segment result required');
     const sourceFrameValue=Object.freeze({coordinateSpace:'native',shapeType:3,origin:Object.freeze([...origin]),to:Object.freeze(to),queryMask:0x2107c0,rawQueryFlag:false});
     const record=Object.freeze({target:entry.actor,actor:entry.actor,actorId:entry.actor.id,hitPart:0,part:0,flag16:0,point:entry.point,nativePoint:Object.freeze(entry.point.toArray().map(n=>n/SCN_SCENE_SCALE)),sourceFrame:sourceFrameValue,geometryPolicy:config.policy.id,nativeReady:false});
     if(result.blocked)blocked.push(Object.freeze({...record,obstructionPoint:pointArray(result.point)}));else contacts.push(record);
    }
    assertSourceFrame(s);coverage();for(const [actor,v]of frames)assertFrame(actor,v);
    return publish(s,contacts,blocked,frames,'dagger-fan-contacts-classified');
   }finally{busy=false;}
  },
  assertReceipt(receipt){const r=receipts.get(receipt);if(!r||r.owner!==api||r.revision!==revision)throw Error('Actual private Dagger FAN receipt required');assertSourceFrame(r.s);coverage();for(const [actor,v]of r.frames)assertFrame(actor,v);return receipt;},
  assertContact(contact,{receipt,actor}={}){const r=contactOwners.get(contact),batch=receipts.get(receipt);if(!r||r.owner!==api||r.receipt!==receipt||r.actor!==actor||contact.target!==actor||!batch||batch.revision!==revision||!same(contact.point.toArray(),r.point))throw Error('Actual private current Dagger FAN contact required');assertSourceFrame(batch.s);assertFrame(actor,r.frame);return contact;},
  snapshot(){source();return {actorCount:bindings.size,revision,policy:config.policy.id,nativeReady:false};},
  dispose(){if(disposed)return;if(busy)throw Error('Cannot dispose querying Dagger FAN owner');disposed=true;bindings.clear();revision++;},
 });source();assertConquestAttackWorldQueries(worldQueries,{world:worldOwner});return api;
}
