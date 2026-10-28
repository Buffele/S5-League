// Legacy ENEMY_STATUS_GroupBox, gui/new/maingame_ingame.xui:8374–8451.
// Position/projection and native targeting policy belong to the caller.
export const S4_OPPONENT_HEALTH_LAYOUT=Object.freeze({
 source:'gui/new/maingame_ingame.xui',panel:'ENEMY_STATUS_GroupBox',
 width:85,height:26,name:Object.freeze({left:-213,top:-6,width:512,height:20,font:'2002_12'}),
 bar:Object.freeze({left:10,top:15,width:64,height:5,margin:1}),
 fillTime:2000,afterFillTime:2000,afterFillWaitTime:500,afterFillVisibleAnimTime:30
});
export const S4_OPPONENT_HEALTH_ASSETS=Object.freeze({
 background:'/assets/s5runtime/modes-ui/gui/new/black.png',
 enemy:'/assets/s5runtime/modes-ui/gui/new/red.png',
 ally:'/assets/s5runtime/modes-ui/gui/new/green.png',
 spectate:'/assets/s5runtime/modes-ui/gui/new/white.png',font:'/assets/s5runtime/ui/2002.ttf'
});

/** A single reusable plate. No timers, listeners, game-state mutations or projections. */
export function createS4OpponentHealthUi({document:doc=globalThis.document,container=doc?.body}={}){
 if(!doc?.createElement||!container?.append)throw new TypeError('Opponent health UI requires a DOM container');
 const element=doc.createElement('div'),nameElement=doc.createElement('span'),number=doc.createElement('b'),bar=doc.createElement('div'),fill=doc.createElement('i');
 element.className='enemy-health s4-opponent-health';element.hidden=true;
 element.dataset.s4Ui='opponent-health';nameElement.className='s4-opponent-name';
 bar.className='s4-opponent-bar';fill.className='s4-opponent-fill';number.className='s4-opponent-number';
 number.setAttribute('aria-hidden','true');bar.setAttribute('aria-hidden','true');bar.append(fill);element.append(nameElement,number,bar);container.append(element);
 let disposed=false;const cache=new Map();
 function write(key,value,apply){if(cache.has(key)&&cache.get(key)===value)return;cache.set(key,value);apply(value);}
 function update({hp,maxHp,name='',team='',relation='enemy',visible=true,dead=false,x,y}={}){
  if(disposed)return false;
  const valid=Number.isFinite(hp)&&Number.isFinite(maxHp)&&maxHp>0;
  const positioned=Number.isFinite(x)&&Number.isFinite(y);
  const hidden=!visible||dead||!valid||!positioned;
  write('hidden',hidden,value=>{element.hidden=value;});
  // Missing health is not shown as zero, and numeric health remains accessible
  // without adding a visible number that is absent from the source panel.
  const label=String(name??''),kind=relation==='ally'||relation==='spectate'?relation:'enemy';
  write('name',label,value=>{nameElement.textContent=value;});
  write('team',String(team??''),value=>{element.dataset.team=value;});
  write('relation',kind,value=>{element.dataset.relation=value;});
  if(valid){
   const ratio=Math.min(1,Math.max(0,hp/maxHp));
   write('fill',ratio,value=>{fill.style.transform=`scaleX(${value})`;});
   write('label',`${label||'Opponent'}: ${Math.max(0,hp)} / ${maxHp} HP`,value=>element.setAttribute('aria-label',value));
   write('number',`${hp} / ${maxHp}`,value=>{number.textContent=value;});
   write('hp',String(hp),value=>{element.dataset.hp=value;});
   write('maxHp',String(maxHp),value=>{element.dataset.maxHp=value;});
  }
  if(positioned)write('position',`${x},${y}`,()=>{element.style.transform=`translate(-50%,-100%) translate(${x}px,${y}px)`;});
  return !hidden;
 }
 function dispose(){if(disposed)return;disposed=true;cache.clear();element.remove();}
 return {element,nameElement,number,bar,fill,update,dispose};
}
