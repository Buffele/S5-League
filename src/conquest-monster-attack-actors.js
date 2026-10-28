import {Controller} from './controller.js';
import {CombatState} from './combat-state.js';
import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {TUNING} from './movement-profile.js';
import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {enumerateConquestAttackBoxCandidates} from './conquest-monster-attack-geometry.js';
import {assertConquestPlayerAttackFields,assertConquestMonsterAttackFields} from './conquest-player-attack-profile.js';

const f=Math.fround,axes=['x','y','z'];
const bool=(v,name)=>{if(typeof v!=='boolean')throw Error('Explicit native '+name+' required');return v;};
const number=(v,name)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v))||v<0)throw Error('Explicit nonnegative native '+name+' required');return f(v);};
const vec=(v,scale=1)=>{if(!v||!axes.every(k=>Number.isFinite(v[k])&&Number.isFinite(f(v[k]/scale))))throw Error('Actual finite actor position required');return Object.freeze(axes.map(k=>f(v[k]/scale)));};
const peer=value=>{if(!Array.isArray(value)||value.length!==2||!value.every(n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff))throw Error('Explicit virtual2C peer DWORDs required');return Object.freeze([...value]);};
const rootOf=node=>{while(node?.parent)node=node.parent;return node;};
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);
export const CONQUEST_ATTACK_ACTOR_SOURCE=Object.freeze({scale:SCN_SCENE_SCALE,playerPhysicalWidth:200,playerPhysicalHeight:320,
 monsterVtable:0x13f0244,playerVtables:Object.freeze([0x13aafdc,0x13c1c14]),samePositionGetter7c80:0x5304e0,peerGetter2c:0x5301b0,
 sideGetter1c4:0x530650,playerWidthGetter68:0x51bf10,playerHeightGetter6c:0x51c0d0,nativeReady:false});

//51BF10/51C0D0. Physical Controller dimensions are NOT assumed to be these
//state-dependent attack bounds. Actor1C is currentState, never the avatar.
//Every native property/state/class branch remains explicit.
export function conquestPlayerAttackBounds(fields,{currentStatePresent}={}){
 if(!fields)throw Error('Current native player dimension fields unresolved');
 const size=number(fields.actorSizeA4,'actorA4'),heightRate=number(fields.actorHeightRateAC,'actorAC');
 bool(currentStatePresent,'currentState1C presence');
 if(!currentStatePresent)return {width68:f(f(.699999988079071)*size),height6c:f(f(.699999988079071)*size)};
 const matches=bool(fields.stateClassMatches,'state RTTI match');
 if(!matches)return {width68:f(f(.699999988079071)*size),height6c:f(f(.699999988079071)*size)};
 const alternate=bool(fields.actor270,'actor270'),width=number(fields.stateWidth68,'state68'),height=number(fields.stateHeight6c,'state6C');
 return {width68:f((alternate?f(f(1.5)*size):size)*width),height6c:f((alternate?f(f(1.5)*heightRate):heightRate)*height)};
}

