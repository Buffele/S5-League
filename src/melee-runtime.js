import {counterAttackContacts,COUNTER_ABILITY} from './counter-sword-data.js';
import {getSpyDaggerAttackProfile,SPY_DAGGER_ITEM} from './spy-dagger-data.js';
import {breakerAttackContacts,BREAKER_ABILITY} from './breaker-combat-data.js';
import {katanaAttackContacts,KATANA_ABILITY} from './katana-combat-data.js';
import {getTwinBladeContacts,TWIN_BLADE_ABILITY} from './twin-blade-data.js';
import {plasmaAttackContacts,PLASMA_ABILITY} from './plasma-combat-data.js';
import {batAttackContacts,BAT_ABILITY} from './bat-data.js';
import {sigmaBladeAttackContacts,SIGMA_BLADE_ABILITY} from './sigma-blade-data.js';
import {getIronBootsAttackProfile,IRON_BOOTS_ABILITY} from './iron-boots-data.js';
import {assassinClawAttackContacts,ASSASSIN_CLAW_ABILITY} from './assassin-claw-data.js';
import {vitalShockAttackContacts,VITAL_SHOCK_ABILITY} from './vital-shock-data.js';
import {deathScytheAttackContacts,DEATH_SCYTHE_ABILITY} from './death-scythe-data.js';
import {demonicKnuckleAttackContacts,DEMONIC_KNUCKLE_ABILITY} from './demonic-knuckle-data.js';
import {smashSecondaryContacts,smashSecondaryContactCandidates,SMASH_SECONDARY_ABILITY} from './smash-secondary.js';
import {meleeShapeContact,meleeShapeImpactPoint,selectMeleeContact} from './native-melee.js';

// Explicit arena policy, not the native equipment/critical/defence pipeline.
export const MELEE_ARENA_POLICY=Object.freeze({channel:'melee',critical:'normal-only',additionalPower:0,targetWidth:1.2,targetHeight:1.8});
const adapters={smashrifle:{contacts:smashSecondaryContacts,preset:SMASH_SECONDARY_ABILITY},counter:{contacts:counterAttackContacts,preset:COUNTER_ABILITY},plasma:{contacts:plasmaAttackContacts,preset:PLASMA_ABILITY},
 demonicknuckle:{contacts:demonicKnuckleAttackContacts,preset:DEMONIC_KNUCKLE_ABILITY},
 deathscythe:{contacts:deathScytheAttackContacts,preset:DEATH_SCYTHE_ABILITY},
 vitalshock:{contacts:vitalShockAttackContacts,preset:VITAL_SHOCK_ABILITY},
 sigmablade:{contacts:sigmaBladeAttackContacts,preset:SIGMA_BLADE_ABILITY},
 ironboots:{contacts:(kind,comboIndex,options)=>getIronBootsAttackProfile(kind,{...options,comboIndex}).contacts,preset:IRON_BOOTS_ABILITY},
 bat:{contacts:batAttackContacts,preset:BAT_ABILITY},assassinclaw:{contacts:assassinClawAttackContacts,preset:ASSASSIN_CLAW_ABILITY},
 breaker:{contacts:breakerAttackContacts,preset:BREAKER_ABILITY},katana:{contacts:katanaAttackContacts,preset:KATANA_ABILITY},
 twinblade:{contacts:(kind,comboIndex,options)=>getTwinBladeContacts(kind,{...options,comboIndex}),preset:TWIN_BLADE_ABILITY}};
