import {Vector3,Triangle} from 'three';
import {EllipsoidWorld} from './collision.js';

export const PRACTICE_PROJECTILE_GEOMETRY_POLICY=Object.freeze({name:'actual-sentry-render-triangles-projectile-diagnostic-v1',surface:'evaluated original rigid Sentry meshes',sweep:'existing S5 swept sphere, source projectile radius unchanged; native NPC volume/solver unverified',blast:'closest actual triangle surface, evaluated model-bounds center for occlusion/direction; native NPC center unverified',nativeReady:false});
// No generated target boxes. The adapter supplies its private issued-token
// registry and actual actor/generation validity, shared by all contact types.
export function createPracticeSentryProjectileGeometry({pool,valid,issue}={}){
 if(!Array.isArray(pool)||typeof valid!=='function'||typeof issue!=='function')throw Error('Actual Sentry pool, validity and token registry required');let disposed=false,cache=new WeakMap();
 function triangles(model){model.group.updateWorldMatrix(true,true);const result=[];for(const mesh of model.meshes){const p=mesh.geometry.attributes.position,index=mesh.geometry.index;if(!index)throw Error('Original indexed Sentry geometry required');for(let i=0;i<index.count;i+=3)result.push({mesh:mesh.name,vertices:[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,index.getX(i+j)).applyMatrix4(mesh.matrixWorld))});}return result;}
 function proxy(actor){const generation=actor.generation,live=()=>!disposed&&valid(actor,generation),token=hit=>live()&&hit?issue(actor,generation,{...hit,geometryPolicy:PRACTICE_PROJECTILE_GEOMETRY_POLICY.name}):null;
  return {actor,generation,id:actor.id,get position(){return actor.model.group.position;},contactGeometry:{
   ray({origin,direction,range}){if(!live())return null;const hit=actor.model.intersectRay(origin,direction,range);return hit?token({point:hit.point,distance:hit.distance,sourceMesh:hit.object.name}):null;},
   closest(origin){if(!live())return null;const tri=new Triangle(),candidate=new Vector3();let closest=null;for(const row of triangles(actor.model)){tri.set(...row.vertices);tri.closestPointToPoint(origin,candidate);const distance=candidate.distanceTo(origin);if(!closest||distance<closest.distance)closest={point:candidate.clone(),distance,sourceMesh:row.mesh};}return closest?token({...closest,center:actor.model.bounds().getCenter(new Vector3())}):null;},
   sweep({origin,delta,radius}){if(!live())return null;if(!Number.isFinite(radius)||radius<=0)throw Error('Actual positive source projectile bound radius required');const rows=triangles(actor.model),world={triangles:rows.map(r=>r.vertices)},sweep=new EllipsoidWorld(world,{x:radius,y:radius,z:radius}),hit=sweep.sweep(origin,delta);return hit?token({point:hit.point,time:hit.time,normal:hit.normal,sourceMesh:rows[hit.triangle.id].mesh,projectileCenter:origin.clone().addScaledVector(delta,hit.time)}):null;},
  },nativeReady:false};
 }
 return {targets(){if(disposed)return [];return pool.filter(r=>valid(r,r.generation)).map(r=>{let value=cache.get(r);if(!value||value.generation!==r.generation){value=proxy(r);cache.set(r,value);}return value;});},reset(){cache=new WeakMap();},dispose(){disposed=true;cache=new WeakMap();},policy:PRACTICE_PROJECTILE_GEOMETRY_POLICY,nativeReady:false};
}
