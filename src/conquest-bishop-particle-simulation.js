// Bishop source-bound use of the same independently CPU-qualified CActParticle stages.
// Scoped source extension of the independently CPU-qualified EnterBase kernels.
// Low-level native particle-field stages. These consume the retained native
// layout; they do not manufacture a qualified birth, emitter, draw or effect
// lifetime owner. They can be composed once those separate producers close.
import {conquestBishopParticleSourceNode} from './conquest-bishop-particle-source.js';
import {CONQUEST_PAWN_PARTICLE_NUMERICS} from './conquest-pawn-particle-simulation.js';
const f=Math.fround,uint=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;

export const CONQUEST_PAWN_PARTICLE_LAYOUT=Object.freeze({bytes:0xac,age:4,life:8,origin:0x0c,previousPosition:0x18,position:0x24,acceleration:0x30,velocity:0x3c,halfSize:0x48,halfSizeRate:0x58,color:0x60,colorRate:0x80,angle:0x90,angleRate:0x98,orbitalRate:0x9c});
function view(fields){if(!(fields instanceof DataView)||fields.byteLength<CONQUEST_PAWN_PARTICLE_LAYOUT.bytes)throw Error('Retained native Pawn particle DataView layout required');return fields;}
function numerics(profile){if(profile!==CONQUEST_PAWN_PARTICLE_NUMERICS)throw Error('Explicit supported Pawn particle numerical profile required');}
const read=(v,off)=>v.getFloat32(off,true),write=(v,off,x)=>v.setFloat32(off,x,true);

// Complete1168F40, including signed tests and its dead-slot sentinel. Negative
// age is already dead and is not incremented; expiry storesFFFFFFFF, notlife.
export function advanceConquestBishopParticleAge(fields,deltaMs){
 const v=view(fields);if(!uint(deltaMs))throw Error('Native unsigned particle delta required');
 const age=v.getInt32(4,true);if(age<0)return false;
 const next=(age+deltaMs)>>>0;v.setUint32(4,next,true);
 if((next|0)<v.getInt32(8,true))return true;
 v.setUint32(4,0xffffffff,true);return false;
}

// Complete1168F90. Native vector multiply
// helpers store each product tofloat before the separate vector addition.
// Color/angle use an x87 multiply+add with only the final float store.
export function integrateConquestBishopParticleFields(fields,deltaMs,{numericalProfile}={}){
 const v=view(fields);numerics(numericalProfile);if(!uint(deltaMs))throw Error('Native unsigned particle delta required');
 // Original1168F90 accepts IEEE nonfinite intermediate rates. Bishop third effect
 // node1 reaches its final authored appearance time at age800/life2000;
 // retarget creates0*Infinity rates, then replaces current values next tick.
 // The strict five-node Pawn kernel is deliberately kept separate.
 const seconds=f(f(deltaMs)*.001),position=[0,4,8].map(i=>read(v,0x24+i)),velocity=[0,4,8].map(i=>read(v,0x3c+i)),acceleration=[0,4,8].map(i=>read(v,0x30+i));
 for(let i=0;i<3;i++){
  write(v,0x18+i*4,position[i]);write(v,0x24+i*4,f(position[i]+f(velocity[i]*seconds)));write(v,0x3c+i*4,f(velocity[i]+f(acceleration[i]*seconds)));
 }
 for(const off of [0,4])write(v,0x48+off,f(read(v,0x48+off)+f(read(v,0x58+off)*seconds)));
 for(const off of [0,4,8,12])write(v,0x60+off,f(read(v,0x80+off)*seconds+read(v,0x60+off)));
 write(v,0x90,f(read(v,0x98)*seconds+read(v,0x90)));
 const orbitalRate=read(v,0x9c);
 if(orbitalRate!==0){
  const direction=[0,4,8].map(off=>f(read(v,0x0c+off)-read(v,0x24+off))),length=f(Math.sqrt(f(f(f(direction[0]*direction[0])+f(direction[1]*direction[1]))+f(direction[2]*direction[2]))));
  if(length!==0){const inverse=f(1/length);for(let i=0;i<3;i++)direction[i]=f(direction[i]*inverse);}
  for(let i=0;i<3;i++)write(v,0x3c+i*4,f(read(v,0x3c+i*4)+f(f(direction[i]*orbitalRate)*seconds)));
 }
 return {source:0x1168f90,seconds,numericalProfile:numericalProfile.name,orbitalBranch:orbitalRate===0?'source-zero':'source-normalized-origin-attraction',fieldIntegrationQualified:true,birthProducerQualified:false,emitterUpdateQualified:false,drawQualified:false,effectLifetimeQualified:false,nativeReady:false};
}

