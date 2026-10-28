import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {queryS5RuntimeShieldSourceContact} from './s5runtime-skill-shield-triangle.js';

// Render/collision candidates live in S5 scene units. Native intersection
// constants and float32 arithmetic must receive native units; the model itself
// remains scaled once, by the presentation's existing scene boundary.
export function queryGameShieldContact({from,to,triangles,sphere,...context}){
 const native=point=>point.map(value=>value/SCN_SCENE_SCALE);
 const result=queryS5RuntimeShieldSourceContact({...context,from:native(from),to:native(to),triangles:triangles.map(triangle=>triangle.map(native)),
  sphere:{center:native(sphere.center),radius:sphere.radius/SCN_SCENE_SCALE}});
 const sceneSquared=value=>value*SCN_SCENE_SCALE*SCN_SCENE_SCALE;
 return {...result,...(result.point?{nativePoint:[...result.point],point:result.point.map(value=>value*SCN_SCENE_SCALE)}:{}),
  ...(Number.isFinite(result.distance)?{nativeDistance:result.distance,distance:result.distance*SCN_SCENE_SCALE}:{}),
  ...(Number.isFinite(result.distanceSquared)?{nativeDistanceSquared:result.distanceSquared,distanceSquared:sceneSquared(result.distanceSquared)}:{}),
  ...(result.broadphase?{broadphase:{...result.broadphase,nativeDistanceSquared:result.broadphase.distanceSquared,nativeRadiusSquared:result.broadphase.radiusSquared,
   distanceSquared:sceneSquared(result.broadphase.distanceSquared),radiusSquared:sceneSquared(result.broadphase.radiusSquared)}}:{}),
  operandUnits:'source-native',resultUnits:'s5-scene',sceneScale:SCN_SCENE_SCALE,nativeComparisonVerified:false};
}
