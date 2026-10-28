import {meleeActivations,claimMeleeActivation} from './melee-activations.js';
import {meleeRuntimeContact} from './melee-runtime.js';
import {captureMapAttackSource} from './map-attack-source.js';
import {worldMeleeRay} from './native-melee-ray.js';

const MAP_TARGET=Symbol('map-object-melee');
const attackIds=new WeakMap();
let nextAttackId=0;
// Classic Counter item2000002: explicit wrapper arguments, not a name guess.
// weapon_countersword.lua lines15,146,295,425,554,705 supplies these
// parameters to weapon_countersword_attack.lua's CHANNEL_MELEE declarations.
// SHA/provenance: work/map-destruction-audit/melee-integration.json.
const COUNTER_ATTRIBUTES={
 CounterSwordLight1:{Attack2:'ATTACKATTRIB_COUNTER_SWORD_ATTACK1',Attack3:'ATTACKATTRIB_COUNTER_SWORD_ATTACK1'},
 CounterSwordLight2:{Attack2:'ATTACKATTRIB_COUNTER_SWORD_ATTACK2'},
 CounterSwordLight3:{Attack2:'ATTACKATTRIB_COUNTER_SWORD_ATTACK3'},
 CounterSwordLight4:{Attack2:'ATTACKATTRIB_COUNTER_SWORD_ATTACK4',Attack3:'ATTACKATTRIB_COUNTER_SWORD_ATTACK4'},
 CounterSwordHeavy:{Attack2:'ATTACKATTRIB_COUNTER_SWORD_COUNTER_ATTACK'},
 CounterSwordJumpAttack:{Attack2:'ATTACKATTRIB_COUNTER_SWORD_JUMPDASH'},
};
function activationId(attack,index){
 if(!attackIds.has(attack))attackIds.set(attack,++nextAttackId);
 return `local-melee:${attackIds.get(attack)}:${index}`;
}

// Called once per actor event batch, independently of the opponent loop. This
// uses the existing authored-contact selection, not the character HP policy.
// Contact shapes/flags not qualified by the current melee adapter stay absent.
export function resolveMapMeleeHits(world,actor,events){
 const objects=world?.mapObjects;
 if(typeof objects?.queryVolume!=='function'||typeof objects.commit!=='function')return [];
 const results=[];
 for(const {attack,index} of meleeActivations(events,actor.attack)){
  if(!claimMeleeActivation(attack,index,MAP_TARGET))continue;
  const source=meleeRuntimeContact(attack,index);
  if(!source?.shape||source.geometrySupported===false)continue;
  const context=captureMapAttackSource({weaponKey:source.weapon??actor.weapon,
   attribute:source.attribute??source.source?.attribute??(source.weapon==='counter'?COUNTER_ATTRIBUTES[source.source?.function]?.[source.id]:undefined),sourceFunction:source.source?.function,
   rawPower:source.damage,attackId:activationId(attack,index),
   enableBlast:source.enableBlast??source.source?.enableBlast??true,ownerKind:'normal-character'});
  if(!context.qualified)continue;
  const pose={position:actor.position,facing:attack.facing??actor.facing};
  let shape=source.shape;
  if(shape.type==='ray'){
   const ray=worldMeleeRay(shape,pose);
   shape={type:'ray',origin:ray.origin,displacement:ray.direction.map(v=>v*ray.length)};
  }
  // The query captures all generation tokens before the first mutation. A
  // different object's destruction does not invalidate this contact batch.
  const query=objects.queryVolume(shape,pose);
  if(!query?.supported)continue;
  const seen=new Set();
  for(const hit of query.hits??[]){
   const token=hit.token;if(!token)continue;
   const key=JSON.stringify([token.instanceKey,token.generation]);
   if(seen.has(key))continue;seen.add(key);
   results.push(objects.commit(hit,context));
  }
 }
 return results;
}
