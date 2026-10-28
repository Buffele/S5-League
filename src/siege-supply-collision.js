import {Vector3} from 'three';
import {EllipsoidWorld,COLLISION_SETTINGS} from './collision.js';
import {nativePreSlide,nativeSlideContinuation,NATIVE_CONTACT_MARGIN} from './native-collision-response.js';

const f=Math.fround;
const dot=v=>f(f(f(v[0]*v[0])+f(v[1]*v[1]))+f(v[2]*v[2]));

// Supply-only adapter. The terrain sweep remains the explicit S5 triangle
// query, not a qualified native world/partition query. Preserve the source
// pre-slide gap before rounding the actor's position back to native floats:
// an exact tangent can otherwise round through Iron Heart's ceiling slab.
// Do not change character collisions or claim complete native solver parity.
export class SiegeSupplyCollision extends EllipsoidWorld{
 move(center,displacement,{maxIterations=COLLISION_SETTINGS.maxIterations}={}){
  this.refresh();
  let position=new Vector3(center.x,center.y,center.z).divide(this.radii).toArray().map(f);
  let remaining=new Vector3(displacement.x,displacement.y,displacement.z).divide(this.radii).toArray().map(f);
  const contacts=[];let iterations=0;
  for(;iterations<maxIterations;iterations++){
   const square=dot(remaining);
   if(square<f(NATIVE_CONTACT_MARGIN*NATIVE_CONTACT_MARGIN)){remaining=[0,0,0];break;}
   const delta=new Vector3(...remaining),hit=this.nearest(new Vector3(...position),delta);
   if(!hit){
    const length=f(Math.sqrt(square)),fraction=f(f(length-NATIVE_CONTACT_MARGIN)/length);
    position=position.map((value,i)=>f(value+f(remaining[i]*fraction)));remaining=[0,0,0];break;
   }
   contacts.push(this.toWorldContact(hit));
   const pre=nativePreSlide(position,remaining,hit.time*delta.length());
   const continuation=nativeSlideContinuation(position,remaining,pre.position,hit.point.toArray());
   position=pre.position;remaining=continuation.stop?[0,0,0]:continuation.remaining;
   if(continuation.stop)break;
  }
  return {position:new Vector3(...position).multiply(this.radii),contacts,iterations,exhausted:dot(remaining)>0};
 }
}
