// Scoped source extension of the independently CPU-qualified EnterBase kernels.
import {conquestPawnExplodeParticleSourceNode} from './conquest-pawn-explode-particle-source.js';
import {CONQUEST_PAWN_PARTICLE_NUMERICS} from './conquest-pawn-particle-simulation.js';
import {CONQUEST_PAWN_PARTICLE_TRIG_PROFILE} from './conquest-pawn-particle-spatial.js';
const f=Math.fround,DEG=0.017453292521994;
const add=(a,b)=>a.map((x,i)=>f(x+b[i])),sub=(a,b)=>a.map((x,i)=>f(x-b[i])),mul=(a,k)=>a.map(x=>f(x*k));
const cross=(a,b)=>[f(f(a[1]*b[2])-f(a[2]*b[1])),f(f(a[2]*b[0])-f(a[0]*b[2])),f(f(a[0]*b[1])-f(a[1]*b[0]))];
function normalize(v){const len=f(Math.sqrt(f(f(f(v[0]*v[0])+f(v[1]*v[1]))+f(v[2]*v[2]))));return len===0?v:mul(v,f(1/len));}
function vector(value){if(!Array.isArray(value)||value.length!==3||value.some(x=>!Number.isFinite(x)||!Number.isFinite(f(x))))throw Error('Current finite native draw vector required');return value.map(f);}
function rotate(v,axis,angle){if(angle===0)return v;const r=f(f(angle)*DEG),s=f(Math.sin(r)),c=f(Math.cos(r)),[x,y,z]=v;return axis==='y'?[f(f(x*c)+f(z*s)),y,f(f(z*c)-f(x*s))]:[f(f(x*c)-f(y*s)),f(f(x*s)+f(y*c)),z];}

// Geometry subranges of1240600/1240A30/1241280. The camera's native view
// transform (mode0) and camera vector getter1139F10 (mode1) remain explicit
// producer boundaries. No velocity/axis fallback is invented for zero motion.
export function conquestPawnExplodeParticleDrawGeometry(fields,{source,nodeIndex,numericalProfile,trigProfile,runtimeOriginNative,instanceAlpha,viewCenterNative,cameraVectorNative}={}){
 if(!(fields instanceof DataView)||fields.byteLength<0xac)throw Error('Retained particle native layout required');
 if(numericalProfile!==CONQUEST_PAWN_PARTICLE_NUMERICS||trigProfile!==CONQUEST_PAWN_PARTICLE_TRIG_PROFILE)throw Error('Explicit Pawn draw numerical and trig profiles required');
 const node=conquestPawnExplodeParticleSourceNode(source,nodeIndex),read=off=>fields.getFloat32(off,true),origin=vector(runtimeOriginNative),alpha=f(instanceAlpha);
 if(!Number.isFinite(alpha)||[0x18,0x1c,0x20,0x24,0x28,0x2c,0x48,0x4c,0x60,0x64,0x68,0x6c,0x90].some(off=>!Number.isFinite(read(off))))throw Error('Current finite particle draw fields and alpha required');
 const center=add([read(0x24),read(0x28),read(0x2c)],node.control54?origin:[0,0,0]),width=read(0x48),height=read(0x4c),angle=read(0x90);let a,b,c,d,space;
 if(node.drawMode===3){const left=rotate([-width,0,height],'y',angle),right=rotate([width,0,height],'y',angle);a=add(center,left);b=sub(center,right);c=add(center,right);d=sub(center,left);space='native-world';}
 else if(node.drawMode===2){const camera=vector(cameraVectorNative),heading=camera[0]===0?0:f(((camera[0]>0?1.5707999467849731:-1.5707999467849731)-f(Math.atan(f(camera[2]/camera[0]))))*57.295799255371094),left=rotate(rotate([-width,height,0],'z',angle),'y',heading),right=rotate(rotate([width,height,0],'z',angle),'y',heading);a=add(center,left);b=sub(center,right);c=add(center,right);d=sub(center,left);space='native-world';}
 else if(node.drawMode===0){const view=vector(viewCenterNative),left=rotate([-width,height,0],'z',angle),right=rotate([width,height,0],'z',angle);a=add(view,left);b=sub(view,right);c=add(view,right);d=sub(view,left);space='native-view';}
 else if(node.drawMode===1){const axis=mul(normalize(sub([read(0x24),read(0x28),read(0x2c)],[read(0x18),read(0x1c),read(0x20)])),height),side=mul(normalize(cross(vector(cameraVectorNative),axis)),width);a=sub(add(center,axis),side);b=sub(sub(center,axis),side);c=add(add(center,axis),side);d=add(sub(center,axis),side);space='native-world';}
 else throw Error('Unsupported source Pawn particle draw mode');
 return Object.freeze({drawMode:node.drawMode,coordinateSpace:space,centerNative:Object.freeze(center),positions:Object.freeze([...b,...a,...d,...d,...a,...c]),rgba:Object.freeze([read(0x60),read(0x64),read(0x68),f(read(0x6c)*alpha)]),geometryStageQualified:true,cameraProducerQualified:false,nativeD3DXImplementationQualified:false,nativeCRTImplementationQualified:false,nativeGPUQualified:false,effectLifetimeQualified:false,nativeReady:false});
}
