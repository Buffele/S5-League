import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {readConquestPlayerAttackProfile,assertConquestPlayerAttackFields} from './conquest-player-attack-profile.js';
import {conquestPlayerAttackBounds} from './conquest-monster-attack-actors.js';

const f=Math.fround,u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff,authorityStateReaders=new WeakMap();
const pair=value=>{if(!Array.isArray(value)||value.length!==2||!value.every(u32))throw Error('Explicit two-DWORD actor identity required');return Object.freeze([...value]);};
const rootOf=node=>{while(node?.parent)node=node.parent;return node;};
const vector=value=>{if(!['x','y','z'].every(k=>Number.isFinite(value?.[k])&&Number.isFinite(f(value[k]))))throw Error('Current finite native actor position required');return Object.fromEntries(['x','y','z'].map(k=>[k,f(value[k])]));};

// MapAI needs only this private lifetime bit. Reading it does not enumerate
// actors or manufacture diagnostics, and public snapshot replacement cannot
// impersonate the retained authority owner. Snapshots remain unchanged.
export function readConquestPawnActorAuthorityDisposed(authority){
 const reader=authorityStateReaders.get(authority);if(!reader)throw Error('Actual privately owned Pawn actor authority required');return reader();
}

// Owns the S5 actor lists consumed by native Pawn perception/navigation.
// It reads actual Controller/profile/monster owners, rather than reusing the
// BOX attack candidate order or installing a dummy target with cached position.
export class ConquestPawnActorAuthority {
 #players;#teams;#monsters;#world;#render;#bindings=new Map();#objects=new WeakMap();#owners=new WeakMap();#shortIds=new Map();#disposed=false;
 #playerStatus=new WeakMap();#exclusions=new Set();#visible;
 constructor({playerActors,playerTeamSelectors,monsterActors,worldOwner,renderOwner,probeVisibility}={}){
  if(!(playerActors instanceof Map)||!(playerTeamSelectors instanceof Map)||!(monsterActors instanceof Map)||playerActors===monsterActors||worldOwner?.nativeMapId!==46||!renderOwner?.isObject3D||probeVisibility!==undefined&&typeof probeVisibility!=='function')throw Error('Actual distinct player/monster Maps, team selector Map and map46/render owners required');
  this.#players=playerActors;this.#teams=playerTeamSelectors;this.#monsters=monsterActors;this.#world=worldOwner;this.#render=renderOwner;this.#visible=probeVisibility;
  this.perceptionPorts=Object.freeze({readTeamSelector:actor=>{const b=this.#binding(actor);return b.kind==='monster'?b.actor.teamSelector:this.#teams.get(b.id);},
   readPlayerTeamActors:team=>this.playersForTeam(team),readMonsters:()=>this.monsters(),
   isEligible:actor=>this.eligible(actor),isExcludedMonster:actor=>this.excluded(actor),
   readPosition:actor=>this.position(actor),isActorType165AC64:actor=>this.#binding(actor).kind==='player',
   readVirtual164:(actor,argument)=>this.playerStatus(actor,argument),visible:(from,to)=>this.visible(from,to)});
  this.navigationPorts=Object.freeze({readActorIdentityById:id=>({qualified:true,identityPair:this.identity(id)}),
   lookupShortIdentity:identity=>this.lookupShortIdentity(identity),isActorType165AC58:actor=>this.#binding(actor).kind==='player',
   readPosition7c:actor=>this.position(actor),readHeight6c:actor=>this.height(actor)});
  authorityStateReaders.set(this,Object.freeze(()=>this.#disposed));
 }
 #live(){if(this.#disposed)throw Error('Disposed Pawn actor authority');}
 #check(b){
  this.#live();
  if(b.kind==='monster'){
   if(this.#monsters.get(b.id)!==b.actor||b.actor.id!==b.id||!(b.actor instanceof ConquestMonsterActor)||b.actor.model!==b.model||b.model.group!==b.group||rootOf(b.model.group)!==this.#render)throw Error('Stale/detached monster authority');
  }else{
   if(this.#players.get(b.id)!==b.record||b.record.controller!==b.controller||b.record.combatState!==b.health||b.record.model!==b.model||b.controller.world!==this.#world||rootOf(b.model.group)!==this.#render||![0,1,2].includes(this.#teams.get(b.id)))throw Error('Stale/replaced player authority or team selector');
   const receipt=readConquestPlayerAttackProfile(b.profile);
   if(receipt.playerId!==b.id)throw Error('Player profile identity belongs to another authority record');
   assertConquestPlayerAttackFields(receipt,{controller:b.controller,combatState:b.health,model:b.model});
   return receipt;
  }
 }
 #binding(actor){this.#live();const b=this.#objects.get(actor);if(!b||this.#bindings.get(b.id)!==b)throw Error('Current owned navigation actor required');this.#check(b);return b;}
 #coverage(){this.#live();for(const [id,record] of this.#players)if(this.#bindings.get(id)?.record!==record)throw Error('Incomplete current player authority');for(const [id,actor] of this.#monsters)if(this.#bindings.get(id)?.actor!==actor)throw Error('Incomplete current monster authority');for(const b of this.#bindings.values())this.#check(b);}
 #insert(b){
  this.#live();if(this.#bindings.has(b.id)||this.#owners.has(b.controller??b.actor))throw Error('Distinct live actor ID and underlying owner required');
  const key=b.peer[0]+':'+(b.peer[1]&0xffff);if(this.#shortIds.has(key))throw Error('Ambiguous source short actor identity');
  this.#check(b);this.#bindings.set(b.id,b);this.#objects.set(b.actor,b);this.#owners.set(b.controller??b.actor,b);this.#shortIds.set(key,b);return b.actor;
 }
 bindPlayer(id,{profile,peerId2c}={}){
  this.#live();const record=this.#players.get(id);
  if(!record||![0,1,2].includes(this.#teams.get(id)))throw Error('Actual registered player and source team selector required');
  const actor=Object.freeze({id,kind:'conquest-owned-player-navigation'});
  const b={id,kind:'player',actor,record,controller:record.controller,health:record.combatState,model:record.model,profile,peer:pair(peerId2c)};
  this.#insert(b);
  // 513FC0 creates B87B30 into2A0; B87B4F initializes its active byte8
  // false. Retained application state, distinct from CombatState.invincible.
  // Later invisibility/status writers must update this owner explicitly.
  if(!this.#playerStatus.has(record))this.#playerStatus.set(record,{active:false,source:'B87B30 constructor byte8'});
  return actor;
 }
 bindMonster(id,{peerId2c}={}){
  this.#live();const actor=this.#monsters.get(id),peer=pair(peerId2c);
  if(!(actor instanceof ConquestMonsterActor)||((peer[1]>>>16)&7)!==6)throw Error('Actual registered monster and source kind6 peer required');
  return this.#insert({id,kind:'monster',actor,model:actor.model,group:actor.model.group,peer});
 }
 unbind(id){this.#live();const b=this.#bindings.get(id);if(!b)return false;this.#bindings.delete(id);this.#objects.delete(b.actor);this.#owners.delete(b.controller??b.actor);this.#shortIds.delete(b.peer[0]+':'+(b.peer[1]&0xffff));return true;}
 // A lookup consumes one privately registered actor, not the whole roster.
 // Enumeration below still checks complete coverage and every returned owner.
 #byId(id){this.#live();const b=this.#bindings.get(id);if(!b)throw Error('Current registered actor ID required');this.#check(b);if(this.#disposed||this.#bindings.get(id)!==b||(b.kind==='monster'?this.#monsters.get(id)!==b.actor:this.#players.get(id)!==b.record))throw Error('Current registered actor ID required');return b;}
 actor(id){return this.#byId(id).actor;}
 identity(id){return [...this.#byId(id).peer];}
 lookupShortIdentity(identity){
  this.#coverage();const p=pair(identity);if(p[1]>0xffff)throw Error('Already truncated native short identity required');
  return this.#shortIds.get(p[0]+':'+p[1])?.actor??null;
 }
 // A27E80/A126D0 command lookup uses both full DWORDs. Navigation's
 // 9FC800 short identity truncation must not redirect a delayed command.
 lookupFullIdentity(identity){this.#coverage();const p=pair(identity);for(const b of this.#bindings.values())if(b.peer[0]===p[0]&&b.peer[1]===p[1])return b.actor;return null;}
 playersForTeam(team){this.#coverage();if(![0,1,2].includes(team))throw Error('Native team selector required');return [...this.#players.keys()].map(id=>this.#bindings.get(id)).filter(b=>this.#teams.get(b.id)===team).map(b=>b.actor);}
 monsters(){this.#coverage();return [...this.#monsters.values()];}
 position(actor){const b=this.#binding(actor);return b.kind==='monster'?vector(b.actor.positionNative):vector(Object.fromEntries(['x','y','z'].map(k=>[k,b.controller.position[k]/.006])));}
 height(actor){const b=this.#binding(actor);if(b.kind==='monster')return b.actor.height;const receipt=this.#check(b);return conquestPlayerAttackBounds(receipt.fields,{currentStatePresent:receipt.fields.currentStatePresent}).height6c;}
 eligible(actor){const b=this.#binding(actor);if(b.kind==='monster'){if(typeof b.actor.eligibleVirtual44!=='boolean')throw Error('Current monster358 required');return b.actor.eligibleVirtual44;}const fields=this.#check(b).fields;return fields.actor154&&fields.currentStatePresent&&fields.stateB0;}
 excluded(actor){const b=this.#binding(actor);if(b.kind!=='monster')throw Error('Actual monster exclusion query required');return this.#exclusions.has(b.actor.spawnStats.monsterKey);}
 replaceExcludedMonsterKeys(keys){this.#live();if(!Array.isArray(keys)||keys.some(k=>!u32(k)))throw Error('Explicit ordered native excluded monster keys required');this.#exclusions=new Set(keys);}
 playerStatus(actor,argument){const b=this.#binding(actor);if(argument!==0)throw Error('Only source Pawn virtual164(0) selection is qualified');return b.kind==='monster'?false:this.#playerStatus.get(b.record).active;}
 setPlayerTargetStatus(actor,{active,source}={}){const b=this.#binding(actor);if(b.kind!=='player'||typeof active!=='boolean'||typeof source!=='string'||!source.trim())throw Error('Owned player targeting-status write and explicit source required');this.#playerStatus.set(b.record,{active,source});}
 visible(from,to){this.#binding(from);this.#binding(to);if(typeof this.#visible!=='function')throw Error('Current native visibility producer unresolved');const r=this.#visible({from,to});if(r?.qualified!==true||typeof r.visible!=='boolean')throw Error('Qualified current visibility result required');return r.visible;}
 snapshot(){return {playerCount:[...this.#bindings.values()].filter(b=>b.kind==='player').length,monsterCount:[...this.#bindings.values()].filter(b=>b.kind==='monster').length,disposed:this.#disposed,collectionOrder:'S5 owned player-team insertion order, then owned monster insertion order',nativeRegistryOrderObserved:false,nativeReady:false};}
 dispose(){if(this.#disposed)return;this.#disposed=true;this.#bindings.clear();this.#shortIds.clear();this.#exclusions.clear();}
}
