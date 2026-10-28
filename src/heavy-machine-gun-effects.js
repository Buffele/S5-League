import {readAsset} from './scene-assets.js';
import {loadEffectRuntime} from './combat-effects.js';
import {loadGunParticleEffects} from './revolver-effects.js';
const root='/assets/s5runtime/heavy-machine-gun/effects',muzzle='HW_Fire_Dummy';
export async function loadHeavyMachineGunEffects(scene,{random15}={}){
 const [base,data]=await Promise.all([loadGunParticleEffects(scene,{weapon:'heavymachinegun',muzzle,root}),readAsset(root+'/firing-runtime.json')]);
 if(data.duration!==3||data.loop!==true||data.nodes.length!==2)throw Error('Qualified native HMG firing sequence required');
 const firing=await loadEffectRuntime(scene,{firing:data},{random15}),actors=new Map();
 function remove(avatar){const entry=actors.get(avatar);if(!entry)return;entry.sequence.clear();actors.delete(avatar);}
 function updateActors(dt,records){
  base.updateActors(dt,records);const active=new Set();
  for(const {controller:c,avatar,disabled=false}of records??[]){
   if(!avatar?.group||c?.weapon!=='heavymachinegun'||c.rifle?.phase!=='fire'||disabled||active.has(avatar))continue;
   active.add(avatar);let entry=actors.get(avatar);
   if(entry&&(entry.controller!==c||entry.rifle!==c.rifle||entry.serial!==c.rifle.serial||entry.resetSerial!==c.resetSerial)){remove(avatar);entry=null;}
   if(!entry){
    const socket=[...avatar.bones].find(([name])=>name.endsWith(muzzle))?.[1];if(!socket)throw Error('Missing post-mixer HMG muzzle');
    const view={group:avatar.group,bones:new Map(avatar.bones)};view.bones.set(muzzle,socket);
    const sequence=firing.play('firing',c.position,view,{rootBone:muzzle,follow:true,loop:true});
    entry={controller:c,rifle:c.rifle,serial:c.rifle.serial,resetSerial:c.resetSerial,sequence,view};actors.set(avatar,entry);
   }
  }
  for(const avatar of actors.keys())if(!active.has(avatar))remove(avatar);
  firing.update(dt);
 }
 function firingState(){return {actors:[...actors].map(([avatar,e])=>({avatarId:avatar.group.uuid,age:e.sequence.age,clock:e.sequence.clock,matrix:e.sequence.rootMatrix.toArray(),meshes:e.sequence.nodes.filter(n=>n.group).map(n=>({visible:n.group.visible,matrix:n.matrix.toArray()}))})),textures:firing.textureAnimationState(),nativeReady:false};}
 return {...base,updateActors,update(dt,c,avatar,disabled=false){updateActors(dt,[{controller:c,avatar,disabled}]);},firingState,
  snapshot(){return {...base.snapshot(),firing:firingState()};},
  clearForAvatar(avatar){remove(avatar);base.clearForAvatar(avatar);},
  clear(){for(const avatar of [...actors.keys()])remove(avatar);base.clear();firing.clear();},
  render(camera){base.render(camera);firing.render(camera);},
  async warmup(renderer,camera){await base.warmup(renderer,camera);await firing.warmup(renderer,camera);}};
}
