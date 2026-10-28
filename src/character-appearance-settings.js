// Project the existing character controls so Settings and Inventory use the
// same availability rules and the same accepted character-change handler.
export function installCharacterAppearanceSettings(host,{document:doc=host.ownerDocument,Observer=globalThis.MutationObserver}={}){
 const section=doc.createElement('fieldset');section.className='character-appearance-settings';
 const legend=doc.createElement('legend');legend.textContent='Character appearance';section.append(legend);
 const fields=doc.createElement('div');fields.className='character-appearance-fields';section.append(fields);
 const records=[],play=doc.getElementById('play');
 const skinLabels={s5runtime:'Original · S5',meshy:'Modernized · Meshy'};
 for(const [id,title] of [['appearance-select','Skin type'],['sex-select','Body']]){
  const source=doc.getElementById(id);if(!source)continue;
  // Keep the native combo outside a label: menu-layout enhances selects inside
  // labels into equipment cards, while these controls stay compact dropdowns.
  const field=doc.createElement('div'),caption=doc.createElement('span'),select=doc.createElement('select');
  caption.textContent=title;select.setAttribute('aria-label',title);field.append(caption,select);fields.append(field);
  const change=()=>{
   if(select.disabled||source.disabled||play?.disabled){sync();return;}
   if(select.value===source.value)return;
   const option=[...source.options].find(option=>option.value===select.value&&!option.disabled);
   if(!option){sync();return;}
   source.value=option.value;
   source.dispatchEvent(new (doc.defaultView?.Event??Event)('change',{bubbles:true}));sync();
  };
  const record={source,select,change,signature:null};records.push(record);
  select.addEventListener('change',change);source.addEventListener('change',sync);
 }
 const hint=doc.createElement('small');hint.textContent='Changing character appearance reloads the game.';section.append(hint);
 host.querySelector('summary').after(section);
 function sync(){
  for(const record of records){
   const {source,select}=record,signature=[...source.options].map(option=>`${option.value}:${option.textContent}:${option.disabled}`).join('|');
   if(signature!==record.signature){
    select.replaceChildren();
    for(const option of source.options){const copy=doc.createElement('option');copy.value=option.value;copy.textContent=source.id==='appearance-select'?(skinLabels[option.value]??option.textContent):option.textContent;copy.disabled=option.disabled;select.append(copy);}
    record.signature=signature;
   }
   select.value=source.value;select.disabled=source.disabled||!!play?.disabled;
  }
 }
 const observer=new Observer(sync);
 for(const {source} of records)observer.observe(source,{attributes:true,attributeFilter:['disabled'],childList:true,subtree:true,characterData:true});
 if(play)observer.observe(play,{attributes:true,attributeFilter:['disabled']});
 sync();
 return {element:section,sync,dispose(){observer.disconnect();for(const {source,select,change} of records){source.removeEventListener('change',sync);select.removeEventListener('change',change);}section.remove();}};
}
