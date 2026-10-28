import {WEAPON_EFFECT_STYLES} from './weapon-effect-styles.js';
import {installWeaponAuraControls} from './weapon-aura-controls.js';

// A separate section leaves appearance/skin and equipment transactions intact.
export function installInventoryWeaponEffects(host,{document:doc,settings,busy=()=>false}={}){
 const section=doc.createElement('section');section.className='s5-inventory-effects';section.hidden=true;
 section.setAttribute('aria-label','Attack effects');host.append(section);let weapon=null,rows=[];
 const heading=doc.createElement('h3');heading.textContent='Attack effects';section.append(heading);
 const help=doc.createElement('p');help.textContent='Choose an effect for each attack. Your choices are saved.';section.append(help);
 const fields=doc.createElement('div');section.append(fields);
 const note=doc.createElement('p');note.className='s5-inventory-effects-note';section.append(note);
 const auraControls=installWeaponAuraControls(section,{document:doc,settings});auraControls.element.hidden=true;
 function sync(next=weapon){
  if(weapon!==next){weapon=next;rows=[];fields.replaceChildren();for(const attack of WEAPON_EFFECT_STYLES[weapon]??[]){
   const label=doc.createElement('label'),title=doc.createElement('span'),select=doc.createElement('select');title.textContent=attack.label;
   select.dataset.effectAttack=attack.id;select.setAttribute('aria-label','Effect · '+attack.label);
   for(const choice of [{id:'original',name:'Original'},...attack.choices]){const option=doc.createElement('option');option.value=choice.id;option.textContent=choice.id==='original'?choice.name:attack.code+'-'+choice.id+' · '+choice.name;select.append(option);}
   const description=doc.createElement('small');label.append(title,select,description);fields.append(label);
   const change=()=>{if(select.disabled)return;settings.set(weapon,attack.id,select.value);sync();};select.addEventListener('change',change);rows.push({attack,select,description,change});
  }}
  section.hidden=!rows.length;note.textContent=weapon==='plasma'?'Right click keeps your spectral rush. Flame adds fire to the weapon.':weapon==='counter'?'The original weapon deployment is preserved with every Counter Sword aura.':'';note.hidden=!['plasma','counter'].includes(weapon);auraControls.element.hidden=!rows.length;
  for(const {attack,select,description}of rows){select.value=settings.get(weapon,attack.id);select.disabled=busy();description.textContent=select.value==='original'?'Original effect':attack.choices.find(choice=>choice.id===select.value)?.name??'';}
 }
 const unsubscribe=settings.subscribe(()=>sync());
 return {element:section,sync,get controls(){return [...rows.map(row=>row.select),...(auraControls.element.hidden?[]:auraControls.controls)];},dispose(){unsubscribe();auraControls.dispose();for(const row of rows)row.select.removeEventListener('change',row.change);section.remove();}};
}
