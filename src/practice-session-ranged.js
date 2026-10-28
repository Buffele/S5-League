import {Vector3} from 'three';
import * as SharedRifleContact from './rifle-contact.js';
export const PRACTICE_SOURCE_RIFLE_DIAGNOSTIC_WEAPONS=Object.freeze(['revolver','submachinegun','semirifle']);
import {SCN_SCENE_SCALE} from './root-motion.js';
import {handgunDamageAtSourceDistance} from './handgun-contact.js';
import {assaultRifleDamageAtSourceDistance} from './assault-rifle-contact.js';
import {burstShotgunRayDirections,burstShotgunDamageAtSourceDistance} from './burst-shotgun-contact.js';
import {clipRangedSourceContactSegment} from './ranged-source-query.js';
import {queryGameShieldContact} from './game-shield-query.js';

export const PRACTICE_RANGED_DIAGNOSTIC_POLICY=Object.freeze({name:'s5-practice-original-gun-rays-triangle-target-local-hp-v1',weapons:['handgun','assaultrifle','burstshotgun'],unboundAdditionalPower:0,damage:'existing source distance formula then local applyContact; native CDamageRecord/conditions/defense/gates not established',reaction:'no inferred Push/flinch; source HP0 destruction lifecycle only',sourceRifleWeapons:PRACTICE_SOURCE_RIFLE_DIAGNOSTIC_WEAPONS,sourceRifleDamage:'unchanged existing rifle-contact consumer; missing equipment/record/native reception remain diagnostic',nativeReady:false});
const WEAPONS=[...PRACTICE_RANGED_DIAGNOSTIC_POLICY.weapons,...PRACTICE_SOURCE_RIFLE_DIAGNOSTIC_WEAPONS];
// This is an explicit diagnostic HP adapter, NOT the native Sentry receiver.
// Consumes actual runtime pendingShots after the avatar mixer; visual effects
// subsequently consume those same finalized contact objects without retracing.
export function createPracticeRangedResolver({player,adapter,getAudio,policy}={}){
 if(!player||typeof adapter?.contactRay!=='function'||typeof adapter?.applyContact!=='function'||typeof getAudio!=='function'||policy?.name!==PRACTICE_RANGED_DIAGNOSTIC_POLICY.name)throw Error('Actual Practice ray/contact/audio services and named diagnostic policy required');
 let disposed=false,epoch=0,serial=0,seen=new WeakSet();const observations=[];
 function trace(origin,direction,range,attackId){
  const displacement=direction.clone().multiplyScalar(range),wall=player.collision.raycast(origin,displacement),wallDistance=wall?origin.distanceTo(wall.point):range,query=player.sourceShieldQuery;let shield=null,cutoff=wallDistance;
  if(query){shield=clipRangedSourceContactSegment({weaponKey:player.weapon,attackId,from:origin.toArray(),to:origin.clone().add(displacement).toArray(),worldContact:wall?{hit:true,point:wall.point.toArray()}:null,shields:query.getCandidates(),requesterSlot1c4:query.requesterSlot1c4,nativeContext:{enabled:true},coordinateSpace:'actual S5 muzzle/world endpoints; source query operands converted to native units; x87/body/HP parity unverified',queryShield:queryGameShieldContact});cutoff=shield.cutoffDistance;}
  const token=cutoff>0?adapter.contactRay({origin,direction,range:cutoff}):null,hit=!!token,blockedByShield=!hit&&!!shield?.blockedByShield,point=hit?token.point:blockedByShield?new Vector3().fromArray(shield.to):wall?.point||origin.clone().add(displacement);
  return {hit,wall:!hit&&!blockedByShield&&!!wall,target:hit?token.target:null,point,origin:origin.clone(),direction:direction.clone(),blockedByShield,shieldQuery:shield,practiceContact:token,sourceDistance:origin.distanceTo(point)/SCN_SCENE_SCALE,targetGeometryPolicy:'actual Sentry render triangles with real world/Shield cutoff; native NPC volume unverified'};
 }
 function direction(origin,shot){if(shot.aimTarget)return new Vector3().copy(shot.aimTarget).sub(origin).normalize();const pitch=player.rifle.aimPitch||0;return new Vector3(Math.sin(player.facing)*Math.cos(pitch),Math.sin(pitch),Math.cos(player.facing)*Math.cos(pitch));}

 // Reuse the existing source-facing directions, dispersion and falloff consumer.
 // The optional target port changes only actor geometry; no human box is used.
 const sourceShotIds=new WeakMap();
 function resolveSourceRifles(avatar){
  if(!player.rifle?.pendingShots?.some(s=>!s.contact&&!(s.delayRemaining>0)))return [];
  if(SharedRifleContact.RIFLE_CONTACT_TRACE_PORT_VERSION!==1)throw Error('Practice source rifles require promoted real-geometry trace port');
  const resolved=[];
  SharedRifleContact.resolveRifleShots(player,avatar,{contactRay:args=>adapter.contactRay(args)},contact=>{
   const shot=player.rifle.pendingShots.find(s=>s.contact===contact||s.contacts?.includes(contact));if(!shot)throw Error('Actual source shot/contact identity required');
   if(!sourceShotIds.has(shot))sourceShotIds.set(shot,++serial);const index=shot.contacts?shot.contacts.indexOf(contact):0,id=`practice-ray:${epoch}:${player.weapon}:${sourceShotIds.get(shot)}:${index}`;
   if(!Number.isFinite(contact.damage)||contact.damage<0)throw Error('Existing finite source-facing rifle damage required');
   const accepted=!!contact.hit&&adapter.applyContact(contact.practiceContact,{damage:contact.damage,id});contact.practiceDamageAccepted=!!accepted;contact.nativeDamageRecordProduced=false;contact.nativePushApplied=false;contact.nativeReady=false;contact.sourceDistance=contact.origin.distanceTo(contact.point)/SCN_SCENE_SCALE;
   if(accepted)getAudio()?.play('impact');else if(contact.wall)getAudio()?.play('wallHit');
   observations.push({epoch,weapon:player.weapon,shotSerial:shot.serial??null,projectileIndex:index,targetId:contact.target?.id??null,generation:contact.practiceContact?.generation??null,hit:contact.hit,accepted:!!accepted,wall:contact.wall,blockedByShield:contact.blockedByShield,sourceDistance:contact.sourceDistance,damage:contact.damage,damagePolicy:'unchanged existing source-facing rifle-contact calculation; local HP reception',nativeDamageRecordProduced:false,nativePushApplied:false,nativeReady:false});resolved.push(contact);
  });if(observations.length>128)observations.splice(0,observations.length-128);return resolved;
 }
 function resolve(avatar){if(disposed||!WEAPONS.includes(player.weapon)||!adapter.state.alive||adapter.state.phase!=='playing')return [];if(PRACTICE_SOURCE_RIFLE_DIAGNOSTIC_WEAPONS.includes(player.weapon))return resolveSourceRifles(avatar);const rifle=player.rifle;if(!rifle?.pendingShots?.length)return [];if(!avatar?.group||typeof rifle.muzzle!=='string')throw Error('Actual evaluated avatar and source muzzle required');avatar.group.updateWorldMatrix(true,true);const socket=[...avatar.bones].find(([name])=>name.endsWith(rifle.muzzle))?.[1];if(!socket)throw Error(player.weapon+': missing actual post-mixer muzzle');const range=rifle.range;if(!Number.isFinite(range)||range<=0)throw Error('Actual rifle range required');const results=[];
  for(const shot of rifle.pendingShots){if(seen.has(shot)||shot.contact||shot.delayRemaining>0)continue;if(!Number.isFinite(shot.power))throw Error('Actual source shot power required');const additionalPower=shot.additionalPower??policy.unboundAdditionalPower;if(!Number.isFinite(additionalPower))throw Error('Finite explicit diagnostic AdditionalPower required');
   const origin=socket.getWorldPosition(new Vector3()),forward=direction(origin,shot);if(forward.lengthSq()<1e-12)throw Error('Actual nonzero shot aim required');let contacts;
   if(player.weapon==='burstshotgun')contacts=burstShotgunRayDirections(forward,{right:new Vector3(-Math.cos(player.facing),0,Math.sin(player.facing))}).map((p,index)=>{const declaration=shot.projectiles?.[index]??p.sourceDeclaration,contact=trace(origin,p.direction,range,index+1);return {...contact,projectileId:declaration.id,projectileIndex:index,sourcePush:[...declaration.push],nativePushApplied:false,damage:burstShotgunDamageAtSourceDistance(contact.sourceDistance,{power:shot.power,additionalPower}).damage};});
   else{const [x,y,z]=shot.dispersion?.offset??[0,0,-1],right=new Vector3().crossVectors(forward,new Vector3(0,1,0)).normalize();if(right.lengthSq()<.001)right.set(-Math.cos(player.facing),0,Math.sin(player.facing));const up=new Vector3().crossVectors(right,forward).normalize(),ray=forward.clone().multiplyScalar(-z).addScaledVector(right,x).addScaledVector(up,y).normalize(),contact=trace(origin,ray,range,1),calculate=player.weapon==='handgun'?handgunDamageAtSourceDistance:assaultRifleDamageAtSourceDistance;contacts=[{...contact,damage:calculate(contact.sourceDistance,{power:shot.power,additionalPower}).damage,...(shot.sourcePush?{sourcePush:[...shot.sourcePush],nativePushApplied:false}:{})}];}
   // Resolve all four Burst geometries BEFORE any local HP update. A first
   // lethal pellet cannot make later simultaneous rays pass through the corpse.
   shot.origin=origin;shot.contact=contacts[0];if(contacts.length>1)shot.contacts=contacts;seen.add(shot);const shotIdentity=++serial;
   for(const [index,contact] of contacts.entries()){const id=`practice-ray:${epoch}:${player.weapon}:${shotIdentity}:${index}`,accepted=contact.hit&&adapter.applyContact(contact.practiceContact,{damage:contact.damage,id});contact.practiceDamageAccepted=!!accepted;contact.nativeDamageRecordProduced=false;contact.nativeReady=false;
    if(accepted)getAudio()?.play('impact');else if(contact.wall)getAudio()?.play('wallHit');const row={epoch,weapon:player.weapon,shotSerial:shot.serial,projectileIndex:index,targetId:contact.target?.id??null,generation:contact.practiceContact?.generation??null,hit:contact.hit,accepted:!!accepted,wall:contact.wall,blockedByShield:contact.blockedByShield,sourceDistance:contact.sourceDistance,damage:contact.damage,additionalPowerPolicy:shot.additionalPower===undefined?'explicit local zero, native producer unbound':'actual shot field',nativeDamageRecordProduced:false,nativePushApplied:false,nativeReady:false};observations.push(row);results.push(contact);
   }if(observations.length>128)observations.splice(0,observations.length-128);
  }return results;
 }
 return {resolve,aimPoint(camera){if(disposed||!WEAPONS.includes(player.weapon))return null;if(!camera?.isCamera)throw Error('Actual camera required');const origin=camera.getWorldPosition(new Vector3()),direction=camera.getWorldDirection(new Vector3()),range=player.rifle.range,wall=player.collision.raycast(origin,direction.clone().multiplyScalar(range)),hit=adapter.contactRay({origin,direction,range});return hit?.point??wall?.point??origin.addScaledVector(direction,range);},reset(){epoch++;seen=new WeakSet();observations.length=0;},dispose(){if(disposed)return;disposed=true;epoch++;seen=new WeakSet();observations.length=0;},snapshot(){return {policy:PRACTICE_RANGED_DIAGNOSTIC_POLICY,observations:[...observations],disposed,nativeReady:false};},nativeReady:false};
}
