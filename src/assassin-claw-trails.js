import {SRGBColorSpace,TextureLoader} from 'three';
import {WeaponTrail} from './weapon-trail.js';
import {ASSASSIN_CLAW_TRAIL,assassinClawTrailWindow} from './assassin-claw-data.js';
import {createTrailMeshWarmup} from './trail-mesh-warmup.js';

// Current authenticated vital_shock.scn has no Shape/Line01. Keep the existing
// S5 bounds ribbon explicit, never label its endpoints as native Line geometry.
export class AssassinClawTrails extends WeaponTrail {
 constructor(avatar,{texture,...options}={}){
  const meshes=avatar.meshes.filter(mesh=>mesh.userData.weapon&&mesh.userData.source==='model/weapon/vital_shock.scn'&&mesh.name==='vital_shock');
  if(meshes.length!==1||!meshes[0].geometry?.attributes.position?.count)throw Error('Exact Assassin Claw body mesh required; no skinned-hand fallback');
  if(!texture)throw Error('Prepared Assassin Claw trail texture required');
  super(meshes[0],{...options,texture,weapon:'assassinclaw'});
  this.mesh.name='assassin-claw-motion-trail';this.warmup=createTrailMeshWarmup(this.mesh);this.lastTime=null;this.signature=null;
 }
 update(dt,attack,options={}){
  if(options.cancel||attack&&attack.weapon!=='assassinclaw'){this.clear();return;}
  if(dt<=0)return;
  const time=attack?.timeMs??(attack?.time??0)*1000,signature=attack?`${attack.kind}:${attack.comboIndex??0}`:null;
  if(attack===this.attack&&(time<this.lastTime||signature!==this.signature))this.clear();
  super.update(dt,attack,options);this.currentAttack=attack;this.lastTime=time;this.signature=signature;
 }
 clear(){super.clear();this.currentAttack=null;this.lastTime=null;this.signature=null;}
 snapshot(){return {nativeReady:false,geometryPolicy:'S5 body-bounds ribbon; source Line01 absent',window:{delayMs:ASSASSIN_CLAW_TRAIL.startMs,durationMs:ASSASSIN_CLAW_TRAIL.durationMs},emitting:assassinClawTrailWindow(this.currentAttack),samples:this.samples.length,visible:this.mesh.visible};}
}
export async function loadAssassinClawTrails(avatar,options={}){
 const texture=options.texture??await new TextureLoader().loadAsync(ASSASSIN_CLAW_TRAIL.texture);
 texture.flipY=false;texture.colorSpace=SRGBColorSpace;
 let trail;try{trail=new AssassinClawTrails(avatar,{...options,texture});}catch(error){if(!options.texture)texture.dispose();throw error;}
 if(!options.texture){const dispose=trail.dispose.bind(trail);trail.dispose=()=>{dispose();texture.dispose();};}
 return trail;
}
