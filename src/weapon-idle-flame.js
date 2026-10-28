import {Group} from 'three';
import {WeaponPowerAura} from './weapon-power-aura.js';
import {selectedWeaponEffect} from './weapon-effect-styles.js';
import {weaponFlameSources} from './weapon-flame-sources.js';

// Independent of the attack VFX: persistent fire never synthesizes an attack,
// hides native models/trails, or starts an audio/impact event.
export class WeaponIdleFlame{
 constructor({avatar,owner,scene,parts,copy,capture}){
  this.avatar=avatar;this.owner=owner;this.group=new Group();this.group.name='weapon-fire-'+avatar.weapon;scene.add(this.group);
  this.sources=weaponFlameSources(avatar,parts);this.aura=new WeaponPowerAura({avatar,group:this.group,copy:()=>copy(this.group),capture,...this.sources});this.age=0;this.clear();
 }
 clear(){this.active=false;this.releaseAge=null;this.group.visible=false;this.aura.clear();}
 update(dt){this.age+=dt;}
 sample(){
  const a=this.avatar,settings=a.group.userData.weaponEffectSettings;
  if(a.group.userData.weaponFlameEnabled===false||!a.group.visible||this.owner&&this.owner.weapon!==a.weapon){this.clear();return;}
  const selected=selectedWeaponEffect(a,this.owner?.attack),always=settings?.getAura().alwaysActive===true,wanted=always||selected?.style==='F';
  if(wanted){if(!this.active)this.startAge=this.age;this.active=true;this.releaseAge=null;}
  else if(this.active){this.active=false;this.releaseAge=this.age;}
  if(!wanted&&(this.releaseAge===null||this.age-this.releaseAge>=.55)){this.clear();return;}
  this.group.visible=true;this.aura.sample({age:this.age,startAge:this.startAge,releaseAge:this.releaseAge,profile:{powerAura:true,weapon:a.weapon,style:'B',auraMode:'flame'}});
 }
 snapshot(){return {...this.aura.snapshot(),visible:this.group.visible,alwaysActive:this.avatar.group.userData.weaponEffectSettings?.getAura().alwaysActive===true};}
 dispose(){this.aura.dispose();this.sources.dispose();this.group.removeFromParent();}
}
