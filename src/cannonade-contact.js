import {Vector3,Ray,Box3} from 'three';
import {CANNONADE} from './cannonade-runtime.js';
import {createNativeMeleePush,advanceNativeMeleePush} from './native-melee-push.js';
import {S5RUNTIME_NATIVE_PHYSICS} from './s5runtime-native-physics-data.js';
import {applyNativePushCollision} from './native-push-collision.js';
import {demonicKnuckleCanAddCondition} from './demonic-knuckle-protection.js';
const SCALE=.006;
export const CANNONADE_RECONSTRUCTION=Object.freeze({
 damage:'Native charge interpolation and observed equipped-reference endpoints compared on both sexes; target HP/armor/critical and equipment outside that profile remain unverified',
 targetVolume:'arena box, width1 / height2.2',occlusion:'center ray',
 pushPolicy:'native actor cap from 23 September captured registry and ordered XZ/downward-Y collision writes; actor condition gates/modifier and native solver skin remain unresolved'});
export const CANNONADE_CONTACT_DELAY_MS=100;
const capturedFloat=index=>S5RUNTIME_NATIVE_PHYSICS.floatConstants.find(c=>c.index===index).value;
// Base FREE registry snapshot,23 September2026, not a live15 October actor
// measurement. Gate1/condition400 are explicit neutral local policies here.
export const CANNONADE_PUSH_ACTOR_POLICY=Object.freeze({horizontalBlocked:false,horizontalMultiplier:1,maxDistance:Math.fround(capturedFloat(108)*capturedFloat(42))});
const body=a=>new Box3(new Vector3(a.position.x-.5,a.position.y,a.position.z-.5),new Vector3(a.position.x+.5,a.position.y+2.2,a.position.z+.5));
export function cannonadeAimContact(origin,aimTarget,collision,targets){
 const direction=new Vector3().copy(aimTarget).sub(origin),range=direction.length();
 if(range<1e-9)return {point:origin.clone(),direction:new Vector3(0,0,1),actor:null,wall:false};
 direction.divideScalar(range);
 const wall=collision?.raycast(origin,direction.clone().multiplyScalar(range));let point=wall?.point?.clone()??new Vector3().copy(aimTarget),actor=null,nearest=point.distanceTo(origin);
 for(const candidate of targets){const geometry=candidate.contactGeometry,token=geometry?geometry.ray({origin,direction,range}):null,p=geometry?token?.point:new Ray(origin,direction).intersectBox(body(candidate),new Vector3());if(p){const d=p.distanceTo(origin);if(d<=range+1e-8&&d<nearest+1e-8){point=p;actor=candidate;nearest=d;}}}
 // Native57EB39–57EB86: Cannonade attack origin = target - unit direction.
 const center=point.clone().addScaledVector(direction,-Math.min(SCALE,nearest));
 return {point:center,aimPoint:point.clone(),direction,actor,wall:!actor&&!!wall};
}
export class CannonadeShots{
 constructor(){this.items=[];this.pushes=new Map();}
 schedule(origin,aimTarget,shot,source){const item={...shot,source,origin:origin.clone(),aimTarget:new Vector3().copy(aimTarget),ageMs:0,dead:false};this.items.push(item);return item;}
 update(dt,collision,targets,onExplosion=()=>{},{origin=null,aimTarget=null}={}){
  for(const item of this.items){
   item.ageMs+=dt*1000;if(item.ageMs<CANNONADE_CONTACT_DELAY_MS-1e-7)continue;
   const trace=cannonadeAimContact(origin??item.origin,aimTarget??item.aimTarget,collision,targets.filter(a=>a!==item.source));
   const radius=CANNONADE.rangeNative*(item.max?1.2:.7)*SCALE;
   const contacts=targets.filter(candidate=>candidate!==item.source).flatMap(candidate=>{
    const geometry=candidate.contactGeometry,token=geometry?geometry.closest(trace.point):null;if(geometry&&!token)return [];
    const center=geometry?token.center:new Vector3(candidate.position.x,candidate.position.y+1.1,candidate.position.z),closest=geometry?token.point:body(candidate).clampPoint(trace.point,new Vector3());
    if(closest.distanceTo(trace.point)>radius)return [];
    const toward=center.clone().sub(trace.point),block=collision?.raycast(trace.point.clone().addScaledVector(toward.clone().normalize(),.002),toward);
    if(candidate!==trace.actor&&block&&block.point.distanceTo(trace.point)<toward.length()-.01)return [];
    const outward=toward.lengthSq()>1e-8?toward.normalize():trace.direction.clone();
    return [{target:candidate,point:trace.point.clone(),direction:outward,damage:item.damage,...(token?{practiceContact:token}:{}),push:item.max?[200,5000,-5000]:[100,2500,-5000]}];
   });
   item.dead=true;onExplosion({...trace,radius,contacts},item);
  }
  this.items=this.items.filter(item=>!item.dead);
 }
 push(contact){
  if(!demonicKnuckleCanAddCondition(contact.target.demonicKnuckleProtection))return;
  const factor=S5RUNTIME_NATIVE_PHYSICS.floatConstants.find(c=>c.index===3).value;
  this.pushes.set(contact.target,createNativeMeleePush(contact.push,contact.direction.toArray().map(v=>-v),{timeFactor:factor,clockMode:'arena-fractional-ms'}));
 }
 advancePushes(dt){
  for(const [actor,state]of this.pushes){
   const {displacement,active}=advanceNativeMeleePush(state,dt*1000);
   applyNativePushCollision(actor,[displacement.x/state.scale,displacement.y/state.scale,displacement.z/state.scale],{actorPolicy:CANNONADE_PUSH_ACTOR_POLICY,scale:state.scale});
   if(!active)this.pushes.delete(actor);
  }
 }
 clear(){this.items.length=0;this.pushes.clear();}
}
