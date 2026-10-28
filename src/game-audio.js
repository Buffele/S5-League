import {weaponStateCue} from './weapon-cues.js';
import {meleeRuntimeContact} from './melee-runtime.js';
import {meleeActivations} from './melee-activations.js';
import {ironBootsSoundCues} from './iron-boots-effects.js';
import {sigmaBladeSoundCues} from './sigma-blade-effects.js';
import {VITAL_SHOCK_SOURCE_EVENTS} from './vital-shock-data.js';
import {DEATH_SCYTHE_SOUND_FILES,deathScytheSoundCues} from './death-scythe-effects.js';
import {DEMONIC_KNUCKLE_SOUND_FILES,demonicKnuckleSoundCues} from './demonic-knuckle-effects.js';
import {HMG_FIRING_SOUND} from './heavy-machine-gun-audio.js';
import {playDodgeSound} from './dodge-sound.js';
import {twinBladeSoundCues} from './twin-blade-effects.js';
import {batSoundCues} from './bat-effects.js';
import {breakerSoundCues} from './breaker-effects.js';
const AUDIO_CACHE=new WeakMap();
const PRELOADED_AUDIO=new Map();let preloadDecoder=null;
function preloadAudioFile(file){
 if(PRELOADED_AUDIO.has(file))return PRELOADED_AUDIO.get(file);
 const promise=(async()=>{const url=file.startsWith('/')?file:`/assets/s5runtime/sound/${file}.ogg`,response=await fetch(url);if(!response.ok)throw Error('Audio unavailable: '+file);const bytes=await response.arrayBuffer();
  // An offline decoder has no output device and needs no autoplay unlock.
  if(typeof globalThis.OfflineAudioContext==='function'){preloadDecoder??=new globalThis.OfflineAudioContext(1,1,44100);return{buffer:await preloadDecoder.decodeAudioData(bytes.slice(0)),bytes:null};}
  return{buffer:null,bytes};})();
 PRELOADED_AUDIO.set(file,promise);promise.catch(()=>{if(PRELOADED_AUDIO.get(file)===promise)PRELOADED_AUDIO.delete(file);});return promise;
}
const IMPORTED_RIFLE_AUDIO=Object.freeze({...Object.fromEntries([
 ['handgun','handgun',['handgun_blast','revo_reload','smg_dry_fire','player_attack','wall_attack']],
 ['assaultrifle','assault-rifle',['assultrifle_shot','assultrifle_reload','smg_dry_fire','assultrifle_hit','wall_attack']],
 ['burstshotgun','burst-shotgun',['burstshotgun_blast','burstshotgun_reload','smg_dry_fire','burstshotgun_hit','burstshotgun_wall_hit','revo_blast']],
].map(([weapon,folder,files])=>[weapon,Object.fromEntries(files.map((file,i)=>[['shot','reloadStart','empty','impact','wallHit','shotSecondary'][i],`/assets/s5runtime/${folder}/sounds/${file}.ogg`]))])),
 heavymachinegun:{firingLoop:HMG_FIRING_SOUND,reloadStart:'/assets/s5runtime/heavy-machine-gun/sounds/hmg_reload.ogg',empty:'/assets/s5runtime/heavy-machine-gun/sounds/smg_dry_fire.ogg',impactLow:'/assets/s5runtime/heavy-machine-gun/sounds/player_attack.ogg',wallHit:'/assets/s5runtime/heavy-machine-gun/sounds/wall_attack.ogg'},
});
export function rifleImpactSoundKey(contact){
 // HMG MIDDLE/UPPER use hmg_hit.ogg, still absent from the current archive.
 // Do not substitute the LOWER sound or the AI-only firing-start sample.
 return contact.weapon==='heavymachinegun'?(contact.sourcePart==='LOWER'?'impactLow':null):'impact';
}

