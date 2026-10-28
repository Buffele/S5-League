import {readAsset} from './scene-assets.js';
import {loadEffectRuntime} from './combat-effects.js';
import {resolveRifleShots} from './rifle-contact.js';
import {createBulletTracers} from './bullet-tracers.js';
import {BURST_SHOTGUN_SOURCE as source} from './burst-shotgun-data.js';
import {burstShotgunBlastSounds} from './burst-shotgun-audio.js';
export const BURST_BLAST_ARENA_CONTEXT=Object.freeze({effectsEnabled:true,soundsEnabled:true,positionedSound:true,frequency:'one-per-arena-volley',nativeCallerContextVerified:false,nativeReady:false});
export function dispatchBurstShotgunBlastBindings(shot,avatar,{effectsEnabled,soundsEnabled,positionedSound}={}, {playEffect,playSound=()=>{}}={}){
 if(![effectsEnabled,soundsEnabled,positionedSound].every(v=>typeof v==='boolean'))throw new TypeError('Explicit common Burst blast gates required');
 const sounds=burstShotgunBlastSounds({soundsEnabled,positionedSound}),report={effects:[],sounds:[],errors:[],nativeReady:false};
 for(const binding of source.blastBindings){
  // Native consumer reads sound before sequence creation within each record.
  if(soundsEnabled){const descriptor=sounds[binding.index];try{playSound(descriptor,shot.position,shot);report.sounds.push(binding.index);}catch(error){report.errors.push({index:binding.index,kind:'sound',message:error.message});}}
  if(effectsEnabled){try{
   const socket=[...avatar.bones].find(([name])=>name.endsWith(binding.attachNode))?.[1];if(!socket)throw Error('Burst missing binding socket '+binding.attachNode);
   playEffect(binding.effect,shot.position,{group:avatar.group,bones:new Map([...avatar.bones,[binding.attachNode,socket]])},{rootBone:binding.attachNode,follow:false,facing:shot.facing});report.effects.push(binding.index);
  }catch(error){report.errors.push({index:binding.index,kind:'effect',message:error.message});}}
 }
 return report;
}
export function createBurstShotgunEffectsRuntime(runtime,{tracers,onSound=()=>{},resolveShots=resolveRifleShots}={}){
 let current=null,previousWeapon=null,previousResetSerial=null,played=new WeakSet(),lastBlastDispatchReport=null;
 const clear=()=>{runtime.clear();tracers.clear();played=new WeakSet();lastBlastDispatchReport=null;};
 return {...runtime,get lastBlastDispatchReport(){return lastBlastDispatchReport;},dispatchBlast(shot,avatar,context=BURST_BLAST_ARENA_CONTEXT){if(played.has(shot))return null;played.add(shot);lastBlastDispatchReport=dispatchBurstShotgunBlastBindings(shot,avatar,context,{playEffect:runtime.play.bind(runtime),playSound:onSound});return lastBlastDispatchReport;},
  update(dt,c,avatar,disabled=false){
   if(current!==avatar||previousWeapon!==c.weapon||previousResetSerial!==c.resetSerial){clear();current=avatar;previousWeapon=c.weapon;previousResetSerial=c.resetSerial;}
   tracers.update(dt);
   if(c.weapon==='burstshotgun'&&c.rifle){resolveShots(c,avatar);const shots=c.rifle.pendingShots.filter(s=>s.contact);c.rifle.pendingShots=c.rifle.pendingShots.filter(s=>!s.contact);
    for(const shot of shots){this.dispatchBlast(shot,avatar,{...BURST_BLAST_ARENA_CONTEXT,effectsEnabled:!disabled});if(!disabled)for(const contact of shot.contacts||[shot.contact]){tracers.emit(shot.origin,contact.point);if(contact.hit||contact.wall)runtime.play(contact.hit?'hit':'wallHit',contact.point,null,{facing:shot.facing});}}
   }
   runtime.update(dt);
  },clear,render(camera){runtime.render(camera);tracers.render(camera);}};
}
export async function loadBurstShotgunEffects(scene,{onSound}={}){
 const root='/assets/s5runtime/burst-shotgun/effects',definitions=await readAsset(root+'/runtime.json');
 if(!definitions.blast0||!definitions.blast1)throw Error('Burst ordered blast definitions missing');
 return createBurstShotgunEffectsRuntime(await loadEffectRuntime(scene,definitions),{tracers:createBulletTracers(scene),onSound});
}
