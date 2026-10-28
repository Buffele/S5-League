import {HANDGUN_SOURCE} from './handgun-data.js';
import {BURST_SHOTGUN_SOURCE} from './burst-shotgun-data.js';
import {REVOLVER_PROFILE} from './revolver-runtime.js';
import {S5RUNTIME_NATIVE_PHYSICS} from './s5runtime-native-physics-data.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {createNativeMeleePush,advanceNativeMeleePush} from './native-melee-push.js';
import {applyNativePushCollision} from './native-push-collision.js';

// Source chain and qualified S5 bindings:
// work/ranged-push-direction-20261017/DELIVERY.md. The original FREE registry
// snapshot supplies the clock/cap. Actor gates1/400 and equipment modifiers
// remain an explicit neutral local policy, not a current native actor reading.
const capturedFloat=index=>S5RUNTIME_NATIVE_PHYSICS.floatConstants.find(c=>c.index===index).value;
export const S5_RANGED_PUSH_POLICY=Object.freeze({
 timeFactor:capturedFloat(3),
 actorPolicy:Object.freeze({horizontalBlocked:false,horizontalMultiplier:1,maxDistance:Math.fround(capturedFloat(108)*capturedFloat(42))}),
 nativeReady:false,
});
const finiteVector=v=>v&&[v.x,v.y,v.z].every(Number.isFinite);
const f=Math.fround;
function normalize(x,z){
 const length=f(Math.sqrt(f(f(x*x)+f(z*z))));
 if(length===0)return [x,z];
 const inverse=f(1/length);return [f(x*inverse),f(z*inverse)];
}
const length=([x,z])=>f(Math.sqrt(f(f(x*x)+f(z*z))));

// Exact FRONT branch of6E9780: horizontal source point minus target position,
// normalized independently of the bullet ray. SetDir5F7130 stores FRONT=1;
// that branch performs no temporary rotation. Invalid directions use the
// source's (0,0,-1) fallback. Other attribute directions are not inferred here.
export function frontRangedRecordDirection(sourcePoint,targetPosition,targetForward){
 if(![sourcePoint,targetPosition,targetForward].every(finiteVector))throw new TypeError('Finite received-record positions and actor forward required');
 const forward=normalize(f(targetForward.x),f(targetForward.z)),forwardLength=length(forward);
 if(forwardLength<f(.9)||forwardLength>f(1.1))return [0,0,-1];
 let direction=normalize(f(sourcePoint.x-targetPosition.x),f(sourcePoint.z-targetPosition.z));
 direction=normalize(...direction);const n=length(direction);
 return n>f(.9)&&n<f(1.1)?[direction[0],0,direction[1]]:[0,0,-1];
}

// One entry per accepted CAttack condition, in contact order. Base Push masks
// are zero: the native manager neither blocks nor removes another base Push.
// Never collapse the four Burst conditions into a Map entry for the victim.
export function createRangedVictimPushes({timeFactor=S5_RANGED_PUSH_POLICY.timeFactor,actorPolicy=S5_RANGED_PUSH_POLICY.actorPolicy}={}){
 let entries=[];
 return {
  add(contact,actor){
   const expected=contact.weapon==='handgun'?HANDGUN_SOURCE.push:contact.weapon==='burstshotgun'?BURST_SHOTGUN_SOURCE.projectiles[contact.projectileIndex]?.push:
    contact.weapon==='revolver'&&Number.isInteger(contact.projectileIndex)&&REVOLVER_PROFILE.shot.directions[contact.projectileIndex]?REVOLVER_PROFILE.shot.push:null;
   if(!expected||!contact.hit||contact.target!==actor)return false;
   if(!Array.isArray(contact.sourcePush)||expected.some((v,i)=>contact.sourcePush[i]!==v)||contact.sourcePush.length!==3)throw new TypeError('Authenticated source Push parameters required');
   if(!finiteVector(contact.origin)||!finiteVector(actor.position)||!Number.isFinite(actor.facing))throw new TypeError('Actual contact origin and target actor required');
   // false/false CollisionRangeAdjust makes570890 take frame+8, the copied
   // world attack-shape origin. In S5 this is the evaluated contact muzzle,
   // already shared by the actual HP ray. No attacker-position substitute.
   const toNative=v=>({x:v.x/SCN_SCENE_SCALE,y:v.y/SCN_SCENE_SCALE,z:v.z/SCN_SCENE_SCALE});
   const recordDirection=frontRangedRecordDirection(toNative(contact.origin),toNative(actor.position),{x:Math.sin(actor.facing),y:0,z:Math.cos(actor.facing)});
   const condition=createNativeMeleePush(expected,recordDirection,{timeFactor,clockMode:'arena-fractional-ms'});
   entries.push({actor,serial:actor.resetSerial,condition});
   contact.sourcePushApplied=true;
   // This means the source equation is now executed in S5, not that it was
   // measured against a live native actor. Readiness remains explicitly false.
   contact.nativePushApplied=true;contact.nativeReady=false;contact.recordDirection=recordDirection;
   return true;
  },
  advance(dt){
   if(!Number.isFinite(dt)||dt<0)throw new RangeError('Finite nonnegative Push step required');
   entries=entries.filter(entry=>{
    const {actor,condition}=entry;
    if(actor.resetSerial!==entry.serial)return false;
    // Attached S5 actors accept updates, including death animation playback.
    // Native actor+1A8's dynamic binding remains unverified; HP is not that flag.
    const {displacement,active}=advanceNativeMeleePush(condition,dt*1000,{actorAcceptsUpdate:true});
    applyNativePushCollision(actor,[displacement.x/condition.scale,displacement.y/condition.scale,displacement.z/condition.scale],{actorPolicy,scale:condition.scale});
    return active;
   });
  },
  clear(){entries=[];},
  get size(){return entries.length;},
 };
}