function cachedAudio(context,file){
  let cache=AUDIO_CACHE.get(context);if(!cache){cache=new Map();AUDIO_CACHE.set(context,cache);}
  if(!cache.has(file)){
   const pending=(async()=>{
    if(PRELOADED_AUDIO.has(file)){const prepared=await PRELOADED_AUDIO.get(file);return prepared.buffer??context.decodeAudioData(prepared.bytes.slice(0));}
    const url=file.startsWith('/')?file:`/assets/s5runtime/sound/${file}.ogg`;
    const response=await fetch(url);if(!response.ok)throw Error(`Son introuvable : ${file}`);
    return context.decodeAudioData(await response.arrayBuffer());
   })();
   cache.set(file,pending);pending.catch(()=>{if(cache.get(file)===pending)cache.delete(file);});
  }
  return cache.get(file);
}
const FILES={light:'spydagger_cut',rush:'spydagger_poke',lightHit:'spydagger_cut_hit',rushHit:'spydagger_poke_hit',jump:'jump_up',dash:'dodge',airdash:'dash',land:'land_ground',walllaunch:'dash',wallfail:'warning',sprint:'voice_man_fastrun'};
export function movementSounds(sex='male'){return {...FILES,sprint:sex==='female'?'voice_girl_fastrun':'voice_man_fastrun'};}
// Movement locking is independent of attack intent (counter light/air
// attacks also use the controller's "rush" movement branch).
export function attackSoundKey(attack){
  const kind=typeof attack==='string'?attack:attack?.kind??attack?.type;
  if(kind==='guard'||kind==='charge'||kind==='backdash'||!kind)return null;
  if(['demonicknuckle','ironboots','sigmablade','vitalshock','deathscythe'].includes(attack?.weapon))return null; // Authored state sounds have their own clock.
  if(attack?.weapon==='twinblade')return ['heavy','air','gather'].includes(kind)?null:kind==='light'&&attack.comboIndex===1?'light2':'light';
  if(attack?.weapon==='bat')return ['heavy','spin2','spin3','spin4','spin5'].includes(kind)?null:'light';
  if(attack?.weapon==='breaker')return kind==='heavy'?null:kind==='air'?'air':'light';
  if(attack?.weapon==='katana')return kind==='air'?'air':kind==='heavy'||kind==='strong'?'rush':'light';
  if(weaponStateCue(attack)?.sound)return null;
  return kind==='heavy'||kind==='strong'||kind==='strongFollow'||kind==='rush'?'rush':'light';
}
export function impactSoundKey(attack,{surface=false}={}){
  const kind=typeof attack==='string'?attack:attack?.kind??attack?.type;
  if(!kind||kind==='guard'||kind==='charge')return null;
  const native=typeof attack==='object'&&meleeRuntimeContact(attack);
  // SetPlaySound(false) belongs to the individual native contact. It mutes
  // target and surface impact audio, independently of actor-state sounds.
  if(native?.playSound===false)return null;
  if(attack?.weapon==='katana'&&surface)return native?.effects?.nativeObjectSound?'wallHit':null;
  if(surface&&native?.effects&&Object.hasOwn(native.effects,'damageObjectSound'))return native.effects.damageObjectSound;
  if(attack?.weapon==='demonicknuckle')return native?.effects?.nativeDamageSound?.split('/').at(-1).replace(/\.ogg$/i,'')??null;
  if(attack?.weapon==='sigmablade')return native?.effects?.nativeDamageSound?.split('/').at(-1).replace(/\.ogg$/i,'')??null;
  if(native?.effects)return native.effects.damageSound??null;
  // Plasma jump has no SetDamageSequence; stun audio belongs to the victim.
  if(kind==='air'&&attack.weapon==='plasma')return null;
  // Unknown Twin contacts do not inherit a generic hit sound.
  if(attack?.weapon==='twinblade')return null;
  if(kind==='air'&&attack.weapon)return 'airHit';
  return ['heavy','strong','strongFollow','rush'].includes(kind)?'rushHit':'lightHit';
}
export function audioEvents(events,attack){
  const activations=meleeActivations(events,attack);let activationIndex=0;
  return events.flatMap(event=>{
    // Controller "hit" is attack-volume activation, even in empty space.
    // Confirmed contacts are resolved separately and alone play *Hit sounds.
    if(event==='hit'){
      const activation=activations[activationIndex++],current=activation?.attack??attack;
      if(current?.weapon==='katana')return [];
      if(['deathscythe','ironboots','demonicknuckle'].includes(current?.weapon)){
        // The actor-state sounds are separate from the attribute's
        // SetAttackSequence, which belongs to each activated attack volume.
        const contact=meleeRuntimeContact(current,activation?.index);
        const sound=contact?.effects?.nativeAttackSound;
        return contact?.playSound!==false&&['sound/sword_s.ogg','sound/bsword_s.ogg'].includes(sound)?[sound.split('/').at(-1).replace(/\.ogg$/i,'')]:[];
      }
      // SpyDaggerStab explicitly silences contacts 0/2, including their
      // attack-sequence sound. Only its middle activation plays the poke.
      // Keep individual indices when several volumes cross the same tick.
      if(current&&typeof current==='object'&&(current.weapon??'dagger')==='dagger'&&
        (current.kind??current.type)==='rush'&&meleeRuntimeContact(current,activation?.index)?.playSound===false)return [];
      const key=attackSoundKey(current);return key?[key]:[];
    }
    return FILES[event]?[event]:[];
  });
}
// actorstates_katana_a_sword.lua: playback events are independent of contact.
export function katanaSoundCues(attack){
 if(attack?.weapon!=='katana')return [];
 return attack.kind==='light'?[
  [{at:.2,key:'light'},{at:.7,key:'finish'}],
  [{at:.3,key:'light'},{at:.7,key:'light'},{at:1.6,key:'finish'}],
  [{at:.35,key:'light'},{at:1,key:'finish'}],
 ][attack.comboIndex??0]:attack.kind==='strong'?[{at:.001,key:'rush'},{at:.8,key:'finish'}]:attack.kind==='air'?[{at:.001,key:'air'}]:attack.kind==='heavy'?[{at:.001,key:'slash'},{at:1.1,key:'finish'}]:[];
}
// AddSoundBySex in the base actorstates_* scripts, associated by clip.
const ATTACK_VOICES={HM001:[2,2],HM004:[1,1],HM016:[3,1],KT000:[1,1],KT001:[5,5],KT002:[3,3],KT009:[3,3],KT006_1:[1,3],SG000:[5,5],SG002:[1,1],SG012:[3,3],SG014:[1,1],B0000:[3,3],A0000:[1,2],A0018:[3,1],R0000:[5,5],R0001:[2,2],
  R0002:[1,1],R0003:[6,4],R0029:[3,3],R0030:[4,3],DD022:[1,2],BB001:[1,2],A0015:[3,1]};
