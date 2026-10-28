// Pawn's CAttack entry, not its damage-to-HP consumer. See attack-runtime-20261021.
const frozenVector=values=>Object.freeze(values);
export const CONQUEST_PAWN_ATTACK_CONTACT=Object.freeze({
 monsterKey:1003,input:5,stateDurationMs:670,collisionDelayMs:300,
 weaponType:'WEAPONTYPE_MELEE_',attribute:'ATTACKATTRIB_BOSSSHOTA_LASER',
 rawPower:5,rawAdditionalPower:0,
 box:Object.freeze({position:frozenVector([0,180,0]),direction:frozenVector([0,0,-1]),width:400,height:300,depth:400}),
 initAttack2:frozenVector([1,1,false]),push:null,blow:null,
 nativeReady:false,
 unresolved:frozenVector(['current actor/registry and obstruction producers','actual player-state and defense context','complete native reaction/message side effects'])
});
const uint=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;

// 56D320: working power=(initial power + 573B60 addition)*574520 factor.
// The arguments must come from the real producer. Neither is base_attack.
export function prepareConquestAttackRawPower({initialPower,randomAddition,probabilityFactor}){
 for(const value of [initialPower,randomAddition,probabilityFactor])if(!Number.isFinite(value))throw new TypeError('Explicit finite native power inputs required');
 return Math.fround(Math.fround(Math.fround(initialPower)+Math.fround(randomAddition))*Math.fround(probabilityFactor));
}

// Port boundary: queryContacts must implement 56E870/575BA0 geometry/filtering;
// consumeContacts must implement the actual damage-message receiver. This class
// does not turn a local box, AP or base_attack into invented HP damage.
export class ConquestPawnAttackContactRuntime{
 constructor({prepareAttack,queryContacts,consumeContacts}={}){
  if([prepareAttack,queryContacts,consumeContacts].some(value=>typeof value!=='function'))throw new TypeError('Explicit native attack preparation, contact query and consumer ports required');
  this.ports={prepareAttack,queryContacts,consumeContacts};this.active=false;
  this.counter={updates:0,durationMs:300,elapsedMs:0,paused:false};this.prepared=null;this.actor=null;
 }
 enter(actor){
  if(!actor)throw new TypeError('Attack owner required');
  const prepared=this.ports.prepareAttack(actor,CONQUEST_PAWN_ATTACK_CONTACT);
  if(prepared===undefined||prepared===null)throw new TypeError('Native attack preparation must return its explicit context');
  this.actor=actor;this.prepared=prepared;Object.assign(this.counter,{updates:0,durationMs:300,elapsedMs:0,paused:false});this.active=true;
  return prepared;
 }
 tick(deltaMs,{enabled,collisionAllowed}={}){
  if(!uint(deltaMs))throw new TypeError('Unsigned native delta required');
  if(typeof enabled!=='boolean'||typeof collisionAllowed!=='boolean')throw new TypeError('Explicit native attack enabled/collision predicates required');
  if(!this.active||!enabled)return {queried:false};
  const counter=this.counter;
  if(counter.elapsedMs>counter.durationMs)return {queried:false};
  if(counter.paused)return {queried:false};
  counter.updates=(counter.updates+1)>>>0;counter.elapsedMs=(counter.elapsedMs+deltaMs)>>>0;
  if(counter.elapsedMs<=counter.durationMs||!collisionAllowed)return {queried:false};
  const request={actor:this.actor,prepared:this.prepared,source:CONQUEST_PAWN_ATTACK_CONTACT,elapsedMs:counter.elapsedMs};
  const contacts=this.ports.queryContacts(request);
  if(!Array.isArray(contacts))throw new TypeError('Native contact query must return an explicit contact array');
  const result=this.ports.consumeContacts({...request,contacts});
  return {queried:true,contacts,result};
 }
 exit(){this.active=false;this.actor=null;this.prepared=null;}
}
