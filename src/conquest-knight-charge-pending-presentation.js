import {assertConquestKnightChargeActor} from './conquest-knight-charge-ai.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
const owners=new WeakMap(),actors=new WeakMap();
export const CONQUEST_KNIGHT_CHARGE_PENDING_PRESENTATION=Object.freeze({id:'s5-knight-charge-five-source-effects-pending',monsterKey:1204,persistentCount:5,deathEffect:'Effects/Knight_death2.seq',createsReplacementEffects:false,nativeReady:false});
// Preserve the five real source requests without manufacturing particles or
//borrowing Normal1203's empty344. A qualified renderer can replace this policy
//only through its own typed owner and explicit reaction integration.
export function createConquestKnightChargePendingPresentation({actor,policy}={}){
 assertConquestKnightChargeActor(actor);if(policy!==CONQUEST_KNIGHT_CHARGE_PENDING_PRESENTATION||actors.has(actor))throw Error('Distinct Charge actor and exact pending presentation policy required');
 const model=actor.model,sequence=CONQUEST_SOURCE_DATA.monsters[1204].Sequence;
 if(sequence.count!=='5')throw Error('Exact Charge five source Sequence requests required');
 const requests=Object.freeze(Array.from({length:5},(_,i)=>{const nodeName=sequence['node_name_'+(i+1)],sourcePath=sequence['file_name_'+(i+1)],node=model.findSourceNode(nodeName);if(!node||typeof sourcePath!=='string')throw Error('Actual Charge source attachment node required '+nodeName);return Object.freeze({ordinal:i+1,nodeName,sourcePath,node});}));let disposed=false,cleared=false,lastDeath=null;
 const live=()=>{if(disposed||actors.get(actor)!==api||actor.model!==model||CONQUEST_SOURCE_DATA.monsters[1204].Sequence!==sequence||requests.some(r=>model.findSourceNode(r.nodeName)!==r.node))throw Error('Current owned Charge pending source presentation required');assertConquestKnightChargeActor(actor);};
 const api=Object.freeze({
  update(deltaMs){live();if(!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0xffffffff)throw Error('Charge presentation uint32 phase required');return api.snapshot();},
  clearPersistentEffects(){live();cleared=true;return {accepted:true,sourceRequestedEffects:5,removedS5ModelEffects:0,sourceRequestsRetired:true,nativeComplete344ReleaseQualified:false};},
  prepareDeathEffect({enterBase,effectOverride}={}){live();if(typeof enterBase!=='boolean'||enterBase!==(actor.nativeField33C===2)||effectOverride!==(enterBase?'Resources/Effects/enter_base.seq':null))throw Error('Exact Charge ordinary/enter-base Death branch required');const path=effectOverride??CONQUEST_SOURCE_DATA.monsters[1204].Scene.death_effect;if(path!==(enterBase?'Resources/Effects/enter_base.seq':'Effects/Knight_death2.seq'))throw Error('Actual Charge Death2 request required');lastDeath=Object.freeze({accepted:false,pending:true,sourcePath:path,renderer:null,policy:policy.id,nativeReady:false});return lastDeath;},
  snapshot(){live();return {monsterKey:1204,sourceRequestedPersistentEffects:5,requests:requests.map(({ordinal,nodeName,sourcePath})=>({ordinal,nodeName,sourcePath,pending:!cleared,renderer:null})),sourceRequestsRetired:cleared,renderedModelEffects:0,sourceComplete344Qualified:false,lastDeath,policy:policy.id,nativeReady:false};},
  dispose(){if(disposed)return;disposed=true;if(actors.get(actor)===api)actors.delete(actor);},
 });actors.set(actor,api);owners.set(api,{actor,live});live();return api;
}
export function assertConquestKnightChargePendingPresentation(owner,{actor}={}){const r=owners.get(owner);if(!r||r.actor!==actor)throw Error('Typed actual Charge five-effects pending presentation required');r.live();return owner;}
