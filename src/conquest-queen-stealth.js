import {assertConquestQueenActor} from './conquest-queen-ai.js';
import {ConquestPawnActorAuthority} from './conquest-pawn-actor-authority.js';
const owners=new WeakMap(),actors=new WeakMap(),uint=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
// The nonnull source component is retained. This policy exposes the S5 alpha
// adaptation separately: native modelD0/CC versus Death fade is NOT qualified.
export const CONQUEST_QUEEN_INACTIVE_STEALTH_POLICY=Object.freeze({id:'s5-queen-nonnull-inactive-stealth-alpha-channel',monsterKey:1403,sourceInitialFlag8:false,sourceInitialAlphaC:1,sourceModelAlphaMappingQualified:false,stealthDeathInterferenceQualified:false,activeStealthQualified:false,nativeReady:false});
export function assertConquestQueenStealth(owner,{actor,monsterActors,actorAuthority}={}){const r=owners.get(owner);if(!r||r.actor!==actor||monsterActors!==undefined&&r.monsterActors!==monsterActors||actorAuthority!==undefined&&r.actorAuthority!==actorAuthority)throw Error('Typed actual Queen nonnull stealth owner required');r.live();return owner;}
export function createConquestQueenStealth({actor,monsterActors,actorAuthority,policy}={}){
 assertConquestQueenActor(actor);if(policy!==CONQUEST_QUEEN_INACTIVE_STEALTH_POLICY||!(monsterActors instanceof Map)||monsterActors.get(actor.id)!==actor||!(actorAuthority instanceof ConquestPawnActorAuthority)||actorAuthority.actor(actor.id)!==actor||actors.has(actor)||actor.health!==actor.maxHealth||actor.nativeField33C!==4)throw Error('Fresh actual Queen authority and exact declared inactive-stealth policy required');
 const peer=actorAuthority.identity(actor.id),model=actor.model,materials=[...new Set(model.meshes.flatMap(m=>[].concat(m.material)))];
 if(((peer[1]>>>16)&7)!==6||!materials.length||materials.some(m=>!m.isMaterial||m.opacity!==1))throw Error('Actual kind6 Queen and initially opaque model required');
 const component=Object.freeze({vtable:0x1401768,flag8:false,alphaC:1,flag30:true,alpha44:1,flag48:false,counter10:Object.freeze({updates:0,durationMs:0,elapsedMs:0,paused:false}),counter20:Object.freeze({updates:0,durationMs:0,elapsedMs:0,paused:false})});
 let disposed=false,reason=null,ticks=0,deathReads=0,api;
 const live=()=>{if(disposed||reason||actors.get(actor)!==api||monsterActors.get(actor.id)!==actor||actor.model!==model||actorAuthority.actor(actor.id)!==actor||actorAuthority.identity(actor.id).some((v,i)=>v!==peer[i]))throw Error('Current Queen stealth identity required'+(reason?': '+reason:''));assertConquestQueenActor(actor);};
 api=Object.freeze({
  isOn(){live();return component.flag8;},
  tick(deltaMs){live();if(!uint(deltaMs))throw Error('Source uint32 Queen stealth delta required');ticks++;return {qualified:true,actor,sourceBranch:'B88D50-kind6-off→B89B40-equal-alpha',sourceInactiveBranchQualified:true,modelAlphaPolicy:policy.id,sourceModelAlphaMappingQualified:false,stealthDeathInterferenceQualified:false,nativeReady:false};},
  resetForDeath(){live();deathReads++;return {accepted:true,actor,sourceBranch:'A04620-nonnull2EC→B88CC0-equal-alpha-false',sourceInactiveBranchQualified:true,sourceModelAlphaMappingQualified:false,stealthDeathInterferenceQualified:false,nativeReady:false};},
  snapshot(){live();return {actorId:actor.id,monsterKey:1403,nonnull2EC:true,component,modelAlphaD0PolicyValue:1,uninitialized3CRead:false,sourceInactiveBranchQualified:true,activeStealthQualified:false,stealthDeathInterferenceQualified:false,ticks,deathReads,policy:policy.id,nativeReady:false};},
  invalidate(value){if(typeof value!=='string'||!value.trim())throw Error('Explicit unsupported Queen stealth/alpha writer required');reason=value;},
  dispose(){if(disposed)return;disposed=true;if(actors.get(actor)===api)actors.delete(actor);},
 });actors.set(actor,api);owners.set(api,{actor,monsterActors,actorAuthority,live});live();return api;
}
