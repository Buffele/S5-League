// King source-bound use of the same independently CPU-qualified CActParticle stages.
// Scoped source extension of the independently CPU-qualified EnterBase kernels.
import {conquestKingParticleSourceNode,conquestKingParticleSequence} from './conquest-king-particle-source.js';
const boolean=v=>{if(typeof v!=='boolean')throw Error('Explicit native King source action flag required');return v;};
const uint=v=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw Error('Explicit native uint32 action time required');return v;};
export function conquestKingActionWindow(source,nodeIndex){
 conquestKingParticleSourceNode(source,nodeIndex);const seq=conquestKingParticleSequence(source),action=seq.actions[nodeIndex];
 if(action.index!==nodeIndex||action.type!=='CActParticle')throw Error('Exact indexed King particle source required');return action;
}
// Same real14AD05C.virtual54=1282C80 class, independently qualified on all
// fifteen authored particle windows. These ports are low-level boundaries, not an effect
// owner or substitutes for a qualified particle pool and finished predicate.
export function applyConquestKingParticleActionControl({source,nodeIndex,emitting,previous,current,rootPresent=true,particlePresent=true}={},ports={}){
 const action=conquestKingActionWindow(source,nodeIndex);boolean(emitting);uint(previous);uint(current);boolean(rootPresent);boolean(particlePresent);const calls=[];
 if(!rootPresent||!particlePresent)return Object.freeze({applied:false,calls:Object.freeze(calls),nativeReady:false});
 for(const key of ['readEmitting44','setEmitting1282F20','readActive18','setActive18','readFinished1136050'])if(typeof ports[key]!=='function')throw Error('Explicit King source action port '+key+' required');
 let inside=false;if(emitting){calls.push('window');inside=action.startTimeMs<=current&&current<=action.endTimeMs;}
 if(inside){
  if(!boolean(ports.readEmitting44())){calls.push('set44:1');ports.setEmitting1282F20(true);}
  if(!boolean(ports.readActive18())){calls.push('set18:1');ports.setActive18(true);}
 }else{
  if(boolean(ports.readEmitting44())){calls.push('set44:0');ports.setEmitting1282F20(false);}
  if(boolean(ports.readActive18())){calls.push('finished');if(boolean(ports.readFinished1136050())){calls.push('set18:0');ports.setActive18(false);}}
 }
 return Object.freeze({applied:true,calls:Object.freeze(calls),sourceActionControlQualified:true,particlePoolProducerQualified:false,nativeReady:false});
}
