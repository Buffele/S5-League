import {assertConquestKingActor} from './conquest-king-ai.js';
import {assertConquestKingRuntime,assertConquestKingStateControl} from './conquest-king-runtime.js';
import {assertConquestKingAIClocks} from './conquest-king-ai-clocks.js';
import {assertConquestKingProbabilityOwner} from './conquest-king-probability.js';
const owners=new WeakMap();
export function assertConquestKingAIControls(owner,{actor,monsterActors,runtime}={}){const r=owners.get(owner);if(!r||r.actor!==actor||r.monsters!==monsterActors||r.runtime!==runtime)throw Error('Typed actual King AI controls required');r.live();return owner;}
export function createConquestKingAIControls({actor,monsterActors,runtime,clockOwner,probabilityOwner}={}){
 assertConquestKingActor(actor);assertConquestKingRuntime(runtime,{actor});assertConquestKingAIClocks(clockOwner,{actor,monsterActors});assertConquestKingProbabilityOwner(probabilityOwner,{actor,monsterActors});const model=actor.model;let disposed=false;
 const live=()=>{if(disposed||monsterActors.get(actor.id)!==actor||actor.model!==model)throw Error('Current owned King AI controls required');assertConquestKingRuntime(runtime,{actor});assertConquestKingAIClocks(clockOwner,{actor,monsterActors});assertConquestKingProbabilityOwner(probabilityOwner,{actor,monsterActors});};
 const control=target=>{live();if(target!==actor)throw Error('Actual King control actor required');const receipt=runtime.readStateControl();return assertConquestKingStateControl(receipt,{runtime,actor});};
 const api=Object.freeze({bindings:Object.freeze({...clockOwner.bindings,...probabilityOwner.bindings,isCreateNewCommand:target=>control(target).createNewCommand,isOnlyToGoal:target=>control(target).onlyToGoal}),snapshot(){live();return {actorId:actor.id,monsterKey:1500,nativeCounterInitializationQualified:false,nativeSeedObserved:false,nativeReady:false};},dispose(){disposed=true;}});owners.set(api,{actor,monsters:monsterActors,runtime,live});return api;
}
