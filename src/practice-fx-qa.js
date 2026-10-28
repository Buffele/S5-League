import * as THREE from 'three';
// Explicit visual fixture in the main renderer. This does not produce native
// perception, attacks, damage, points or results, and never runs in normal play.
export function installPracticeFxQA({getSession,setCamera,document:doc=globalThis.document}={}){
 if(typeof getSession!=='function'||getSession()?.state?.mode!=='practice'||getSession()?.active!==true||typeof setCamera!=='function')throw Error('Active Practice session and camera placement required');
 const panel=doc.createElement('section');panel.id='practice-fx-qa';panel.setAttribute('aria-label','Arranged Practice source effects');
 panel.style.cssText='position:fixed;left:12px;top:120px;z-index:65;max-width:260px;background:#102435ee;color:white;padding:8px;font:12px system-ui';
 const title=doc.createElement('strong');title.textContent='Arranged source FX · AI unverified';panel.append(title);
 const out=doc.createElement('output');out.id='practice-fx-qa-state';out.style.display='block';
 let kind='waiting',timeMs=1300,view='front',actor=null,owner=null,disposed=false;const buttons=[];
 function current(){if(disposed)return null;const session=getSession();if(session?.state?.mode==='practice'&&session.active===true&&session.adapter?.pool&&session.effects)return session;out.dataset.observation='null';out.textContent='Practice fixture unavailable';return null;}
 function publish(){const session=current();if(!session)return;const report={fixture:true,nativeAttackProduced:false,kind,timeMs,view,mapId:session.world.nativeMapId,actorId:owner===session?actor?.id:null,generation:owner===session?actor?.generation:null,effects:session.effects.snapshot(),culling:session.effects.staticFrustumReport()};out.dataset.observation=JSON.stringify(report);out.textContent=`Map ${report.mapId} · ${kind} · ${timeMs} ms · ${view}`;}
 function place(){
  const session=current();if(!session)return;if(owner!==session||!session.adapter.pool.includes(actor)||actor.released){out.textContent='Choose Waiting blue or Attack red to arrange this session';return;}
  const center=actor.model.bounds().getCenter(new THREE.Vector3()),position=center.clone(),target=center.clone();
  if(view==='near')position.add(new THREE.Vector3(.1,.05,.15));
  else{position.add(new THREE.Vector3(0,1,7));if(view==='edge')target.x+=4.9;if(view==='outside')target.x+=100;}
  setCamera(position,target);publish();
 }
 function arrange(){
  const session=current();if(!session)return;
  // Reset the real generation/SEQ owner, then sample an explicit source clock.
  session.reset();actor=session.adapter.spawnNotification(1000);owner=session;
  if(!actor)throw Error('Actual source Sentry allocation required');
  const p=session.player.position;actor.model.setNativePosition({x:p.x/.006,y:(p.y+60)/.006,z:p.z/.006});
  actor.driver?.applyState(kind==='attack'?3:1,{gate6c:false});
  session.effects.stopOwner(actor.id,actor.generation);
  const result=session.effects.cue({type:'sequence',operation:'start',actorId:actor.id,actorGeneration:actor.generation,resource:`effects/skill_hacker_sentrygun_2_${kind}.seq`});
  if(result.status!=='original-node-sequence-started')throw Error('Actual source sequence was not started');
  session.effects.endTick(session.effects.beginTick(),timeMs);session.render(0);place();
 }
 function button(label,action){const b=doc.createElement('button');b.type='button';b.textContent=label;b.style.cssText='min-height:30px;margin:3px;width:auto;display:inline-block;font:12px system-ui;padding:3px 6px';b.onclick=e=>{e.stopPropagation();if(!disposed)action();};b.onpointerdown=e=>e.stopPropagation();buttons.push(b);panel.append(b);}
 button('Waiting blue',()=>{kind='waiting';arrange();});button('Attack red',()=>{kind='attack';arrange();});
 for(const ms of [0,100,1300,4900])button(`FX ${ms} ms`,()=>{timeMs=ms;arrange();});
 for(const name of ['front','edge','near','outside'])button(`View ${name}`,()=>{view=name;place();});
 function dispose(){if(disposed)return;disposed=true;for(const b of buttons){b.disabled=true;b.onclick=null;b.onpointerdown=null;}panel.remove();}
 button('Read arranged FX',publish);panel.append(out);doc.body.append(panel);try{arrange();}catch(error){dispose();throw error;}
 return {dispose};
}
