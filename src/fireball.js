import {Box3,Ray,Vector3} from 'three';

// Original S5 ability, authored here; these are not imported S5Runtime timings.
export const FIREBALL=Object.freeze({charge:34/30,release:43/30,sendEnd:66/30,duration:3,cooldown:3,cost:25,speed:18,range:42,radius:.65,damage:30,clip:'S5_FIREBALL'});
export const fireballPhase=time=>time<34/30?'signs':time<43/30?'inhale':time<66/30?'send':'relax';
export const isFireballKey=event=>event.code==='Backquote'||event.key==='²';
export function resetFireball(c){c.fireball=null;c.fireballCooldown=0;c.fireballSerial=0;}
export function advanceFireball(c,dt,input){
 c.fireballCooldown=Math.max(0,(c.fireballCooldown||0)-dt);
 if(input.special&&!c.fireball&&!c.grounded){c.events.push('fireballGroundOnly');return false;}
 if(input.special&&!c.fireball&&c.fireballCooldown===0&&!c.attack&&!c.dash&&!c.wallAction&&!c.plasmaDashExit&&!c.katanaAirFall&&!c.weaponRuntimeBusy&&(!c.rifle||c.rifle.phase==='idle')&&(!c.airgun||c.airgun.phase==='idle')){
  if(!c.infiniteEnergy&&c.energy<FIREBALL.cost){c.events.push('fireballEmpty');return false;}
  if(!c.infiniteEnergy)c.energy-=FIREBALL.cost;
  c.fireball={time:0,phase:'signs',serial:++c.fireballSerial,released:false,pending:false,facing:Number.isFinite(input.facing)?input.facing:c.facing};
  c.fireballCooldown=FIREBALL.cooldown;c.events.push('fireballCharge');c.stopSprint();
  c.jumpBuffer=0;c.jumpRecovery=null;c.dodgeSprintUntil=-Infinity;c.moveIntent={x:0,z:0};
 }
 const cast=c.fireball;if(!cast)return false;
 c.facing=cast.facing;
 const before=cast.time;
 cast.time+=dt;cast.phase=fireballPhase(cast.time);
 if(before<34/30&&cast.time>=34/30)c.events.push('fireballInhale');
 if(!cast.released&&cast.time+1e-9>=FIREBALL.release){cast.released=true;cast.pending=true;c.events.push('fireballLaunch');}
 c.state='fireball';c.sprinting=false;c.velocity={x:0,y:0,z:0};c.moveIntent={x:0,z:0};c.rootMotionDelta={x:0,y:0,z:0};
 if(cast.time>=FIREBALL.duration)c.fireball=null;
 return true;
}

// Sweep every travelled segment so a fast projectile cannot tunnel through
// a target or wall. The same finite radius is used for both kinds of contact.
export function fireballContact(origin,end,collision,target){
 const delta=end.clone().sub(origin),length=delta.length();if(length<1e-9)return null;
 const direction=delta.clone().normalize();let nearest=null;
 const right=new Vector3().crossVectors(direction,new Vector3(0,1,0));if(right.lengthSq()<.001)right.set(1,0,0);right.normalize();
 const up=new Vector3().crossVectors(right,direction).normalize();
 for(const offset of [new Vector3(),right.clone().multiplyScalar(FIREBALL.radius),right.clone().multiplyScalar(-FIREBALL.radius),up.clone().multiplyScalar(FIREBALL.radius),up.clone().multiplyScalar(-FIREBALL.radius)]){
  const wall=collision.raycast(origin.clone().add(offset),delta);
  if(wall){const distance=origin.clone().add(offset).distanceTo(wall.point);if(!nearest||distance<nearest.distance)nearest={point:origin.clone().addScaledVector(direction,distance),distance,hit:false};}
 }
 if(target){
  const p=target.position,r=FIREBALL.radius;
  const box=new Box3(new Vector3(p.x-.5-r,p.y-r,p.z-.5-r),new Vector3(p.x+.5+r,p.y+2.2+r,p.z+.5+r));
  const point=box.containsPoint(origin)?origin.clone():new Ray(origin,direction).intersectBox(box,new Vector3());
  const distance=point?origin.distanceTo(point):Infinity;
  if(distance<=length&&(!nearest||distance<nearest.distance-1e-6))nearest={point,distance,hit:true};
 }
 return nearest;
}

export class FireballProjectiles{
 constructor(){this.items=[];this.serial=0;}
 launch(origin,aim,facing){
  const direction=aim?new Vector3().copy(aim).sub(origin):new Vector3(Math.sin(facing),0,Math.cos(facing));
  if(direction.lengthSq()<1e-8)direction.set(Math.sin(facing),0,Math.cos(facing));
  const item={id:++this.serial,position:origin.clone(),direction:direction.normalize(),distance:0};this.items.push(item);return item;
 }
 update(dt,collision,target,onImpact){
  for(const item of [...this.items]){
   const travel=Math.min(FIREBALL.speed*dt,FIREBALL.range-item.distance),end=item.position.clone().addScaledVector(item.direction,travel);
   const contact=fireballContact(item.position,end,collision,target);
   if(contact){item.position.copy(contact.point);onImpact(contact,item);this.items.splice(this.items.indexOf(item),1);}
   else{item.position.copy(end);item.distance+=travel;if(item.distance>=FIREBALL.range-1e-8){onImpact({point:end,hit:false,expired:true},item);this.items.splice(this.items.indexOf(item),1);}}
  }
 }
 clear(){this.items.length=0;}
}
