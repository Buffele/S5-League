import * as THREE from 'three';
import {readAsset,sceneAsset} from './scene-assets.js';
export class ImportedEffect {
 constructor(asset,{center=false,duration=.6}={}){
  this.group=new THREE.Group();this.content=asset.group;this.group.add(this.content);this.content.scale.setScalar(.006);
  this.group.updateMatrixWorld(true);
  if(center){const box=new THREE.Box3().setFromObject(this.content);this.content.position.sub(box.getCenter(new THREE.Vector3()));}
  this.materials=asset.meshes.flatMap(m=>Array.isArray(m.material)?m.material:[m.material]);
  this.duration=asset.clip?.duration||duration;this.mixer=asset.clip?new THREE.AnimationMixer(asset.group):null;
  if(this.mixer){this.action=this.mixer.clipAction(asset.clip);this.action.setLoop(THREE.LoopOnce,1);this.action.clampWhenFinished=true;}
  this.clear();
 }
 setContact(contact){
  if(!contact)return;
  const n=new THREE.Vector3(contact.normal.x,contact.normal.y,contact.normal.z).normalize();
  this.group.position.copy(contact.point).addScaledVector(n,.035);this.group.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n);
 }
 trigger(contact){
  if(!contact)return;
  this.setContact(contact);
  this.age=0;this.group.visible=true;this.action?.reset().play();this.update(0);
 }
 update(dt){if(!this.group.visible)return;this.age+=dt;this.mixer?.update(dt);const fade=Math.max(0,1-this.age/this.duration);for(const m of this.materials)m.opacity=fade;if(!fade)this.clear();}
 clear(){this.group.visible=false;this.age=0;this.action?.stop();}
}
export async function loadImportedEffects(){
 const [wall,impact]=await Promise.all(['walljump','impact'].map(async name=>sceneAsset(await readAsset(`/assets/s5runtime/${name}.json`),{effect:true})));
 return {wall:new ImportedEffect(wall,{center:true}),impact:new ImportedEffect(impact,{center:true,duration:.22})};
}
