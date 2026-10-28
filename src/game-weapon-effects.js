import {installInventoryWeaponEffects} from './inventory-weapon-effects.js';
import {WEAPON_EFFECT_STYLES} from './weapon-effect-styles.js';

// Shares the inventory's settings and selectors; never equips or resets a weapon.
export function installGameWeaponEffects(host,{document:doc,settings,read,onBack}){
 const panel=doc.createElement('section');panel.className='game-weapon-effects';panel.hidden=true;host.append(panel);
 const heading=doc.createElement('h2');heading.textContent='Weapon effects';panel.append(heading);
 const label=doc.createElement('label'),caption=doc.createElement('span'),weapon=doc.createElement('select');caption.textContent='Equipped weapon';weapon.setAttribute('aria-label','Weapon effects · equipped weapon');label.append(caption,weapon);panel.append(label);
 const empty=doc.createElement('p');empty.textContent='No customizable melee weapon is equipped.';empty.hidden=true;panel.append(empty);
 const view=installInventoryWeaponEffects(panel,{document:doc,settings,busy:()=>read()?.busy===true});
 const back=doc.createElement('button');back.type='button';back.className='game-weapon-effects-back';back.textContent='Back to game menu';panel.append(back);
 const choose=()=>view.sync(weapon.value);weapon.addEventListener('change',choose);back.addEventListener('click',onBack);
 let opened=false;
 return {element:panel,get opened(){return opened;},
  open(){const state=read()??{},choices=(state.weapons??[]).filter(row=>WEAPON_EFFECT_STYLES[row.value]);
   while(weapon.children.length)weapon.children[0].remove();for(const row of choices){const option=doc.createElement('option');option.value=row.value;option.textContent=row.label;weapon.append(option);}
   weapon.value=choices.some(row=>row.value===state.weapon)?state.weapon:choices[0]?.value??'';weapon.disabled=!choices.length||state.busy===true;label.hidden=!choices.length;empty.hidden=!!choices.length;view.sync(weapon.value);panel.hidden=false;opened=true;
  },
  close(){opened=false;panel.hidden=true;},
  focusables(){return [...(weapon.disabled?[]:[weapon]),...view.controls.filter(select=>!select.disabled),back];},
  dispose(){weapon.removeEventListener('change',choose);back.removeEventListener('click',onBack);view.dispose();panel.remove();opened=false;},
 };
}
