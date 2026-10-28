// Shared, bounded translations of native melee mechanisms. These functions do
// not certify loaded weapon stats, target dimensions, damage or DependOn rules.
// Evidence and limits: work/melee-batch/native-mechanisms.md.
import {SCN_SCENE_SCALE,sourceActorVector} from './s5runtime-coordinates.js';
import {nativeBoxAabbIntersection} from '../tools/s5runtime-arsenal/attack-box-intersection.mjs';

const finite=(n,name)=>{if(!Number.isFinite(n))throw new TypeError(`Finite ${name} required`);return n;};
function vector(v,name){
 if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw new TypeError(`Finite ${name} vec3 required`);
 return v;
}
function positive(n,name){finite(n,name);if(n<=0)throw new RangeError(`Positive ${name} required`);return n;}
function position(actor){const p=actor?.position;return vector([p?.x,p?.y,p?.z],'actor position');}
function actorVector(v,actor,scale){
 const p=sourceActorVector({x:v[0],y:v[1],z:v[2]},finite(actor.facing,'facing'),scale);
 return [p.x,p.y,p.z];
}
function horizontalDirection(shape){
 const raw=shape.direction??[0,0,-1];
 const d=vector(raw.length===2?[raw[0],0,raw[1]]:raw,'direction');
 if(d[1]!==0)throw new RangeError('Only source-horizontal melee shapes are verified');
 const length=positive(Math.hypot(d[0],d[2]),'direction length');
 return [d[0]/length,0,d[2]/length];
}

// MAKEBOX's anchor lies on its rear face; W,H,D are FULL extents.
// Native 0x53faf0 / 0x5f5790. S5 yaw/scale is applied at one boundary.
export function worldMeleeBox(shape,actor,scale=SCN_SCENE_SCALE){
 if(shape?.type!=='box')throw new TypeError('Expected box shape');
 const anchor=vector(shape.anchor,'anchor'),dimensions=vector(shape.dimensions,'dimensions');
 dimensions.forEach((v,i)=>positive(v,`dimension ${i}`));positive(scale,'scale');
 const d=horizontalDirection(shape),p=position(actor);
 const localCenter=anchor.map((v,i)=>v+d[i]*dimensions[2]/2);
 const translated=actorVector(localCenter,actor,scale);
 return {center:translated.map((v,i)=>v+p[i]),halfExtents:dimensions.map(v=>v*scale/2),
  axes:[actorVector([-d[2],0,d[0]],actor,1),[0,1,0],actorVector([-d[0],0,-d[2]],actor,1)]};
}

// Width and height MUST be supplied in world units. Native candidate bodies
// use a square X/Z footprint and a feet-to-head Y interval (0x53fef3).
// Supplying S5 training dimensions is an explicit approximation of the body.
export function meleeBoxContact(shape,actor,target,{width,height,scale=SCN_SCENE_SCALE}={}){
 positive(width,'target width');positive(height,'target height');
 const p=position(target),half=width/2;
 return nativeBoxAabbIntersection(worldMeleeBox(shape,actor,scale),
  [p[0]-half,p[1],p[2]-half],[p[0]+half,p[1]+height,p[2]+half]).intersects;
}

// MAKEFAN 0x568540 stores four unchanged scalars and a normalized direction.
// Scalar 1 controls lateral offsets and box width; 2 controls height;
// 3 controls depth/radial tests; 4 enters +/-half-angle rotations.
export function worldMeleeFan(shape,actor,scale=SCN_SCENE_SCALE){
 if(shape?.type!=='fan')throw new TypeError('Expected fan shape');
 const anchor=vector(shape.anchor,'anchor'),p=position(actor);
 const scalars=shape.scalars??shape.parameters;
 if(!Array.isArray(scalars)||scalars.length!==4)throw new TypeError('Four MAKEFAN scalars required');
 scalars.forEach((v,i)=>positive(v,`fan scalar ${i}`));positive(scale,'scale');
 const translated=actorVector(anchor,actor,scale);
 return {anchor:translated.map((v,i)=>v+p[i]),direction:actorVector(horizontalDirection(shape),actor,1),
  width:scalars[0]*scale,height:scalars[1]*scale,depth:scalars[2]*scale,
  angleParameter:scalars[3],nativeCollisionVerified:false};
}