function spyDaggerRuntimeContacts(kind){
 const profile=getSpyDaggerAttackProfile(kind),[durationMs,moving,byPart]=profile.reaction.damageData;
 // The dagger adapter stores these attributes on its profile, not each hit.
 // Preserve the same authored200ms for Cut and all three independent Stab hits.
 return profile.contacts.map(contact=>({...contact,counterable:profile.reaction.counterAttack,
  reaction:{sourceDamageData:[durationMs,moving?'DAMAGEMOVING_ENABLE':'DAMAGEMOVING_DISABLE',byPart?'DAMAGEBYPART_ENABLE':'DAMAGEBYPART_DISABLE']},
  source:{path:'script/attack/weapon_spydagger_attack.lua',function:profile.source}}));
}
// Source declarations before the arena's damage selection. AlwaysCritical
// flags and DependOn links are distinct; this API does not arbitrate them.
export function meleeRuntimeDeclaredContacts(attack){
 const weapon=attack?.weapon??'dagger',kind=attack?.kind??attack?.type;
 if(adapters[weapon])return adapters[weapon].contacts(kind,attack.comboIndex??0,{
  fullCharge:!!attack.fullCharge,transformed:!!attack.transformed,
  criticalPolicy:'include-declared',includeDeclaredCritical:true,
 }).map((contact,sourceContactIndex)=>({...contact,weapon,sourceContactIndex}));
 if(weapon==='dagger'&&['light','air','rush'].includes(kind))
  return spyDaggerRuntimeContacts(kind).map((contact,sourceContactIndex)=>({...contact,weapon,sourceContactIndex}));
 return [];
}
// Comparison-only declarations: no activation claim or damage arbitration.
// Callers must select the native collision branch explicitly.
export function meleeRuntimeContactCandidates(attacker,victim,attack=attacker.attack,{rayCollisionMode}={}){
 if(attack?.weapon!=='smashrifle'||!['secondary','heavy'].includes(attack.kind??attack.type))return null;
 return smashSecondaryContactCandidates(
  {position:attacker.position,facing:attack.facing??attacker.facing},victim,
  {width:MELEE_ARENA_POLICY.targetWidth,height:MELEE_ARENA_POLICY.targetHeight,rayCollisionMode});
}
export function meleeRuntimeContact(attack,index=attack?.contactIndex??Math.max(0,(attack?.hits??1)-1)){
 const weapon=attack?.weapon??'dagger',kind=attack?.kind??attack?.type;
 if(adapters[weapon]){
  const adapter=adapters[weapon];
  // Bat's late spin states author only AlwaysCritical contacts. Keep those
  // volumes and their flag; native flag/damage interaction is still unresolved.
  // No critical multiplier is supplied by these Lua states.
  const authoredCritical=weapon==='bat'&&['spin4','spin5'].includes(kind);
  const contacts=meleeRuntimeDeclaredContacts(attack);
  if(authoredCritical){
   const contact=contacts[index];
   return contact?{...contact,weapon,index,critical:true,criticalCandidates:[],preset:adapter.preset,
    policy:{...MELEE_ARENA_POLICY,critical:'authored-flag',nativeCriticalDamageVerified:false}}:null;
  }
  const normal=selectMeleeContact(contacts.filter(c=>!c.alwaysCritical)[index],null,{policy:MELEE_ARENA_POLICY.critical})[0];
  if(!normal)return null;
  return {...normal,weapon,index,damage:normal.damage,critical:false,
   criticalCandidates:contacts.filter(c=>c.dependsOn===normal.id),
   declaredCriticalContacts:contacts.filter(c=>c.alwaysCritical&&(c.timeMs??c.atMs)===(normal.timeMs??normal.atMs)),
   nativeCriticalArbitrationVerified:false,preset:adapter.preset,policy:MELEE_ARENA_POLICY};
 }
 if(weapon==='dagger'&&['light','air','rush'].includes(kind)){
  const contact=spyDaggerRuntimeContacts(kind)[index];
  return contact?{...contact,weapon,index,damage:contact.baseDamage,critical:false,preset:SPY_DAGGER_ITEM,policy:MELEE_ARENA_POLICY}:null;
 }
 return null;
}
// This single Iron Boots contact declares Blow BEFORE Push. The final alias
// `condition` is not an arbitration rule: Damage18 is processed before the
// explicit conditions; Blow's input47 resolves through the current state, and
// Push's Enter requests no state. Keep this scope explicit until other mixed
// paths have their own source proof. See iron-boots-mixed-condition-20261025.
export function meleeRuntimeIronBootsBlowPush(attack,contact=meleeRuntimeContact(attack)){
 if(attack?.weapon!=='ironboots'||(attack.kind??attack.type)!=='light'||(attack.comboIndex??0)!==0||contact?.id!=='Attack3'||contact.attribute!=='ATTACKATTRIB_IRON_BOOTS_OBJECT_BLAST')return null;
 const sequence=contact.sourceConditions;
 if(sequence?.length!==2||sequence[0].type!=='blow'||sequence[1].type!=='push'||contact.condition?.type!=='push')return null;
 return {sequence,blow:sequence[0],push:sequence[1]};
}

