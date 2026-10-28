import {readAsset} from './scene-assets.js';
import {loadEffectRuntime} from './combat-effects.js';
import {convertParticleSequence} from './native-particle-sequence.js';
import * as THREE from 'three';
import {resolveRifleShots} from './rifle-contact.js';
export async function loadSmashRifleEffects(scene){
 const root='/assets/s5runtime/effects/smash-rifle',definitions={};
 for(const [key,name] of Object.entries({shot:'shot',hit:'hit',wallHit:'hit_wall'}))definitions[key]=convertParticleSequence(await readAsset(root+'/sequences/weapon_smashgun_'+name+'.json'),root);
 const effects=await loadEffectRuntime(scene,definitions);
 const rail=await readAsset(root+'/sequences/weapon_smashgun_rail.json'),lightning=rail.nodes[0].fields;
 const lifetime=lightning.base.endTimeField.int32/1000;
 const map=await new THREE.TextureLoader().loadAsync(root+'/textures/green_beam.png');map.colorSpace=THREE.SRGBColorSpace;
 const beams=Array.from({length:8},()=>{
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
  mesh.visible=false;mesh.name='Smash Rifle source-textured tracer';scene.add(mesh);
  return {mesh,start:new THREE.Vector3(),end:new THREE.Vector3(),age:Infinity};
 });
 let nextBeam=0;
 const axis=new THREE.Vector3(),normal=new THREE.Vector3(),across=new THREE.Vector3(),basis=new THREE.Matrix4();
 let current=null;
 return {
  update(dt,c,avatar,disabled=false){
   if(current!==avatar){effects.clear();for(const b of beams){b.age=Infinity;b.mesh.visible=false;}current=avatar;}
   for(const b of beams){b.age+=dt;b.mesh.visible=b.age<lifetime;}
   const s=c.weapon==='smashrifle'?c.rifle:null;
   if(s){
    resolveRifleShots(c,avatar);
    const pending=s.pendingShots.splice(0);
    if(!disabled&&pending.length){
     avatar.group.updateWorldMatrix(true,true);
     const socket=[...avatar.bones].find(([key])=>key.endsWith('Dual_Fire_Dummy'))?.[1];
     if(!socket)throw Error('Smash Rifle: missing Dual_Fire_Dummy after mixer');
     const view={group:avatar.group,bones:new Map([...avatar.bones,['Dual_Fire_Dummy',socket]])};
     for(const shot of pending){
      effects.play('shot',shot.position,view,{rootBone:'Dual_Fire_Dummy',follow:false,facing:shot.facing});
      if(shot.contact?.hit||shot.contact?.wall)effects.play(shot.contact.hit?'hit':'wallHit',shot.contact.point,null,{facing:shot.facing});
      const b=beams[nextBeam++%beams.length];b.start.copy(shot.origin);b.end.copy(shot.contact.point);b.age=0;b.mesh.visible=true;
     }
    }
   }
   effects.update(dt);
  },
  clear(){effects.clear();for(const b of beams){b.age=Infinity;b.mesh.visible=false;}},
  render(camera){
   effects.render(camera);
   for(const b of beams)if(b.mesh.visible){
    axis.subVectors(b.end,b.start).normalize();normal.subVectors(camera.position,b.start).normalize();across.crossVectors(normal,axis).normalize();normal.crossVectors(axis,across).normalize();
    basis.makeBasis(axis,across,normal);b.mesh.quaternion.setFromRotationMatrix(basis);b.mesh.position.copy(b.start).add(b.end).multiplyScalar(.5);
    // Native texture and 100 ms lifetime; ribbon geometry remains a documented
    // approximation of CActLightning's procedural tessellation.
    b.mesh.scale.set(b.start.distanceTo(b.end),.035,1);b.mesh.material.opacity=1-b.age/lifetime;
   }
  },
  warmup:(renderer,camera)=>effects.warmup(renderer,camera),
 };
}
