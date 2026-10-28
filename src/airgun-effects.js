import * as THREE from 'three';
import {readAsset} from './scene-assets.js';
import {loadEffectRuntime} from './combat-effects.js';

export async function loadAirgunEffects(scene){
 const data=await readAsset('/assets/s5runtime/effects/airgun/runtime.json');
 const effects=await loadEffectRuntime(scene,data.definitions),beamData=data.lightning[0];
 const map=await new THREE.TextureLoader().loadAsync(beamData.texture);map.colorSpace=THREE.SRGBColorSpace;
 const beam=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
 beam.name='Air Gun decoded lightning texture';beam.visible=false;scene.add(beam);
 const start=new THREE.Vector3(),end=new THREE.Vector3(),axis=new THREE.Vector3(),across=new THREE.Vector3(),normal=new THREE.Vector3(),basis=new THREE.Matrix4();
 let charge=null,lastKey=null,view=null,source=null,beamAge=Infinity;
 return {
  update(dt,c,avatar,disabled=false){
   if(source!==avatar){source=avatar;const bones=new Map(avatar.bones),socket=[...bones].find(([key])=>key.endsWith('Railgun_Fire_Dummy'))?.[1];if(socket)bones.set('Railgun_Fire_Dummy',socket);view={group:avatar.group,bones};}
   const state=c.airgun,phase=disabled?'idle':state?.phase||'idle',key=`${avatar.weapon}/${phase}/${state?.serial||0}`;
   if(key!==lastKey){
    lastKey=key;charge?.clear();charge=null;
    if(phase==='charge')charge=effects.play('airgun_smog',c.position,view,{rootBone:'Railgun_Fire_Dummy',follow:true,duration:3600,facing:c.facing});
    if(phase==='fire'){
     effects.play('airgun_rail',c.position,view,{rootBone:'Railgun_Fire_Dummy',follow:false,facing:c.facing});
     view.bones.get('Railgun_Fire_Dummy').getWorldPosition(start);
     const range=state.maxCue?7.8:6;end.copy(start).add(new THREE.Vector3(Math.sin(c.facing)*range,0,Math.cos(c.facing)*range));
     const hit=c.collision?.raycast(start,new THREE.Vector3().subVectors(end,start));if(hit?.point)end.copy(hit.point);
     beamAge=0;
    }
   }
   effects.update(dt);beamAge+=dt;beam.visible=beamAge<beamData.end;
  },
  render(camera){
   effects.render(camera);if(!beam.visible)return;
   axis.subVectors(end,start).normalize();normal.subVectors(camera.position,start).normalize();across.crossVectors(normal,axis).normalize();normal.crossVectors(axis,across).normalize();
   basis.makeBasis(axis,across,normal);beam.quaternion.setFromRotationMatrix(basis);beam.position.copy(start).add(end).multiplyScalar(.5);
   // Native procedural lightning geometry remains unverified. Preserve source
   // texture and 100 ms lifetime; this bounded ribbon is a visible approximation.
   beam.scale.set(start.distanceTo(end),.25,1);beam.material.opacity=Math.max(0,1-beamAge/beamData.end);
  },
  clear(){charge?.clear();charge=null;lastKey=null;beamAge=Infinity;beam.visible=false;effects.clear();},
  warmup:(renderer,camera)=>effects.warmup(renderer,camera),
 };
}