const receipts=new WeakMap();
export const CONQUEST_DIRECT_ROOK_SPHERE_ENUMERATION_POLICY=Object.freeze({name:'s5-rook-direct-sphere-source-image-global6-zero',caller:0xb7d200,dispatch:0x5448c0,sphereConsumer:0x5426f0,enumerator:0x548ae0,global165ADE4:false,global165ADE6:false,nativeGlobalObserved:false,nativeReady:false});
//Owns registry placement and capability receipts. Authority maps remain the
//actual game owners, so replacing/removing an actor cannot leave a valid alias.
//Native fields missing from S5 require bound synchronous producers; null refuses.
export class ConquestAttackActorRegistry{
 #world;#render;#monsters;#players;#bindings=new Map();#objects=new WeakMap();#peerKeys=new Set();#pools=[];#second=[];#third=[];#placements=new Map();#revision=0;#disposed=false;#reading=false;
 constructor({worldOwner,renderOwner,monsterActors,playerActors}={}){
  if(!worldOwner||!renderOwner?.isObject3D||!(monsterActors instanceof Map)||!(playerActors instanceof Map)||monsterActors===playerActors)throw Error('Actual loaded world/render owners and distinct actor authority Maps required');
  if(SCN_SCENE_SCALE!==.006||TUNING.radius!==100*.006||TUNING.height!==320*.006)throw Error('Qualified unmirrored .006 Controller boundary required');
  this.#world=worldOwner;this.#render=renderOwner;this.#monsters=monsterActors;this.#players=playerActors;
 }
 #active(){if(this.#disposed)throw Error('Disposed Conquest attack actor registry');}
 #idle(){this.#active();if(this.#reading)throw Error('Actor registry lifecycle cannot mutate during snapshot');}
 createFirstPool({identity,tag}={}){this.#idle();if(identity==null||this.#pools.some(p=>p.token.identity===identity)||!Number.isInteger(tag)||tag<0||tag>255)throw Error('Distinct source pool identity and decoded tag byte required');const token=Object.freeze({identity,tag}),pool={token,actors:[]};this.#pools.push(pool);this.#revision++;return token;}
 #bind(kind,{identity,actorId,playerId,actor,record,peerId2c,readSourceFields,vtable}={}){
  this.#idle();if(identity==null||this.#bindings.has(identity)||!sync(readSourceFields))throw Error('Distinct actor identity and synchronous native field producer required');
  const id=kind==='monster'?actorId:playerId,object=kind==='monster'?actor:record?.controller;
  if(kind==='monster'){
   if(!(actor instanceof ConquestMonsterActor)||actor.id!==actorId||this.#monsters.get(actorId)!==actor)throw Error('Actual authority-owned ConquestMonsterActor required');
  }else if(!record||this.#players.get(playerId)!==record||!(record.controller instanceof Controller)||!(record.combatState instanceof CombatState)||!CONQUEST_ATTACK_ACTOR_SOURCE.playerVtables.includes(vtable))throw Error('Actual authority-owned Controller/CombatState record and source player vtable required');
  const words=peer(peerId2c),key=words.join(':');
  if(this.#objects.has(object)||this.#peerKeys.has(key))throw Error('Actor object or native peer is already bound');
  if(kind==='monster'&&((words[1]>>>16)&7)!==6)throw Error('Actual monster virtual2C peer kind6 required');
  const token=Object.freeze({identity,kind,id}),binding={token,kind,id,actor,record,object,peer:words,key,readSourceFields,vtable,
   model:kind==='monster'?actor.model:record.model,modelGroup:kind==='monster'?actor.model?.group:record.model?.group,combatOwner:kind==='player'?record.combatState:null,positionObject:kind==='player'?record.controller.position:null};
  this.#check(binding);this.#bindings.set(identity,binding);this.#objects.set(object,binding);this.#peerKeys.add(key);this.#placements.set(token,[]);this.#revision++;return token;
 }
 bindMonster(source){return this.#bind('monster',source);}
 bindPlayer(source){return this.#bind('player',source);}
 #owned(token){this.#active();const b=this.#bindings.get(token?.identity);if(!b||b.token!==token)throw Error('Current owned actor binding required');this.#check(b);return b;}
 #check(b){
  if(b.kind==='monster'){
   if(this.#monsters.get(b.id)!==b.actor||b.actor.model!==b.model||b.model?.group!==b.modelGroup||!b.model?.group?.isObject3D||rootOf(b.model.group)!==this.#render)throw Error('Stale/replaced/detached monster binding');
  }else if(this.#players.get(b.id)!==b.record||b.record.controller!==b.object||!(b.record.combatState instanceof CombatState)||b.record.combatState!==b.combatOwner||b.object.world!==this.#world||b.object.position!==b.positionObject||b.record.model!==b.model||b.model!==null&&(b.model?.group!==b.modelGroup||!b.model?.group?.isObject3D||rootOf(b.model.group)!==this.#render))throw Error('Stale/replaced/reset player binding');
 }
 append(token,{registry,pool}={}){this.#idle();this.#owned(token);let list;if(registry==='first'){list=this.#pools.find(p=>p.token===pool)?.actors;if(!list)throw Error('Owned source first-registry pool required');}else if(registry==='second')list=this.#second;else if(registry==='third')list=this.#third;else throw Error('Explicit source registry placement required');const membership=Object.freeze({binding:token,registry});list.push(membership);this.#placements.get(token).push({membership,list});this.#revision++;return membership;}
 unbind(token){this.#idle();const b=this.#bindings.get(token?.identity);if(!b||b.token!==token)throw Error('Owned actor binding required for release');for(const {membership,list}of this.#placements.get(token))list.splice(list.indexOf(membership),1);this.#placements.delete(token);this.#bindings.delete(token.identity);this.#objects.delete(b.object);this.#peerKeys.delete(b.key);this.#revision++;}
 #coverage(){
  for(const [id,actor]of this.#monsters){const b=this.#objects.get(actor);if(!b||b.kind!=='monster'||b.id!==id||!this.#placements.get(b.token)?.length)throw Error('Incomplete owned monster registry coverage');this.#check(b);}
  for(const [id,record]of this.#players){const b=this.#objects.get(record?.controller);if(!b||b.kind!=='player'||b.id!==id||b.record!==record||!this.#placements.get(b.token)?.length)throw Error('Incomplete owned player registry coverage');this.#check(b);}
  for(const b of this.#bindings.values())this.#check(b);
 }
 #read(b,{source=false}={}){
  this.#check(b);const value=b.readSourceFields(b.kind==='monster'?{actor:b.actor}:{controller:b.object,combatState:b.record.combatState,model:b.model});
  if(!value||typeof value!=='object'||typeof value.then==='function')throw Error('Current native actor fields unresolved');
  let fields=value,nativeFieldProducerQualified=false,fieldReceipt=null;
  if(value.kind==='conquest-owned-player-attack-fields'){
   if(b.kind!=='player')throw Error('Player field receipt cannot bind a monster');
   assertConquestPlayerAttackFields(value,{controller:b.object,combatState:b.record.combatState,model:b.model});fields=value.fields;fieldReceipt=value;nativeFieldProducerQualified=true;
  }else if(value.kind==='conquest-owned-monster-attack-fields'){
   if(b.kind!=='monster')throw Error('Monster field receipt cannot bind a player');
   assertConquestMonsterAttackFields(value,{actor:b.actor});fields=value.fields;fieldReceipt=value;nativeFieldProducerQualified=true;
  }else if(value.fields!==undefined||value.kind!==undefined)throw Error('Unknown or unauthenticated actor field receipt');
  const slot1c4=bool(fields.actor1aa,'actor1AA'),common={identity:b.token.identity,peerId2c:b.peer,slot1c4,
   object:b.object,combatState:b.kind==='player'?b.record.combatState:null,binding:b.token,actorVtable:b.kind==='monster'?0x13f0244:b.vtable,nativeFieldProducerQualified,fieldReceipt};
  let eligible,position,dimensions;
  if(b.kind==='monster'){
   eligible=bool(b.actor.eligibleVirtual44,'monster358');position=vec(b.actor.positionNative);
   dimensions={width68:number(b.actor.width,'monster width68'),height6c:number(b.actor.height,'monster height6C')};
  }else{
   const currentStatePresent=bool(fields.currentStatePresent,'currentState1C presence');
   eligible=bool(fields.actor154,'player154')&&currentStatePresent&&bool(fields.stateB0,'stateB0');position=vec(b.object.position,.006);
   dimensions=eligible||source?conquestPlayerAttackBounds(fields,{currentStatePresent}):{};
  }
  const result={...common,eligible44:eligible,position7c:position,position80:Object.freeze([...position]),...dimensions};
  if(source){if(b.kind!=='monster')throw Error('Pawn source must be an actual monster');result.direction8c=vec(b.actor.facingNative);}
  return Object.freeze(result);
 }
 snapshot(options={}){return this.#snapshot(options);}
 snapshotDirectSphere(options={}){
  if(options.policy!==CONQUEST_DIRECT_ROOK_SPHERE_ENUMERATION_POLICY)throw Error('Explicit immutable Rook direct-sphere global6 policy required');
  const sourceBinding=this.#owned(options.source);if(sourceBinding.kind!=='monster'||sourceBinding.actor.spawnStats.monsterKey!==1100)throw Error('Qualified direct B7D200 Rook1100 caller required');
  if(options.excludeSubtype2!==false)throw Error('B7D200 explicitly clears enumeration global4');
  return this.#snapshot(options,CONQUEST_DIRECT_ROOK_SPHERE_ENUMERATION_POLICY);
 }
 #snapshot({source,excludeSubtype2,omitSecondRegistry,excludeSubtype5}={},directPolicy=null){
  this.#idle();const sourceBinding=this.#owned(source);if(sourceBinding.kind!=='monster')throw Error('Actual Pawn requester required');
  for(const [name,value]of Object.entries({excludeSubtype2,omitSecondRegistry,excludeSubtype5}))bool(value,name);
  this.#reading=true;
  try{
   this.#coverage();const revision=this.#revision,cache=new Map(),read=token=>{let value=cache.get(token);if(!value){value=this.#read(this.#owned(token));cache.set(token,value);}return value;};
   //56E870 sets global6 from its requester kind then restores0. Direct
   //B7D200->5448C0(type5)->5426F0 bypasses56E870;548AE0 has no requester
   //argument and reads the retained global6. Keep these callers distinct.
   const requester=this.#read(sourceBinding,{source:true}),omitThirdRegistry=directPolicy?directPolicy.global165ADE6:((requester.peerId2c[1]>>>16)&7)===6;
   // Filter peer types before reading candidate fields, matching548AE0 before53FAF0.
   const firstRegistryPools=this.#pools.map(p=>({tag:p.token.tag,actors:p.token.tag===0?[]:p.actors.map(m=>this.#owned(m.binding)).filter(b=>!(excludeSubtype2&&((b.peer[1]>>>16)&7)===2)&&!(excludeSubtype5&&((b.peer[1]>>>16)&7)===5)).map(b=>read(b.token))}));
   const candidates=Object.freeze(enumerateConquestAttackBoxCandidates({firstRegistryPools,secondRegistry:omitSecondRegistry?undefined:this.#second.map(m=>read(m.binding)),thirdRegistry:omitThirdRegistry?undefined:this.#third.map(m=>read(m.binding)),excludeSubtype2:false,excludeSubtype5:false,omitSecondRegistry,omitThirdRegistry}));
   this.#coverage();if(this.#revision!==revision)throw Error('Actor registry changed during snapshot');
   const nativeFieldProducerQualified=[requester,...cache.values()].every(actor=>actor.nativeFieldProducerQualified===true);
   const receipt=Object.freeze({source:requester,candidates,coverage:Object.freeze({scope:'owned-S5-Controller-CombatState-and-ConquestMonsterActor',registryRevision:revision,monsterCount:this.#monsters.size,playerCount:this.#players.size,registryCoverageQualified:true,getterContractsQualified:true,nativeFieldProducerQualified,candidateProducerQualified:nativeFieldProducerQualified,omitThirdRegistry,...(directPolicy?{enumerationPolicy:directPolicy.name,sourceCaller:directPolicy.caller,sourceGlobal6Observed:false,s5CurrentGlobal6:false}:{})}),nativeReady:false});
   receipts.set(receipt,{registry:this,revision,cache,requester,sourceBinding});return receipt;
  }finally{this.#reading=false;}
 }
 assertCurrent(receipt){
  this.#idle();const proof=receipts.get(receipt);if(!proof||proof.registry!==this||proof.revision!==this.#revision)throw Error('Current owned actor snapshot receipt required');
  this.#coverage();this.#reading=true;
  try{
   const equal=(a,b)=>['identity','eligible44','slot1c4','width68','height6c','nativeFieldProducerQualified'].every(k=>a[k]===b[k])&&['position7c','position80','direction8c'].every(k=>a[k]===undefined&&b[k]===undefined||a[k]?.every((v,i)=>v===b[k]?.[i]));
   if(!equal(proof.requester,this.#read(proof.sourceBinding,{source:true})))throw Error('Stale actor source snapshot');
   for(const [token,previous]of proof.cache)if(!equal(previous,this.#read(this.#owned(token))))throw Error('Stale actor candidate snapshot');
   return receipt;
  }finally{this.#reading=false;}
 }
 dispose(){this.#idle();this.#disposed=true;this.#revision++;this.#bindings.clear();this.#pools=[];this.#second=[];this.#third=[];this.#placements.clear();}
}