const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
// 0x100b960: degrees -> radians constant at 0x13ab558, RotateY.
const rotateY=(v,degrees)=>{
 const angle=degrees*.017453292521994,c=Math.cos(angle),s=Math.sin(angle);
 return [v[0]*c+v[2]*s,v[1],v[2]*c-v[0]*s];
};

// Static transcription of the boolean branches at 0x540950. A FAN is a
// BOX union (three half-spaces intersect two displaced disks and height),
// not a centered cone. The BOX has inclusive contact; the later plane,
// disk and height branches use strict comparisons. This returns a contact,
// not the native contact POINT or any target/damage policy. JS trig, unit
// conversion and x87 precision are not a bit-exact native emulator.
export function meleeFanContact(shape,actor,target,{width,height,scale=SCN_SCENE_SCALE}={}){
 positive(width,'target width');positive(height,'target height');
 const fan=worldMeleeFan(shape,actor,scale),p=position(target),radius=width/2;
 const scalars=shape.scalars??shape.parameters;
 const core={type:'box',anchor:shape.anchor,direction:shape.direction,dimensions:scalars.slice(0,3)};
 if(meleeBoxContact(core,actor,target,{width,height,scale}))return true;
 const d=fan.direction,a=fan.anchor;
 const right=rotateY(d,-90),left=rotateY(d,90);
 const q1=a.map((v,i)=>v+right[i]*fan.width/2),q2=a.map((v,i)=>v+left[i]*fan.width/2);
 const n1=rotateY(rotateY(d,-fan.angleParameter/2),90);
 const n2=rotateY(rotateY(d,fan.angleParameter/2),-90);
 if(dot(d,subtract(p,a))<=-radius||dot(n1,subtract(p,q1))<=-radius||dot(n2,subtract(p,q2))<=-radius)return false;
 const reach=fan.depth+radius;
 if(!(Math.hypot(p[0]-q1[0],p[2]-q1[2])<reach||Math.hypot(p[0]-q2[0],p[2]-q2[2])<reach))return false;
 return p[1]<a[1]+fan.height/2&&p[1]+height>a[1]-fan.height/2;
}

// MAKECYLINDER 0x568770 is type 2. Scalars are stored at +4c/+58;
// dispatch 0x544953 passes them as height, radius to 0x5403a0.
// The anchor is vertically centered, unlike the victim's feet position.
export function worldMeleeCylinder(shape,actor,scale=SCN_SCENE_SCALE){
 if(shape?.type!=='cylinder')throw new TypeError('Expected cylinder shape');
 const anchor=vector(shape.anchor,'anchor'),p=position(actor),args=shape.arguments;
 if(!Array.isArray(args)||args.length!==2)throw new TypeError('Two MAKECYLINDER arguments required');
 finite(args[0],'cylinder height');if(args[0]<0)throw new RangeError('Nonnegative cylinder height required');
 positive(args[1],'cylinder radius');positive(scale,'scale');
 const translated=actorVector(anchor,actor,scale);
 return {center:translated.map((v,i)=>v+p[i]),height:args[0]*scale,radius:args[1]*scale};
}

// Native 0x5403a0: circle/actor-radius and vertical interval tests are strict.
// No forward hemisphere filter: this cylinder reaches behind its owner too.
export function meleeCylinderContact(shape,actor,target,{width,height,scale=SCN_SCENE_SCALE}={}){
 positive(width,'target width');positive(height,'target height');
 const cylinder=worldMeleeCylinder(shape,actor,scale),p=position(target),c=cylinder.center;
 return Math.hypot(p[0]-c[0],p[2]-c[2])<cylinder.radius+width/2&&
  p[1]<c[1]+cylinder.height/2&&p[1]+height>c[1]-cylinder.height/2;
}

