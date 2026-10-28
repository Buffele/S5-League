// Azit15 CLimitedArea mode0, copied source 71C700..71CC9B.
// Pure source geometry/filter/command compiler. No health, scene or frame owner.
// Evidence: work/azit-blender-reconstruction/build/native-limited-damage-audit.json.
import {Matrix4,Quaternion,Vector3} from 'three';
import {nativeBoxIntersection} from '../tools/s5runtime-arsenal/attack-box-intersection.mjs';

const f=Math.fround,mask48=(1n<<48n)-1n,max64=(1n<<64n)-1n;
const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
const fail=reason=>({qualified:false,eligible:false,reason});
const allow=reason=>({qualified:true,eligible:true,reason});
const skip=reason=>({qualified:true,eligible:false,reason});
const byte=v=>Number.isInteger(v)&&v>=0&&v<=255;
const peer=v=>{
 if(typeof v!=='bigint'&&(typeof v!=='string'||! /^(0|[1-9][0-9]*)$/.test(v)))return null;
 const n=BigInt(v);return n>=0n&&n<=max64?n:null;
};
const vector=(v,label)=>{if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw TypeError(`Finite ${label} XYZ required`);return v.slice();};
const matrix=(v,label)=>{if(!Array.isArray(v)||v.length!==16||!v.every(Number.isFinite))throw TypeError(`Finite ${label} matrix required`);return new Matrix4().fromArray(v);};

// Same static Box evaluation as Azit jump profiles: 11C1990 discards a local
// center and transforms the origin. Runtime SAT is the shared native consumer.
export function compileAzitLimitedAreas(source,{scale=.006}={}){
 if(!Number.isFinite(scale)||scale<=0)throw TypeError('Positive source scale required');
 const scene=source?.scenes?.[6],names=['alpha_limited_area01','beta_limited_area02'];
 if(!scene?.source?.toLowerCase().endsWith('/azit_oct.scn')||scene.nodes?.length!==4)throw Error('Expected exact Azit15 limited-area scene');
 const worlds=[];
 for(const [i,node]of scene.nodes.entries()){
  const parent=node.parentIndex;
  if(parent!==undefined&&(!Number.isInteger(parent)||parent<0||parent>=i))throw Error('Azit parent ordinal is not already inserted');
  const base=parent===undefined?matrix(scene.root?.matrix,'source root'):worlds[parent].clone();
  worlds.push(base.multiply(matrix(node.matrix,'source local')));
 }
 const profiles=names.map((name,i)=>{
  const node=scene.nodes[i],world=worlds[i];
  if(node.name!==name||node.sourceNodeIndex!==i||node.type!=='Box'||node.serializedVectors?.length!==4)throw Error('Azit limited-area source identity changed');
  const translation=new Vector3(),rotation=new Quaternion(),dimensions=new Vector3();world.decompose(translation,rotation,dimensions);
  const axes=node.serializedVectors.slice(0,3).map(v=>new Vector3(...vector(v,'Box axis')).applyQuaternion(rotation).normalize().toArray());
  const halfExtents=vector(node.serializedVectors[3],'Box extents').map((v,j)=>v*dimensions.getComponent(j)*scale);
  if(halfExtents.some(v=>!Number.isFinite(v)||v<=0))throw Error('Invalid source limited-area extent');
  const box={center:translation.toArray().map(v=>v*scale),axes,halfExtents};
  nativeBoxIntersection(box,box);
  return {id:name,sourceSceneIndex:6,sourceNodeIndex:i,selector:i+1,mode:0,box,
   qualification:{staticSourceDerived:true,nativeRuntimeCompared:false,D3DXBitParity:false,alternateMode1Qualified:false}};
 });
 if(scene.nodes.filter(n=>n.name?.includes('limited_area')).length!==2)throw Error('Unexpected extra Azit limited-area identity');
 return freeze(profiles);
}

