import {assertConquestQueenActor} from './conquest-queen-ai.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {createConquestQueenRandom,assertConquestQueenRandom,CONQUEST_QUEEN_DECLARED_RANDOM_SEED} from './conquest-queen-random.js';
import {assertConquestQueenStealth} from './conquest-queen-stealth.js';
const owners=new WeakMap(),actors=new WeakMap(),uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
export {CONQUEST_QUEEN_DECLARED_RANDOM_SEED};
export function assertConquestQueenChoiceFields(owner,{actor,monsterActors}={}){const r=owners.get(owner);if(!r||r.actor!==actor||monsterActors!==undefined&&r.monsterActors!==monsterActors)throw Error('Typed actual Queen AI choice/rate owner required');r.live();return owner;}
// Actor32C and248/258/268 constructor stores, A09380/A09470/A05120.
// The exact MT stream is per actor; its S5 seed is explicitly declared.
export function createConquestQueenChoiceFields({actor,monsterActors,stealth,seed32,seedPolicy}={}){
 assertConquestQueenActor(actor);assertConquestQueenStealth(stealth,{actor,monsterActors});
 if(!(monsterActors instanceof Map)||monsterActors.get(actor.id)!==actor||actors.has(actor)||actor.health!==actor.maxHealth||actor.nativeField33C!==4)throw Error('Fresh current Queen constructor choice/rate fields required');
 const source=CONQUEST_SOURCE_DATA.monsters[1403],ability=source.Ability,model=actor.model,stats=actor.spawnStats;
 if(ability.escape_speed!=='3'||[1,2,3].some(i=>ability['rate_of_fire_'+i]!=='0'))throw Error('Actual Queen escape3/zeroROF source required');
 const random=createConquestQueenRandom({seed32,policy:seedPolicy}),counters=new Map([5,6,7].map(input=>[input,{updates:0,durationMs:0,elapsedMs:0,paused:false}]));let lastAttack=11,disposed=false,reason=null,api;
 const live=()=>{if(disposed||reason||actors.get(actor)!==api||monsterActors.get(actor.id)!==actor||actor.model!==model||actor.spawnStats!==stats||CONQUEST_SOURCE_DATA.monsters[1403]!==source||source.Ability!==ability)throw Error('Current Queen source choice/rate owner required'+(reason?': '+reason:''));assertConquestQueenActor(actor);assertConquestQueenStealth(stealth,{actor,monsterActors});assertConquestQueenRandom(random);};
 const same=owner=>{live();if(owner!==actor)throw Error('Actual same Queen getter actor required');};
 const bindings=Object.freeze({
  escapeMoveSpeedRate:owner=>{same(owner);return 3;},
  rateOfFire:(owner,input)=>{same(owner);if(!counters.has(input))throw Error('Queen source rate input5..7 required');return counters.get(input).durationMs;},
  getLastAttackStateId:owner=>{same(owner);return lastAttack;},
  setLastAttackStateId:(owner,value)=>{same(owner);if(!uint(value))throw Error('Queen source unsigned32C required');lastAttack=value;},
  getRandom:(owner,maximum)=>{same(owner);return random.below(maximum);},
  resetRateOfFire:(owner,input,duration=0)=>{same(owner);if(!Number.isInteger(input)||!uint(duration))throw Error('Queen source rate reset operands required');const c=counters.get(input);if(!c)return;c.updates=0;c.elapsedMs=0;if(duration!==0)c.durationMs=duration;},
  isStealthOn:owner=>{same(owner);return stealth.isOn();},
 });
 api=Object.freeze({bindings,snapshot(){live();return {actorId:actor.id,lastAttackStateId32C:lastAttack,escapeMoveSpeedRate:3,counters:[...counters].map(([input,counter])=>({input,offset:0x268+(5-input)*16,...counter})),random:random.snapshot(),nonnullStealth:true,sourceInitializationQualified:true,nativeReady:false};},invalidate(value){if(typeof value!=='string'||!value.trim())throw Error('Explicit unknown Queen field writer required');reason=value;},dispose(){if(disposed)return;disposed=true;random.dispose();if(actors.get(actor)===api)actors.delete(actor);}});actors.set(actor,api);owners.set(api,{actor,monsterActors,live});live();return api;
}
