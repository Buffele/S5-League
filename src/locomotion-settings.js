// Settings projects the authoritative controls, sharing their saved values and URL handling.
export function installLocomotionSettings(host,{document:doc=host.ownerDocument}={}){
 const section=doc.createElement('fieldset');section.className='character-appearance-settings locomotion-settings';
 const legend=doc.createElement('legend');legend.textContent='Character animations';section.append(legend);
 const fields=doc.createElement('div');fields.className='character-appearance-fields';section.append(fields);
 const records=[];
 for(const [id,title] of [['run-style','Ground movement'],['sprint-style','Sprint animation · F3']]){
  const source=doc.getElementById(id);if(!source)throw Error(`Animation setting unavailable: ${id}`);
  const field=doc.createElement('div'),caption=doc.createElement('span'),select=doc.createElement('select');
  caption.textContent=title;select.setAttribute('aria-label',title);select.dataset.animationSetting=id;
  for(const option of source.options){const copy=doc.createElement('option');copy.value=option.value;copy.textContent=option.textContent.replace('Marche lissée','Smooth walking').replace('Marche retravaillée','Reworked walking').replace(' · avant',' · forward');select.append(copy);}
  field.append(caption,select);fields.append(field);
  const change=()=>{
   source.value=select.value;
   source.dispatchEvent(new (doc.defaultView?.Event??Event)('change',{bubbles:true}));
   sync();
  };
  select.addEventListener('change',change);source.addEventListener('change',sync);
  records.push({source,select,change});
 }
 const hint=doc.createElement('small');hint.textContent='Applied immediately and saved on this device. Blender V2: athletic cycle in all eight directions for Spy Dagger, male and female. V1: mild forward retouch. Smooth walking: softened curves. Choose Classic to return to the original.';section.append(hint);
 host.querySelector('.graphics-grid').before(section);
 function sync(){for(const {source,select} of records)select.value=source.value;}
 sync();
 return {element:section,sync,dispose(){for(const {source,select,change} of records){source.removeEventListener('change',sync);select.removeEventListener('change',change);}section.remove();}};
}