// This is the side/UID predicate only. Pool enumeration admission and actor
// eligibility are separate consumers. Identity kind2/4 NEVER substitutes a tag.
export function azitLimitedAreaFilter({selector,rawRuleKind,swapSceneKeys,actorPoolTeamTag,actorPeer64,specialUID}={}){
 if(![1,2,3].includes(selector)||!byte(rawRuleKind))return fail('explicit-selector-and-raw-rule-required');
 if(selector===3)return allow('selector3-bypass');
 if(rawRuleKind===8){
  const actor=peer(actorPeer64),special=peer(specialUID);
  if(actor===null||special===null)return fail('explicit-rule8-peer-and-special-uid-required');
  const equal=(actor&mask48)===special;
  return (selector===1?equal:!equal)?skip('rule8-uid-filter'):allow('rule8-uid-passes');
 }
 if(typeof swapSceneKeys!=='boolean'||!byte(actorPoolTeamTag))return fail('explicit-swap-and-actor-pool-tag-required');
 const effectiveKey=swapSceneKeys?3-selector:selector;
 return actorPoolTeamTag===effectiveKey?skip('pool-tag-filter'):allow('pool-tag-passes');
}

// B8=519390 prebranch. Target UID values are compared exactly as returned:
// only actorPeer is low48-masked, never mask opaque rule-object values for it.
export function azitLimitedB8Eligibility({rawRuleKind,actorPeer64,rule20UIDs}={}){
 if(!byte(rawRuleKind))return fail('explicit-raw-rule-required');
 if(rawRuleKind!==20)return allow('ordinary-b8-base-dispatch');
 const actor=peer(actorPeer64),uids=Array.isArray(rule20UIDs)&&rule20UIDs.length===2?rule20UIDs.map(peer):null;
 if(actor===null||!uids||uids.some(v=>v===null))return fail('explicit-rule20-peer-and-two-uids-required');
 return uids.includes(actor&mask48)?allow('rule20-uid-passes'):skip('rule20-uid-exempt');
}

// HP guard 71CC2F UCOMISS/LAHF/TEST44 is ordered equality, not HP-positive.
// The host must supply the second current GetHP read separately (71CC64).
// Negative/NaN command amounts are source-representable, not executable health
// policy: a host may explicitly refuse them without claiming native parity.
export function azitLimitedDamageCommand({property94,dispatchHP,actorPeer64,damageOwnerId,areaId,sourceSceneIndex=6,sourceNodeIndex}={}){
 if(typeof property94!=='number')return {...fail('explicit-hp-guard-read-required'),command:null};
 if(f(property94)===0)return {...skip('ordered-zero-hp'),command:null};
 const actor=peer(actorPeer64);
 if(typeof dispatchHP!=='number'||actor===null||typeof damageOwnerId!=='string'||!damageOwnerId.trim())return {...fail('explicit-current-hp-peer-and-damage-owner-required'),command:null};
 if(sourceSceneIndex!==6||!['alpha_limited_area01','beta_limited_area02'].includes(areaId)||sourceNodeIndex!==['alpha_limited_area01','beta_limited_area02'].indexOf(areaId))return {...fail('exact-source-area-identity-required'),command:null};
 const amount=f(f(dispatchHP)*f(2));
 return {...allow('source-b8-command'),command:freeze({type:'native-limited-area-damage',target:'explicit-actor-damage-owner',damageOwnerId,
  areaId,sourceSceneIndex,sourceNodeIndex,nativeSlot:0xb8,amount,attribute:0x12,sourcePeer64:actor.toString(),
  hpGuardRead:f(property94),hpDispatchRead:f(dispatchHP),ordinaryFinitePositive:Number.isFinite(f(dispatchHP))&&f(dispatchHP)>0,
  qualification:{sourceDerived:true,nativeRuntimeCompared:false,healthMutationApplied:false}})};
}

