import {assertConquestKingActor} from './conquest-king-ai.js';
import {CONQUEST_KING_STATE_SOURCE} from './conquest-king-state-source.js';
import {ConquestMonsterAttackState,ConquestMonsterDeathState} from './conquest-monster-state-manager.js';
import {assertConquestKingSpecialState} from './conquest-king-special-states.js';
export function readConquestKingStateEffectDeclaration(state,{actor,index}={}){
 assertConquestKingActor(actor);if(state?.actor!==actor||!Number.isInteger(index)||index<0)throw Error('Actual King indexed state effect required');
 if(state.stateId===4){if(!(state instanceof ConquestMonsterDeathState))throw Error('Actual King Death state required');}
 else if(state.stateId===5){if(!(state instanceof ConquestMonsterAttackState))throw Error('Actual King attack5 state required');}
 else if([8,9,10].includes(state.stateId))assertConquestKingSpecialState(state,{actor});else throw Error('Actual King source effect class required');
 const entry=CONQUEST_KING_STATE_SOURCE.states.find(s=>s.stateId===state.stateId)?.events.filter(e=>e.method==='AddSequence')[index];if(!entry)throw Error('Actual indexed King AddSequence required');
 const[delayMs,nodeName,sourcePath]=entry.args;return Object.freeze({stateId:state.stateId,index,delayMs,nodeName,sourcePath,pendingLiteral:sourcePath==='Resourcewws/Effects/pve_mon_king_attack01.seq'});
}
export function assertConquestKingOrdinaryDeathEffectState(state,{actor}={}){assertConquestKingActor(actor);if(!(state instanceof ConquestMonsterDeathState)||state.actor!==actor||actor.eligibleVirtual44!==false||actor.nativeField33C===2)throw Error('Actual entered ordinary King Death required');return state;}
