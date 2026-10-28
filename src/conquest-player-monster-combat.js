import {Controller} from './controller.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {assertConquestKingDamageNotification} from './conquest-king-damage-notification.js';

const f=Math.fround,records=new WeakSet(),healthOwners=new WeakMap();
const uint=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
const finite=(value,name)=>{if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw Error('Explicit finite '+name+' required');return f(value);};
const bool=(value,name)=>{if(typeof value!=='boolean')throw Error('Explicit '+name+' required');return value;};
const peer=value=>{if(!Array.isArray(value)||value.length!==2||!value.every(uint))throw Error('Two native peer DWORDs required');return Object.freeze([...value]);};
const samePeer=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const rootOf=node=>{while(node?.parent)node=node.parent;return node;};
const synchronous=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);

export const CONQUEST_MONSTER_DAMAGE_SOURCE=Object.freeze({vtable:0x13f0244,recordReceiver:0xa03a80,recordConsumer:0xa05a80,numericReceiver:0xa041f0,
 baseNumericReceiver:0x97fa20,eligibilityGetter:0xa093f0,excludedGetter:0xc13d20,stateNotification:0xa13c90,nativeReady:false});

// A typed logical CDamageRecord at the final numeric delivery boundary. This
// factory validates representation, not the weapon's producer/critical policy.
// damage50 MUST already include the actual equipment, defense and contact
// pipeline. Neither arena contact.damage nor raw weapon power is a substitute.
export function createConquestPlayerMonsterDamageRecord({attributeId,sourcePeerId10,creditOwnerPeerId78,damage50,field44,field47,field4a,field4d}){
 if(!uint(attributeId))throw Error('Explicit native attribute8 required');
 const record=Object.freeze({attributeId8:attributeId,sourcePeerId10:peer(sourcePeerId10),creditOwnerPeerId78:peer(creditOwnerPeerId78),damage50:finite(damage50,'record50'),
  field44:bool(field44,'record44'),field47:bool(field47,'record47'),field4a:bool(field4a,'record4A'),field4d:bool(field4d,'record4D'),nativeReady:false});
 records.add(record);return record;
}

// CMonster B8 forwards unchanged into97FA20. Its4C getter is C13D20 (false),
// unlike player/Sentry profiles. This is the shared original HP prefix only;
// no death transition, Conquest score or hit reaction is inferred from HP.
export function conquestMonsterNumericDamage({hp94,maxHp9c,slot44,attributeId8,damage50}){
 const hp=finite(hp94,'monsterHP94'),maxHp=finite(maxHp9c,'monsterMaxHP9C'),amount=finite(damage50,'record50');
 bool(slot44,'monster358');if(!uint(attributeId8))throw Error('Explicit native attribute8 required');
 if(hp<=0||!slot44)return {accepted:false,hpBefore:hp,hpAfter:hp,amountConsumed:0,nativeReady:false};
 const consumed=amount<hp?amount:hp,next=f(hp-consumed),after=next>=maxHp?maxHp:next;
 return {accepted:true,hpBefore:hp,hpAfter:after,amountConsumed:consumed,nativeReady:false};
}