export function createAzitLimitedAreas(source,options){
 const profiles=compileAzitLimitedAreas(source,options);
 return Object.freeze({profiles,
  // Snapshot query only. A host executing commands must query each source
  // areaId in profile order and refresh its authoritative actor/HP context
  // between areas. Two overlapping areas must not execute a stale HP batch.
  query({actorBox,gates,areaId}={}){
   const notifications=[],damageCommands=[],overlaps=[];
   const result=(qualified,reason)=>({qualified,reason,overlaps,damageCommands:qualified?damageCommands:[],notifications:qualified?notifications:[],nativeReady:false});
   if(areaId!==undefined&&!profiles.some(p=>p.id===areaId))return result(false,'exact-source-area-id-required');
   if(!Number.isInteger(gates?.gameStateCode))return result(false,'explicit-game-state-required');
   if(gates.gameStateCode!==2)return result(true,'game-state');
   if(gates.areaMode!==0)return result(false,gates.areaMode===1?'alternate-mode1-unqualified':'explicit-mode0-required');
   if(!byte(gates.enumeratedPoolTag))return result(false,'explicit-enumerated-pool-tag-required');
   if(gates.enumeratedPoolTag===0)return result(true,'disabled-enumerated-pool');
   if(!actorBox)return result(false,'current-actor-obb-required');
   try{for(const p of profiles)if((areaId===undefined||p.id===areaId)&&nativeBoxIntersection(p.box,actorBox).intersects)overlaps.push(p.id);}
   catch{return result(false,'current-actor-obb-unqualified');}
   if(!overlaps.length)return result(true,'outside-source-areas');
   if(!byte(gates.rawRuleKind))return result(false,'explicit-raw-rule-required');
   // Source notifications occur BEFORE actor3C/44 and side/HP guards.
   if([2,6,17].includes(gates.rawRuleKind)){
    if(typeof gates.ruleNotificationOwnerPresent!=='boolean')return result(false,'explicit-rule-notification-owner-presence-required');
    if(gates.ruleNotificationOwnerPresent){
     const actor=peer(gates.actorPeer64);
     if(actor===null||typeof gates.ruleNotificationOwnerId!=='string'||!gates.ruleNotificationOwnerId.trim())return result(false,'explicit-rule-notification-owner-and-peer-required');
     for(const id of overlaps)notifications.push(freeze({type:'native-rule-area-notification',nativeCall:'F5DA60',rawRuleKind:gates.rawRuleKind,
      ruleOwnerId:gates.ruleNotificationOwnerId,actorPeer64:actor.toString(),areaId:id,sourceSceneIndex:6,sourceNodeIndex:profiles.find(p=>p.id===id).sourceNodeIndex}));
    }
   }
   if(typeof gates.actor3c!=='boolean')return result(false,'explicit-actor3c-required');
   if(gates.actor3c)return result(true,'actor3c');
   if(typeof gates.actor44!=='boolean')return result(false,'explicit-actor44-required');
   if(!gates.actor44)return result(true,'actor44');
   let lastReason='source-filters';
   for(const p of profiles){
    if(!overlaps.includes(p.id))continue;
    const filter=azitLimitedAreaFilter({...gates,selector:p.selector});
    if(!filter.qualified)return result(false,filter.reason);
    if(!filter.eligible){lastReason=filter.reason;continue;}
    const damage=azitLimitedDamageCommand({...gates,areaId:p.id,sourceSceneIndex:p.sourceSceneIndex,sourceNodeIndex:p.sourceNodeIndex});
    if(!damage.qualified)return result(false,damage.reason);
    if(!damage.eligible){lastReason=damage.reason;continue;}
    const dispatch=azitLimitedB8Eligibility(gates);
    if(!dispatch.qualified)return result(false,dispatch.reason);
    if(!dispatch.eligible){lastReason=dispatch.reason;continue;}
    damageCommands.push(damage.command);
   }
   return result(true,damageCommands.length?'source-overlap':lastReason);
  }
 });
}