// Complete1137C50 scoped to the authenticated Bishop particle profiles. The current
// native fields and the explicit CRT15 stream are separate input producers;
// this does not claim their births or the process-global RNG were observed.
export function retargetConquestBishopParticleFields(fields,{source,nodeIndex,numericalProfile,parentScale,nextRandom15}={}){
 const v=view(fields);numerics(numericalProfile);const c=conquestBishopParticleSourceNode(source,nodeIndex);
 if(typeof nextRandom15!=='function'||!Number.isFinite(parentScale)||!Number.isFinite(f(parentScale)))throw Error('Explicit current parent scale and CRT15 stream required');
 const age=v.getInt32(4,true),life=v.getInt32(8,true);
 const floatOffsets=[0,0x48,0x4c,0x50,0x54,0x60,0x64,0x68,0x6c,0x70,0x74,0x78,0x7c,0x90,0x94];// Original1137C50 preserves source IEEE rates; this scoped source can reach a final appearance key.
 const ratio=f(f(age)/f(life));if(Number.isNaN(ratio)||read(v,0)>ratio)return {source:0x1137c50,changed:false,randomDraws:0,retargetQualified:true,nativeReady:false};
 let randomDraws=0;const difference=()=>{const a=nextRandom15(),b=nextRandom15();randomDraws+=2;if(!Number.isInteger(a)||a<0||a>32767||!Number.isInteger(b)||b<0||b>32767)throw Error('Actual CRT15 unsigned sample domain required');return f(a-b)/32767;};
 for(const off of [0,4])write(v,0x48+off,read(v,0x50+off));for(const off of [0,4,8,12])write(v,0x60+off,read(v,0x70+off));write(v,0x90,read(v,0x94));
 let keyIndex=c.appearance.length-1;for(let i=c.appearance.length-2;i>=0;i--)if(ratio>=c.appearance[i][0]){keyIndex=i;break;}
 const key=c.appearance[(keyIndex+1)%c.appearance.length];write(v,0,key[0]);
 for(const off of [0,4])write(v,0x50+off,c.retainSize?read(v,0x48+off):key[1+off/4]);
 for(const off of [0,4,8])write(v,0x70+off,c.retainRGB?read(v,0x60+off):key[3+off/4]);
 write(v,0x7c,c.retainAlpha?read(v,0x6c):key[6]);write(v,0x94,c.retainAngle?read(v,0x90):key[7]);
 const sizeScale=c.inheritanceMask&4?f(parentScale):1;if(c.inheritanceMask&4)for(const off of [0,4])write(v,0x50+off,f(read(v,0x50+off)*sizeScale));
 const inverse=f(1000/((read(v,0)-ratio)*f(life)));
 if(!c.retainSize){
  if(c.commonSizeVariation!==0){const offset=f(c.commonSizeVariation*difference()*sizeScale);for(const off of [0,4])write(v,0x50+off,Math.max(0,f(read(v,0x50+off)+offset)));}
  if(c.sizeVariation.some(value=>value!==0))for(let i=0;i<2;i++)write(v,0x50+i*4,Math.max(0,f(c.sizeVariation[i]*difference()*sizeScale+read(v,0x50+i*4))));
  for(const off of [0,4])write(v,0x58+off,f(f(read(v,0x50+off)-read(v,0x48+off))*inverse));
 }else for(const off of [0,4])write(v,0x58+off,0);
 if(!c.retainRGB){if(c.rgbVariation.some(value=>value!==0))for(let i=0;i<3;i++)write(v,0x70+i*4,Math.min(1,Math.max(0,f(c.rgbVariation[i]*difference()+read(v,0x70+i*4)))));for(const off of [0,4,8])write(v,0x80+off,f((read(v,0x70+off)-read(v,0x60+off))*inverse));}else for(const off of [0,4,8])write(v,0x80+off,0);
 if(!c.retainAlpha){if(c.alphaVariation!==0)write(v,0x7c,Math.min(1,Math.max(0,f(c.alphaVariation*difference()+read(v,0x7c)))));write(v,0x8c,f((read(v,0x7c)-read(v,0x6c))*inverse));}else write(v,0x8c,0);
 if(!c.retainAngle){if(c.angleVariation!==0)write(v,0x94,f(c.angleVariation*difference()+read(v,0x94)));write(v,0x98,f((read(v,0x94)-read(v,0x90))*inverse));}else write(v,0x98,0);
 return {source:0x1137c50,changed:true,keyIndex:(keyIndex+1)%c.appearance.length,randomDraws,retargetQualified:true,appearanceLoaderProducerQualified:false,birthProducerQualified:false,drawQualified:false,effectLifetimeQualified:false,nativeReady:false};
}

