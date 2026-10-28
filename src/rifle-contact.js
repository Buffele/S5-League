import {Vector3,Ray,Box3} from 'three';
import {SCN_SCENE_SCALE} from './root-motion.js';
import {REVOLVER_PROFILE} from './revolver-runtime.js';
import {INITIAL_RIFLE_RANGE} from './native-rifle-range.js';
import {handgunDamageAtSourceDistance} from './handgun-contact.js';
import {assaultRifleDamageAtSourceDistance} from './assault-rifle-contact.js';
import {burstShotgunRayDirections,burstShotgunDamageAtSourceDistance} from './burst-shotgun-contact.js';
import {heavyMachineGunArenaDirection,heavyMachineGunDamageAtSourceDistance} from './heavy-machine-gun-contact.js';
import {clipRangedSourceContactSegment,RANGED_SOURCE_QUERY_WEAPONS} from './ranged-source-query.js';
import {queryGameShieldContact} from './game-shield-query.js';
import {commitMapWeaponHits} from './map-attack-source.js';
export const RIFLE_RANGE=INITIAL_RIFLE_RANGE;
// Optional actual-geometry contact target, preserving existing source shot calculations.
export const RIFLE_CONTACT_TRACE_PORT_VERSION=1;
const bounds=actor=>new Box3(new Vector3(actor.position.x-.5,actor.position.y,actor.position.z-.5),new Vector3(actor.position.x+.5,actor.position.y+2.2,actor.position.z+.5));
function trace(origin,direction,collision,target,range=RIFLE_RANGE,query=null){
 const displacement=direction.clone().multiplyScalar(range),wall=collision.raycast(origin,displacement);
 const wallDistance=wall?origin.distanceTo(wall.point):range;
 let shield=null,cutoffDistance=wallDistance;
 if(query&&RANGED_SOURCE_QUERY_WEAPONS.includes(query.weapon)){
  shield=clipRangedSourceContactSegment({weaponKey:query.weapon,attackId:query.attackId??1,from:origin.toArray(),to:origin.clone().add(displacement).toArray(),worldContact:wall?{hit:true,point:wall.point.toArray()}:null,
   shields:query.getCandidates(),requesterSlot1c4:query.requesterSlot1c4,nativeContext:{enabled:true},coordinateSpace:'S5 scene endpoints; source query operands converted to native units; x87 parity unverified',queryShield:queryGameShieldContact});
  cutoffDistance=shield.cutoffDistance;
 }
 const geometryPort=typeof target?.contactRay==='function'?target:null;
 const targets=geometryPort?[]:Array.isArray(target)?target:[target].filter(Boolean);
 let point=null,actor=null;
 for(const candidate of targets){const p=new Ray(origin,direction).intersectBox(bounds(candidate),new Vector3());if(p&&(!point||p.distanceToSquared(origin)<point.distanceToSquared(origin))){point=p;actor=candidate;}}
 const practiceContact=geometryPort&&cutoffDistance>0?geometryPort.contactRay({origin,direction,range:cutoffDistance}):null;
 if(practiceContact){if(!practiceContact.point?.isVector3||!practiceContact.target)throw Error('Actual geometry contact token required');point=practiceContact.point;actor=practiceContact.target;}
 const distance=point?origin.distanceTo(point):Infinity;
 const hit=distance<=cutoffDistance&&distance<=range;
 const blockedByShield=!hit&&!!shield?.blockedByShield;
 return {hit,wall:!hit&&!blockedByShield&&!!wall,target:hit?actor:null,point:hit?point:blockedByShield?new Vector3().fromArray(shield.to):wall?.point||origin.clone().add(displacement),blockedByShield,shieldQuery:shield,...(wall?.token?{worldContact:wall}:{}),...(practiceContact?{practiceContact,targetGeometryPolicy:practiceContact.geometryPolicy}: {})};
}
const shieldQuery=(controller,attackId=1)=>controller.sourceShieldQuery?{...controller.sourceShieldQuery,weapon:controller.weapon,attackId}:null;
// Resolve the center-reticle camera ray, then converge from the muzzle.
// The target box is an explicit arena approximation, not native hit volumes.
export function rifleAimPoint(camera,collision,target,range=RIFLE_RANGE){
 return trace(camera.getWorldPosition(new Vector3()),camera.getWorldDirection(new Vector3()),collision,target,range).point;
}
export function rifleContact(controller,target,shot={}){
 const origin=shot.origin?new Vector3().copy(shot.origin):new Vector3(controller.position.x,controller.position.y+1.35,controller.position.z);
 const pitch=controller.rifle?.aimPitch||0;
 const direction=shot.aimTarget?new Vector3().copy(shot.aimTarget).sub(origin).normalize():
  new Vector3(Math.sin(controller.facing)*Math.cos(pitch),Math.sin(pitch),Math.cos(controller.facing)*Math.cos(pitch));
 return {...trace(origin,direction,controller.world?.mapWeaponQuery??controller.collision,target,controller.rifle?.range??RIFLE_RANGE,shieldQuery(controller)),origin,direction};
}
export function resolveRifleShots(controller,avatar,target,onContact=()=>{}){
 if(!controller.rifle?.pendingShots.length)return;
 avatar.group.updateWorldMatrix(true,true);
 const socket=[...avatar.bones].find(([key])=>key.endsWith(controller.rifle.muzzle||'Dual_Fire_Dummy'))?.[1];
 if(!socket)throw Error(controller.weapon+': missing post-mixer muzzle');
 for(const shot of controller.rifle.pendingShots){
  if(shot.contact||shot.delayRemaining>0)continue;
  const weapon=shot.mapAttackSource?.weaponKey??shot.weapon??controller.weapon,collision=controller.world?.mapWeaponQuery??controller.collision;
  const deliver=(contact,index=0)=>{
   contact.weapon=weapon;
   if(contact.worldContact&&!contact.hit&&!contact.blockedByShield)contact.mapObjectDamage=commitMapWeaponHits(controller.world,shot,[contact.worldContact],shot.mapAttackSource,{contactIndex:index})[0]??null;
   onContact(contact);
  };
  shot.origin=socket.getWorldPosition(new Vector3());
  shot.contact=rifleContact(controller,target,shot);
  if(weapon==='burstshotgun'){
   const right=new Vector3(-Math.cos(controller.facing),0,Math.sin(controller.facing));
   shot.contacts=burstShotgunRayDirections(shot.contact.direction,{right}).map((projectile,index)=>{
    const declaration=shot.projectiles?.[index]??projectile.sourceDeclaration;
    const contact={...trace(shot.origin,projectile.direction,collision,target,controller.rifle.range??RIFLE_RANGE,shieldQuery(controller,index+1)),origin:shot.origin,direction:projectile.direction,
     projectileId:declaration.id,projectileIndex:index,sourcePush:[...declaration.push],nativePushApplied:false};
    const distance=shot.origin.distanceTo(contact.point)/SCN_SCENE_SCALE;
    contact.sourceDistance=distance;contact.damage=burstShotgunDamageAtSourceDistance(distance,{power:shot.power,additionalPower:shot.additionalPower??0}).damage;
    return contact;
   });
   shot.contact=shot.contacts[0];for(const [index,contact]of shot.contacts.entries())deliver(contact,index);
  }else if(weapon==='heavymachinegun'){
   const right=new Vector3(-Math.cos(controller.facing),0,Math.sin(controller.facing));
   const rotated=heavyMachineGunArenaDirection(shot.sourcePatternIndex,shot.contact.direction,{right});
   const contact={...trace(shot.origin,rotated.direction,collision,target,controller.rifle.range??RIFLE_RANGE,shieldQuery(controller,shot.sourcePatternIndex+1)),origin:shot.origin,direction:rotated.direction,sourcePart:shot.sourcePart,directionPolicy:rotated.policy,nativeReady:false};
   contact.sourceDistance=shot.origin.distanceTo(contact.point)/SCN_SCENE_SCALE;
   contact.damage=heavyMachineGunDamageAtSourceDistance(contact.sourceDistance,{power:shot.power}).damage;
   shot.contact=contact;deliver(contact);
  }else if(weapon==='revolver'){
   const forward=shot.contact.direction,right=new Vector3().crossVectors(forward,new Vector3(0,1,0)).normalize();
   if(right.lengthSq()<.001)right.set(-Math.cos(controller.facing),0,Math.sin(controller.facing));
   const up=new Vector3().crossVectors(right,forward).normalize();
   shot.contacts=REVOLVER_PROFILE.shot.directions.map(([x,y,z],index)=>{
    const direction=forward.clone().multiplyScalar(-z).addScaledVector(right,x).addScaledVector(up,y).normalize();
    const contact={...trace(shot.origin,direction,collision,target,controller.rifle.range??RIFLE_RANGE,shieldQuery(controller,index+1)),origin:shot.origin,direction,
     projectileIndex:index,sourcePush:[...REVOLVER_PROFILE.shot.push],nativePushApplied:false};
    const distance=shot.origin.distanceTo(contact.point)/SCN_SCENE_SCALE;
    contact.damage=7.5*(distance<=4000?1:Math.max(.2,1-(distance-4000)/4000*.8));
    return contact;
   });
   shot.contact=shot.contacts[0];for(const [index,contact]of shot.contacts.entries())deliver(contact,index);
  }else {
   if(['semirifle','smashrifle','submachinegun','handgun','assaultrifle'].includes(weapon)){
    const [x,y,z]=shot.dispersion?.offset||[0,0,-1],forward=shot.contact.direction;
    const right=new Vector3().crossVectors(forward,new Vector3(0,1,0)).normalize();
    if(right.lengthSq()<.001)right.set(-Math.cos(controller.facing),0,Math.sin(controller.facing));
    const up=new Vector3().crossVectors(right,forward).normalize();
    const direction=forward.clone().multiplyScalar(-z).addScaledVector(right,x).addScaledVector(up,y).normalize();
    shot.contact={...trace(shot.origin,direction,collision,target,controller.rifle.range??RIFLE_RANGE,shieldQuery(controller)),origin:shot.origin,direction};
    const distance=shot.origin.distanceTo(shot.contact.point)/SCN_SCENE_SCALE;
    if(weapon==='semirifle')shot.contact.damage=5.3*(distance<=4000?1:Math.max(.2,1-(distance-4000)/20000*.8));
    if(weapon==='submachinegun')shot.contact.damage=7*(distance<=4000?1:Math.max(.2,1-(distance-4000)/4000*.8));
    if(weapon==='handgun'){shot.contact.damage=handgunDamageAtSourceDistance(distance,{power:shot.power,additionalPower:shot.additionalPower??0}).damage;shot.contact.sourcePush=[...(shot.sourcePush??[])];shot.contact.nativePushApplied=false;}
    if(weapon==='assaultrifle')shot.contact.damage=assaultRifleDamageAtSourceDistance(distance,{power:shot.power,additionalPower:shot.additionalPower??0}).damage;
    shot.contact.sourceDistance=distance;
   }
   deliver(shot.contact);
  }
  // Keep the last actual resolved record after the VFX consumer drains the
  // queue. Revolver's lastShot is immutable firing metadata, not this record.
  controller.rifle.lastResolvedShot=shot;
 }
}
