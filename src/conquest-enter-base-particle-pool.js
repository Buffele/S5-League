import {conquestEnterBaseParticleSourceNode} from './conquest-enter-base-particle-source.js';
export function advanceConquestEnterBaseParticleTexture(p,{source,nodeIndex}={}){
 const node=conquestEnterBaseParticleSourceNode(source,nodeIndex),spec=node.emitter.sourceFields;
 if(!(p instanceof DataView)||p.byteLength!==0xac)throw Error('Current native Pawn particle fields required');
 if(node.textureMode===0||spec.textures.length<=1)return false;
 if(node.textureMode!==2||spec.textureIntervalMs<=0)throw Error('Unsupported Pawn source texture timeline');
 const step=Math.floor(p.getUint32(4,true)/spec.textureIntervalMs)>>>0;
 if(step<=p.getUint32(0xa8,true))return false;
 p.setUint32(0xa8,step,true);p.setUint32(0xa4,((p.getUint32(0xa0,true)+step)>>>0)%spec.textures.length,true);return true;
}

export {createConquestPawnParticleFields,advanceConquestPawnParticlePool} from './conquest-pawn-particle-pool.js';
