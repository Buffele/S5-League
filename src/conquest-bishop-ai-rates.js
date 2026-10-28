import {assertConquestBishopActor} from './conquest-bishop-ai.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';

const owners=new WeakMap(),actors=new WeakMap(),f=Math.fround;
export function assertConquestBishopAIRates(owner,{actor,monsterActors}={}){const r=owners.get(owner);if(!r||r.actor!==actor||r.monsterActors!==monsterActors)throw Error('Typed actual Bishop AI rate owner required');r.live();return owner;}

// Original XML -> resource168/180 -> A021A4/FE6050/A05120 initialization;
// getters A05210 and A051B0. This owner has no later SetRateOfFire writer.
export function createConquestBishopAIRates({actor,monsterActors}={}){
 assertConquestBishopActor(actor);
 if(!(monsterActors instanceof Map)||monsterActors.get(actor.id)!==actor||actors.has(actor)||actor.health!==actor.maxHealth||actor.eligibleVirtual44!==true||actor.nativeField33C!==4)throw Error('Fresh owned Bishop constructor rate initialization required');
 const model=actor.model,stats=actor.spawnStats,source=CONQUEST_SOURCE_DATA.monsters[1303],ability=source.Ability;
 // This source class's exact authored values are qualified; no general
 // float-to-DWORD or future rate mutation is inferred from one class.
 if(ability.escape_speed!=='3'||ability.rate_of_fire_1!=='1000')throw Error('Authenticated Bishop escape/rate source values required');
 const escape=f(Number(ability.escape_speed)),duration=1000;let disposed=false,reason=null,api;
 const live=()=>{if(disposed||reason||actors.get(actor)!==api||monsterActors.get(actor.id)!==actor||actor.model!==model||actor.spawnStats!==stats||source!==CONQUEST_SOURCE_DATA.monsters[1303]||source.Ability!==ability||ability.escape_speed!=='3'||ability.rate_of_fire_1!=='1000')throw Error('Current owned Bishop AI rates required'+(reason?': '+reason:''));assertConquestBishopActor(actor);};
 const same=owner=>{live();if(owner!==actor)throw Error('Rate getter belongs to another Bishop');};
 const bindings=Object.freeze({escapeMoveSpeedRate:owner=>{same(owner);return escape;},rateOfFire:(owner,input)=>{same(owner);if(input!==5)throw Error('Bishop authored attack input5 rate getter required');return duration;}});
 api=Object.freeze({bindings,
  snapshot(){live();return {actorId:actor.id,monsterKey:1303,escapeMoveSpeedRate:escape,rateOfFireInput5:duration,sourceInitializationQualified:true,initializationOnly:true,nativeReady:false};},
  invalidate(value){if(typeof value!=='string'||!value.trim())throw Error('Explicit unqualified Bishop rate writer required');reason=value;},
  dispose(){if(disposed)return;disposed=true;if(actors.get(actor)===api)actors.delete(actor);},
 });actors.set(actor,api);owners.set(api,{actor,monsterActors,live});live();return api;
}
