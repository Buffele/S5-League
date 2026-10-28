// Opt-in main-game fixture. Buttons step the real controller, mixer, contact
// solver and effects; setup is explicit and does not certify native fidelity.
import {Vector3} from 'three';
import {localDirection} from './motion-graph.js';
import {rifleRuntimePose} from './rifle-runtime.js';

export function installPrimaryRifleQA({controller,combat,motionGraph,getAvatar,getAudio,getEffects=()=>[],animate,resetPose,selectWeapon}){
 if(!combat)throw Error('Primary rifle QA requires the main combat adapter');
 const weapons=['handgun','assaultrifle','burstshotgun','revolver','semirifle','smashrifle','heavymachinegun'];
 const panel=document.createElement('aside');panel.id='primary-rifle-qa';
 panel.style.cssText='position:fixed;bottom:65px;left:8px;z-index:35;background:#102236ef;color:white;padding:8px;border-radius:8px;width:230px;font:11px Arial';
 const details=document.createElement('details');details.open=true;
 const summary=document.createElement('summary');summary.textContent='Vérification des armes';details.append(summary);
 const select=document.createElement('select');select.id='primary-rifle-qa-weapon';
 for(const id of weapons){const option=document.createElement('option');option.value=id;option.textContent=id;select.append(option);}
 select.value=controller.weapon;details.append(select);
 const controls=document.createElement('div');controls.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4px;max-height:230px;overflow:auto;margin-top:5px';details.append(controls);
 const output=document.createElement('output');output.style.cssText='display:block;font-size:10px;margin-top:5px';panel.append(details,output);document.body.append(panel);
 document.getElementById('welcome').hidden=true;
 let history=[],fixture=null,swap=null,events=[],elapsedMs=0;
 const target=()=>({x:combat.enemy.position.x,y:combat.enemy.position.y+1.3,z:combat.enemy.position.z});
 const step=(dt,input={})=>{const ev=combat.tick(dt,{facing:0,...input});elapsedMs+=dt*1000;events.push(...ev);getAudio()?.events(ev,controller.attack,controller);motionGraph.events(ev);animate(dt);};
 // Fixture durations are whole milliseconds. Subdivide in integer ms so an
 // intended 2999+1 boundary is not 2999.999999999998 from accumulated seconds.
 const advance=(seconds,input={})=>{const durationMs=Math.round(seconds*1000);let elapsedMs=0,index=0;while(elapsedMs<durationMs){const dtMs=Math.min(8,durationMs-elapsedMs);step(dtMs/1000,typeof input==='function'?input(index,elapsedMs/1000):input);elapsedMs+=dtMs;index++;}};
 const reset=()=>{
  controller.reset();motionGraph.reset();combat.reset();combat.setMode('passive');events=[];fixture=null;swap=null;elapsedMs=0;
  controller.position={x:0,y:0,z:0};controller.facing=0;combat.enemy.position={x:0,y:0,z:5};combat.avatar.group.visible=true;
  getAvatar().prepareSwitch();animate(0);resetPose();
 };
 const report=label=>{
  const avatar=getAvatar(),rifle=controller.rifle;
  avatar.group.updateWorldMatrix(true,true);
  const direction=localDirection(controller.velocity.x,controller.velocity.z,controller.facing);
  const moving=Math.hypot(controller.velocity.x,controller.velocity.z)>.25,pose=rifle?rifleRuntimePose(controller.weapon,rifle,direction,moving,avatar.sex):null;
  const muzzle=rifle?[...avatar.bones].find(([name])=>name.endsWith(rifle.muzzle))?.[1]:null;
  const meshes=avatar.meshes.filter(mesh=>mesh.userData.weapon);
  const record={label,sex:avatar.sex,weapon:controller.weapon,phase:rifle?.phase,ammo:rifle?.ammo,capacity:rifle?.capacity,reserve:rifle?.reserve===Infinity?'Infinity':rifle?.reserve,
   shots:rifle?.shotSerial,clip:avatar.clip,pose,direction,moving,activeClips:[...avatar.actions.values()].filter(action=>action.isRunning()&&action.getEffectiveWeight()>0).map(action=>({clip:action.getClip().name,weight:action.getEffectiveWeight(),time:action.time})),position:{...controller.position},velocity:{...controller.velocity},hp:combat.enemyState.hp,reaction:combat.enemyState.reaction,
   locked:combat.enemyState.locked,enemyPosition:{...combat.enemy.position},muzzle:muzzle?.getWorldPosition(new Vector3()).toArray()??null,
   hmgFiring:getEffects().find(effect=>effect.firingState)?.firingState()??null,
   equipment:meshes.map(mesh=>({name:mesh.name,visible:mesh.visible,position:mesh.getWorldPosition(new Vector3()).toArray()})),
   finite:[...avatar.bones.values(),...meshes].every(node=>node.matrixWorld.elements.every(Number.isFinite)),
   contacts:(rifle?.lastShot?.contacts??(rifle?.lastShot?.contact?[rifle.lastShot.contact]:[])).map(c=>({hit:c.hit,wall:c.wall,damage:c.damage,projectileId:c.projectileId??null,nativePushApplied:c.nativePushApplied??null})),
   events:[...events],elapsedMs,fixture,swap,audio:{state:getAudio()?.context?.state??'locked',decoded:[...(getAudio()?.buffers.keys()??[])],missing:[...(getAudio()?.missingFiles??[])],activeSources:getAudio()?.sources.size??0,activeKeys:[...(getAudio()?.sources??[])].map(source=>getAudio().sourceKeys.get(source))},blastDispatch:getEffects().find(effect=>effect.lastBlastDispatchReport)?.lastBlastDispatchReport??null,nativeCompared:false};
  history.push(record);panel.dataset.last=JSON.stringify(record);panel.dataset.results=JSON.stringify(history);output.textContent=`${label} · ${record.weapon} · ${record.ammo}/${record.capacity} · HP ${record.hp}`;
  resetPose();return record;
 };
 const add=(label,run)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.style.cssText='font:10px Arial;padding:6px;border:0;border-radius:4px;cursor:pointer;min-width:0;white-space:normal;margin:0';button.onclick=()=>{try{events=[];run();report(label);}catch(error){panel.dataset.error=error.message;output.textContent=error.message;throw error;}};controls.append(button);};
 select.onchange=()=>{reset();if(!selectWeapon(select.value))throw Error('Main equipment switch rejected');reset();report('Équipement');};
 add('Repos',reset);
 const directions={front:[0,1],rightFront:[-1,1],right:[-1,0],rightBack:[-1,-1],back:[0,-1],leftBack:[1,-1],left:[1,0],leftFront:[1,1]};
 for(const [direction,[x,z]] of Object.entries(directions))add(`Course ${direction}`,()=>{reset();advance(.4,{x,z});});
 add('Retour au repos',()=>advance(.4));
 const shot=(seconds,extra={})=>{reset();advance(seconds??(controller.weapon==='heavymachinegun'?1.1:controller.weapon==='assaultrifle'?.12:.25),(i)=>({light:true,lightPressed:i===0,aimTarget:target(),...extra}));};
 add('Avant départ du tir',()=>shot(controller.weapon==='assaultrifle'?.005:.08));
 add('Tir réel',()=>shot());
 add('Tir en mouvement',()=>shot(undefined,{x:-1,z:1}));
 add('Tir maintenu',()=>shot(controller.weapon==='heavymachinegun'?4.1:.4));
 for(const [label,pitch] of [['Visée haute',.8],['Visée basse',-.8]])add(label,()=>{
  reset();combat.enemy.position={x:0,y:Math.tan(pitch)*20,z:20};
  advance(controller.weapon==='heavymachinegun'?1.1:controller.weapon==='assaultrifle'?.12:.25,i=>({light:true,lightPressed:i===0,aimPitch:pitch,aimTarget:target()}));
 });
 const reload=()=>{reset();controller.rifle.ammo=controller.rifle.capacity-2;fixture={type:'reload-ammo',seededAmmo:controller.rifle.ammo};step(.008,{reload:true});};
 add('Recharge mobile',()=>{reload();advance(.4,{x:-1,z:1});});
 const reloadMs=()=>({handgun:3000,assaultrifle:2000,burstshotgun:2500,revolver:3000,semirifle:2000,smashrifle:2000,heavymachinegun:5000}[controller.weapon]);
 add('Avant fin recharge',()=>{reload();advance((reloadMs()-1)/1000,{x:-1,z:1});});
 add('Fin recharge',()=>advance(.001,{x:-1,z:1}));
 const spend=()=>{shot();advance(.6);};
 add('Changer et revenir',()=>{
  spend();const weapon=controller.weapon,before=controller.rifle.ammo;
  if(!selectWeapon('dagger')||!selectWeapon(weapon))throw Error('Main equipment round-trip rejected');
  swap={before,after:controller.rifle.ammo,via:'dagger'};
 });
 add('Annuler recharge',()=>{
  spend();step(.008,{reload:true});advance(.2);const weapon=controller.weapon,before=controller.rifle.ammo;
  if(!selectWeapon('dagger')||!selectWeapon(weapon))throw Error('Main reload cancellation switch rejected');
  swap={before,after:controller.rifle.ammo,via:'dagger',reloadCancelled:controller.rifle.phase==='idle'};
 });
 add('Nouvelle partie',reset);
 const audioButton=document.createElement('button');audioButton.type='button';audioButton.textContent='Activer audio';audioButton.onclick=async()=>{panel.dataset.audioPending='true';try{await getAudio().unlock();report('Audio prêt');}finally{delete panel.dataset.audioPending;}};controls.append(audioButton);
 reset();report('Prêt');return {panel,dispose:()=>panel.remove()};
}