export function meleeShapeContact(shape,actor,target,options){
 if(shape?.type==='box')return {intersects:meleeBoxContact(shape,actor,target,options),geometry:'native-box',approximate:false};
 if(shape?.type==='fan')return {intersects:meleeFanContact(shape,actor,target,options),geometry:'native-fan',approximate:false,
  numericLimit:'Static boolean geometry port, not bit-exact x87/SSE or native runtime certification'};
 if(shape?.type==='cylinder')return {intersects:meleeCylinderContact(shape,actor,target,options),geometry:'native-cylinder',approximate:false,
  numericLimit:'Static boolean geometry port, not bit-exact x87/SSE or native runtime certification'};
 throw new TypeError('Unsupported melee shape');
}

// Contact record point, not a nearest surface projection. Static native
// 0x540100/0x541460/0x541d20/0x540700; proof impact-points-native.json.
// The calls to100b580 compute length without changing the displacement.
// BOX/FAN use full depth; CYLINDER uses radius. Target width is the full
// actor slot+68 value here, unlike its half-width in intersection tests.
export function meleeShapeImpactPoint(shape,actor,target,{width,height,scale=SCN_SCENE_SCALE}={}){
 positive(width,'target width');positive(height,'target height');positive(scale,'scale');
 if(!meleeShapeContact(shape,actor,target,{width,height,scale}).intersects)return null;
 const p=position(actor),q=position(target),offset=actorVector(vector(shape.anchor,'anchor'),actor,scale);
 const a=offset.map((v,i)=>v+p[i]);
 const reach=shape.type==='box'?shape.dimensions[2]*scale:shape.type==='fan'?(shape.scalars??shape.parameters)[2]*scale:shape.arguments[1]*scale;
 const ratio=reach/(width+reach);
 return {x:a[0]+(q[0]-a[0])*ratio,y:Math.max(q[1],Math.min(q[1]+height,a[1])),z:a[2]+(q[2]-a[2])*ratio};
}

// Strict native timer comparison. No epsilon, overshoot carry or automatic
// skip over the zero-duration recovery: one state transition per tick.
// The caller supplies the source-verified phases; this does NOT decide which
// InitLua argument is action/recovery/minimum for an untyped native class.
export function advanceMeleeClock(clock,dtMs,phases){
 finite(dtMs,'dtMs');if(dtMs<0)throw new RangeError('Negative dtMs');
 if(!Array.isArray(phases)||!phases.length)throw new TypeError('Explicit clock phases required');
 const index=clock.phaseIndex??0;
 if(!Number.isInteger(index)||index<0||index>=phases.length)throw new RangeError('Invalid phase index');
 phases.forEach(p=>{finite(p.durationMs,'durationMs');if(p.durationMs<0)throw new RangeError('Negative phase duration');});
 if(clock.complete)return {...clock};
 const timeMs=finite(clock.timeMs??0,'timeMs')+dtMs;
 const phaseTimeMs=finite(clock.phaseTimeMs??0,'phaseTimeMs')+dtMs;
 if(phaseTimeMs<=phases[index].durationMs)return {...clock,timeMs,phaseTimeMs,phaseIndex:index,phase:phases[index].id,complete:false};
 if(index===phases.length-1)return {...clock,timeMs,phaseTimeMs,phaseIndex:index,phase:phases[index].id,complete:true};
 return {...clock,timeMs,phaseTimeMs:0,phaseIndex:index+1,phase:phases[index+1].id,complete:false};
}

// DependOn/AlwaysCritical are declarations, not proof that damage is additive,
// exclusive or multiplied by a particular factor. A runtime using these
// provisional policies must choose and document one; there is no default.
// Inputs are already intersecting contact records or null; returns records.
export function selectMeleeContact(normal,critical,{policy}={}){
 if(policy==='normal-only')return normal?[normal]:[];
 if(policy==='critical-replaces-normal')return critical?[critical]:normal?[normal]:[];
 if(policy==='independent')return [normal,critical].filter(Boolean);
 throw new TypeError('Explicit melee critical policy required');
}
