// Web layout adaptation, not a recovered native notification position.
// The host still owns the message, opacity, transition and 1400 ms lifetime.
export const S4_NOTICE_OBSTACLES=Object.freeze([
 '#hud','#weapon','#weapon-picker','#fireball-hud','#crosshair','#fps-counter',
 '#weapon-name','#weapon-description','.s4-equipment-status',
 '.td-scoreboard','.td-objective','.td-announcement','.match-roster','.match-feed','.td-local',
 '.s4-practice-board','.s4-practice-session-objective','.s4-practice-session-status',
 '.s4-practice-limits','.s4-practice-actions',
 '.ch-score-panel','.ch-round-panel','.ch-notice','.ch-point-feed','.ch-roster','.ch-result-card',
 '.s4-opponent-health','.s4-opponent-name',
]);
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
const finite=value=>Number.isFinite(value);
const valid=rect=>rect&&[rect.left,rect.top,rect.width,rect.height].every(finite)&&rect.width>0&&rect.height>0;
// Browser zoom can report 366 CSS px as 366.0000305. This is coordinate
// roundoff, not a covered strip. A real 0.001 px overlap still fails.
export const S4_NOTICE_GEOMETRY_EPSILON=0.0001;
const area=(a,b)=>{
 const width=Math.max(0,Math.min(a.left+a.width,b.left+b.width)-Math.max(a.left,b.left));
 const height=Math.max(0,Math.min(a.top+a.height,b.top+b.height)-Math.max(a.top,b.top));
 return width>S4_NOTICE_GEOMETRY_EPSILON&&height>S4_NOTICE_GEOMETRY_EPSILON?width*height:0;
};

// Search the boundaries of every forbidden rectangle, not arbitrary sample
// points. If the viewport is saturated, report the least-overlapping option;
// never silently suppress a useful message or an action to make it fit.
export function chooseS4NoticePlacement({viewport,width,height,obstacles=[],margin=12,gap=8}){
 if(!valid({left:0,top:0,width:viewport?.width,height:viewport?.height})||!finite(width)||!finite(height)||width<=0||height<=0)return null;
 const maximumX=Math.max(margin,viewport.width-width-margin),maximumY=Math.max(margin,viewport.height-height-margin);
 const targetX=(viewport.width-width)/2,targetY=clamp(viewport.height*.32,230,320);
 const forbidden=obstacles.filter(valid).map(rect=>({...rect,left:rect.left-gap,top:rect.top-gap,width:rect.width+2*gap,height:rect.height+2*gap}));
 const xs=new Set([margin,maximumX,clamp(targetX,margin,maximumX)]),ys=new Set([margin,maximumY,clamp(targetY,margin,maximumY)]);
 for(const rect of forbidden){xs.add(clamp(rect.left-width,margin,maximumX));xs.add(clamp(rect.left+rect.width,margin,maximumX));ys.add(clamp(rect.top-height,margin,maximumY));ys.add(clamp(rect.top+rect.height,margin,maximumY));}
 let best=null;
 for(const left of xs)for(const top of ys){
  const rect={left,top,width,height},overlaps=forbidden.filter(item=>area(rect,item)>0),overlapArea=overlaps.reduce((sum,item)=>sum+area(rect,item),0);
  const outside=left<margin-S4_NOTICE_GEOMETRY_EPSILON||top<margin-S4_NOTICE_GEOMETRY_EPSILON||left+width>viewport.width-margin+S4_NOTICE_GEOMETRY_EPSILON||top+height>viewport.height-margin+S4_NOTICE_GEOMETRY_EPSILON;
  const outsideArea=outside?Math.max(0,width*height-area(rect,{left:margin,top:margin,width:Math.max(0,viewport.width-2*margin),height:Math.max(0,viewport.height-2*margin)})):0;
  const cost=overlapArea+outsideArea,distance=Math.abs(left-targetX)+Math.abs(top-targetY);
  if(!best||cost<best.cost||(cost===best.cost&&distance<best.distance))best={...rect,cost,distance,overlapArea,outsideArea,overlaps:overlaps.map(item=>item.id??'panel'),safe:cost===0};
 }
 return best;
}

