import {Vector3,Ray,Box3} from 'three';
import {EllipsoidWorld} from './collision.js';
import {createNativeMeleePush,advanceNativeMeleePush} from './native-melee-push.js';
import {S5RUNTIME_NATIVE_PHYSICS} from './s5runtime-native-physics-data.js';
import {demonicKnuckleCanAddCondition} from './demonic-knuckle-protection.js';
import {createNativeRocketMotion,advanceNativeRocketMotion,applyNativeRocketFreeTravel,nativeRocketOffsets} from './native-rocket-motion.js';
import {createS5RuntimeCRTRandom} from './s5runtime-crt-random.js';
import {nativeRocketExplosionPower} from './native-attack-random.js';
export const ROCKET_PROJECTILE=Object.freeze({primarySpeed:7500*.006,secondarySpeed:4500*.006,lifetimeMs:5000,boundRadius:16*.006,explosionRadius:500*.006,whirlRate:4,whirlRadius:300*.006,spreadMs:500});
export const ROCKET_RECONSTRUCTION=Object.freeze({trajectory:'Native F61210 float32 center/phase/spread update and camera-up offsets; launch-center and terrain/actor collision fidelity pending',damage:'Native573B60 probability gate and mean-uniform bonus rolled once per explosion, before distance tiers; catalogue power48 retained. Native logical power/equipment/critical/armor/HP and global CRT seed/interleaving remain pending',collision:'Source16-unit bound radius and native free-travel margin with S5 swept sphere; arena target boxes and center occlusion; native sensing100/actor geometry pending',push:'Native float32 Push integrator; actor gates/direction policy pending'});
const body=(a,margin=0)=>new Box3(new Vector3(a.position.x-.5-margin,a.position.y-margin,a.position.z-.5-margin),new Vector3(a.position.x+.5+margin,a.position.y+2.2+margin,a.position.z+.5+margin));
export class RocketLauncherProjectiles{
 constructor({random=createS5RuntimeCRTRandom()}={}){this.items=[];this.pushes=new Map();this.world=null;this.sweep=null;this.random=random;}
 resetRandom(seed=1){this.random=createS5RuntimeCRTRandom(seed);}
 launch(origin,aimTarget,shot,source){
  // Main play supplies the camera frame used by native 5805F0. Headless/QA
  // callers without a camera explicitly retain their muzzle-to-target frame.
  const direction=shot.launchFrame?new Vector3().fromArray(shot.launchFrame.direction):new Vector3().copy(aimTarget).sub(origin).normalize();if(direction.lengthSq()<1e-8)direction.set(0,0,1);
  const up=shot.launchFrame?new Vector3().fromArray(shot.launchFrame.up):(Math.abs(direction.y)<.95?new Vector3(0,1,0):new Vector3(1,0,0));
  if(!shot.launchFrame)up.addScaledVector(direction,-direction.dot(up)).normalize();
  const secondary=shot.mode==='secondary',count=secondary?3:1,items=[];
  const offsets=secondary?nativeRocketOffsets(direction.toArray(),up.toArray()):[[0,0,0]],speed=secondary?4500:7500;
  for(let i=0;i<count;i++){const motion=createNativeRocketMotion({position:origin.toArray().map(v=>v/.006),velocity:direction.toArray().map(v=>Math.fround(Math.fround(v)*speed)),axis:direction.toArray(),offset:offsets[i],angularRate:secondary?4:0,spreadMs:secondary?500:0});const p={...shot,source,origin:origin.clone(),position:new Vector3().fromArray(motion.position).multiplyScalar(.006),direction:direction.clone(),motion,index:i,ageMs:0,fractionalMs:0,dead:false,speed:speed*.006};this.items.push(p);items.push(p);}return items;
 }
 update(dt,collision,targets,onExplosion=()=>{}){
  if(collision?.world!==this.world){this.world=collision?.world;const r=ROCKET_PROJECTILE.boundRadius;this.sweep=this.world?new EllipsoidWorld(this.world,{x:r,y:r,z:r}):null;}
  for(const p of this.items){
   const duration=dt*1000+p.fractionalMs,elapsedMs=Math.floor(duration+1e-8);p.fractionalMs=Math.max(0,duration-elapsedMs);p.ageMs=Math.min(5000,p.ageMs+elapsedMs);
   const previous=p.motion.position.slice();advanceNativeRocketMotion(p.motion,elapsedMs);const next=new Vector3().fromArray(p.motion.position).multiplyScalar(.006);
   const delta=next.clone().sub(p.position),distance=delta.length(),axis=distance>1e-9?delta.clone().divideScalar(distance):p.direction;
   const wall=this.sweep?.sweep(p.position,delta)??(!this.sweep?collision?.raycast(p.position,delta):null);let fraction=wall?.time??(wall?.point&&distance?wall.point.distanceTo(p.position)/distance:Infinity),actor=null;
   for(const target of targets.filter(a=>a!==p.source&&(p.source.team===undefined||a.team===undefined||a.team!==p.source.team))){const geometry=target.contactGeometry,token=geometry?geometry.sweep({origin:p.position,delta,radius:ROCKET_PROJECTILE.boundRadius}):null,hit=geometry?token?.projectileCenter:new Ray(p.position,axis).intersectBox(body(target,ROCKET_PROJECTILE.boundRadius),new Vector3());if(hit&&distance){const f=geometry?token.time:hit.distanceTo(p.position)/distance;if(f<=1&&f<fraction){fraction=f;actor=target;}}}
   const contact=fraction<=1;if(contact)next.copy(p.position).addScaledVector(delta,Math.max(0,fraction));else {applyNativeRocketFreeTravel(p.motion,previous);next.fromArray(p.motion.position).multiplyScalar(.006);}p.position.copy(next);
   if(contact||p.ageMs===5000){
    p.dead=true;p.damageRoll=nativeRocketExplosionPower(p.power,p.mode,this.random);const radius=ROCKET_PROJECTILE.explosionRadius,contacts=[];
    for(const target of targets){if(target!==p.source&&p.source.team!==undefined&&target.team===p.source.team)continue;const geometry=target.contactGeometry,token=geometry?geometry.closest(p.position):null;if(geometry&&!token)continue;const closest=geometry?token.point:body(target).clampPoint(p.position,new Vector3()),range=closest.distanceTo(p.position);if(range>radius)continue;
     const toward=(geometry?token.center.clone():new Vector3(target.position.x,target.position.y+1.1,target.position.z)).sub(p.position),block=collision?.raycast(p.position,toward);
     if(target!==actor&&block&&block.point.distanceTo(p.position)<toward.length()-.01)continue;
     const normalized=range/radius,tiers=p.mode==='secondary'?[.25,.5,.75]:[.25,.5,.5],rate=normalized<=tiers[0]?1:normalized<=tiers[1]?.75:.5;
     contacts.push({target,point:p.position.clone(),direction:toward.lengthSq()>1e-8?toward.normalize():p.direction.clone(),damage:Math.fround(p.damageRoll.power*rate),...(token?{practiceContact:token}:{}),push:[300,2000,-5000]});
    }
    onExplosion({point:p.position.clone(),actor,contacts,timedOut:!contact},p);
   }
  }
  this.items=this.items.filter(p=>!p.dead);
 }
 push(contact){if(!demonicKnuckleCanAddCondition(contact.target.demonicKnuckleProtection))return;const factor=S5RUNTIME_NATIVE_PHYSICS.floatConstants.find(c=>c.index===3).value;this.pushes.set(contact.target,createNativeMeleePush(contact.push,contact.direction.toArray().map(v=>-v),{timeFactor:factor,clockMode:'arena-fractional-ms'}));}
 advancePushes(dt){for(const [actor,state]of this.pushes){const {displacement,active}=advanceNativeMeleePush(state,dt*1000),center={...actor.position,y:actor.position.y+actor.collision.radii.y};const moved=actor.collision.move(center,displacement);actor.position={x:moved.position.x,y:moved.position.y-actor.collision.radii.y,z:moved.position.z};if(!active)this.pushes.delete(actor);}}
 clear(){this.items.length=0;this.pushes.clear();}
}