export function attackVoiceKey(weapon,sex,attack){
  if(!attack)return null;
  if(weapon==='demonicknuckle'||weapon==='vitalshock'||weapon==='deathscythe'||weapon==='sigmablade')return null; // Source AddSoundBySex is emitted on its own clock.
  if(weapon==='ironboots'){
    if(attack.kind==='boost')return 'sprint';
    const pair={IB001:[5,5],IB002:[4,3],IB005:[3,3],IB019:[4,3],ES001:[2,2],DC002:[1,1]}[attack.profile?.clip];
    return pair?`voice${pair[sex==='female'?1:0]}`:null;
  }
  const cue=weapon==='dagger'?(attack.type==='rush'?[3,3]:[2,2]):ATTACK_VOICES[attack.profile?.clip];
  return cue?`voice${cue[sex==='female'?1:0]}`:null;
}
export class GameAudio {
  constructor(weapon='dagger',sex='male'){this.weapon=weapon;this.sex=sex;this.context=null;this.buffers=new Map();this.missingFiles=new Set();this.sources=new Set();this.sourceKeys=new WeakMap();this.volume=.35;this.loading=null;this.stateCues=new WeakSet();this.katanaCues=new WeakMap();this.followingStateSounds=new Map();
    // attackattribindexer.lua: SetAttackSequence vs SetDamageSequence.
    this.files={stun:"stun",damage:`voice_${sex==='female'?'girl':'man'}_damage_1`,damageStrong:`voice_${sex==='female'?'girl':'man'}_damage_3`,...Object.fromEntries([1,2,3,4,5,6].map(i=>[`voice${i}`,`voice_${sex==='female'?'girl':'man'}_attack_${i}`])),...movementSounds(sex),...(weapon==='plasma'?{light:'sword_s',rush:'sword_s',stance:'sword_stance',power:'sword_power',lightHit:'sword_attack',rushHit:'sword_attack',airHit:'sword_power'}:weapon==='counter'?{light:'bsword_s',rush:'bsword_s',counterAttack:'bsword_counter',lightHit:'bsword_attack',rushHit:'bsword_attack',airHit:'bsword_power'}:weapon==='breaker'?{light:'breaker_smash',rush:'breaker_big_smash',air:'breaker_jump',lightHit:'breaker_hit',rushHit:'breaker_hit',airHit:'breaker_hit'}:weapon==='katana'?{katanaChargeStart:'katana_charge',light:'katana_cut',rush:'katana_cut_power',air:'katana_cut_air',lightHit:'spydagger_cut_hit',rushHit:'spydagger_cut_hit',airHit:'spydagger_cut_hit'}:weapon==='twinblade'?{light:'twin-blade/twinsword_cut_2',light2:'twin-blade/twinsword_cut_3',rush:'twin-blade/twinsword_wide',air:'twin-blade/twinsword_jump',chargeStart:'twin-blade/twinsword_charge',chargeMax:'twin-blade/twinsword_charge_full'}:weapon==='airgun'?{chargeStart:'airgun_charge_ing',chargeMax:'airgun_charge_complete',shot:'airgun_shot',shotMax:'airgun_blast',impact:'airgun_hit',reloadStart:'airgun_reload',empty:'airgun_charge_done'}:weapon==='rocketlauncher'?{chargeStart:'rocket-launcher/rocket_charge',chargeMax:'rocket-launcher/airgun_charge_complete',secondaryLoad:'rocket-launcher/rocket_reload_normal',shot:'rocket-launcher/rocket_launch',reloadStart:'rocket-launcher/rocket_load',impact:'rocket-launcher/rocket_bomb'}:weapon==='cannonade'?{chargeStart:'cannonade/brail_charge',chargeMax:'cannonade/brail_charge_complete',shot:'cannonade/brail_attack',shotMax:'cannonade/brail_attack',reloadStart:'cannonade/brail_reload',impact:'cannonade/brail_blast',impactMax:'cannonade/brail_blast_max'}:weapon==='submachinegun'?{shot:'submachine-gun/smg_blast',reloadStart:'submachine-gun/smg_reload',empty:'submachine-gun/smg_dry_fire',impact:'submachine-gun/player_attack',wallHit:'submachine-gun/wall_attack'}:weapon==='semirifle'?{shot:'semi-rifle/smg2_blast',reloadStart:'semi-rifle/smg2_reload',empty:'semi-rifle/smg_dry_fire',lightHit:'semi-rifle/player_attack',impact:'semi-rifle/player_attack',wallHit:'semi-rifle/wall_attack'}:weapon==='smashrifle'?{shot:'smash-rifle/smg3_blast',reloadStart:'smash-rifle/smg3_reload',impact:'smash-rifle/smg3_hit',wallHit:'smash-rifle/smg3_wall_hit',empty:'smash-rifle/smg_dry_fire',light:'sword_s',smashSecondaryHit:'sword_attack'}:weapon==='revolver'?{shot:'/assets/s5runtime/weapons/revolver/sounds/revo_blast.ogg',reloadStart:'/assets/s5runtime/weapons/revolver/sounds/revo_reload.ogg',impact:'revolver/player_attack',wallHit:'revolver/wall_attack'}:{}),...(IMPORTED_RIFLE_AUDIO[weapon]??{})};}
  async unlockContext(){
    this.context??=new AudioContext();
    this.gain??=this.context.createGain();this.gain.gain.value=this.volume;
    if(!this.connected){this.gain.connect(this.context.destination);this.connected=true;}
    await this.context.resume();
    return this.context;
  }
  prepareFiles(){
    if(this.filesPrepared)return;this.filesPrepared=true;
    if(this.weapon==='heavymachinegun')this.missingFiles.add('sound/hmg_hit.ogg');
    if(this.weapon==='demonicknuckle')Object.assign(this.files,DEMONIC_KNUCKLE_SOUND_FILES,{bsword_s:'bsword_s'});
    if(this.weapon==='sigmablade')for(const name of ['sword_power','sigmablade_hit_wall_change','sigmablade_hit_slash','sigmablade_hit','sigmablade_cut_power','sigmablade_cut_finish','sigmablade_cut_air','sigmablade_cut','bsword_attack'])this.files[name]=`/assets/s5runtime/sigma-blade/sounds/${name}.ogg`;
    if(this.weapon==='ironboots'){this.files.sword_s='sword_s';Object.assign(this.files,Object.fromEntries(Object.entries({bsword_counter:'bsword_counter',deathside_jump:'deathside_jump',ironFirstHit:'smg3_hit',ironSecondHit:'player_attack',ironHit:'sword_attack',ironFirstWall:'smg3_wall_hit',ironSecondWall:'wall_attack'}).map(([key,file])=>[key,`/assets/s5runtime/iron-boots/sounds/${file}.ogg`])));}
    if(this.weapon==='bat')Object.assign(this.files,{light:'/assets/s5runtime/bat/sounds/bat_swing.ogg',rush:'/assets/s5runtime/bat/sounds/bat_swing.ogg',air:'/assets/s5runtime/bat/sounds/sword_power.ogg',batHit:'/assets/s5runtime/bat/sounds/bat_hit.ogg',batHitAir:'/assets/s5runtime/bat/sounds/bat_hit1.ogg'});
    if(this.weapon==='breaker')this.files.breakerAirPower='sword_power';
    if(this.weapon==='twinblade')this.files.twinHit='/assets/s5runtime/spark-rifle-source/sounds/spark_hit.ogg';
    if(this.weapon==='deathscythe')Object.assign(this.files,DEATH_SCYTHE_SOUND_FILES,{lightHit:DEATH_SCYTHE_SOUND_FILES.sword_attack});
    if(this.weapon==='vitalshock')for(const name of ['shockwave_hit','shockwave_blast','voice_man_attack_3','voice_girl_attack_3'])this.files[name]=`/assets/s5runtime/vital-shock/sounds/${name}.ogg`;
    if(this.weapon==='assassinclaw')Object.assign(this.files,{light:'/assets/s5runtime/assassin-claw/sounds/bmindenergy_enemy.ogg',lightHit:'/assets/s5runtime/assassin-claw/sounds/sword_attack.ogg'});
    if(this.weapon==='twinblade')for(const key of ['light','light2','rush','air','chargeStart','chargeMax'])this.files[key]='/assets/s5runtime/twin-blade/sounds/'+this.files[key].split('/').at(-1)+'.ogg';
    if(this.weapon==='katana')Object.assign(this.files,{slash:'katana_cut_slash',finish:'katana_cut_finish',fullChargeHit:'katana_hit_slash',wallHit:'burstshotgun_wall_hit'});
  }
  async preload(){
    this.prepareFiles();let ready=0;
    await Promise.all([...new Set(Object.values(this.files))].map(async file=>{try{await preloadAudioFile(file);this.missingFiles.delete(file);ready++;}catch{this.missingFiles.add(file);}}));
    return{ready,missing:[...this.missingFiles]};
  }
  async unlock(){
    this.prepareFiles();
    await this.unlockContext();
    if(this.loading)return this.loading;
    const loading=Promise.all(Object.entries(this.files).filter(([key])=>!this.buffers.has(key)).map(async([key,file])=>{
      try{this.buffers.set(key,await cachedAudio(this.context,file));this.missingFiles.delete(file);}
      catch{this.missingFiles.add(file);}
    })).finally(()=>{if(this.loading===loading)this.loading=null;});
    this.loading=loading;return loading;
  }
  setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.gain)this.gain.gain.value=this.volume;}
  playBurstBlast(descriptor){
    const key=descriptor?.index===0?'shot':descriptor?.index===1?'shotSecondary':null;
    if(this.weapon!=='burstshotgun'||!key||descriptor.file!==this.files[key])throw new TypeError('Authenticated Burst blast binding required');
    this.play(key);
  }
  play(key,{actor=this}={}){
    if(!this.buffers.has(key)||this.context?.state!=='running'||!this.volume)return;
    const dodge=key==='dash'||key==='airdash';
    if(!dodge&&this.sources.size>=12)return;
    const source=this.context.createBufferSource();source.buffer=this.buffers.get(key);this.sources.add(source);this.sourceKeys.set(source,key);
    if(dodge){
      playDodgeSound({actor,context:this.context,source,output:this.gain,isActive:()=>this.sources.has(source),onEnded:()=>this.sources.delete(source)});
      return;
    }
    source.connect(this.gain);
    source.onended=()=>{this.sources.delete(source);source.disconnect();};source.start();return source;
  }
  syncHeavyMachineGunActors(records){
    if(this.weapon!=='heavymachinegun')return;
    this.hmgLoops??=new Map();const active=new Map();
    for(const {actor,disabled} of records){
      if(disabled||actor.weapon!=='heavymachinegun'||actor.sex!==this.sex||actor.rifle?.phase!=='fire')continue;
      active.set(actor,{rifle:actor.rifle,serial:actor.rifle.serial,resetSerial:actor.resetSerial});
    }
    for(const [actor,entry]of this.hmgLoops){
      const current=active.get(actor);
      if(current&&current.rifle===entry.rifle&&current.serial===entry.serial&&current.resetSerial===entry.resetSerial)continue;
      this.hmgLoops.delete(actor);entry.source.stop();this.sources.delete(entry.source);
    }
    if(this.context?.state!=='running'||!this.buffers.has('firingLoop'))return;
    for(const [actor,identity]of active){
      if(this.hmgLoops.has(actor)||this.sources.size>=12)continue;
      const source=this.context.createBufferSource();source.buffer=this.buffers.get('firingLoop');source.loop=true;source.connect(this.gain);
      const entry={...identity,source};this.hmgLoops.set(actor,entry);this.sources.add(source);this.sourceKeys.set(source,'firingLoop');
      source.onended=()=>{if(this.hmgLoops.get(actor)===entry)this.hmgLoops.delete(actor);this.sources.delete(source);source.disconnect();};source.start();
    }
  }
  events(events,attack,actor=this){
    const stateTimeMs=attack?.timeMs??attack?.time*1000;
    const previous=this.followingStateSounds.get(actor);
    if(previous&&(previous.attack!==attack||Number.isFinite(previous.stopAfterMs)&&(attack.timeMs??attack.time*1000)>previous.stopAfterMs)){
      if(this.sources.has(previous.source)){previous.source.stop();this.sources.delete(previous.source);}
      this.followingStateSounds.delete(actor);
    }
    const authored=attack?.weapon==='twinblade'?twinBladeSoundCues(attack):attack?.weapon==='bat'?batSoundCues(attack):attack?.weapon==='breaker'?breakerSoundCues(attack):[];
    if(authored.length){
      let seen=this.katanaCues.get(attack);if(!seen){seen=new Set();this.katanaCues.set(attack,seen);}
      authored.forEach((cue,index)=>{if((attack.timeMs??attack.time*1000)>cue.timeMs&&!seen.has(index)){seen.add(index);this.play(cue.key,{actor});}});
    }
    if(attack?.weapon==='demonicknuckle'){
      let seen=this.katanaCues.get(attack);if(!seen){seen=new Set();this.katanaCues.set(attack,seen);}
      demonicKnuckleSoundCues(attack,{sex:this.sex}).forEach((cue,index)=>{if(stateTimeMs>cue.at*1000&&!seen.has(index)){seen.add(index);this.play(cue.name,{actor});}});
    }
    if(attack?.weapon==='deathscythe'){
      let seen=this.katanaCues.get(attack);if(!seen){seen=new Set();this.katanaCues.set(attack,seen);}
      deathScytheSoundCues(attack,{sex:this.sex}).forEach(cue=>{if(stateTimeMs>cue.at*1000&&!seen.has(cue.sourceIndex)){seen.add(cue.sourceIndex);this.play(cue.name,{actor});}});
    }
    if(attack?.weapon==='vitalshock'){
      let seen=this.katanaCues.get(attack);if(!seen){seen=new Set();this.katanaCues.set(attack,seen);}
      (VITAL_SHOCK_SOURCE_EVENTS[attack.kind]??[]).forEach((cue,index)=>{if(stateTimeMs>cue.timeMs&&!seen.has(index)){seen.add(index);const sound=cue.sound??(this.sex==='female'?cue.female:cue.male);if(sound)this.play(sound,{actor});}});
    }
    if(attack?.weapon==='sigmablade'){
      let seen=this.katanaCues.get(attack);if(!seen){seen=new Set();this.katanaCues.set(attack,seen);}
      sigmaBladeSoundCues(attack,{sex:this.sex}).forEach(cue=>{
        // Native event clock crosses only when current > scheduled (562640).
        if((attack.timeMs??attack.time*1000)>cue.timeMs&&!seen.has(cue.sourceIndex)){
          seen.add(cue.sourceIndex);this.play(cue.key);
        }
      });
    }
    if(attack?.weapon==='ironboots'){
      let seen=this.katanaCues.get(attack);if(!seen){seen=new Set();this.katanaCues.set(attack,seen);}
      ironBootsSoundCues(attack).forEach((cue,index)=>{if(stateTimeMs>cue.at*1000&&!seen.has(index)){seen.add(index);this.play(cue.name,{actor});}});
    }
    for(const event of events)if(event==='fireballInhale'||event==='fireballLaunch')this.specialSound(event==='fireballInhale'?'charge':'launch');
    for(const key of audioEvents(events,attack))this.play(key,{actor});
    // Twin's current catalogue charge sound fields are empty. Do not infer
    // a charge event from available file names or the brief preparation state.
    if(this.weapon==='smashrifle'||this.weapon==='airgun'||this.weapon==='cannonade'||this.weapon==='rocketlauncher'||this.weapon==='semirifle'||this.weapon==='submachinegun'||this.weapon==='revolver'||Object.hasOwn(IMPORTED_RIFLE_AUDIO,this.weapon))for(const event of events)if(this.files[event]&&!(this.weapon==='burstshotgun'&&event==='shot'))this.play(event);
    if(events.includes('attack')){const voice=attackVoiceKey(this.weapon,this.sex,attack);if(voice)this.play(voice);}
    if(attack?.weapon==='katana'){
      let seen=this.katanaCues.get(attack);if(!seen){seen=new Set();this.katanaCues.set(attack,seen);}
      katanaSoundCues(attack).forEach((cue,index)=>{if(attack.time>=cue.at&&!seen.has(index)){seen.add(index);this.play(cue.key);}});
    }
    const cue=weaponStateCue(attack);
    if(cue?.sound&&attack.time>=cue.at&&!this.stateCues.has(attack)){
      this.stateCues.add(attack);
      if(!(Number.isFinite(cue.stopAfterMs)&&(attack.timeMs??attack.time*1000)>cue.stopAfterMs)){
        const source=this.play(cue.sound,{actor});
        if(source&&cue.cancelOnExit){
          this.followingStateSounds.set(actor,{attack,source,stopAfterMs:cue.stopAfterMs});
          const ended=source.onended;
          source.onended=()=>{ended?.();if(this.followingStateSounds.get(actor)?.source===source)this.followingStateSounds.delete(actor);};
        }
      }
    }
  }
  stop({preserveDodge=false,preserveOneShots=false,localActor=null}={}){
    for(const [actor,entry]of [...this.followingStateSounds])if(!localActor||actor===localActor){
      if(this.sources.has(entry.source)){entry.source.stop();this.sources.delete(entry.source);}
      this.followingStateSounds.delete(actor);
    }
    // A weapon bank may also be borrowed by opponents. Switching the local
    // weapon must not stop their independent continuous firing handles.
    const preserved=new Set();
    for(const [actor,entry]of this.hmgLoops??[]){if(localActor&&actor!==localActor)preserved.add(entry.source);else this.hmgLoops.delete(actor);}
    for(const source of this.sources){
      if(preserved.has(source))continue;
      // Switching equipment does not own the lifetime of a sound which
      // has already started. Continuous firing still belongs to its action.
      if(preserveOneShots&&!source.loop)continue;
      if(preserveDodge&&['dash','airdash'].includes(this.sourceKeys.get(source)))continue;
      source.stop();this.sources.delete(source);
    }
  }
  // Synthesized specifically for the original fireball ability. Uses the
  // game's existing audio context, mute control and source cleanup.
  specialSound(kind){
    const context=this.context;if(context?.state!=='running'||!this.volume||this.sources.size>=12)return;
    const duration=kind==='charge'?.5:kind==='launch'?.24:.45,now=context.currentTime;
    const envelope=context.createGain(),filter=context.createBiquadFilter();filter.type='lowpass';
    filter.frequency.setValueAtTime(kind==='charge'?350:1800,now);filter.frequency.exponentialRampToValueAtTime(kind==='charge'?1600:100,now+duration);
    envelope.gain.setValueAtTime(.001,now);envelope.gain.linearRampToValueAtTime(kind==='impact'?.65:.28,now+.03);envelope.gain.exponentialRampToValueAtTime(.001,now+duration);
    const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){const t=i/context.sampleRate;data[i]=(Math.random()*2-1)*.7+Math.sin(2*Math.PI*(kind==='charge'?100+t*160:70)*t)*.3;}
    const source=context.createBufferSource();source.buffer=buffer;source.connect(filter);filter.connect(envelope);envelope.connect(this.gain);this.sources.add(source);
    source.onended=()=>{this.sources.delete(source);source.disconnect();filter.disconnect();envelope.disconnect();};source.start();
  }
}
