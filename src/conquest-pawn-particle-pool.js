import {retireNonFiniteConquestParticle} from './conquest-particle-finite-presentation.js';
import {advanceConquestPawnParticleAge} from './conquest-pawn-particle-simulation.js';
import {conquestPawnParticleSourceNode} from './conquest-pawn-particle-source.js';
const uint=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;
// Complete1168D30 constructor, excluding allocator ownership (the native
// pool copies a value object). Every field in its0xAC retained layout is set.
export function createConquestPawnParticleFields(){const p=new DataView(new ArrayBuffer(0xac));p.setFloat32(0,1,true);p.setUint32(4,0xffffffff,true);for(const off of [0x48,0x4c,0x50,0x54])p.setFloat32(off,10,true);for(let off=0x60;off<=0x8c;off+=4)p.setFloat32(off,1,true);return p;}
export function advanceConquestPawnParticleTexture(p,{source,nodeIndex}={}){
 const node=conquestPawnParticleSourceNode(source,nodeIndex),spec=node.emitter.sourceFields;
 if(!(p instanceof DataView)||p.byteLength!==0xac)throw Error('Current native Pawn particle fields required');
 if(node.textureMode===0||spec.textures.length<=1)return false;
 if(node.textureMode!==2||spec.textureIntervalMs<=0)throw Error('Unsupported Pawn source texture timeline');
 const step=Math.floor(p.getUint32(4,true)/spec.textureIntervalMs)>>>0;
 if(step<=p.getUint32(0xa8,true))return false;
 p.setUint32(0xa8,step,true);p.setUint32(0xa4,((p.getUint32(0xa0,true)+step)>>>0)%spec.textures.length,true);return true;
}

//11366E5..11368DF ordered pool traversal. Operation callbacks are mandatory
// source boundaries; no empty simulation/render defaults qualify them.
export function advanceConquestPawnParticlePool(particles,{remaining,capacity,deltaMs,control54,originNative}={},ports={}){
 if(!Array.isArray(particles)||particles.some(p=>!(p instanceof DataView)||p.byteLength!==0xac)||![remaining,capacity,deltaMs].every(uint)||particles.length>capacity||typeof control54!=='boolean'||!Array.isArray(originNative)||originNative.length!==3||!originNative.every(Number.isFinite))throw Error('Owned retained Pawn pool and explicit native traversal fields required');
 for(const key of ['integrate','retarget','textureTick','birth','render'])if(typeof ports[key]!=='function')throw Error('Actual Pawn pool operation '+key+' required');
 let invalidPresentationParticles=0;const rendered=[],initialLength=particles.length,operations=[];
 const render=(p,index)=>{ports.render(p,index);rendered.push(p);operations.push(['render',index]);};
 for(let index=0;index<initialLength;index++){const p=particles[index];operations.push(['age',index]);
  if(advanceConquestPawnParticleAge(p,deltaMs)){
   if(!control54)for(let i=0;i<3;i++)p.setFloat32(0x0c+i*4,originNative[i],true);
   ports.integrate(p,deltaMs);operations.push(['integrate',index]);ports.retarget(p);operations.push(['retarget',index]);if(retireNonFiniteConquestParticle(p)){invalidPresentationParticles++;operations.push(['retire-nonfinite-presentation',index]);continue;}ports.textureTick(p);operations.push(['texture',index]);render(p,index);
  }else if(remaining>0){remaining--;ports.birth(p);operations.push(['birth',index]);render(p,index);}
 }
 remaining=Math.min(remaining,(capacity-particles.length)>>>0);
 for(let i=0;i<remaining;i++){const p=createConquestPawnParticleFields(),index=particles.length;operations.push(['construct',index]);particles.push(p);operations.push(['append',index]);ports.birth(p);operations.push(['birth',index]);render(p,index);}
 return Object.freeze({rendered:Object.freeze(rendered),operations:Object.freeze(operations.map(Object.freeze)),sourcePoolTraversalQualified:invalidPresentationParticles===0,invalidPresentationParticles,presentationContainmentPolicy:'s5-retire-nonfinite-cosmetic-slot',sourceOperationProducersQualified:false,remainingConsumed:remaining,initialLength,poolLength:particles.length,nativeReady:false});
}
