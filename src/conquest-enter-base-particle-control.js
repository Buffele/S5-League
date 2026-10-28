import {conquestEnterBaseParticleSourceNode,conquestEnterBaseParticleSequence} from './conquest-enter-base-particle-source.js';
const boolean=v=>{if(typeof v!=='boolean')throw Error('Explicit native Enter Base action flag required');return v;};
const uint=v=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw Error('Explicit native uint32 action time required');return v;};
export function conquestEnterBaseActionWindow(source,nodeIndex){
 conquestEnterBaseParticleSourceNode(source,nodeIndex);const seq=conquestEnterBaseParticleSequence(source),action=seq.actions[nodeIndex];
 if(seq.headerByte!==0||seq.durationMs!==2500||action.index!==nodeIndex||action.parentType!==0||action.parentIndex!==0||action.boneName!=='')throw Error('Exact seven-action Enter Base source required');return action;
}
// Same real14AD05C.virtual54=1282C80 class, independently qualified on all
// seven authored windows. These ports are low-level boundaries, not an effect
// owner or substitutes for a qualified particle pool and finished predicate.
export function applyConquestEnterBaseParticleActionControl({source,nodeIndex,emitting,previous,current,rootPresent=true,particlePresent=true}={},ports={}){
 const action=conquestEnterBaseActionWindow(source,nodeIndex);boolean(emitting);uint(previous);uint(current);boolean(rootPresent);boolean(particlePresent);const calls=[];
 if(!rootPresent||!particlePresent)return Object.freeze({applied:false,calls:Object.freeze(calls),nativeReady:false});
 for(const key of ['readEmitting44','setEmitting1282F20','readActive18','setActive18','readFinished1136050'])if(typeof ports[key]!=='function')throw Error('Explicit Enter Base action port '+key+' required');
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
