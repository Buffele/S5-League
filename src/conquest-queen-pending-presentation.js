import {CONQUEST_QUEEN_ATTACK_SOURCE} from './conquest-queen-attack-source.js';
import {assertConquestQueenActor} from './conquest-queen-ai.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {ConquestMonsterAttackState} from './conquest-monster-state-manager.js';
const owners=new WeakMap(),actors=new WeakMap();
export const CONQUEST_QUEEN_PENDING_PRESENTATION=Object.freeze({id:'s5-queen-three-source-effects-pending',monsterKey:1403,persistentCount:3,deathEffect:'Effects/pve_mon_queen_death.seq',createsReplacementEffects:false,nativeReady:false});
// Preserve the three real source requests without manufacturing particles or
//borrowing Normal1203's empty344. A qualified renderer can replace this policy
//only through its own typed owner and explicit reaction integration.
export function createConquestQueenPendingPresentation({actor,policy}={}){
 assertConquestQueenActor(actor);if(policy!==CONQUEST_QUEEN_PENDING_PRESENTATION||actors.has(actor))throw Error('Distinct Queen actor and exact pending presentation policy required');
 const model=actor.model,sequence=CONQUEST_SOURCE_DATA.monsters[1403].Sequence;
 if(sequence.count!=='3')throw Error('Exact Queen three source Sequence requests required');
 const requests=Object.freeze(Array.from({length:3},(_,i)=>{const nodeName=sequence['node_name_'+(i+1)],sourcePath=sequence['file_name_'+(i+1)],node=model.findSourceNode(nodeName);if(!node||typeof sourcePath!=='string')throw Error('Actual Queen source attachment node required '+nodeName);return Object.freeze({ordinal:i+1,nodeName,sourcePath,node});}));let disposed=false,cleared=false,lastDeath=null;
 const live=()=>{if(disposed||actors.get(actor)!==api||actor.model!==model||CONQUEST_SOURCE_DATA.monsters[1403].Sequence!==sequence||requests.some(r=>model.findSourceNode(r.nodeName)!==r.node))throw Error('Current owned Queen pending source presentation required');assertConquestQueenActor(actor);};
 const stateEffects=[];
 const api=Object.freeze({
  requestStateEffect({state,elapsedMs,index}={}){live();if(!(state instanceof ConquestMonsterAttackState)||state.actor!==actor||![5,6].includes(state.stateId)||!Number.isInteger(elapsedMs)||elapsedMs<=0||elapsedMs>0xffffffff)throw Error('Actual Queen attack state and expired effect clock required');const declaration=CONQUEST_QUEEN_ATTACK_SOURCE.stateEvents.find(s=>s.stateId===state.stateId)?.events.filter(e=>e.method==='AddSequence')[index];if(!declaration)throw Error('Actual indexed Queen AddSequence required');const [delayMs,nodeName,sourcePath]=declaration.args,node=model.findSourceNode(nodeName);if(!node||elapsedMs<=delayMs)throw Error('Actual Queen attachment and expired delay required');const request=Object.freeze({actor,state,node,nodeName,sourcePath,delayMs,elapsedMs,pending:true,renderer:null,nativeReady:false});stateEffects.push(request);if(stateEffects.length>64)stateEffects.shift();return request;},
  readStateEffectRequests(){live();return [...stateEffects];},
  releaseStateEffects(state){live();if(!(state instanceof ConquestMonsterAttackState)||state.actor!==actor||![5,6].includes(state.stateId))throw Error('Actual Queen attack5/6 source exit required');return {accepted:true,released:0,pending:true,source:'A2D560→A2E400',nativeReferenceCountQualified:false,nativeReady:false};},
  update(deltaMs){live();if(!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0xffffffff)throw Error('Queen presentation uint32 phase required');return api.snapshot();},
  clearPersistentEffects(){live();cleared=true;return {accepted:true,sourceRequestedEffects:3,removedS5ModelEffects:0,sourceRequestsRetired:true,nativeComplete344ReleaseQualified:false};},
  prepareDeathEffect({enterBase,effectOverride}={}){live();if(typeof enterBase!=='boolean'||enterBase!==(actor.nativeField33C===2)||effectOverride!==(enterBase?'Resources/Effects/enter_base.seq':null))throw Error('Exact Queen ordinary/enter-base Death branch required');const path=effectOverride??CONQUEST_SOURCE_DATA.monsters[1403].Scene.death_effect;if(path!==(enterBase?'Resources/Effects/enter_base.seq':'Effects/pve_mon_queen_death.seq'))throw Error('Actual Queen Death2 request required');lastDeath=Object.freeze({accepted:false,pending:true,sourcePath:path,renderer:null,policy:policy.id,nativeReady:false});return lastDeath;},
  snapshot(){live();return {monsterKey:1403,sourceRequestedPersistentEffects:3,requests:requests.map(({ordinal,nodeName,sourcePath})=>({ordinal,nodeName,sourcePath,pending:!cleared,renderer:null})),sourceRequestsRetired:cleared,renderedModelEffects:0,sourceComplete344Qualified:false,lastDeath,policy:policy.id,nativeReady:false};},
  dispose(){if(disposed)return;disposed=true;if(actors.get(actor)===api)actors.delete(actor);},
 });actors.set(actor,api);owners.set(api,{actor,live});live();return api;
}
export function assertConquestQueenPendingPresentation(owner,{actor}={}){const r=owners.get(owner);if(!r||r.actor!==actor)throw Error('Typed actual Queen three-effects pending presentation required');r.live();return owner;}
