import {breakerContact,BREAKER_TRAINING_PROFILE} from './breaker-contact.js';
import {FIREBALL} from './fireball.js';
import {meleeRuntimeContact,meleeRuntimeRange,meleeRuntimeIronBootsBlowPush} from './melee-runtime.js';
import {nativeBlowComponents} from './native-melee-blow.js';
import {COUNTER_DAMAGE_REACTION} from './counter-damage-reaction.js';
import {advanceBlowReaction,blowReactionAnimation} from './blow-reaction.js';
import {beginDownDamageReaction,DOWN_DAMAGE_REACTION_POLICY} from './down-damage-reaction.js';
const sourceDamageRecoveryWeapons=new Set(['plasma','counter','dagger','breaker','katana','twinblade','bat','ironboots','assassinclaw','sigmablade','vitalshock','deathscythe','demonicknuckle']);
// Training damage is normalized to 100 HP. S5Runtime reaction clips and status
// durations are separate from equipment-dependent damage/critical formulas.
export function hitProfile(attack){
 const weapon=attack?.weapon||'dagger',kind=attack?.kind||attack?.type;
 const nativeContact=attack&&meleeRuntimeContact(attack);
 if(nativeContact){
  const blowPush=meleeRuntimeIronBootsBlowPush(attack,nativeContact);
  const reaction=blowPush?'blow':nativeContact.condition?.type;
  const blowParameters=blowPush?.blow.arguments??nativeContact.condition?.arguments;
  const blowComponents=reaction==='blow'&&blowParameters?.length===2?
   nativeBlowComponents(blowParameters):null;
  // Damage18 reads AttackAttrib+28 independent of the incoming weapon and
  // expires strictly after that duration. Explicit Blow/Stun/Pull conditions
  // have separate consumers; do not treat the last-declared one as a native
  // priority or replace their lifetimes with this ordinary-damage parameter.
  const conditions=[...(nativeContact.conditions??[]),...(nativeContact.sourceConditions??[]),nativeContact.condition].filter(Boolean);
  const ordinary=conditions.every(condition=>condition.type==='push');
  const sourceRecoveryMs=nativeContact.reaction?.sourceDamageData?.[0];
  const authored=sourceDamageRecoveryWeapons.has(weapon)&&Number.isInteger(sourceRecoveryMs)&&sourceRecoveryMs>=0&&sourceRecoveryMs<=0xffffffff;
  // Receiver529269 skips full Damage18 entry for duration0. Keep other
  // conditions and their gates separate; this is not a partial-animation port.
  const zeroDamageReaction=authored&&sourceRecoveryMs===0&&ordinary;
  const hold=authored&&ordinary&&sourceRecoveryMs>0?sourceRecoveryMs/1000:
   zeroDamageReaction?0:reaction==='blow'?.65:.25;
  return {damage:nativeContact.damage,blow:reaction==='blow',push:reaction==='push'||!!blowPush,hold,counterable:nativeContact.counterable??true,
   ...(authored&&ordinary?{sourceDamageDurationMs:sourceRecoveryMs}:{}),
   ...(zeroDamageReaction?{reaction:'none'}:{}),
   ...(reaction==='stun'?{stun:nativeContact.condition.arguments[1]/1000}:{}),
   ...(blowComponents??{})};
 }
 if(weapon==='fireball')return {damage:FIREBALL.damage,ranged:true,push:true,hold:.35,pushSpeed:6,liftSpeed:2};
 // Cannonade's AddPushCondition is a displacement condition, not generic Blow.
 // Its projectile resolver applies that condition separately after accepted HP.
 if(weapon==='cannonade')return {damage:attack.damage,reaction:'none',ranged:true};
 if(weapon==='rocketlauncher')return {damage:attack.damage,reaction:'none',ranged:true};
 if(weapon==='revolver')return {damage:attack.damage??7.5,reaction:'none',ranged:true};
 if(weapon==='handgun')return {damage:attack.damage??8.25,reaction:'none',ranged:true};
 if(weapon==='assaultrifle')return {damage:attack.damage??6.5,reaction:'none',ranged:true};
 if(weapon==='burstshotgun')return {damage:attack.damage??6.4375,reaction:'none',ranged:true};
 if(weapon==='heavymachinegun')return {damage:attack.damage??6,reaction:'none',ranged:true};
 if(weapon==='semirifle')return {damage:attack.damage??5.3,reaction:'none',ranged:true};
 if(weapon==='submachinegun')return {damage:attack.damage??7,reaction:'none',ranged:true};
 if(weapon==='smashrifle')return {damage:6,reaction:'none',ranged:true};
 // weapon_airgun.lua declares symmetric Blow(2500,2500) / (3000,3000).
 // CBlowCondition::Enter overwrites Y with that vertical source parameter.
 if(weapon==='airgun')return {damage:15,blow:true,hold:.65,...nativeBlowComponents(kind==='shotMax'?[3000,3000]:[2500,2500])};
 if(weapon==='katana'){
  // _eu_weapon.x7 item 2000018: power 10. StandardKatana_A_Sword*
  // applies per-attack fractions in CHANNEL_MELEE; extra power and native
  // reaction physics have not yet been decoded for this training arena.
  if(kind==='charge'||kind==='backdash')return {damage:0,hold:0};
  const fraction=kind==='heavy'?(attack.hits===1?.7:1.2):kind==='strong'?1.7:kind==='air'?.35:[.7,.45,.7][attack.comboIndex??0]??.7;
  return {damage:10*fraction,blow:kind==='heavy'||kind==='strong'||attack.comboIndex===2,hold:kind==='heavy'||kind==='strong'?.65:.25};
 }
 if(weapon==='breaker'){
  // Explicit XBN 24-power melee preset; equipment/live precedence unverified.
  if(kind==='charge')return {damage:0,hold:0};
  return {damage:BREAKER_TRAINING_PROFILE.power*(kind==='heavy'?.85:1),
    blow:kind==='light'||kind==='strong',push:kind==='air',hold:kind==='air'?.25:.65};
 }
 if(weapon==='plasma'&&kind==='air')return {damage:25,stun:2.5,hold:.3};
 if(['strong','strongFollow'].includes(kind)||(weapon==='counter'&&(kind==='heavy'||attack?.comboIndex===3)))return {damage:30,blow:true,hold:.65};
 return {damage:kind==='rush'||kind==='heavy'?20:12,push:weapon==='counter',hold:.25};
}
export function hitDirection(victim,source){
 const dx=source.x-victim.position.x,dz=source.z-victim.position.z,s=Math.sin(victim.facing),c=Math.cos(victim.facing);
 const forward=dx*s+dz*c,right=-dx*c+dz*s;
 return Math.abs(forward)>=Math.abs(right)?(forward>=0?0:1):(right>=0?3:2);
}
export function inMeleeRange(attacker,victim,range=2.6){
 const native=attacker.attack&&meleeRuntimeRange(attacker,victim);if(native!==null&&native!==undefined)return native;
 if(attacker.attack?.weapon==='breaker')return breakerContact(attacker,victim);
 const dx=victim.position.x-attacker.position.x,dz=victim.position.z-attacker.position.z;
 return Math.hypot(dx,dz)<=range&&Math.abs(victim.position.y-attacker.position.y)<2&&dx*Math.sin(attacker.facing)+dz*Math.cos(attacker.facing)>-.15;
}
export class CombatState{
 constructor(){this.reset();}
 reset(){this.hp=100;this.reaction=null;this.blowReaction=null;this.age=0;this.hold=0;this.damageDurationMs=null;this.damageElapsedMs=0;this.stun=0;this.stunDirectLoop=false;this.counterAttackDamage=false;this.counterDamageElapsedMs=0;this.counterDamageLoopAge=null;this.blow=false;this.dead=false;this.invincible=false;this.direction=0;this.serial=(this.serial||0)+1;}
 receive(profile,direction=0){
  // Native actor getter980ca0/CanReceive980c00 read SetInvincibility's bool.
  // It defaults false at construction and is independent of guarding.
  if(this.dead||this.invincible)return false;
  this.hp=Math.max(0,this.hp-profile.damage);this.dead=this.hp===0;
  // State19 has neither INPUT_COUNTERATTACK_DAMAGE50 nor INPUT_STUN46.
  // An admitted ordinary Stun condition may update the actor property, but
  // cannot re-enter19 or reset its copied timer/phase (80A230,655320).
  // HP still applies above, and a lethal contact takes the death route.
  if(!this.dead&&this.counterAttackDamage&&this.reaction==='stun'&&profile.stun>0)return true;
  // Ordinary bullets do not flinch, interrupt or refresh an existing stun.
  // Lethal damage still enters the death state.
    if(!this.dead&&profile.reaction==='none'&&!profile.stun&&!profile.blow&&(!profile.push||profile.sourceDamageDurationMs===0))return true;
  if(!this.dead&&profile.downDamageReaction===true&&!profile.stun&&!profile.blow){
   const next=beginDownDamageReaction(this.blowReaction);
   if(next){this.blowReaction=next;this.age=0;this.hold=DOWN_DAMAGE_REACTION_POLICY.durationMs/1000;this.direction=direction;this.serial++;return true;}
  }
  this.blowReaction=null;this.age=0;this.hold=profile.hold||.25;
  this.stun=profile.stun||0;this.stunDirectLoop=profile.stunDirectLoop===true&&this.stun>0&&!this.dead&&!profile.counterAttackDamage;this.counterAttackDamage=!!profile.counterAttackDamage&&this.stun>0&&!this.dead;this.counterDamageElapsedMs=0;this.counterDamageLoopAge=null;this.blow=!!profile.blow;this.direction=direction;this.serial++;
  this.reaction=this.dead?'death':this.stun?'stun':this.blow?'blow':'damage';
  const sourceMs=profile.sourceDamageDurationMs;
  this.damageDurationMs=this.reaction==='damage'&&Number.isInteger(sourceMs)&&sourceMs>0&&sourceMs<=0xffffffff?sourceMs:null;
  this.damageElapsedMs=0;return true;
 }
 get locked(){return !!this.reaction;}
 tick(dt){
  if(!this.reaction)return;this.age+=dt;
  if(this.blowReaction&&!this.dead){
   if(advanceBlowReaction(this.blowReaction,dt)){this.blowReaction=null;this.blow=false;this.reaction=null;}
   return;
  }
  if(this.reaction==='damage'&&this.damageDurationMs!==null){
   // Damage18 timer60B430..60B495 adds unsigned engine milliseconds and
   // remains active at equality. Keep pose age independent of expiry so
   // decimal seconds cannot release a200ms reaction on its twentieth10ms tick.
   // Arena dt uses the same integer-ms bridge as Counter19/Down20; native
   // actor virtual3C/F4 admission is a separate, still unqualified policy.
   this.damageElapsedMs=(this.damageElapsedMs+Math.round(dt*1000))>>>0;
   if(this.damageElapsedMs>this.damageDurationMs)this.reaction=null;
   return;
  }
  if(this.counterAttackDamage){
   // Native5617F0 consumes integer engine milliseconds. Decimal QA steps
   // must not cross700/3000ms early through accumulated floating seconds.
   const dtMs=Math.round(dt*1000);
   this.counterDamageElapsedMs=(this.counterDamageElapsedMs+dtMs)>>>0;
   if(this.counterDamageLoopAge!==null)this.counterDamageLoopAge+=dtMs/1000;
   else if(this.counterDamageElapsedMs>COUNTER_DAMAGE_REACTION.precedingMs)this.counterDamageLoopAge=0;
  }
  const expired=this.counterAttackDamage?this.counterDamageElapsedMs>Math.round(this.stun*1000):this.age>Math.max(this.hold,this.stun||0,this.blow?1.2:0);
  if(!this.dead&&expired)this.reaction=null;
 }
 animation(){
  if(!this.reaction)return null;
  if(this.dead)return {clip:this.blow?'00024':'00030',speed:this.blow?1.5:1.3,loop:false,key:this.serial};
  if(this.blowReaction)return blowReactionAnimation(this.blowReaction,this.serial);
  if(this.stun&&this.counterAttackDamage)return {clip:this.counterDamageLoopAge===null?'00006':'00007',speed:1,loop:this.counterDamageLoopAge!==null,key:this.serial};
  if(this.stun)return {clip:this.stunDirectLoop||this.age>=.18?'00007':'00006',speed:1,loop:this.stunDirectLoop||this.age>=.18,key:this.serial};
  if(this.blow)return {clip:this.age<.3?'00027':this.age<.7?'00026':'00024',speed:1,loop:this.age>=.3&&this.age<.7,key:this.serial};
  return {clip:['00016','00017','00018','00019'][this.direction],speed:1,loop:false,key:this.serial};
 }
}
