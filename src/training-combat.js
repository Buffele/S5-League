import {resolveRifleShots} from './rifle-contact.js';
import {meleeActivations,claimMeleeActivation} from './melee-activations.js';
import {resolveMapMeleeHits} from './map-melee-hits.js';
import * as THREE from 'three';
import {Controller,TUNING} from './controller.js';
import {MotionGraph} from './motion-graph.js';
import {cancelCannonade} from './cannonade-runtime.js';
import {cancelRocketLauncher} from './rocket-launcher-runtime.js';
import {CombatState,hitProfile,hitDirection,inMeleeRange} from './combat-state.js';
import {setAvatarFacing} from './view-orientation.js';
import {attackEffectCue,playAttackEffects} from './combat-effects.js';
import {WeaponTrail} from './weapon-trail.js';
import {TwinBladeTrails} from './twin-blade-trails.js';
import {IronBootsTrails} from './iron-boots-trails.js';
import {impactSoundKey,rifleImpactSoundKey} from './game-audio.js';
import {stopAttackMovement,blockedMeleeContact,contactEffect,playSurfaceImpact} from './melee-contact.js';
import {bindCombatBodyContacts,releaseCombatBodyContacts} from './actor-body-contact.js';
import {signalDeathScytheSecondImpactContact} from './death-scythe-second-impact.js';
import {demonicKnuckleCanAddCondition} from './demonic-knuckle-protection.js';
import {meleeRuntimeContact,meleeRuntimeImpactPoint,meleeRuntimeDamageContributions} from './melee-runtime.js';
import {createS4OpponentHealthUi} from './s4-opponent-health-ui.js';
import {createRangedVictimPushes} from './ranged-victim-push.js';
import {createSourceMeleeVictimPushes} from './source-melee-victim-push.js';
import {damageReactionPlayback} from './damage-reaction-playback.js';
import {COUNTER_DAMAGE_REACTION,counterDamageReactionPlayback} from './counter-damage-reaction.js';
import {stunLoopReactionPlayback} from './stun-loop-reaction.js';
import {plasmaReceivedInputPhase} from './plasma-received-input-phase.js';
import {daggerReceivedInputPhase} from './dagger-received-input-phase.js';
import {createBlowReaction,blowReactionAfterMove,requestBlowStandup,blowReactionPlayback,ordinaryBlowReactionContact} from './blow-reaction.js';
import {receivedDownDamageDirection} from './down-damage-contact.js';
import {downDamageReactionVelocity} from './down-damage-reaction.js';
function presentMeleeImpact(effects,attack,source,victim,impactPoint){
 if(!((attack.weapon==='smashrifle'&&attack.kind==='secondary')||!['fireball','smashrifle','revolver','semirifle','submachinegun'].includes(attack.weapon)))return;
 const position=impactPoint??{x:victim.position.x,y:victim.position.y+1,z:victim.position.z};
 if(impactPoint)effects.playArtImpact?.(attack,impactPoint,{source});
 const effect=contactEffect(attack);if(!effect)return;
 effects.play(effect,position,null,{facing:source.facing});
}
export class TrainingCombat{
 constructor({scene,world,enemy,player,getAvatar,getAudio,effects,texture,gameMode=null,getPreparedTrail=null}){
  this.scene=scene;this.world=world;this.avatar=enemy;this.player=player;this.getAvatar=getAvatar;this.getAudio=getAudio;this.effects=effects;
  this.gameMode=gameMode;
  this.enemy=new Controller(world,{weapon:enemy.weapon,sex:enemy.sex});this.graph=new MotionGraph();this.playerState=new CombatState();this.enemyState=new CombatState();
  enemy.prepareSwitch?.();enemy.group.visible=true;
  this.mode='retaliate';this.cooldown=1;this.alert=0;this.pause=0;this.shake=0;this.cues=new WeakSet();
  this.autoRespawn=true;this.damagePolicy=null;this.onDefeat=null;this.onRespawn=null;this.onFall=null;this.enemyInput=null;
  this.enemyHome={x:1,y:0,z:3};this.enemy.position={...this.enemyHome};this.enemy.facing=0;
  world.target.visible=false;scene.add(enemy.group);enemy.group.position.copy(this.enemy.position);
  const mesh=enemy.meshes.find(m=>m.userData.weapon&&!m.userData.source.endsWith('_l.scn'));
  const preparedTrail=getPreparedTrail?.(enemy);this.ownsTrail=preparedTrail===undefined;
  this.trail=this.ownsTrail?(mesh&&!this.enemy.rifle?(enemy.weapon==='ironboots'?new IronBootsTrails(enemy,{texture}):enemy.weapon==='twinblade'?new TwinBladeTrails(enemy,{texture}):new WeaponTrail(mesh,{weapon:enemy.weapon,texture})):null):preparedTrail;
  if(this.trail){this.trail.clear();scene.add(this.trail.mesh);}
  this.healthUi=createS4OpponentHealthUi({document});this.label=this.healthUi.element;this.label.querySelector('span').textContent='OPPONENT';
  this.bar=this.healthUi.fill;this.number=this.healthUi.number;this.projected=new THREE.Vector3();
  // Health belongs to the combat session; collision roles do not describe
  // whether a living body occupies a destructible's restoration volume.
  // Read the current property: Chaser shares playerState after construction.
  this.mapObjectPresenceReleases=[
   world.mapObjects?.bindActorPresence?.(this.player,()=>!this.playerState.dead),
   world.mapObjects?.bindActorPresence?.(this.enemy,()=>!this.enemyState.dead),
  ];
  if(!this.ownsTrail)this.pose(this.avatar,this.enemy,this.enemyState,0,this.graph);
 }
 reset(){this.leaveDownDamage(this.player,this.playerState);this.leaveDownDamage(this.enemy,this.enemyState);this.rangedPushes?.clear();this.meleePushes?.clear();this.playerState.reset();this.enemyState.reset();this.enemy.reset();this.enemy.position={...this.enemyHome};this.graph.reset();this.effects.clear();this.trail?.clear();this.cooldown=1;this.alert=0;this.pause=0;this.shake=0;this.avatar.group.visible=true;}
 setMode(mode){this.mode=mode;this.cooldown=.5;}
 cancel(controller){controller.clearPlasmaLightHandoff?.();controller.leaveAttackProtection?.();if(controller.cannonade)cancelCannonade(controller.cannonade);if(controller.rocketLauncher)cancelRocketLauncher(controller.rocketLauncher);this.effects?.clearForAvatar?.(controller===this.player?this.getAvatar?.():this.avatar);if(controller.rifle){controller.rifle.pendingShots=[];controller.rifle.phase='idle';}if(controller.counterGuardDash){controller.velocity.x=0;controller.velocity.z=0;}controller.attack=null;controller.dash=0;controller.dashMotion=null;controller.counterGuardDash=null;controller.wallAction=null;controller.plasmaDashExit=null;controller.sprinting=false;}
 receive(victim,state,avatar,source,attack){
  if(state.dead||state.invincible)return;
  const impactPoint=meleeRuntimeImpactPoint(source,victim,attack);
  let profile=hitProfile(attack);
  const contributions=meleeRuntimeDamageContributions(source,victim,attack);
  // One received profile and the normal's condition/effects per activation.
  // Derive HP from declared source contacts, never an input damage override.
  if(contributions?.criticalContacts.length)profile={...profile,damage:contributions.damage};
  if(this.damagePolicy){profile=this.damagePolicy({victim,state,source,attack,profile});if(!profile)return false;}
  // SetImmune is a condition-add gate, not invincibility. Suppress only the
  // explicit AddStun/AddBlow/AddPush condition. Keep HP and the existing
  // arena attribute reaction; its native received-record mapping is unresolved.
  if(meleeRuntimeContact(attack)?.condition&&!demonicKnuckleCanAddCondition(victim.demonicKnuckleProtection))
   profile={...profile,stun:0,blow:false,push:false,...(state.reaction?{reaction:'none'}:{})};
  if(!profile.ranged&&profile.counterable!==false&&victim.weapon==='counter'&&victim.attack?.kind==='guard'&&hitDirection(victim,source.position)===0){
   const guardPoint=impactPoint;
   if(guardPoint)this.effects.playArtImpact?.(victim.attack,guardPoint,{source:victim});
   // Front guard reflects a counterable melee contact into the attacker's stun.
   const record=this.actorRecord?.(source);
   const sourceState=record?.health??(source===this.player?this.playerState:this.enemyState),sourceAvatar=record?.avatar??(source===this.player?this.getAvatar():this.avatar);
   if(sourceState.dead)return;
   if(!demonicKnuckleCanAddCondition(source.demonicKnuckleProtection))return true;
   // Only the qualified Deathmatch reaction19 timing changes here. Admission,
   // HP and other modes retain their existing policy; Stun13 is separate.
   const counterAttackDamage=this.gameMode==='deathmatch';
   sourceState.receive({damage:0,stun:counterAttackDamage?COUNTER_DAMAGE_REACTION.totalMs/1000:2.5,hold:.3,counterAttackDamage});this.cancel(source);
   this.effects.play('stun',source.position,sourceAvatar,{follow:true,duration:2.5});this.getAudio(source.weapon,source.sex).play('stun');return true;
  }
  // Stun13 reads registry integer0 for its preceding phase: observed0 in
  // the reserved Deathmatch reference. This visual phase is independent of
  // the still-approximate total actor/condition duration and admission policy.
  if(this.gameMode==='deathmatch'&&profile.stun&&!profile.counterAttackDamage)
   profile={...profile,stunDirectLoop:true};
  const previousHp=state.hp;
  const wasDownDamage=state.blowReaction?.stateId===20;
  const downDirection=receivedDownDamageDirection({state,avatar,attack,profile,source,victim});
  if(downDirection)profile={...profile,downDamageReaction:true};
  if(!state.receive(profile,hitDirection(victim,source.position)))return;
  const downEntry=!!downDirection&&!state.dead&&state.blowReaction?.stateId===20;
  const noFullReaction=!state.dead&&profile.reaction==='none'&&!profile.stun&&!profile.blow&&(!profile.push||profile.sourceDamageDurationMs===0);
  // Leave20 runs on EVERY full accepted exit/reentry. Zero-duration and
  // no-reaction records keep the existing phase/velocity and independent Push.
  if(wasDownDamage&&!noFullReaction){victim.velocity.x=0;victim.velocity.z=0;}
  this.onDamage?.(victim,source,Math.max(0,previousHp-state.hp));

  if(noFullReaction&&profile.sourceDamageDurationMs!==0){
   // A suppressed condition does not suppress the accepted melee impact.
   // Ranged effects have their own projectile presentation path.
   if(!profile.ranged)presentMeleeImpact(this.effects,attack,source,victim,impactPoint);
   this.alert=5;return true; // keep movement, attack, pose and existing reaction clock
  }
  // A zero-duration melee contact still deals HP and presents its authored
  // impact. It must not cancel an attack or reset an existing reaction timer.
  // Push is independent of Damage18: a declared zero damage-animation duration
  // must not cancel the victim's attack merely to apply its displacement.
  let sourcePush=false;
  if(profile.push||profile.blow){this.meleePushes??=createSourceMeleeVictimPushes();sourcePush=this.meleePushes.add(attack,source,victim);}
  if(!noFullReaction){
   this.cancel(victim);victim.fireball=null;const dx=victim.position.x-source.position.x,dz=victim.position.z-source.position.z,n=Math.hypot(dx,dz)||1;
   if(profile.blow||(profile.push&&!sourcePush&&!downEntry)){const speed=profile.pushSpeed??(profile.blow?12:4);victim.velocity.x=dx/n*speed;victim.velocity.z=dz/n*speed;victim.velocity.y=profile.liftSpeed??(profile.blow?18:3);victim.grounded=false;}
  }
  if(downEntry)Object.assign(victim.velocity,downDamageReactionVelocity(downDirection,victim.velocity));
  // Local living Blow16 only. Weapon42's special170/171 paths, lethal variants,
  // other modes and unavailable reaction resources retain their prior policy.
  if(this.gameMode==='deathmatch'&&profile.blow&&!profile.stun&&!state.dead&&ordinaryBlowReactionContact(attack,meleeRuntimeContact(attack)))
   state.blowReaction=createBlowReaction(avatar);
  presentMeleeImpact(this.effects,attack,source,victim,impactPoint);
  // Reaction voices belong to the affected actor, including bot-to-bot hits.
  if(state.dead){state.effect?.clear();state.effect=this.effects.play('dead_eff',victim.position,avatar,{follow:true});this.getAudio(victim.weapon,victim.sex).play('damageStrong');this.onDefeat?.(victim,source,attack);}
  else if(profile.stun){state.effect?.clear();state.effect=this.effects.play('stun',victim.position,avatar,{follow:true,duration:profile.stun});this.getAudio(victim.weapon,victim.sex).play('stun');}
  else this.getAudio(victim.weapon,victim.sex).play(profile.blow||downEntry?'damageStrong':'damage');
  // Keep presentation hit-stop separate from gameplay clocks. SpyDaggerStab's
  // actor/Select/state/CAttack chain forwards raw delta; success is a no-op.
  // The former45ms pause created an artificial reply gap between its hits.
  // PlasmaLight's own moving-state Tick likewise forwards raw delta. Its
  // Lua hit-stop changes visual channel speed, not this gameplay clock.
  // The aerial exception and all other drivers retain their policy.
  const ordinaryDaggerStab=(attack.weapon??source.weapon)==='dagger'&&(attack.kind??attack.type)==='rush'&&!state.dead&&!profile.stun&&!profile.blow&&!profile.push;
  const ordinaryPlasmaLight=attack.weapon==='plasma'&&attack.kind==='light'&&!state.dead&&!profile.stun&&!profile.blow&&!profile.push;
  // Counter CAttackState also forwards the raw delta; authored Push is a
  // separate displacement condition, not a pause of either actor's clock.
  const ordinaryCounterLight=(attack.weapon??source.weapon)==='counter'&&(attack.kind??attack.type)==='light'&&!state.dead&&!profile.stun&&!profile.blow;
  const noGameplayPause=attack.weapon==='plasma'&&attack.kind==='air'||ordinaryDaggerStab||ordinaryPlasmaLight||ordinaryCounterLight||(sourcePush&&noFullReaction&&profile.sourceDamageDurationMs===0);
  // An exempt contact does not create hit-stop; it must not cancel a pause
  // already caused by another actor/contact earlier in the same update.
  if(!noGameplayPause)this.pause=.045;
  this.shake=profile.blow?.13:.05;this.alert=5;return true;
 }
 resolve(attacker,victim,state,avatar,events){
  for(const activation of meleeActivations(events,attacker.attack)){
   const {attack,index}=activation;
   const wasActive=attacker.attack===attack;
   if(state.dead)break;
   if(!claimMeleeActivation(attack,index,victim))continue;
   // Preserve the individual index when multiple contacts cross one tick.
   // Target transforms and reaction physics remain arena approximations.
   const contact={...attack,hits:index+1,contactIndex:index};
   if(!inMeleeRange({...attacker,attack:contact},victim)||blockedMeleeContact(attacker,victim))continue;
   if(attack.scytheSecondImpact&&!state.dead){
    signalDeathScytheSecondImpactContact(attack.scytheSecondImpact,{weaponType:42,attributeId:172,
     sourcePosition:attacker.position,targetPosition:victim.position,targetFacing:victim.facing,targetInvincible:state.invincible});
   }
   if(this.receive(victim,state,avatar,attacker,contact)){
    stopAttackMovement(attacker,attack);const sound=impactSoundKey(contact);if(sound)this.getAudio(attacker.weapon,attacker.sex).play(sound);
   }
   // Reflection can cancel the source; do not apply its remaining contacts.
   if(wasActive&&attacker.attack!==attack)break;
  }
 }
 resolveMapMeleeHits(actor,events){return resolveMapMeleeHits(this.world,actor,events);}
 leaveDownDamage(controller,state){if(state?.blowReaction?.stateId===20){controller.velocity.x=0;controller.velocity.z=0;}}
 tickReaction(state,controller,dt){const wasDownDamage=state.blowReaction?.stateId===20;state.tick(dt);if(wasDownDamage&&state.blowReaction?.stateId!==20){controller.velocity.x=0;controller.velocity.z=0;}}
 stepReaction(controller,dt,state=null){
  controller.advanceWeaponEffects?.(dt);
  // Reactions use move() directly and otherwise bypass Controller.step's F0
  // hook. Only Azit's opted-in host owns this independent launch channel.
  const sourceLaunch=this.world?.nativeMapId===15?this.world.sourceLaunchMotion?.beforeMove(controller,dt):null;
  if(sourceLaunch?.ownsVerticalMotion){
   controller.velocity.y=sourceLaunch.velocity.y;
   if(sourceLaunch.launches.length)controller.grounded=false;
   const travel=dt>0?{x:sourceLaunch.displacement.x/dt,z:sourceLaunch.displacement.z/dt}:{x:0,z:0};
   controller.move(dt,travel,0,sourceLaunch.velocity.y===0?0:sourceLaunch.displacement.y/sourceLaunch.velocity.y);
  }else{controller.velocity.y=Math.max(-TUNING.terminal,controller.velocity.y-TUNING.gravity*dt);controller.move(dt);}
  if(sourceLaunch)this.world.sourceLaunchMotion.afterMove(controller,{position:controller.position,groundContact:controller.grounded});
  if(controller.grounded){controller.velocity.x*=Math.exp(-12*dt);controller.velocity.z*=Math.exp(-12*dt);}
  if(state?.blowReaction)blowReactionAfterMove(state.blowReaction,{grounded:controller.grounded,velocity:controller.velocity});
 }
 reactionInput(state,input){
  if(!state.blowReaction)return input;
  requestBlowStandup(state.blowReaction,input);
  // An edge consumed by the committed recovery cannot also attack if its
  // timer happens to expire later in this simulation step. No buffered attack.
  return {...input,light:false,lightPressed:false,lightShort:false,lightLong:false,heavy:false,heavyHeld:false,jump:false};
 }
 receivedInputBeforeTick(input){
  // Local Damage18 receives input before its timer is advanced. Keep the
  // same committed phase for all fixed steps belonging to one render frame.
  this.plasmaReceivedPhase=plasmaReceivedInputPhase(this.plasmaReceivedPhase,{frameId:this.player._inputFrameOpen?this.player._inputFrameId:null,serial:this.playerState.serial,damageActive:this.playerState.reaction==='damage',weapon:this.player.weapon});
  this.daggerReceivedPhase=daggerReceivedInputPhase(this.daggerReceivedPhase,{frameId:this.player._inputFrameOpen?this.player._inputFrameId:null,serial:this.playerState.serial,damageActive:this.playerState.reaction==='damage',sourceDurationMs:this.playerState.damageDurationMs,weapon:this.player.weapon});
  if(this.plasmaReceivedPhase.blocked)input={...input,plasmaDamageInputBlocked:true};
  if(this.daggerReceivedPhase.blocked)input={...input,daggerDamageInputBlocked:true};
  return input;
 }
 tick(dt,input){
  input=this.reactionInput(this.playerState,input);
  let enemyRecoveryInput=null;
  if(this.enemyState.blowReaction){
   const dx=this.player.position.x-this.enemy.position.x,dz=this.player.position.z-this.enemy.position.z,distance=Math.hypot(dx,dz),facing=Math.atan2(dx,dz);
   const swing=(this.mode==='attack'||this.mode==='retaliate'&&this.alert>0)&&distance<2.5&&this.cooldown<=0&&!this.playerState.dead;
   const intent=this.enemyInput?.({dt,dx,dz,distance,facing,swing,move:false,recovering:true})??{facing,lightPressed:swing,heavy:this.mode==='guard'};
   enemyRecoveryInput=this.reactionInput(this.enemyState,intent);
  }
  // Input belongs to the committed reaction before its timer advances.
  input=this.receivedInputBeforeTick(input);
  bindCombatBodyContacts([{actor:this.player,health:this.playerState},{actor:this.enemy,health:this.enemyState}]);
  // Local S5 fixed-step time; matches own this clock when modeState exists.
  if(!this.modeState)this.world.advanceMapObjects?.(dt);
  this.effects.update(dt,{deferAvatarEmissions:this.pause<=0});this.shake=Math.max(0,this.shake-dt);this.tickReaction(this.playerState,this.player,dt);this.tickReaction(this.enemyState,this.enemy,dt);
  if(this.autoRespawn&&this.playerState.dead&&this.playerState.age>4){this.player.reset();this.playerState.effect?.clear();this.playerState.reset();this.onRespawn?.(this.player);}
  if(this.autoRespawn&&this.enemyState.dead&&this.enemyState.age>4){this.enemy.reset();this.enemy.position={...this.enemyHome};this.enemyState.effect?.clear();this.enemyState.reset();this.graph.reset();this.alert=0;this.onRespawn?.(this.enemy);}
  if(this.pause>0){this.player.advanceWeaponEffects?.(dt);this.enemy.advanceWeaponEffects?.(dt);this.pause=Math.max(0,this.pause-dt);this.advanceRangedPushes(dt);if(this.enemyState.reaction==='damage'||this.enemyState.blowReaction)this.pose(this.avatar,this.enemy,this.enemyState,0,this.graph);return [];}
  let events=[];
  if(this.playerState.locked)this.stepReaction(this.player,dt,this.playerState);else events=this.player.step(dt,input);
  if(events.includes('respawn'))this.onFall?.(this.player);
  playSurfaceImpact(this.player,events,this.effects,this.getAudio(this.player.weapon,this.player.sex));
  this.resolveMapMeleeHits(this.player,events);
  this.resolve(this.player,this.enemy,this.enemyState,this.avatar,events);
  if(this.player.airgun&&(events.includes('shot')||events.includes('shotMax'))&&!this.enemyState.dead){
    // Test-arena approximation, not a port of the native cone/knockback solver.
    const dx=this.enemy.position.x-this.player.position.x,dz=this.enemy.position.z-this.player.position.z;
    const distance=Math.hypot(dx,dz),max=events.includes('shotMax');
    const dot=dx*Math.sin(this.player.facing)+dz*Math.cos(this.player.facing);
    if(distance<=(max?7.8:6)&&dot>distance*Math.cos(35*Math.PI/180)&&Math.abs(this.enemy.position.y-this.player.position.y)<1.8&&!blockedMeleeContact(this.player,this.enemy)){
      this.receive(this.enemy,this.enemyState,this.avatar,this.player,{weapon:'airgun',kind:max?'shotMax':'shot'});
      this.getAudio(this.player.weapon,this.player.sex).play('impact');
    }
  }
  this.cooldown-=dt;this.alert=Math.max(0,this.alert-dt);
  const dx=this.player.position.x-this.enemy.position.x,dz=this.player.position.z-this.enemy.position.z,distance=Math.hypot(dx,dz);
  const wantsAttack=this.mode==='attack'||this.mode==='retaliate'&&this.alert>0;
  let enemyEvents=[];
  if(this.enemyState.locked)this.stepReaction(this.enemy,dt,this.enemyState);
  else{
   const ranged=!!this.enemy.rifle;
   // S5 training AI holds automatic weapons through preparation and firing.
   // Their own runtimes retain cadence, dispersion, debit and reload behavior.
   const sustainedRanged=['heavymachinegun','assaultrifle','semirifle','submachinegun','smashrifle'].includes(this.enemy.weapon)&&['begin','fire'].includes(this.enemy.rifle?.phase);
   const swing=wantsAttack&&distance<(ranged?20:2.5)&&(this.cooldown<=0||sustainedRanged)&&this.enemy.rifle?.phase!=='reload'&&!this.playerState.dead;
   const facing=Math.atan2(dx,dz),move=!ranged&&wantsAttack&&distance>2.1&&distance<14&&!this.playerState.dead;
   const enemyInput=enemyRecoveryInput??this.enemyInput?.({dt,dx,dz,distance,facing,swing,move})??{facing,x:move?dx/distance:0,z:move?dz/distance:0,light:swing,lightPressed:swing,lightShort:swing,heavy:!ranged&&this.mode==='guard',heavyHeld:!ranged&&this.mode==='guard',
    ...(ranged?{aimTarget:{x:this.player.position.x,y:this.player.position.y+1.35,z:this.player.position.z},aimPitch:Math.atan2(this.player.position.y-this.enemy.position.y,Math.max(.001,distance)),reload:this.enemy.rifle.ammo===0}:{})};
   enemyEvents=this.enemy.step(dt,enemyInput);
   if(enemyEvents.includes('respawn'))this.onFall?.(this.enemy);
   if(swing&&!sustainedRanged)this.cooldown=1.6;
  }
   this.getAudio(this.enemy.weapon,this.enemy.sex).events(enemyEvents,this.enemy.attack,this.enemy);
  playSurfaceImpact(this.enemy,enemyEvents,this.effects,this.getAudio(this.enemy.weapon,this.enemy.sex));
  this.graph.events(enemyEvents);this.resolveMapMeleeHits(this.enemy,enemyEvents);this.resolve(this.enemy,this.player,this.playerState,this.getAvatar(),enemyEvents);
  this.advanceRangedPushes(dt);
  this.pose(this.avatar,this.enemy,this.enemyState,dt,this.graph);
  // Snapshot this enemy's sockets only after its pose. The player pose is
  // evaluated by main.animateAvatar after this tick, so its socket effects
  // are dispatched there rather than reading the previous player's frame.
  this.cue(this.enemy,this.avatar);
  this.trail?.update(dt,this.enemy.attack);
  this.bar.style.transform=`scaleX(${this.enemyState.hp/(this.enemyState.maxHp||100)})`;this.number.textContent=`${this.enemyState.hp} / ${this.enemyState.maxHp||100}`;
  return events;
 }
 resolveRifleShots(avatar){
  resolveRifleShots(this.player,avatar,this.enemy,contact=>{
   if(contact.hit&&!this.enemyState.dead){this.receiveRifleContact(this.enemy,this.enemyState,this.avatar,this.player,contact);this.pause=0;const sound=rifleImpactSoundKey(contact);if(sound)this.getAudio(this.player.weapon,this.player.sex).play(sound);}
   else if(contact.wall)this.getAudio(this.player.weapon,this.player.sex).play('wallHit');
  });
  if(this.enemy.rifle)resolveRifleShots(this.enemy,this.avatar,this.player,contact=>{
   if(contact.hit&&!this.playerState.dead){this.receiveRifleContact(this.player,this.playerState,avatar,this.enemy,contact);this.pause=0;const sound=rifleImpactSoundKey(contact);if(sound)this.getAudio(this.enemy.weapon,this.enemy.sex).play(sound);}
   else if(contact.wall)this.getAudio(this.enemy.weapon,this.enemy.sex).play('wallHit');
  });
 }
 receiveRifleContact(victim,state,avatar,source,contact){
  const accepted=this.receive(victim,state,avatar,source,{weapon:contact.weapon??source.weapon,kind:'shot',damage:contact.damage});
  if(accepted&&demonicKnuckleCanAddCondition(victim.demonicKnuckleProtection)){
   this.rangedPushes??=createRangedVictimPushes();this.rangedPushes.add(contact,victim);
  }
  return accepted;
 }
 advanceRangedPushes(dt){this.rangedPushes?.advance(dt);this.meleePushes?.advance(dt);}
 cue(controller,avatar){playAttackEffects(this.effects,controller.attack,controller.position,avatar,controller.facing,{collision:controller.collision});}
 pose(avatar,controller,state,dt,graph){
  avatar.group.position.copy(controller.position);setAvatarFacing(avatar.group,controller.facing);
  const a=state.animation();
  const damagePlayback=damageReactionPlayback(avatar,state,a)??counterDamageReactionPlayback(avatar,state,a)??stunLoopReactionPlayback(avatar,state,a)??blowReactionPlayback(avatar,state,a);
  if(a){const key=a.key+'/'+a.clip;avatar.play(a.clip,{loop:a.loop,fade:damagePlayback?.fade??.04,speed:damagePlayback?.speed??a.speed,restart:avatar.combatKey!==key});avatar.combatKey=key;}
  else{avatar.combatKey=null;avatar.motion(graph.sample(controller,dt));}
  avatar.update(dt,damagePlayback?{full:damagePlayback.time}:undefined);
  this.effects.sampleAvatar?.(avatar,{emitPending:true});
 }
 render(camera,visible){
  this.effects.render(camera);
  this.trail?.render?.();
  if(visible){this.projected.copy(this.avatar.group.position);this.projected.y+=2.4;this.projected.project(camera);}
  const p=this.projected,inView=p.z>=-1&&p.z<=1&&Math.abs(p.x)<=1&&Math.abs(p.y)<=1;
  this.healthUi.update({hp:this.enemyState.hp,maxHp:this.enemyState.maxHp||100,name:this.label.querySelector('span').textContent,
   relation:this.healthPlateRelation?.()??'enemy',visible:visible&&inView,dead:this.enemyState.dead,
   x:visible?(p.x*.5+.5)*innerWidth:NaN,y:visible?(-p.y*.5+.5)*innerHeight:NaN});
 }
 dispose(){releaseCombatBodyContacts([{actor:this.player},{actor:this.enemy}]);for(const release of this.mapObjectPresenceReleases??[])release?.();this.mapObjectPresenceReleases=[];this.world.mapObjects?.releaseActor?.(this.enemy);this.rangedPushes?.clear();this.meleePushes?.clear();this.cancel(this.enemy);this.avatar.group.removeFromParent();this.healthUi.dispose();if(this.ownsTrail)this.trail?.dispose?.();else{this.trail?.clear();this.trail?.mesh.removeFromParent();}}
}
