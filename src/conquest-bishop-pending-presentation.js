import {assertConquestBishopActor} from './conquest-bishop-ai.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {ConquestMonsterAttackState} from './conquest-monster-state-manager.js';
const owners=new WeakMap(),actors=new WeakMap();
export const CONQUEST_BISHOP_PENDING_PRESENTATION=Object.freeze({id:'s5-bishop-one-source-effects-pending',monsterKey:1303,persistentCount:1,deathEffect:'Effects/bishop_death.seq',createsReplacementEffects:false,nativeReady:false});
// Preserve the one real source requests without manufacturing particles or
//borrowing Normal1203's empty344. A qualified renderer can replace this policy
//only through its own typed owner and explicit reaction integration.
export function createConquestBishopPendingPresentation({actor,policy}={}){
 assertConquestBishopActor(actor);if(policy!==CONQUEST_BISHOP_PENDING_PRESENTATION||actors.has(actor))throw Error('Distinct Bishop actor and exact pending presentation policy required');
 const model=actor.model,sequence=CONQUEST_SOURCE_DATA.monsters[1303].Sequence;
 if(sequence.count!=='1')throw Error('Exact Bishop one source Sequence requests required');
 const requests=Object.freeze(Array.from({length:1},(_,i)=>{const nodeName=sequence['node_name_'+(i+1)],sourcePath=sequence['file_name_'+(i+1)],node=model.findSourceNode(nodeName);if(!node||typeof sourcePath!=='string')throw Error('Actual Bishop source attachment node required '+nodeName);return Object.freeze({ordinal:i+1,nodeName,sourcePath,node});}));let disposed=false,cleared=false,lastDeath=null;
 const live=()=>{if(disposed||actors.get(actor)!==api||actor.model!==model||CONQUEST_SOURCE_DATA.monsters[1303].Sequence!==sequence||requests.some(r=>model.findSourceNode(r.nodeName)!==r.node))throw Error('Current owned Bishop pending source presentation required');assertConquestBishopActor(actor);};
 const stateEffects=[];
 const api=Object.freeze({
  requestStateEffect({state,elapsedMs}={}){live();if(!(state instanceof ConquestMonsterAttackState)||state.actor!==actor||state.stateId!==5||!Number.isInteger(elapsedMs)||elapsedMs<=0||elapsedMs>0xffffffff)throw Error('Actual Bishop attack state and expired source effect clock required');const node=model.findSourceNode('Bishop_Fire_Dummy');if(!node)throw Error('Actual Bishop fire effect node required');const request=Object.freeze({actor,state,node,nodeName:'Bishop_Fire_Dummy',sourcePath:'Effects/pve_mon_bishop_attack.seq',delayMs:0,elapsedMs,pending:true,renderer:null,nativeReady:false});stateEffects.push(request);if(stateEffects.length>32)stateEffects.shift();return request;},
  readStateEffectRequests(){live();return [...stateEffects];},
  releaseStateEffects(state){live();if(!(state instanceof ConquestMonsterAttackState)||state.actor!==actor||state.stateId!==5)throw Error('Actual Bishop attack5 source exit required');return {accepted:true,released:0,pending:true,source:'A2D560→A2E400',nativeReferenceCountQualified:false,nativeReady:false};},
  update(deltaMs){live();if(!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0xffffffff)throw Error('Bishop presentation uint32 phase required');return api.snapshot();},
  clearPersistentEffects(){live();cleared=true;return {accepted:true,sourceRequestedEffects:1,removedS5ModelEffects:0,sourceRequestsRetired:true,nativeComplete344ReleaseQualified:false};},
  prepareDeathEffect({enterBase,effectOverride}={}){live();if(typeof enterBase!=='boolean'||enterBase!==(actor.nativeField33C===2)||effectOverride!==(enterBase?'Resources/Effects/enter_base.seq':null))throw Error('Exact Bishop ordinary/enter-base Death branch required');const path=effectOverride??CONQUEST_SOURCE_DATA.monsters[1303].Scene.death_effect;if(path!==(enterBase?'Resources/Effects/enter_base.seq':'Effects/bishop_death.seq'))throw Error('Actual Bishop Death2 request required');lastDeath=Object.freeze({accepted:false,pending:true,sourcePath:path,renderer:null,policy:policy.id,nativeReady:false});return lastDeath;},
  snapshot(){live();return {monsterKey:1303,sourceRequestedPersistentEffects:1,requests:requests.map(({ordinal,nodeName,sourcePath})=>({ordinal,nodeName,sourcePath,pending:!cleared,renderer:null})),sourceRequestsRetired:cleared,renderedModelEffects:0,sourceComplete344Qualified:false,lastDeath,policy:policy.id,nativeReady:false};},
  dispose(){if(disposed)return;disposed=true;if(actors.get(actor)===api)actors.delete(actor);},
 });actors.set(actor,api);owners.set(api,{actor,live});live();return api;
}
export function assertConquestBishopPendingPresentation(owner,{actor}={}){const r=owners.get(owner);if(!r||r.actor!==actor)throw Error('Typed actual Bishop one-effects pending presentation required');r.live();return owner;}
