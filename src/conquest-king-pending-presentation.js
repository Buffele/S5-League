import {CONQUEST_KING_STATE_SOURCE} from './conquest-king-state-source.js';
import {assertConquestKingActor} from './conquest-king-ai.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {ConquestMonsterMappedState} from './conquest-monster-state-manager.js';
const owners=new WeakMap(),actors=new WeakMap();
export const CONQUEST_KING_PENDING_PRESENTATION=Object.freeze({id:'s5-king-zero-persistent-source-effects-pending',monsterKey:1500,persistentCount:0,deathEffect:'Effects/pve_mon_king_death.seq',createsReplacementEffects:false,nativeReady:false});
// Preserve zero persistent XML requests and the separate state/Death requests
//without manufacturing particles. A qualified renderer can replace this policy
//only through its own typed owner and explicit reaction integration.
export function createConquestKingPendingPresentation({actor,policy}={}){
 assertConquestKingActor(actor);if(policy!==CONQUEST_KING_PENDING_PRESENTATION||actors.has(actor))throw Error('Distinct King actor and exact pending presentation policy required');
 const model=actor.model,sequence=CONQUEST_SOURCE_DATA.monsters[1500].Sequence;
 if(sequence.count!=='0')throw Error('Exact King zero persistent source Sequence requests required');
 const requests=Object.freeze(Array.from({length:0},(_,i)=>{const nodeName=sequence['node_name_'+(i+1)],sourcePath=sequence['file_name_'+(i+1)],node=model.findSourceNode(nodeName);if(!node||typeof sourcePath!=='string')throw Error('Actual King source attachment node required '+nodeName);return Object.freeze({ordinal:i+1,nodeName,sourcePath,node});}));let disposed=false,cleared=false,lastDeath=null;
 const live=()=>{if(disposed||actors.get(actor)!==api||actor.model!==model||CONQUEST_SOURCE_DATA.monsters[1500].Sequence!==sequence||requests.some(r=>model.findSourceNode(r.nodeName)!==r.node))throw Error('Current owned King pending source presentation required');assertConquestKingActor(actor);};
 const stateEffects=[];
 const api=Object.freeze({
  requestStateEffect({state,elapsedMs,index}={}){live();if(!(state instanceof ConquestMonsterMappedState)||state.actor!==actor||![4,5,8,9,10].includes(state.stateId)||!Number.isInteger(elapsedMs)||elapsedMs<=0||elapsedMs>0xffffffff)throw Error('Actual King state4/5/8/9/10 and expired effect clock required');const declaration=CONQUEST_KING_STATE_SOURCE.states.find(s=>s.stateId===state.stateId)?.events.filter(e=>e.method==='AddSequence')[index];if(!declaration)throw Error('Actual indexed King AddSequence required');const [delayMs,nodeName,sourcePath]=declaration.args,node=model.findSourceNode(nodeName);if(!node||elapsedMs<=delayMs)throw Error('Actual King attachment and expired delay required');const request=Object.freeze({actor,state,node,nodeName,sourcePath,delayMs,elapsedMs,pending:true,renderer:null,nativeReady:false});stateEffects.push(request);if(stateEffects.length>64)stateEffects.shift();return request;},
  readStateEffectRequests(){live();return [...stateEffects];},
  releaseStateEffects(state){live();if(!(state instanceof ConquestMonsterMappedState)||state.actor!==actor||![4,5,8,9,10].includes(state.stateId))throw Error('Actual King state4/5/8/9/10 source exit required');return {accepted:true,released:0,pending:true,source:'A2D560→A2E400',nativeReferenceCountQualified:false,nativeReady:false};},
  update(deltaMs){live();if(!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0xffffffff)throw Error('King presentation uint32 phase required');return api.snapshot();},
  clearPersistentEffects(){live();cleared=true;return {accepted:true,sourceRequestedEffects:0,removedS5ModelEffects:0,sourceRequestsRetired:true,nativeComplete344ReleaseQualified:false};},
  prepareDeathEffect({enterBase,effectOverride}={}){live();if(typeof enterBase!=='boolean'||enterBase!==(actor.nativeField33C===2)||effectOverride!==(enterBase?'Resources/Effects/enter_base.seq':null))throw Error('Exact King ordinary/enter-base Death branch required');const path=effectOverride??CONQUEST_SOURCE_DATA.monsters[1500].Scene.death_effect;if(path!==(enterBase?'Resources/Effects/enter_base.seq':'Effects/pve_mon_king_death.seq'))throw Error('Actual King ordinary/enter-base Death request required');lastDeath=Object.freeze({accepted:false,pending:true,sourcePath:path,renderer:null,policy:policy.id,nativeReady:false});return lastDeath;},
  snapshot(){live();return {monsterKey:1500,sourceRequestedPersistentEffects:0,requests:requests.map(({ordinal,nodeName,sourcePath})=>({ordinal,nodeName,sourcePath,pending:!cleared,renderer:null})),sourceRequestsRetired:cleared,renderedModelEffects:0,sourceComplete344Qualified:false,lastDeath,policy:policy.id,nativeReady:false};},
  dispose(){if(disposed)return;disposed=true;if(actors.get(actor)===api)actors.delete(actor);},
 });actors.set(actor,api);owners.set(api,{actor,live});live();return api;
}
export function assertConquestKingPendingPresentation(owner,{actor}={}){const r=owners.get(owner);if(!r||r.actor!==actor)throw Error('Typed actual King zero-persistent pending presentation required');r.live();return owner;}
