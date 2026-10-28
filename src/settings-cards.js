export function createSettingsCards({id,title,description='',options,value,onChange}){
 const fieldset=document.createElement('fieldset');fieldset.className=`settings-group settings-group--${id}`;
 const legend=document.createElement('legend');legend.textContent=title;fieldset.append(legend);
 if(description){const note=document.createElement('small');note.className='settings-group-note';note.textContent=description;fieldset.append(note);}
 const control=document.createElement('input');control.type='hidden';control.id=id;control.value=value;fieldset.append(control);
 const choices=document.createElement('div');choices.className=`settings-choices settings-choices--${Math.min(options.length,4)}`;choices.setAttribute('role','radiogroup');choices.setAttribute('aria-label',title);
 const buttons=new Map();
 const select=next=>{
  if(!buttons.has(next))next=options[0].value;
  control.value=next;
  for(const [option,button] of buttons){const active=option===next;button.classList.toggle('is-selected',active);button.setAttribute('aria-checked',String(active));button.tabIndex=active?0:-1;}
  onChange?.(next);
 };
 for(const option of options){
  const button=document.createElement('button');button.type='button';button.className='settings-choice';button.dataset.value=option.value;button.setAttribute('role','radio');
  const preview=document.createElement('span');preview.className=`settings-preview settings-preview--${id} settings-preview--${option.value}`;preview.setAttribute('aria-hidden','true');
  const label=document.createElement('b');label.textContent=option.label;
  if(option.caption){const caption=document.createElement('small');caption.textContent=option.caption;button.append(preview,label,caption);}else button.append(preview,label);
  button.onclick=()=>select(option.value);
  button.onkeydown=event=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
   event.preventDefault();const direction=['ArrowRight','ArrowDown'].includes(event.key)?1:-1,index=options.findIndex(item=>item.value===control.value);
   const next=options[(index+direction+options.length)%options.length].value;select(next);buttons.get(next).focus();
  };
  buttons.set(option.value,button);choices.append(button);
 }
 fieldset.append(choices);select(value);
 return {element:fieldset,control,select};
}
