import {readAsset} from './scene-assets.js';
import {loadEffectRuntime} from './combat-effects.js';
import {resolveRifleShots} from './rifle-contact.js';
import {createBulletTracers} from './bullet-tracers.js';
export function loadRevolverEffects(scene){return loadGunParticleEffects(scene,{weapon:'revolver',muzzle:'Revolver_Fire_Dummy',root:'/assets/s5runtime/effects/revolver',followMuzzleSmoke:true});}
export function splitMuzzleSmoke(definitions){
 const smoke=definitions.shot.nodes.filter(n=>n.type==='CActParticle'&&n.emitterKeys?.[0]?.['object+10']&&n.textures.some(t=>t.endsWith('/smoke4.png')));
 if(!smoke.length)throw Error('Missing continuous Revolver muzzle smoke');
 return {...definitions,shot:{...definitions.shot,nodes:definitions.shot.nodes.filter(n=>!smoke.includes(n))},muzzleSmoke:{duration:Math.max(...smoke.map(n=>n.end)),nodes:smoke}};
}
export async function loadGunParticleEffects(scene,{weapon,muzzle,muzzles=[muzzle],root,followMuzzleSmoke=false}){
 const definitions=await readAsset(root+'/runtime.json');
 const runtime=await loadEffectRuntime(scene,followMuzzleSmoke?splitMuzzleSmoke(definitions):definitions);
 const tracers=createBulletTracers(scene);
 const actors=new Map();
 function removeActor(avatar){
  const entry=actors.get(avatar);if(!entry)return;
  runtime.clearForAvatar(entry.view);tracers.clearForOwner(entry.view);actors.delete(avatar);
 }
 function actorEntry(controller,avatar,disabled){
  let entry=actors.get(avatar);
  if(entry&&(entry.controller!==controller||entry.resetSerial!==controller.resetSerial)){removeActor(avatar);entry=null;}
  if(!entry){
   // Keep the alias view identity stable: sequence ownership and detached hit
   // effects can then be cleared for this actor without touching other actors.
   entry={controller,resetSerial:controller.resetSerial,view:{group:avatar.group,bones:new Map()},disabled,processedShots:0,lastContacts:[]};actors.set(avatar,entry);
  }
  entry.disabled=disabled;entry.view.group=avatar.group;
  entry.view.bones.clear();for(const [name,bone]of avatar.bones)entry.view.bones.set(name,bone);
  for(const blastMuzzle of muzzles){
   const socket=[...avatar.bones].find(([name])=>name.endsWith(blastMuzzle))?.[1];
   if(socket)entry.view.bones.set(blastMuzzle,socket);
  }
  return entry;
 }
 function updateActors(dt,records){
  const active=new Map();
  for(const record of records||[]){
   const {controller:c,avatar,disabled=false}=record||{};
   if(c?.weapon!==weapon||!c.rifle||!avatar?.group||!avatar.bones||active.has(avatar))continue;
   active.set(avatar,actorEntry(c,avatar,!!disabled));
  }
  for(const avatar of actors.keys())if(!active.has(avatar))removeActor(avatar);
  // The shared runtime and tracer pool advance once for the entire family,
  // regardless of the number of actors firing in this frame.
  tracers.update(dt);
  for(const [avatar,entry]of active){
   const c=entry.controller;
   // Damage already resolved contacts against its actual target. Never query
   // those shots again from this presentation-only consumer.
   if(c.rifle.pendingShots.some(shot=>!shot.contact&&!(shot.delayRemaining>0)))resolveRifleShots(c,avatar);
   const shots=c.rifle.pendingShots.filter(s=>s.contact);
   c.rifle.pendingShots=c.rifle.pendingShots.filter(s=>!s.contact);
   if(!entry.disabled)for(const shot of shots){
    entry.processedShots++;entry.lastContacts=(shot.contacts||[shot.contact]).map(contact=>contact.point.toArray());
    for(const blastMuzzle of muzzles){
     if(!entry.view.bones.has(blastMuzzle))throw Error(weapon+': missing muzzle '+blastMuzzle);
     runtime.play('shot',shot.position,entry.view,{rootBone:blastMuzzle,follow:false,facing:shot.facing});
    // Only the continuous emitter follows the recoiling barrel. Its emitted
    // particles stay in world space; the flash, burst and bullet paths detach.
     if(followMuzzleSmoke)runtime.play('muzzleSmoke',shot.position,entry.view,{rootBone:blastMuzzle,follow:true,facing:shot.facing});
    }
    for(const contact of shot.contacts||[shot.contact]){
     tracers.emit(shot.origin,contact.point,entry.view);
     if(contact.hit||contact.wall)runtime.play(contact.hit?'hit':'wallHit',contact.point,entry.view,{facing:shot.facing});
    }
   }
  }
  runtime.update(dt);
 }
 return {...runtime,updateActors,update(dt,c,avatar,disabled=false){updateActors(dt,[{controller:c,avatar,disabled}]);},
  snapshot(){return Object.freeze({weapon,actors:Object.freeze([...actors].map(([avatar,entry])=>Object.freeze({avatarId:avatar.group.uuid,disabled:entry.disabled,processedShots:entry.processedShots,lastContacts:Object.freeze(entry.lastContacts.map(point=>Object.freeze([...point])))})))});},
  clearForAvatar(avatar){if(actors.has(avatar))removeActor(avatar);else{runtime.clearForAvatar(avatar);tracers.clearForOwner(avatar);}},
  clear(){runtime.clear();tracers.clear();actors.clear();},render(camera){runtime.render(camera);tracers.render(camera);}};
}
