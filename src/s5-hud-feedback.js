const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));

/** A delayed damage trail, driven by the presentation clock; no timers or game mutation. */
export function createResourceTrail({delay=180,decay=8}={}){
 let value=null,lastTime=null,holdUntil=0,lastTarget=0;
 return {reset(){value=null;lastTime=null;holdUntil=0;},update(target,now){
  target=clamp(target);const dt=lastTime===null?0:Math.min(.1,Math.max(0,(now-lastTime)/1000));lastTime=now;
  if(value===null||target>=value){value=target;holdUntil=0;}
  else if(target<lastTarget)holdUntil=now+delay;
  if(now>=holdUntil)value=target+(value-target)*Math.exp(-decay*dt);
  if(Math.abs(value-target)<.001)value=target;lastTarget=target;return value;
 }};
}

export function clockSeconds(text){
 const value=String(text??'').trim();
 if(/^\d+:\d{2}$/.test(value)){const [m,s]=value.split(':').map(Number);return m*60+s;}
 return /^\d+$/.test(value)?Number(value):null;
}

/** Bounded, event-driven feedback on the existing live labels. */
export function createHudFeedback({document:doc,host,weapon}){
 const reduced=doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
 const animations=new Map(),hpTrail=createResourceTrail(),spTrail=createResourceTrail({delay:70,decay:12});
 let previous=null,hitUntil=0,lastRoot=null,labels=[],disposed=false;
 const paint=(key,value)=>{if(host.style?.getPropertyValue(key)!==String(value))host.style?.setProperty(key,String(value));};
 const pulse=(node,frames,duration)=>{
  if(!node?.animate||reduced?.matches)return;
  animations.get(node)?.cancel();
  const animation=node.animate(frames,{duration,easing:'cubic-bezier(.16,1,.3,1)'});animations.set(node,animation);
  animation.onfinish=()=>{if(animations.get(node)===animation)animations.delete(node);};
 };
 function reset(){for(const animation of animations.values())animation.cancel();animations.clear();hpTrail.reset();spTrail.reset();previous=null;hitUntil=0;for(const label of labels)label.previous=null;host.classList.remove('s5-damaged');weapon.classList.remove('s5-reloading','s5-low-ammo');}
 return {update({visible=true,hp=null,maxHp=100,sp=0,maxSp=1,ammo=null,phase='',weaponKey='',now=performance.now()}){
  if(disposed)return;
  if(!visible){if(previous)reset();return;}
  const healthRatio=hp===null?0:clamp(hp/maxHp),spRatio=clamp(sp/maxSp);
  if(previous&&previous.maxHp!==maxHp){hpTrail.reset();previous=null;}
  if(previous&&hp!==null&&previous.hp!==null&&hp<previous.hp){hitUntil=now+240;pulse(doc.getElementById('hp-value'),[{color:'#ff6d82',transform:'translateX(2px)'},{color:'#f5f9ff',transform:'translateX(0)'}],260);}
  host.classList.toggle('s5-damaged',now<hitUntil);
  paint('--s5-hp-trail',reduced?.matches?healthRatio:hpTrail.update(healthRatio,now));paint('--s5-sp-trail',reduced?.matches?spRatio:spTrail.update(spRatio,now));
  const sameWeapon=previous?.weaponKey===weaponKey;
  if(sameWeapon&&ammo&&previous.ammo&&ammo.current<previous.ammo.current)pulse(weapon.querySelector?.('.s4-equipment-current'),[{opacity:.45,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],150);
  if(sameWeapon&&previous.phase==='reload'&&phase!=='reload'&&ammo?.current>previous.ammo?.current)pulse(weapon.querySelector?.('.s4-equipment-ammo'),[{color:'#75f3df',opacity:.5},{color:'#f5f9ff',opacity:1}],320);
  weapon.classList.toggle('s5-reloading',phase==='reload');weapon.classList.toggle('s5-low-ammo',!!ammo&&ammo.current===0);
  const root=doc.getElementById('match-ui')??doc.getElementById('touchdown-ui');
  if(root!==lastRoot){for(const label of labels){animations.get(label.node)?.cancel();animations.delete(label.node);}lastRoot=root;labels=[...root?.querySelectorAll?.('[data-left-score],[data-right-score],[data-score],[data-alpha],[data-beta],[data-br-leader-score],.ch-score-value,.ch-round-clock,[data-clock]')??[]].map(node=>({node,clock:node.matches('[data-clock],.ch-round-clock'),previous:null}));}
  for(const label of labels){const value=label.node.querySelector?.('.ch-readable-number')?.textContent??label.node.textContent;
   if(label.clock){const seconds=clockSeconds(value);label.node.classList.toggle('s5-clock-urgent',seconds!==null&&seconds>0&&seconds<=30);if(label.previous!==null&&value!==label.previous&&seconds>0&&seconds<=10)pulse(label.node,[{opacity:.45},{opacity:1}],300);}
   else if(label.previous!==null&&label.previous!==value)pulse(label.node,[{transform:'translateY(-5px) scale(1.12)',filter:'brightness(1.7)'},{transform:'translateY(0) scale(1)',filter:'brightness(1)'}],420);
   label.previous=value;
  }
  previous={hp,maxHp,ammo,phase,weaponKey};
 },reset,dispose(){if(disposed)return;reset();disposed=true;for(const label of labels)label.node.classList.remove('s5-clock-urgent');labels=[];}};
}
