// Explicit opt-in test placement. Ordinary sessions do not install this UI.
export function installS5TouchdownRespawnDiagnostic({document,read,placeInEnemyLaser,focus=()=>{}}){
 const panel=document.createElement('aside'),button=document.createElement('button'),output=document.createElement('output');
 panel.id='s5-touchdown-respawn-diagnostic';panel.style.cssText='position:fixed;right:16px;top:128px;z-index:61;max-width:260px;padding:10px;background:#092632ed;color:#eaffff;border:1px solid #70c6d0;font:12px system-ui';
 button.type='button';button.textContent='Place in enemy laser';button.style.cssText='min-height:44px;width:100%;margin-bottom:8px';output.id='s5-touchdown-respawn-observation';output.setAttribute('aria-label','Touchdown respawn diagnostic');output.setAttribute('role','status');panel.append(button,output);document.body.append(panel);
 let disposed=false,request=null,previousKey=null,error=null;const transitions=[];
 const eligible=state=>state.ready&&state.active&&state.mode==='touchdown'&&state.phase==='playing'&&state.playerControl&&!state.dead;
 function refresh(){
  if(disposed)return;
  const current=read(),key=[current.resetSerial,current.dead,current.phase,current.playerControl].join('/');button.disabled=!eligible(current);
  if(request&&key!==previousKey){transitions.push({...current,position:current.position?{...current.position}:null});if(transitions.length>32)transitions.shift();}previousKey=key;
  output.dataset.observation=JSON.stringify({arrangedPlacement:true,request,current,transitions,error});
  output.textContent=error||`Diagnostic placement · HP ${current.hp??'—'} · ${current.dead?'ELIMINATED':current.active?'PLAYING':'ENTER MATCH'} · control ${current.playerControl?'available':'locked'}`;
 }
 function place(){
  if(disposed||!eligible(read()))return;
  try{error=null;request=placeInEnemyLaser();transitions.length=0;previousKey=null;focus();}catch(reason){error=reason.message;}
  refresh();
 }
 button.addEventListener('click',place);refresh();
 return {refresh,dispose(){if(disposed)return;disposed=true;button.removeEventListener('click',place);panel.remove();}};
}
