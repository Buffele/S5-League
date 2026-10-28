import {impactSoundKey} from './game-audio.js';
import {meleeActivations,claimMeleeActivation} from './melee-activations.js';
import {meleeRuntimeContact} from './melee-runtime.js';
import {COLLISION_SETTINGS} from './collision.js';
import {Matrix4,Quaternion,Vector3} from 'three';
// Preserve the accepted profiles while qualifying their surface-axis convention.
const surfaceAlignedWeapons=new Set(['bat','ironboots','deathscythe','demonicknuckle','twinblade','katana','sigmablade','assassinclaw','breaker']);
const effectScale=new Vector3(.006,.006,.006),worldUp=new Vector3(0,1,0);
// Existing wall presentation maps local -Z to the surface normal. Extend that
// convention to the measured slope without assuming a new native effect pivot.
export function meleeSurfaceImpactMatrix(point,normal,facing){
 const n=new Vector3(normal.x,normal.y,normal.z);
 if(![n.x,n.y,n.z].every(Number.isFinite)||n.lengthSq()<1e-12)throw Error('A finite surface normal is required');
 n.normalize();
 const horizontal=new Vector3(n.x,0,n.z);
 if(horizontal.lengthSq()<1e-12)horizontal.set(Math.sin(facing),0,Math.cos(facing));
 horizontal.normalize();
 const yaw=Math.atan2(horizontal.x,horizontal.z);
 const orientation=new Quaternion().setFromAxisAngle(worldUp,yaw+Math.PI);
 orientation.premultiply(new Quaternion().setFromUnitVectors(horizontal,n));
 return new Matrix4().compose(point,orientation,effectScale);
}
// Local script/attack/weapon_*_attack.lua, Melee branches:
// SpyDaggerStab, PlasmaSwordDash, CounterSwordLight1 explicitly enable
// SetMoveStopWhenDamage(true). SpyDaggerCut explicitly disables it.
export function stopsMovementOnDamage(attack){
 if(attack?.profile?.moveStopWhenDamage)return true;
 const weapon=attack?.weapon||'dagger',kind=attack?.kind||attack?.type;
 return weapon==='dagger'?kind==='rush':weapon==='plasma'?kind==='heavy':(weapon==='katana'||weapon==='counter')&&kind==='light'&&attack.comboIndex===0;
}
export function stopAttackMovement(controller,attack=controller.attack){
 if(!attack||!stopsMovementOnDamage(attack))return false;
 attack.moveStopped=true;controller.velocity.x=0;controller.velocity.z=0;
 controller.rootMotionDelta={x:0,y:0,z:0};return true;
}
export function contactEffect(attack,{surface=false}={}){
 if(attack?.weapon==='assassinclaw'&&attack.kind==='light')return 'assassin_claw_body';
 const native=meleeRuntimeContact(attack);
 if(native?.effects){
  const sequence=surface?(native.effects.damageObjectSequence??native.effects.damageSequence):native.effects.damageSequence;
  const name=sequence?.split('/').at(-1).replace(/\.seq$/i,'')??null;
  return attack.weapon==='ironboots'&&['weapon_smashgun_hit_gold','weapon_smashgun_hit_wall_gold','gun_hit4_gold','gun_hit_gold'].includes(name)?'ironboots_'+name:name;
 }
 if(!attack?.weapon||attack.weapon==='dagger')return 'weapon_mindshock_body';
 if(attack.weapon==='katana')return surface?'katana_damege_obj':'katana_damege';
 return attack?.weapon==='plasma'&&attack.kind==='heavy'?'skill_gunner_chargeshot_hit':'backattack_sword_s';
}
export function blockedMeleeContact(attacker,victim){
 const a=attacker.position,b=victim.position;
 return !!attacker.collision.raycast({x:a.x,y:a.y+1,z:a.z},{x:b.x-a.x,y:b.y-a.y,z:b.z-a.z});
}
// Training actor cylinders, swept over the tick: the moving actor stops at
// the other actor, instead of pushing that actor sideways after tunneling.
// These body dimensions are separate from the still-approximate hit volumes.
export function constrainActorApproach(actor,previous,other,radius=1.2,height=1.8){
 const dx=actor.position.x-previous.x,dz=actor.position.z-previous.z;
 const ox=previous.x-other.position.x,oz=previous.z-other.position.z;
 const speed2=dx*dx+dz*dz,approach=ox*dx+oz*dz,offset=ox*ox+oz*oz-radius*radius;
 if(speed2<1e-12||approach>=0)return false;
 const discriminant=approach*approach-speed2*offset;if(discriminant<0)return false;
 const t=offset<=0?0:(-approach-Math.sqrt(discriminant))/speed2;
 if(t<0||t>1||Math.abs(previous.y+(actor.position.y-previous.y)*t-other.position.y)>=height)return false;
 const limited={x:previous.x+dx*t,y:actor.position.y,z:previous.z+dz*t};
 if(actor.collision){
  // The completed world move may already have descended a slope or stair.
  // Rewinding only X/Z would insert that lower Y into the earlier, higher
  // support. Replay limited horizontal travel, then the full vertical target,
  // as Controller.move does. A combined downward sweep would hit support at
  // t=0 and discard horizontal travel that the body contact still permits.
  const halfHeight=actor.collision.radii.y,start={...previous,y:previous.y+halfHeight};
  const stepHeight=actor.world?.stepHeight||0;
  const support={stopOnGround:true,groundNormalY:stepHeight?.3:COLLISION_SETTINGS.groundNormalY,
   supportDepth:Math.max(stepHeight,COLLISION_SETTINGS.snapBase),allowEdgeSupport:!!actor.sprinting};
  const initialSupport={key:actor.collision.edgeSupportKey,used:actor.collision.edgeSupportUsed};
  const replay=fraction=>{
   actor.collision.edgeSupportKey=initialSupport.key;actor.collision.edgeSupportUsed=initialSupport.used;
   const horizontal=actor.collision.move(start,{x:(limited.x-previous.x)*fraction,y:0,z:(limited.z-previous.z)*fraction});
   const position=actor.collision.move(horizontal.position,{x:0,y:limited.y+halfHeight-horizontal.position.y,z:0},support).position;
   return {position,key:actor.collision.edgeSupportKey,used:actor.collision.edgeSupportUsed};
  };
  let resolved=replay(1);
  // Sliding on a slope can redirect X/Z after the analytic body sweep.
  // Only in that case, shorten the replay until both constraints hold.
  // The previous position is the safe fallback, including initial overlap.
  const minimum=Math.min(radius,Math.hypot(ox,oz))-1e-8;
  const clear=({position:p})=>Math.hypot(p.x-other.position.x,p.z-other.position.z)>=minimum;
  if(!clear(resolved)){
   let low=0,high=1,best=replay(0);if(!clear(best))best={position:start,...initialSupport};
   for(let i=0;i<12;i++){
    const middle=(low+high)/2,candidate=replay(middle);
    if(clear(candidate)){low=middle;best=candidate;}else high=middle;
   }
   resolved=best;
  }
  actor.collision.edgeSupportKey=resolved.key;actor.collision.edgeSupportUsed=resolved.used;
  actor.position.x=resolved.position.x;actor.position.y=resolved.position.y-halfHeight;actor.position.z=resolved.position.z;
 }else Object.assign(actor.position,limited);
 actor.velocity.x=0;actor.velocity.z=0;return true;
}
// Bounded contact probes at each attack activation. They use actual world
// geometry, but are training volumes, not an exact port of native MAKEFAN/BOX.
// Vertical blows can reach the floor; horizontal dagger cuts cannot hit a
// floor merely because the player's feet are touching it.
export function surfaceContact(controller,events){
 const attack=controller.attack;if(!attack||!events.includes('hit'))return null;
 const kind=attack.kind||attack.type,weapon=attack.weapon||controller.weapon;
 if(kind==='guard')return null;
 const origin={x:controller.position.x,y:controller.position.y+1,z:controller.position.z};
 const reach=weapon==='dagger'?2:2.6;
 let closest=null;
 for(const angle of [-.65,0,.65]){
  const facing=controller.facing+angle,delta={x:Math.sin(facing)*reach,y:0,z:Math.cos(facing)*reach};
  const hit=controller.collision.raycast(origin,delta);
  if(hit&&(!closest||hit.time<closest.time))closest=hit;
 }
 if(['air','strong','strongFollow'].includes(kind)||(weapon==='counter'&&kind==='heavy')){
  const hit=controller.collision.raycast(origin,{x:Math.sin(controller.facing)*.9,y:-1.35,z:Math.cos(controller.facing)*.9});
  if(hit&&!closest)closest=hit;
 }
 return closest;
}
export function playSurfaceImpact(controller,events,effects,audio){
 let first=null;
 for(const {attack,index} of meleeActivations(events,controller.attack)){
  if(!claimMeleeActivation(attack,index,'surface'))continue;
  const contact=surfaceContact({...controller,attack},['hit']);if(!contact)continue;
  first??=contact;
  const point=contact.point.clone().addScaledVector(contact.normal,.025);
  const name=contactEffect({...attack,contactIndex:index},{surface:true});
  effects.playArtImpact?.(attack,point,{source:controller,normal:contact.normal,ground:Math.abs(contact.normal.y)>.5});
  if(name){
   const facing=Math.atan2(contact.normal.x,contact.normal.z);
   const align=surfaceAlignedWeapons.has(attack.weapon)&&Math.abs(contact.normal.y)>1e-6;
   effects.play(name,point,null,{facing,...(align?{anchorMatrix:meleeSurfaceImpactMatrix(point,contact.normal,controller.facing)}:{})});
  }
  const sound=impactSoundKey({...attack,contactIndex:index},{surface:true});
  if(sound)audio.play(sound);
 }
 return first;
}