// Real actor-owned HP consumer. readPlayerPeerId bridges Controller's missing
// native2C identity; resolveAttribute bridges the current attribute registry.
// They cannot replace the actor, health owner, render owner or numeric path.
// Scope: final record flags/50 after6E95C0 preparation. Its condition callbacks,
// A05A80 visuals and A041F0→A13C90 state notifications are explicitly unfinished.
export class ConquestMonsterHealth{
 #actor;#model;#group;#monsters;#players;#world;#render;#readPeer;#attribute;#disposed=false;#receivedRecord=null;
 constructor({actor,monsterActors,playerActors,worldOwner,renderOwner,readPlayerPeerId,resolveAttribute}={}){
  if(!(actor instanceof ConquestMonsterActor)||!(monsterActors instanceof Map)||!(playerActors instanceof Map)||monsterActors===playerActors||!worldOwner||!renderOwner?.isObject3D||!synchronous(readPlayerPeerId)||!synchronous(resolveAttribute))throw Error('Actual Conquest monster/player owners and synchronous native identity/attribute producers required');
  this.#actor=actor;this.#model=actor.model;this.#group=actor.model.group;this.#monsters=monsterActors;this.#players=playerActors;this.#world=worldOwner;this.#render=renderOwner;this.#readPeer=readPlayerPeerId;this.#attribute=resolveAttribute;
  this.currentRecord=null;this.lastDamage=null;this.#current();
  healthOwners.set(this,{actor,monsterActors,playerActors,worldOwner,renderOwner,assertCurrent:()=>this.#current()});
 }
 get actor(){return this.#actor;}
 // Reaction timing consumes the same actual actor158 written by receive,
 // including native rejections after source/attribute lookup. A public slot
 // assignment cannot impersonate a received typed record.
 readCurrentRecord(){this.#current();if(this.currentRecord!==this.#receivedRecord)throw Error('Monster record158 was changed outside its actual receiver');return this.#receivedRecord;}
 #current(){if(this.#disposed)throw Error('Disposed monster health receiver');if(this.#monsters.get(this.#actor.id)!==this.#actor||this.#actor.model!==this.#model||this.#model.group!==this.#group||rootOf(this.#group)!==this.#render)throw Error('Stale/replaced/detached monster health owner');}
 #source(words){
  let found=null;
  for(const [playerId,record]of this.#players){
   if(!(record?.controller instanceof Controller)||record.controller.world!==this.#world)throw Error('Actual current player Controller/world required');
   const value=peer(this.#readPeer({playerId,record,controller:record.controller}));
   if(samePeer(value,words)){if(found)throw Error('Ambiguous native player peer');found={playerId,record,controller:record.controller,peerId:value};}
  }
  return found;
 }
 receive(record){
  this.#current();
  if(record===null)return {accepted:false,status:'null-record',recordReceiptFlag:null,nativeReady:false};
  if(!records.has(record))throw Error('Typed final player→monster record required; arena damage is not record50');
  // A03A80 stores actor158 before A05A80 performs the source/attribute lookups.
  this.currentRecord=record;this.#receivedRecord=record;
  const recordReceiptFlag=!record.field4a&&!record.field44&&record.field47;
  const reject=status=>({accepted:false,status,recordReceiptFlag,nativeReady:false,recordSideEffectsComplete:false});
  const source=this.#source(record.sourcePeerId10);if(!source)return reject('missing-source-actor');
  const attribute=this.#attribute(record.attributeId8);
  if(attribute&&typeof attribute.then==='function')throw Error('Synchronous actual attribute lookup required');
  if(!attribute)return reject('missing-attack-attribute');
  if(record.field4a)return reject('record4A-no-monster-numeric-damage');
  if(record.field44)return reject('record44-no-monster-numeric-damage');
  if(!record.field47)return reject('record47-no-monster-numeric-damage');
  // Native4D is read but does not exclude this monster's ordinary HP branch.
  // Recheck the authoritative target after external getters, before any write.
  this.#current();if(this.#players.get(source.playerId)!==source.record||source.record.controller!==source.controller)throw Error('Player source changed during damage lookup');
  const decision=conquestMonsterNumericDamage({hp94:this.#actor.health,maxHp9c:this.#actor.maxHealth,slot44:this.#actor.eligibleVirtual44,attributeId8:record.attributeId8,damage50:record.damage50});
  if(decision.accepted){
   this.#actor.setEffectiveHealth(decision.hpAfter);
   this.lastDamage=Object.freeze({sourcePeerId:Object.freeze([...source.peerId]),attributeId:record.attributeId8,amountConsumed:decision.amountConsumed});
  }
  return {...decision,status:decision.accepted?'monster-hp-written':'monster-hp-rejected',recordReceiptFlag,sourcePlayerId:source.playerId,
   sourcePeerId:[...source.peerId],creditOwnerPeerId:[...record.creditOwnerPeerId78],recordSideEffectsComplete:false,
   // B8 notifies with input amount even if its base HP prefix rejected it.
   stateNotificationsComplete:false,stateNotificationInput:record.damage50};
 }
 dispose(){this.#disposed=true;}
}

export function assertConquestMonsterHealth(receiver,{actor,monsterActors,playerActors,worldOwner,renderOwner}={}){
 const retained=healthOwners.get(receiver);
 if(!retained||retained.actor!==actor||retained.monsterActors!==monsterActors||retained.playerActors!==playerActors||retained.worldOwner!==worldOwner||retained.renderOwner!==renderOwner)throw Error('Actual typed monster health receiver with identical actor/maps/world/render owners required');
 retained.assertCurrent();return receiver;
}

// Composable endpoint for existing S5 weapon contact consumers. The target
// token must be the actual authority-owned monster, not a training dummy or
// an unowned model alias. Contact geometry and the real weapon record producer
// remain the caller's explicit responsibility; contact.damage is never read.
export class ConquestPlayerMonsterCombat{
 #config;#receivers=new Map();#disposed=false;#delivering=new Set();
 constructor(config){
  const {playerId,playerActors,controller}=config??{};
  if(!(controller instanceof Controller)||!(playerActors instanceof Map)||playerActors.get(playerId)?.controller!==controller)throw Error('Actual authority-owned attacking player required');
  this.#config={...config};
 }
 bindMonster(actor,{receiver,ownership='owned'}={}){
  if(this.#disposed)throw Error('Disposed player→monster combat');
  if(this.#receivers.has(actor))throw Error('Monster health receiver already bound');
  if(!['owned','borrowed'].includes(ownership)||ownership==='owned'&&receiver!==undefined||ownership==='borrowed'&&receiver===undefined)throw Error('Explicit borrowed existing receiver or owned new receiver required');
  if(ownership==='owned')receiver=new ConquestMonsterHealth({...this.#config,actor});
  assertConquestMonsterHealth(receiver,{...this.#config,actor});
  this.#receivers.set(actor,{receiver,ownership});return receiver;
 }
 // Release this binding before authority/model teardown. Owned receivers are
 // disposed; borrowed ActorRuntime health owners stay alive for Reactions.
 // Neither operation proves a native actor Release or reference count.
 unbindMonster(actor){
  if(this.#disposed)throw Error('Disposed player→monster combat');
  const binding=this.#receivers.get(actor);if(!binding)return false;
  if(this.#delivering.has(binding))throw Error('Cannot unbind monster during numeric damage delivery');
  const {receiver,ownership}=binding;
  const {playerId,playerActors,controller}=this.#config;
  if(playerActors.get(playerId)?.controller!==controller)throw Error('Stale attacking player Controller');
  // Execute the real receiver's private owner check, even if a returned public
  // receiver has been given a replacement readCurrentRecord/dispose property.
  assertConquestMonsterHealth(receiver,{...this.#config,actor});
  ConquestMonsterHealth.prototype.readCurrentRecord.call(receiver);
  if(ownership==='owned')ConquestMonsterHealth.prototype.dispose.call(receiver);
  this.#receivers.delete(actor);return true;
 }
 consumeWeaponContact(contact,{produceRecord,damageNotification,runtime,runtimes}={}){
  if(this.#disposed)throw Error('Disposed player→monster combat');
  const {playerId,playerActors,controller,readPlayerPeerId}=this.#config,sourceRecord=playerActors.get(playerId);
  if(sourceRecord?.controller!==controller)throw Error('Stale attacking player Controller');
  const target=contact?.target,binding=this.#receivers.get(target);if(!binding)throw Error('Actual bound Conquest monster contact target required');
  if(this.#delivering.has(binding))throw Error('Reentrant monster numeric damage delivery');
  const {receiver}=binding;
  const king=target.spawnStats.monsterKey===1500;
  if(king)assertConquestKingDamageNotification(damageNotification,{actor:target,health:receiver,runtime,runtimes});
  else if(damageNotification!==undefined||runtime!==undefined||runtimes!==undefined)throw Error('King-only typed numeric/state delivery route required');
  if(produceRecord===undefined)return {accepted:false,status:'weapon-record-producer-unresolved',nativeReady:false};
  if(!synchronous(produceRecord))throw Error('Synchronous actual final weapon record producer required');
  const record=produceRecord({contact,controller,playerId,sourceRecord,target});
  const current=()=>{
   if(this.#disposed||this.#receivers.get(target)!==binding||contact.target!==target)throw Error('Monster contact binding changed during record production');
   assertConquestMonsterHealth(receiver,{...this.#config,actor:target});
   if(king)assertConquestKingDamageNotification(damageNotification,{actor:target,health:receiver,runtime,runtimes});
  };
  current();
  if(record===null)return {accepted:false,status:'weapon-record-producer-unresolved',nativeReady:false};
  if(!records.has(record))throw Error('Weapon producer must return typed final record50, not contact.damage');
  if(!samePeer(record.sourcePeerId10,peer(readPlayerPeerId({playerId,record:sourceRecord,controller}))))throw Error('Weapon record source is not the attacking player');
  if(playerActors.get(playerId)!==sourceRecord||sourceRecord.controller!==controller)throw Error('Attacking player changed during record production');
  current();let result;
  this.#delivering.add(binding);
  // King.receive is the single typed numeric+state boundary. Calling Health
  // first here and then the notification would consume numeric damage twice.
  try{result=king?damageNotification.receive(record):ConquestMonsterHealth.prototype.receive.call(receiver,record);}finally{this.#delivering.delete(binding);}
  return {record,result,accepted:result.accepted,delivered:true,status:'final-record-delivered',nativeReady:false};
 }
 dispose(){
  if(this.#delivering.size)throw Error('Cannot dispose combat during numeric damage delivery');
  for(const {receiver,ownership}of this.#receivers.values())if(ownership==='owned')ConquestMonsterHealth.prototype.dispose.call(receiver);
  this.#receivers.clear();this.#disposed=true;
 }
}
