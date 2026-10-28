import {ConquestRuntimeBridge} from './conquest-runtime-bridge.js';
import {assertConquestKingActor} from './conquest-king-ai.js';
export const CONQUEST_KING_CURRENT_HOST_ROLE_POLICY=Object.freeze({kind:'s5-current-Conquest-bridge-host-binds-globalAIController20',sourceGetter:0xa04160,sourceGlobal:0x1644ae0,sourceOffset:0x20,nativeHostSelectionQualified:false,nativeReady:false});
// PreFastRun's port name is historical. Original virtual3C is the inverse of
// the global AI-controller host flag; it is not a per-actor frozen property.
export function readConquestKingActorFrozen({actor,bridge,policy}={}){
 assertConquestKingActor(actor);if(!(bridge instanceof ConquestRuntimeBridge)||bridge.actors.get(actor.id)!==actor||typeof bridge.isHost!=='boolean'||policy!==CONQUEST_KING_CURRENT_HOST_ROLE_POLICY)throw Error('Actual King bridge ownership and immutable explicit S5 host-role policy required');return !bridge.isHost;
}
