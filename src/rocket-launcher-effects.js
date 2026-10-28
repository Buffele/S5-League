import {Group,Vector3,TextureLoader} from 'three';
import {readAsset} from './scene-assets.js';
import {loadEffectRuntime} from './combat-effects.js';
import {RocketLauncherProjectiles} from './rocket-launcher-projectiles.js';
import {RocketLauncherTrail} from './rocket-launcher-trail.js';
export async function loadRocketLauncherEffects(scene){
 const definitions=await readAsset('/assets/s5runtime/effects/rocket-launcher/runtime.json'),effects=await loadEffectRuntime(scene,definitions),projectiles=new RocketLauncherProjectiles(),heads=new Map();
 const headDefinition=definitions.weapon_rocket_l_u_head_01,trailConfigs=headDefinition.ghostTrails??[];
 if(trailConfigs.length!==1)throw Error('Rocket source GhostTrail definition missing');
 const trailConfig=trailConfigs[0],trailSource=await readAsset(headDefinition.nodes.find(n=>n.id===trailConfig.parent).asset),trailTexture=await new TextureLoader().loadAsync(trailConfig.texture);
 let owner=null,stateOwner=null,avatarOwner=null,serialOwner=null,charge=null,chargeKey=null,chargeAge=0;
 function clear(){charge?.clear();charge=null;chargeKey=null;for(const head of heads.values()){head.effect?.clear();head.trail.dispose();scene.remove(head.group);}heads.clear();projectiles.clear();effects.clear();owner=null;stateOwner=null;avatarOwner=null;}
 function updateTrails(dt){for(const head of heads.values()){
  const loader=head.effect.nodes.find(n=>n.id===trailConfig.parent)?.effect;
  if(typeof loader?.evaluatedShapeMatrix!=='function')throw Error('Rocket source hierarchy evaluator missing');
  head.trail.update(dt,loader.evaluatedShapeMatrix(trailConfig.bone));
 }}
 return {projectiles,update(dt,c,avatar,{targets=[],onHit=()=>false,audio=null,disabled=false}={}){
  if(owner!==c||serialOwner!==c.resetSerial){clear();owner=c;serialOwner=c.resetSerial;}
  const s=disabled?null:c.rocketLauncher;
  if(stateOwner!==s||avatarOwner!==avatar){charge?.clear();charge=null;chargeKey=null;stateOwner=s;avatarOwner=avatar;}
  // Fired rockets belong to the world, and survive a weapon switch or a hit.
  // A reset serial clears them; a cancelled charge only clears its own effect.
  projectiles.advancePushes(dt);projectiles.update(dt,c.collision,targets,(explosion,p)=>{const head=heads.get(p);head?.effect?.clear();head?.trail.dispose();if(head)scene.remove(head.group);heads.delete(p);effects.play('weapon_rl_ex',explosion.point,null,{facing:c.facing});(p.audio??audio)?.play('impact');for(const contact of explosion.contacts){const acceptance=onHit(contact,p);if(acceptance&&acceptance.pushAccepted!==false)projectiles.push(contact);}});
  for(const [p,head]of heads){head.group.position.copy(p.position);head.group.quaternion.setFromUnitVectors(new Vector3(0,0,1),p.direction);head.group.updateWorldMatrix(true,true);}
  if(!s){effects.update(dt);updateTrails(dt);return;}
  avatar.group.updateWorldMatrix(true,true);const socket=[...avatar.bones].find(([n])=>n.endsWith('Minegun_Wea_Dummy'))?.[1];if(!socket)throw Error('Rocket Launcher post-mixer muzzle missing');
  const view={group:avatar.group,bones:new Map(avatar.bones)};view.bones.set('Minegun_Wea_Dummy',socket);
  const key=s.phase==='charge'?s.serial:null;
  if(key!==chargeKey){charge?.clear();charge=null;chargeKey=key;chargeAge=0;if(key!==null)charge=effects.play('weapon_rl_smog',c.position,view,{rootBone:'Minegun_Wea_Dummy',follow:true,facing:c.facing});}
  if(charge&&(chargeAge+=dt)>=definitions.weapon_rl_smog.duration){charge.clear();charge=effects.play('weapon_rl_smog',c.position,view,{rootBone:'Minegun_Wea_Dummy',follow:true,facing:c.facing});chargeAge=0;}
  for(const shot of s.pendingShots.splice(0)){
   const origin=socket.getWorldPosition(new Vector3()),aim=shot.aimTarget??origin.clone().addScaledVector(new Vector3(Math.sin(c.facing)*Math.cos(shot.aimPitch),Math.sin(shot.aimPitch),Math.cos(c.facing)*Math.cos(shot.aimPitch)),150);
   effects.play('weapon_rl_rail',c.position,view,{rootBone:'Minegun_Wea_Dummy',follow:false,facing:c.facing});
   for(const p of projectiles.launch(origin,aim,shot,c)){p.audio=audio;const group=new Group();group.name='Rocket Launcher native head';group.position.copy(p.position);group.scale.setScalar(.006);scene.add(group);group.updateWorldMatrix(true,true);const headView={group,bones:new Map([['rocket',group]])},trail=new RocketLauncherTrail(trailConfig,trailSource,trailTexture);scene.add(trail.mesh);heads.set(p,{group,trail,effect:effects.play('weapon_rocket_l_u_head_01',p.position,headView,{rootBone:'rocket',follow:true,duration:5})});}
  }
  for(const [p,head]of heads){head.group.position.copy(p.position);head.group.quaternion.setFromUnitVectors(new Vector3(0,0,1),p.direction);head.group.updateWorldMatrix(true,true);}
  effects.update(dt);
  updateTrails(dt);
 },render:camera=>{effects.render(camera);for(const h of heads.values())h.trail.render();},trailState:()=>[...heads.values()].map(h=>({samples:h.trail.clock?.samples.length??0,opacity:h.trail.clock?.opacity??0,visible:h.trail.mesh.visible,vertices:h.trail.geometry.attributes.position?.count??0})),clear,warmup:(renderer,camera)=>effects.warmup(renderer,camera)};
}
