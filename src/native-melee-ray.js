// Static branch ports; full native target dispatch and critical arbitration are
// deliberately NOT inferred. Evidence: work/melee-critical/README.md.
import {SCN_SCENE_SCALE,sourceActorVector} from './s5runtime-coordinates.js';
const finite=(v,n)=>{if(!Number.isFinite(v))throw new TypeError('Finite '+n+' required');return v;};
const positive=(v,n)=>{finite(v,n);if(v<=0)throw new RangeError('Positive '+n+' required');return v;};
const vec=(v,n)=>{if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw new TypeError(n+' vec3 required');return v;};
const pos=a=>vec([a?.position?.x,a?.position?.y,a?.position?.z],'position');
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export function worldMeleeRay(shape,actor,scale=SCN_SCENE_SCALE){
 if(shape?.type!=='ray')throw new TypeError('Expected ray shape');
 const anchor=vec(shape.anchor,'anchor'),d=vec(shape.direction,'direction'),n=positive(Math.hypot(...d),'direction length'),p=pos(actor);positive(scale,'scale');finite(actor.facing,'facing');positive(shape.length,'length');
 const transform=(v,s)=>{let o=sourceActorVector({x:v[0],y:v[1],z:v[2]},actor.facing,s);return [o.x,o.y,o.z];};
 return {origin:transform(anchor,scale).map((v,i)=>v+p[i]),direction:transform(d.map(v=>v/n),1),length:shape.length*scale};
}
// 0x542060 fallback branch only. Native range limits CENTER distance before
// testing squared distance to the scaled HALF-LINE; this is not segment/AABB.
// Caller must establish the native dispatcher chose this branch. Choosing it
// for all S5 bodies remains a body-model approximation, even with exact math.
export function meleeRayEllipsoidContact(shape,actor,target,{width,height,scale=SCN_SCENE_SCALE,collisionMode}={}){
 if(collisionMode!=='ellipsoid')throw new TypeError('Explicit ellipsoid branch required; detailed actor volumes are unresolved');
 positive(width,'width');positive(height,'height');const ray=worldMeleeRay(shape,actor,scale),p=pos(target),center=[p[0],p[1]+height/2,p[2]],offset=center.map((v,i)=>v-ray.origin[i]);
 const centerDistance=Math.hypot(...offset);if(centerDistance>ray.length)return false;
 const radii=[width/2,height/2,width/2],q=offset.map((v,i)=>v/radii[i]),d=ray.direction.map((v,i)=>v/radii[i]),projection=dot(q,d);
 const t=projection>0?projection/dot(d,d):0,residual=q.map((v,i)=>v-t*d[i]);
 return dot(residual,residual)<=1;
}
// 0x578a10 stores a byte independently from SetCritical's two float fields.
export function withNativeAlwaysCritical(state,value){if(typeof value!=='boolean')throw new TypeError('Boolean AlwaysCritical required');return {...state,alwaysCritical:value};}
// 0x578c30 stores multiplier at +3e8 and chance percentage at +3f4.
// No clamp or automatic critical damage is applied by this setter.
export function withNativeCriticalParameters(state,multiplier,chancePercent){return {...state,criticalMultiplier:finite(multiplier,'critical multiplier'),criticalChancePercent:finite(chancePercent,'critical chance percentage')};}
// 0x574520's final decision given already-effective gear-adjusted values and
// the two supplied native random outputs. No RNG algorithm or gear values are
// fabricated. This is independent of AlwaysCritical and DependOn arbitration.
export function nativeCriticalScalarDecision({effectiveChancePercent,effectiveMultiplier,windowCenter,roll}){
 const half=finite(effectiveChancePercent,'effective chance percentage')*.5,multiplier=finite(effectiveMultiplier,'effective multiplier');finite(windowCenter,'native window center');finite(roll,'native roll');
 const critical=roll>windowCenter-half&&roll<windowCenter+half;
 return {critical,multiplier:critical?multiplier:1};
}
