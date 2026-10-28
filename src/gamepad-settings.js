import {GAMEPAD_DEFAULTS} from './gamepad-input.js';
const storageKey='s5-gamepad-v1';
export function readGamepadSettings(storage){try{return {...GAMEPAD_DEFAULTS,...JSON.parse(storage?.getItem(storageKey)??'{}')};}catch{return {...GAMEPAD_DEFAULTS};}}
export function installGamepadSettings(host,gamepad,{document:doc=host.ownerDocument,storage=null}={}){
 const section=doc.createElement('fieldset');section.className='character-appearance-settings gamepad-settings';
 const legend=doc.createElement('legend');legend.textContent='Controller · Xbox / PlayStation';section.append(legend);
 const status=doc.createElement('p');status.setAttribute('role','status');status.dataset.gamepadStatus='';section.append(status);
 const fields=doc.createElement('div');fields.className='character-appearance-fields';section.append(fields);const listeners=[];
 const field=(key,label,type,min,max,step)=>{
  const row=doc.createElement('label'),caption=doc.createElement('span'),input=doc.createElement('input');caption.textContent=label;input.type=type;input.dataset.gamepadSetting=key;
  input.setAttribute('aria-label',label);if(type==='range'){input.min=min;input.max=max;input.step=step;input.value=gamepad.settings[key];}else input.checked=gamepad.settings[key];
  const output=doc.createElement('output');output.textContent=type==='range'?String(gamepad.settings[key]):'';
  const change=()=>{const value=type==='checkbox'?input.checked:Number(input.value);if(!gamepad.configure({[key]:value}))return;output.textContent=type==='range'?String(value):'';try{storage?.setItem(storageKey,JSON.stringify(gamepad.settings));}catch{}sync();};
  input.addEventListener('input',change);listeners.push([input,change]);row.append(caption,input,output);fields.append(row);
 };
 field('enabled','Enable controller','checkbox');field('deadzone','Stick dead zone','range',.05,.4,.01);field('lookSpeed','Camera sensitivity','range',.5,6,.1);field('invertY','Invert vertical camera','checkbox');
 const saved=doc.createElement('small');saved.textContent='Applied immediately and saved on this device.';section.append(saved);
 const help=doc.createElement('details'),summary=doc.createElement('summary');summary.textContent='Controller button guide';help.append(summary);
 const note=doc.createElement('p');note.textContent='Connect by USB or Bluetooth, then press a button. Left stick: move · Right stick: camera · A / Cross: jump · RB / R1: left click / primary attack (hold to charge) · Hold LB / L1: normal sprint, following camera direction and overriding the movement stick. PlayStation: R2: right click / secondary attack (hold supported) · L2: dodge left with the left stick pointing left, otherwise right (including neutral) · Square: weapon slot 1 · Triangle: weapon slot 2 · Circle: weapon slot 3 · Select / Create / Share: Tab / scoreboard · Start / Options: Escape / menu. Xbox: B: dodge right by default, left with the stick left · X: reload · Y: next equipped weapon · D-pad left / up / right: weapon slots 1 / 2 / 3 · RT: secondary attack · LT: turn camera horizontally by 45 degrees, left if the right stick points left, otherwise right · R3: skill · View: scores · Menu: pause. In menus: D-pad, A / Cross to confirm, B / Circle to go back. In the waiting room: Y / Triangle starts the match.';help.append(note);section.append(help);
 const grid=host.querySelector('.graphics-grid');if(grid)grid.before(section);else host.append(section);
 function sync(state=gamepad.snapshot()){
  const text=state.status==='connected'?`${state.family} controller connected${state.armed?'':' · Release sticks and buttons to enable input'}`:({unavailable:'Gamepad API unavailable. Use localhost or HTTPS in a supported browser.',unsupported:'Controller detected without a standard browser mapping.',disabled:'Controller disabled.',unfocused:'Controller paused while the game is unfocused.',disconnected:'No controller detected. Connect one and press a button.'}[state.status]??'Controller ready.');
  if(status.textContent!==text)status.textContent=text;
 }
 sync();return {element:section,sync,dispose(){for(const [input,change]of listeners)input.removeEventListener('input',change);section.remove();}};
}

function targets(root){return [...root.querySelectorAll('button,a[href],input:not([type="hidden"]),select,summary,[role="button"][tabindex]')].filter(node=>!node.disabled&&(node.tabIndex!==-1||['radio','tab'].includes(node.getAttribute?.('role')))&&!node.closest('[hidden],[inert]')&&node.getClientRects().length>0);}
export function navigateGamepadMenu(root,direction,{document:doc=root.ownerDocument}={}){
 const items=targets(root);if(!items.length)return false;const focused=items.includes(doc.activeElement)?doc.activeElement:null;
 if(focused&&['left','right'].includes(direction)){
  const sign=direction==='right'?1:-1;
  if(focused.tagName==='SELECT'){
   const options=[...focused.options].filter(o=>!o.disabled),index=options.indexOf(focused.selectedOptions[0]),next=options[Math.max(0,Math.min(options.length-1,index+sign))];
   if(next){focused.value=next.value;focused.dispatchEvent(new (doc.defaultView?.Event??Event)('change',{bubbles:true}));}return true;
  }
  if(focused.type==='range'){
   focused.value=String(Math.max(Number(focused.min)||0,Math.min(Number(focused.max)||100,Number(focused.value)+sign*(Number(focused.step)||1))));focused.dispatchEvent(new (doc.defaultView?.Event??Event)('input',{bubbles:true}));return true;
  }
 }
 const index=items.indexOf(focused),sign=['left','up'].includes(direction)?-1:1;items[index<0?0:(index+sign+items.length)%items.length].focus();return true;
}
export function activateGamepadMenu(root,{document:doc=root.ownerDocument,preferred=null}={}){
 const items=targets(root),target=items.includes(doc.activeElement)?doc.activeElement:items.includes(preferred)?preferred:items[0];if(!target)return false;
 target.focus();if(target.tagName!=='SELECT'&&target.type!=='range')target.click();return true;
}
