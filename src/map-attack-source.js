import {MAP_ATTACK_ATTRIBUTE_DATA,MAP_RANGED_PROFILE_DATA} from './map-attack-source-data.js';
for(const value of Object.values(MAP_ATTACK_ATTRIBUTE_DATA))Object.freeze(value);
for(const value of Object.values(MAP_RANGED_PROFILE_DATA))Object.freeze(value);
export const MAP_ATTACK_ATTRIBUTES=Object.freeze(MAP_ATTACK_ATTRIBUTE_DATA);
export const MAP_RANGED_SOURCE_PROFILES=Object.freeze(MAP_RANGED_PROFILE_DATA);
export const mapAttackAttribute=attribute=>Object.hasOwn(MAP_ATTACK_ATTRIBUTES,attribute)?MAP_ATTACK_ATTRIBUTES[attribute]:null;
export function captureMapAttackSource({weaponKey=null,attribute,rawPower,attackId=null,enableBlast=true,ownerKind='normal-character',sourceFunction=null}={}){
 const profile=mapAttackAttribute(attribute);if(profile?.enableBlast===false)enableBlast=false;
 const qualified=Number.isInteger(profile?.damageEnum)&&profile.damageEnum>=0&&profile.damageEnum<=11&&Number.isFinite(rawPower)&&rawPower>=0&&typeof enableBlast==='boolean'&&['normal-character','native-ai-kind4'].includes(ownerKind);
 return Object.freeze({qualified,weaponKey,attribute:attribute??null,rawPower:qualified?Math.fround(rawPower):null,damageEnum:profile?.damageEnum??null,attackId:attackId===null?null:structuredClone(attackId),enableBlast,ownerKind,sourceFunction,
  reason:qualified?null:!profile?'unverified-source-attribute':'unverified-source-power-or-owner',equipmentOverridesApplied:false});
}
export function captureRifleMapAttackSource(weaponKey,state,shot={}){
 const profile=MAP_RANGED_SOURCE_PROFILES[weaponKey];
 if(!profile)return captureMapAttackSource({weaponKey,attribute:shot.attribute,rawPower:shot.rawPower,attackId:shot.serial??state.shotSerial});
 return captureMapAttackSource({weaponKey,attribute:profile.attribute,rawPower:Math.fround((shot.power??profile.basePower)*profile.powerFactor+(shot.additionalPower??0)),
  attackId:`${weaponKey}:${shot.serial??state.shotSerial??0}`,sourceFunction:profile.sourceFunction,enableBlast:shot.enableBlast??true});
}
const committed=new WeakMap();
// The receiver owns generation validation. This ledger prevents repeated S5
// delivery of the same job/pellet/instance, not distinct authored projectiles.
export function commitMapWeaponHits(world,job,hits,context,{contactIndex=0}={}){
 if(!world?.mapObjects?.commit||!world.mapWeaponQuery)return [];
 if(!job||typeof job!=='object')throw TypeError('Stable weapon job required');
 let ledger=committed.get(job);if(!ledger){ledger=new Set();committed.set(job,ledger);}
 return hits.map(hit=>{
  if(!hit?.token?.instanceKey)return {accepted:false,reason:'no-destructible-contact'};
  if(!context?.qualified)return {accepted:false,reason:context?.reason??'unverified-source-attack'};
  if(context.damageEnum===1||context.enableBlast===false)return {accepted:false,reason:context.damageEnum===1?'native-impossible':'source-disabled-S5-conservative'};
  const key=JSON.stringify([contactIndex,hit.token.instanceKey]);
  if(ledger.has(key))return {accepted:false,reason:'duplicate-weapon-contact'};
  ledger.add(key);return world.mapObjects.commit(hit,context);
 });
}
