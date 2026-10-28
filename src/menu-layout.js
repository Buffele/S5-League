import {installInventoryMenu} from './inventory-menu.js';
const LOADOUT_IDS=new Set(['scene-select','appearance-select','sex-select','outfit-select','weapon-select','weapon-skin-select','skill-select','enemy-weapon-select','game-mode','team-select','practice-option']);
const PRIMARY_IDS=new Set(['scene-select','appearance-select','weapon-select']);

function enhanceSelect(select){
 const label=select.closest('label');if(!label)return;
 label.classList.add('menu-field',`menu-field--${select.id}`);select.classList.add('menu-native-select');
 const signature=String(select.disabled)+'|'+[...select.options].map(option=>`${option.value}:${option.textContent}:${option.disabled}`).join('|'),existing=label.querySelector('.menu-choice-list');
 if(existing&&select.dataset.menuSignature===signature){
  for(const item of existing.children){const active=item.dataset.value===select.value;item.classList.toggle('is-selected',active);item.setAttribute('aria-checked',String(active));}
  return;
 }
 existing?.remove();select.dataset.menuSignature=signature;
 const list=document.createElement('div');list.className=`menu-choice-list${PRIMARY_IDS.has(select.id)?' menu-choice-list--primary':' menu-choice-list--compact'}`;list.setAttribute('role','radiogroup');list.setAttribute('aria-label',select.getAttribute('aria-label')||label.firstChild?.textContent?.trim()||select.id);
 for(const option of select.options){
  const button=document.createElement('button');button.type='button';button.className=`menu-choice menu-choice--${select.id} menu-choice--${option.value}`;button.dataset.value=option.value;button.setAttribute('role','radio');
  button.disabled=select.disabled||option.disabled;
  const preview=document.createElement('span');preview.className='menu-choice-preview';preview.setAttribute('aria-hidden','true');
  if(select.id==='weapon-select'){
   preview.textContent=option.textContent.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase();
   preview.classList.add('has-weapon-marker');
  }
  const text=document.createElement('b');text.textContent=option.textContent;button.append(preview,text);
  const sync=()=>{for(const item of list.children){const active=item.dataset.value===select.value;item.classList.toggle('is-selected',active);item.setAttribute('aria-checked',String(active));}};
  button.onclick=()=>{select.value=option.value;sync();select.dispatchEvent(new Event('change',{bubbles:true}));};list.append(button);
 }
 label.append(list);
 for(const item of list.children){const active=item.dataset.value===select.value;item.classList.toggle('is-selected',active);item.setAttribute('aria-checked',String(active));}
}

export function installMenuLayout(){
 const welcome=document.getElementById('welcome'),setup=welcome?.querySelector('.setup'),graphics=document.getElementById('graphics-settings');
 if(!welcome||!setup||!graphics)return;
 welcome.querySelector('h1').textContent='Prepare match';
 welcome.querySelector(':scope>p').innerHTML='Choose your arena, fighter and play style.';
 const shell=document.createElement('section');shell.className='menu-shell';
 shell.innerHTML='<nav class="menu-tabs" aria-label="Menu sections"><button type="button" data-tab="loadout">Equipment</button><button type="button" data-tab="motion">Animations</button><button type="button" data-tab="settings">Settings</button></nav><div class="menu-panels"><section class="menu-panel" data-panel="loadout"><div class="menu-panel-heading"><span>01</span><div><h2>Equipment</h2><p>Arena, fighter and arsenal.</p></div></div><div class="menu-primary"></div><div class="menu-secondary"></div></section><section class="menu-panel" data-panel="motion" hidden><div class="menu-panel-heading"><span>02</span><div><h2>Movement</h2><p>Customize movement timing and behavior.</p></div></div><div class="menu-motion-grid"></div></section><section class="menu-panel" data-panel="settings" hidden><div class="menu-panel-heading"><span>03</span><div><h2>Settings</h2><p>Graphics, camera and interface.</p></div></div><div class="menu-settings-slot"></div></section></div>';
 setup.after(shell);shell.querySelector('.menu-settings-slot').append(graphics);graphics.open=true;graphics.querySelector('summary').hidden=true;
 const footer=document.createElement('div');footer.className='menu-footer';shell.after(footer);
 for(const id of ['weapon-controls','play','load-status','refresh-build','character-preview']){const node=document.getElementById(id);if(node)footer.append(node);}
 const animationLink=[...welcome.querySelectorAll(':scope>a')].find(link=>link.pathname.endsWith('/animation-workshop.html'));if(animationLink)footer.append(animationLink);
 const primary=shell.querySelector('.menu-primary'),secondary=shell.querySelector('.menu-secondary'),motion=shell.querySelector('.menu-motion-grid');
 const route=label=>{
  const control=label.querySelector('select,input');if(!control)return;
  label.classList.add('menu-field',`menu-field--${control.id}`);
  const target=LOADOUT_IDS.has(control.id)?(PRIMARY_IDS.has(control.id)?primary:secondary):motion;
  target.append(label);if(control.matches('select'))enhanceSelect(control);
 };
 for(const label of [...setup.querySelectorAll(':scope>label')])route(label);
 setup.classList.add('menu-staging');
 installInventoryMenu(shell);
 const tabs=[...shell.querySelectorAll('[data-tab]')],panels=[...shell.querySelectorAll('[data-panel]')];
 const show=name=>{for(const button of tabs){const active=button.dataset.tab===name;button.classList.toggle('is-selected',active);button.setAttribute('aria-selected',String(active));}for(const panel of panels)panel.hidden=panel.dataset.panel!==name;};
 for(const button of tabs)button.onclick=()=>show(button.dataset.tab);show('loadout');
 const observer=new MutationObserver(mutations=>{
  for(const mutation of mutations){
   for(const node of mutation.addedNodes)if(mutation.target===setup&&node.nodeType===1&&node.matches?.('label'))route(node);
   const select=mutation.target.matches?.('select')?mutation.target:mutation.target.closest?.('select');if(select)enhanceSelect(select);
  }
 });
 observer.observe(setup,{childList:true});
 for(const select of shell.querySelectorAll('select')){observer.observe(select,{childList:true,attributes:true,attributeFilter:['disabled'],subtree:true});select.addEventListener('change',()=>enhanceSelect(select));}
 return {show};
}