// Original1136C50..1136E29 nonspatial prefix. These source profiles select
// a fixed texture index0, and masks0/3 do not scale life or initial size.
// Position/velocity are deliberately left to the intervening spatial birth.
export function initializeConquestBishopParticleBirthFields(fields,{source,nodeIndex,numericalProfile,parentScale,currentEmitterFields}={}){
 const v=view(fields);numerics(numericalProfile);const c=conquestBishopParticleSourceNode(source,nodeIndex),key=c.appearance[0],row=currentEmitterFields;
 if(!(row instanceof DataView)||row.byteLength<0x64)throw Error('Current evaluated native emitter row required for birth');
 if(!Number.isFinite(parentScale)||!Number.isFinite(f(parentScale))||c.emitter[0x60]<0)throw Error('Current source fixed-index Pawn birth profile required');
 write(v,0,key[0]);for(const off of [0,4])write(v,0x50+off,f(key[1+off/4]*(c.inheritanceMask&4?f(parentScale):1)));
 for(const off of [0,4,8,12])write(v,0x70+off,key[3+off/4]);write(v,0x94,key[7]);
 v.setUint32(4,0,true);v.setUint32(8,row.getUint32(0x58,true),true);for(const off of [0,4,8])write(v,0x30+off,row.getFloat32(0x48+off,true));write(v,0x9c,row.getFloat32(0x54,true));v.setUint32(0xa8,0,true);v.setUint32(0xa0,row.getUint32(0x60,true),true);v.setUint32(0xa4,row.getUint32(0x60,true),true);
 return {sourceStart:0x1136c50,sourceEnd:0x1136e29,birthFieldPrefixQualified:true,spatialBirthQualified:false,emitterLiveRowProducerQualified:false,nativeReady:false};
}

// Original1137335..1137987 after spatial birth. Invoke this with the CRT
// stream at that exact stage, after its preceding spatial/velocity draws.
export function varyConquestBishopParticleBirthFields(fields,{source,nodeIndex,numericalProfile,parentScale,nextRandom15}={}){
 const v=view(fields);numerics(numericalProfile);const c=conquestBishopParticleSourceNode(source,nodeIndex);
 if(typeof nextRandom15!=='function'||!Number.isFinite(parentScale)||!Number.isFinite(f(parentScale)))throw Error('Explicit current parent scale and CRT15 stream required');
 const floatOffsets=[0,0x50,0x54,0x70,0x74,0x78,0x7c,0x94];if(floatOffsets.some(off=>!Number.isFinite(read(v,off)))||v.getInt32(4,true)!==0||v.getInt32(8,true)<=0)throw Error('Current source birth prefix fields required');
 let randomDraws=0;const next=()=>{const x=nextRandom15();if(!Number.isInteger(x)||x<0||x>32767)throw Error('Actual CRT15 unsigned sample domain required');randomDraws++;return x;},difference=()=>f(next()-next())/32767;
 if(c.lifeVariationMs!==0){const offset=Math.trunc(f(c.lifeVariationMs)*difference()*(c.inheritanceMask&8?f(parentScale):1));v.setUint32(8,(v.getUint32(8,true)+offset)>>>0,true);}
 const sizeScale=c.inheritanceMask&4?f(parentScale):1;
 if(c.commonSizeVariation!==0){const offset=f(c.commonSizeVariation*difference()*sizeScale);for(const off of [0,4])write(v,0x50+off,Math.max(0,f(read(v,0x50+off)+offset)));}
 if(c.sizeVariation.some(value=>value!==0))for(let i=0;i<2;i++)write(v,0x50+i*4,Math.max(0,f(c.sizeVariation[i]*difference()*sizeScale+read(v,0x50+i*4))));
 if(c.rgbVariation.some(value=>value!==0))for(let i=0;i<3;i++)write(v,0x70+i*4,Math.min(1,Math.max(0,f(c.rgbVariation[i]*difference()+read(v,0x70+i*4)))));
 if(c.alphaVariation!==0)write(v,0x7c,Math.min(1,Math.max(0,f(c.alphaVariation*difference()+read(v,0x7c)))));
 if(c.angleVariation!==0)write(v,0x94,f(c.angleVariation*difference()+read(v,0x94)));
 const retarget=retargetConquestBishopParticleFields(v,{source,nodeIndex,numericalProfile,parentScale,nextRandom15:next});
 return {sourceStart:0x1137335,sourceEnd:0x1137987,randomDraws,retarget,birthVarianceTailQualified:true,spatialBirthQualified:false,emitterLiveRowProducerQualified:false,nativeReady:false};
}
