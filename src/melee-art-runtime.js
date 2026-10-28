import {MeleeArtEffect} from './melee-art-effect.js';
import {WEAPON_EFFECT_STYLES,selectedWeaponEffect} from './weapon-effect-styles.js';

export function createMeleeArtRuntime(scene){
 const actors=new Map();
 return {
  prepareAvatar(avatar,owner,settings){if(!WEAPON_EFFECT_STYLES[avatar?.weapon])return null;
   avatar.group.userData.weaponEffectSettings=settings;
   if(!actors.has(avatar))actors.set(avatar,new MeleeArtEffect(scene,avatar,{owner}));return actors.get(avatar);
  },
  releaseAvatar(avatar){actors.get(avatar)?.dispose();actors.delete(avatar);},
  select(avatar,attack){return actors.get(avatar)?.select(attack)??false;},
  impact(attack,position,{source,normal,ground=false}={}){
   const entry=[...actors.values()].find(e=>e.owner===source&&e.avatar.weapon===source?.weapon);
   const current=source?.attack??attack;
   if(!entry||!selectedWeaponEffect(entry.avatar,current,{replacementOnly:true}))return false;
   entry.select(current);return entry.impact(position,normal,ground);
  },
  update(dt){for(const effect of actors.values())effect.update(dt);},
  sampleAvatar(avatar,options){actors.get(avatar)?.sample(options);},
  render(camera){for(const effect of actors.values())effect.render(camera);},
  clear(avatar){if(avatar)actors.get(avatar)?.clear();else for(const effect of actors.values())effect.clear();},
  snapshot(){return [...actors].filter(([,e])=>e.selection||e.flame.group.visible).map(([avatar,e])=>({weapon:avatar.weapon,...e.snapshot()}));},
 };
}
