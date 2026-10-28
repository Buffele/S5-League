// Rook source-bound use of the same independently CPU-qualified CActParticle stages.
// Scoped source extension of the independently CPU-qualified EnterBase kernels.
import {conquestRookParticleSourceNode} from './conquest-rook-particle-source.js';
import {CONQUEST_PAWN_PARTICLE_NUMERICS} from './conquest-pawn-particle-simulation.js';
const f=Math.fround,DEG=0.017453292521994,TAU_SOURCE=6.28000020980835;
// Source1136C50/control+2C of the authenticated Rook source rows.

import {CONQUEST_PAWN_PARTICLE_TRIG_PROFILE} from './conquest-pawn-particle-spatial.js';
const read=(v,off)=>v.getFloat32(off,true),write=(v,off,x)=>v.setFloat32(off,x,true);
function vector(value){if(!Array.isArray(value)||value.length!==3||value.some(v=>!Number.isFinite(v)||!Number.isFinite(f(v))))throw Error('Current finite native spatial vector required');return value.map(f);}
function axisRotate(v,axis,degrees){
 const radians=f(f(degrees)*DEG),s=f(Math.sin(radians)),c=f(Math.cos(radians)),dot=f(f(f(axis[0]*v[0])+f(axis[1]*v[1]))+f(axis[2]*v[2])),parallel=axis.map(a=>f(a*dot)),perpendicular=v.map((a,i)=>f(f(a-parallel[i])*c)),cross=[f(f(axis[1]*v[2])-f(axis[2]*v[1])),f(f(axis[2]*v[0])-f(axis[0]*v[2])),f(f(axis[0]*v[1])-f(axis[1]*v[0]))].map(a=>f(a*s));
 return v.map((_,i)=>f(f(parallel[i]+perpendicular[i])+cross[i]));
}
function rotate(v,axis,degrees){const radians=f(f(degrees)*DEG),s=f(Math.sin(radians)),c=f(Math.cos(radians)),[x,y,z]=v;if(axis===0)return [x,f(f(y*c)-f(z*s)),f(f(y*s)+f(z*c))];if(axis===1)return [f(f(x*c)+f(z*s)),y,f(f(z*c)-f(x*s))];return [f(f(x*c)-f(y*s)),f(f(x*s)+f(y*c)),z];}

// Complete1136E29..1137335 for the source-produced Rook shapes. The
// source rows include variable ellipsoid shape0 and variable cylinder shape1.
// Retained runtime-frame and current emitter fields are explicit boundaries;
// this stage does not infer their native producers from a Three pose.
export function applyConquestRookParticleSpatialBirth(fields,{source,nodeIndex,numericalProfile,trigProfile,currentEmitterFields,runtimeFrame,nextRandom15}={}){
 if(!(fields instanceof DataView)||fields.byteLength<0xac||!(currentEmitterFields instanceof DataView)||currentEmitterFields.byteLength<0x64)throw Error('Retained particle and current emitter native layouts required');
 if(numericalProfile!==CONQUEST_PAWN_PARTICLE_NUMERICS||trigProfile!==CONQUEST_PAWN_PARTICLE_TRIG_PROFILE)throw Error('Explicit supported Pawn numerical and trig profiles required');
 const c=conquestRookParticleSourceNode(source,nodeIndex),e=currentEmitterFields,origin=vector(runtimeFrame?.originNative),axis=vector(runtimeFrame?.rotationAxisNative),angle=f(runtimeFrame?.rotationDegrees),shape=e.getInt32(0x34,true);
 if(!Number.isFinite(angle)||typeof nextRandom15!=='function')throw Error('Current native rotation and CRT15 stream required');
 if(shape!==c.emitter[0x34]||![0,1].includes(shape)||Array.from({length:20},(_,i)=>0x14+i*4).filter(off=>![0x34,0x58,0x5c,0x60].includes(off)).some(off=>!Number.isFinite(read(e,off))))throw Error('Current finite source Pawn emitter fields required');
 const maxRadius=read(e,0x3c),maxHeight=read(e,0x44),volume=maxRadius!==0||maxHeight!==0;

 let randomDraws=0;const next=()=>{const x=nextRandom15();if(!Number.isInteger(x)||x<0||x>32767)throw Error('Actual CRT15 unsigned sample domain required');randomDraws++;return x;},difference=()=>f(next()-next())/32767;
 const position=[0,4,8].map(off=>c.control54?read(e,0x14+off):f(origin[off/4]+read(e,0x14+off)));
 if(!c.control54)for(let i=0;i<3;i++)write(fields,0x0c+i*4,origin[i]);
 if(volume){
  const minRadius=read(e,0x38),minHeight=read(e,0x40),radius=minRadius===maxRadius?maxRadius:f(next()/32768*(maxRadius-minRadius)+minRadius),height=minHeight===maxHeight?maxHeight:f(next()/32768*(maxHeight-minHeight)+minHeight);let offset;
  if(shape===0){const a=f(next()/32768*TAU_SOURCE),b=f(next()/32768*TAU_SOURCE),s=f(Math.sin(b));offset=[f(f(Math.cos(a))*(s*radius)),f(f(Math.cos(b))*height),f(f(Math.sin(a))*(s*radius))];}
  else{const radians=f(next()/32768*TAU_SOURCE);offset=axisRotate([f(f(Math.cos(radians))*radius),height,f(f(Math.sin(radians))*radius)],axis,angle);}
  for(let i=0;i<3;i++)position[i]=f(position[i]+offset[i]);
 }
 for(let i=0;i<3;i++){write(fields,0x18+i*4,position[i]);write(fields,0x24+i*4,position[i]);}
 let speed=read(e,0x30);if(c.speedVariation!==0)speed=f(c.speedVariation*difference()+speed);
 let velocity=axisRotate([0,4,8].map(off=>f(read(e,0x20+off)*speed)),axis,angle);
 // Three distinct differences are consumed even if the spread is zero.
 for(let i=0;i<3;i++)velocity=rotate(velocity,i,f(difference()*read(e,0x2c)));
 for(let i=0;i<3;i++)write(fields,0x3c+i*4,velocity[i]);
 return {sourceStart:0x1136e29,sourceEnd:0x1137335,randomDraws,spatialBirthStageQualified:true,numericalProfile:numericalProfile.name,trigProfile:trigProfile.name,nativeCRTImplementationQualified:false,runtimeFrameProducerQualified:false,emitterRowProducerQualified:false,drawQualified:false,effectLifetimeQualified:false,nativeReady:false};
}