export function installS4IngameNotices({document=globalThis.document,window=document?.defaultView??globalThis.window}={}){
 const toast=document?.getElementById('toast');
 if(!toast||!window)return {place:()=>null,suspend(){},dispose(){}};
 let disposed=false,armed=false,bodySubscribed=false,subscribed=false,frame=null,last=null;
 const propertyNames=['--s4-notice-left','--s4-notice-top','--s4-notice-width'];
 const previousStyles=propertyNames.map(name=>[name,toast.style.getPropertyValue(name),toast.style.getPropertyPriority(name)]);
 const attributeNames=['data-s4-notice-managed','data-s4-notice-placement','data-s4-notice-overlaps','role','aria-live'];
 const previousAttributes=attributeNames.map(name=>[name,toast.getAttribute(name)]);
 toast.dataset.s4NoticeManaged='true';
 if(!toast.hasAttribute('role'))toast.setAttribute('role','status');
 if(!toast.hasAttribute('aria-live'))toast.setAttribute('aria-live','polite');
 const set=(name,value)=>{if(toast.style.getPropertyValue(name)!==value)toast.style.setProperty(name,value);};
 const roots=new Set(),panels=new Set();
 const requestedOrVisible=()=>Number(toast.style.opacity)>0||Number(window.getComputedStyle(toast).opacity)>0;
 const active=()=>armed&&!disposed&&document.body.classList.contains('in-game')&&!!toast.textContent&&requestedOrVisible();
 const queue=()=>{if(active()&&frame===null)frame=window.requestAnimationFrame(()=>{frame=null;if(active())place();});};
 const observer=window.ResizeObserver?new window.ResizeObserver(queue):null;
 const mutations=window.MutationObserver?new window.MutationObserver(records=>{
  // Runtime renderers may set an unchanged data-phase every frame. Such writes
  // do not change layout and must not become a notification measurement loop.
  if(!records||records.some(record=>record.type==='childList'||record.target.getAttribute(record.attributeName)!==record.oldValue))queue();
 }):null;
 const observeBody=()=>{if(!bodySubscribed){mutations?.observe(document.body,{attributes:true,attributeOldValue:true,attributeFilter:['class'],childList:true});bodySubscribed=true;}};
 function visible(node){
  if(node.closest('[hidden]'))return false;
  for(let current=node;current&&current!==document.body;current=current.parentElement){
   const style=window.getComputedStyle(current);
   if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse'||/^inset\(50%(?: 50%){0,3}\)$/.test(style.clipPath??''))return false;
   // A newly shown WAAPI announcement may still be at its first opacity0
   // keyframe. Reserve its imminent bounds immediately, without polling the
   // animation or treating genuinely concealed, inactive panels as obstacles.
   if(Number(style.opacity)===0&&!current.getAnimations?.().some(animation=>animation.playState==='running'||animation.pending===true))return false;
  }
  return node.getClientRects().length>0;
 }
 function collect(){
  if(!subscribed){observer?.observe(toast);observeBody();subscribed=true;}
  const nodes=[...document.querySelectorAll(S4_NOTICE_OBSTACLES.join(','))];
  const next=new Set(nodes);
  for(const panel of panels)if(!next.has(panel)){observer?.unobserve(panel);panels.delete(panel);}
  for(const panel of nodes)if(!panels.has(panel)){panels.add(panel);observer?.observe(panel);}
  const nextRoots=new Set(document.querySelectorAll('#touchdown-ui,#match-ui,#practice-session,#hud,#weapon-picker,.s4-opponent-health'));
  if(nextRoots.size!==roots.size||[...nextRoots].some(root=>!roots.has(root))){
   mutations?.disconnect();bodySubscribed=false;roots.clear();observeBody();
   for(const root of nextRoots){
    roots.add(root);
    const filter=['hidden','class','data-phase','data-result','open'];
    // Projected opponent plates move by transform, without resizing. Observe
    // only these styles; queue still refuses all work while the toast is hidden.
    if(String(root.className).split(/\s+/).includes('s4-opponent-health'))filter.push('style');
    mutations?.observe(root,{attributes:true,attributeOldValue:true,subtree:true,attributeFilter:filter});
   }
  }
  return nodes.filter(visible).map((node,index)=>{const rect=node.getBoundingClientRect();return {id:node.id?'#'+node.id:'.'+String(node.className).trim().split(/\s+/)[0]+':'+index,left:rect.left,top:rect.top,width:rect.width,height:rect.height};}).filter(valid);
 }
 function place(){
  if(disposed||!toast.textContent)return null;
  if(!document.body.classList.contains('in-game')){
   // captureMouse can request the camera notice before the main frame adds
   // in-game. Watch only body until that entry; do not retain a stale safe
   // placement or subscribe to menu/old-match panels in the meantime.
   const pending=requestedOrVisible();suspend();
   if(pending){armed=true;observeBody();last=null;toast.dataset.s4NoticePlacement='pending';toast.dataset.s4NoticeOverlaps='[]';}
   return null;
  }
  armed=true;
  const viewport={width:window.innerWidth,height:window.innerHeight},obstacles=collect();
  const available=Math.max(1,viewport.width-24),widths=[Math.min(420,available),Math.min(300,available),Math.min(220,available)];
  let chosen=null;
  for(const width of new Set(widths)){
   set('--s4-notice-width',width+'px');
   const measured=toast.getBoundingClientRect();
   const result=chooseS4NoticePlacement({viewport,width:measured.width,height:measured.height,obstacles});
   if(result&&(!chosen||result.cost<chosen.cost))chosen=result;
   if(result?.safe){chosen=result;break;}
  }
  if(!chosen)return null;
  set('--s4-notice-width',chosen.width+'px');set('--s4-notice-left',chosen.left+'px');set('--s4-notice-top',chosen.top+'px');
  toast.dataset.s4NoticePlacement=chosen.safe?'safe':'constrained';toast.dataset.s4NoticeOverlaps=JSON.stringify(chosen.overlaps);
  last=chosen;return chosen;
 }
 window.addEventListener('resize',queue);
 window.visualViewport?.addEventListener('resize',queue);
 function suspend(){
  armed=false;
  if(frame!==null){window.cancelAnimationFrame(frame);frame=null;}
  observer?.disconnect();mutations?.disconnect();panels.clear();roots.clear();subscribed=false;bodySubscribed=false;
 }
 function dispose(){
  if(disposed)return;suspend();disposed=true;
  window.removeEventListener('resize',queue);window.visualViewport?.removeEventListener('resize',queue);window.removeEventListener('pagehide',onPageHide);
  for(const [name,value,priority]of previousStyles)value?toast.style.setProperty(name,value,priority):toast.style.removeProperty(name);
  for(const [name,value]of previousAttributes)value===null?toast.removeAttribute(name):toast.setAttribute(name,value);
 }
 function onPageHide(event){if(!event.persisted)dispose();}
 window.addEventListener('pagehide',onPageHide);
 return {place,suspend,dispose,get lastPlacement(){return last;}};
}