// Scoped damage policy supported by the centered/lateral Counter and Bat
// observations. It is not a universal native critical/DependOn arbitration.
// Keep the normal activation/reaction; an eligible critical contributes HP only.
export function meleeRuntimeDamageContributions(attacker,victim,attack=attacker.attack){
 const weapon=attack?.weapon,kind=attack?.kind??attack?.type,combo=attack?.comboIndex??0;
 if(kind!=='light'||combo!==0||!['counter','bat'].includes(weapon))return null;
 const index=attack.contactIndex??Math.max(0,(attack.hits??1)-1);
 if(!Number.isInteger(index)||index<0||(weapon==='counter'?index>1:index!==0))return null;
 const normal=meleeRuntimeContact(attack,index);
 const expectedNormal=weapon==='counter'&&index===1?'Attack3':'Attack2';
 if(!normal||normal.id!==expectedNormal||normal.alwaysCritical)return null;
 const actor={position:attacker.position,facing:attack.facing??attacker.facing};
 const dimensions={width:MELEE_ARENA_POLICY.targetWidth,height:MELEE_ARENA_POLICY.targetHeight};
 const intersects=contact=>meleeShapeContact(contact.shape,actor,victim,dimensions).intersects;
 const normalIntersects=intersects(normal);
 // Counter declares DependOn; Bat declares an independent same-time box.
 // Requiring the normal hit for Bat is this scoped damage policy, not a
 // fabricated source dependency or a claim about native record priority.
 const candidates=weapon==='bat'?normal.declaredCriticalContacts:normal.criticalCandidates;
 const criticalContacts=normalIntersects?candidates.filter(contact=>
  contact.alwaysCritical===true&&contact.id==='Attack1'&&
  (weapon==='counter'?contact.dependsOn===normal.id:contact.dependsOn==null)&&
  (contact.timeMs??contact.atMs)===(normal.timeMs??normal.atMs)&&intersects(contact)):[];
 return {normal,normalIntersects,criticalContacts,
  damage:normal.damage+criticalContacts.reduce((sum,contact)=>sum+contact.damage,0),
  policy:'counter-light1-bat-light-conditional-critical',nativeCriticalArbitrationVerified:false};
}
export function meleeRuntimeRange(attacker,victim,attack=attacker.attack){
 const contact=meleeRuntimeContact(attack);
 if(['box','fan','cylinder'].includes(contact?.shape.type))return meleeShapeContact(contact.shape,
  {position:attacker.position,facing:attack.facing??attacker.facing},victim,
  {width:MELEE_ARENA_POLICY.targetWidth,height:MELEE_ARENA_POLICY.targetHeight}).intersects;
 // Other families retain their explicit, existing training range policy.
 return null;
}


export function meleeRuntimeImpactPoint(attacker,victim,attack=attacker.attack){
 const contact=meleeRuntimeContact(attack);
 if(!['box','fan','cylinder'].includes(contact?.shape.type))return null;
 return meleeShapeImpactPoint(contact.shape,{position:attacker.position,facing:attack.facing??attacker.facing},victim,
  {width:MELEE_ARENA_POLICY.targetWidth,height:MELEE_ARENA_POLICY.targetHeight});
}
