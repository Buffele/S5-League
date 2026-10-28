// Explicit ?qa=modes only. Fixtures exercise the real map/combat adapters;
// repositioning is a test arrangement, not a claim of a completed native route.
import * as THREE from 'three';
import {laserBoxes} from './station2-touchdown.js';
import {installSiegeQA} from './siege-qa.js';
import {installS5QaSessionEntry} from './s5-qa-session-entry.js';
export function advanceModesQaSeconds(mode,seconds){
 // QA durations are authored in milliseconds. Keep an integer countdown so
 // repeated subtraction cannot send a fractional final tick to source timers.
 const requestedMs=seconds*1000,totalMs=Math.round(requestedMs);
 if(!Number.isSafeInteger(totalMs)||totalMs<0||!Number.isFinite(requestedMs)||Math.abs(requestedMs-totalMs)>1e-7)throw Error('QA duration requires whole milliseconds');
 for(let remainingMs=totalMs;remainingMs>0;){const dtMs=Math.min(8,remainingMs);mode.step(dtMs/1000,{});remainingMs-=dtMs;}
}
export function installModesQA({touchdown,match,combat,controller,world,avatar,animate,resetPose,chaserPresentation,startSession=null,roomEntry=false}){
 const mode=touchdown||match;if(!mode)throw Error('Modes QA requires an active mode');
 const panel=document.createElement('aside');panel.id='modes-qa';panel.style.cssText='position:fixed;top:100px;left:16px;z-index:25;background:#0b1a2bef;color:white;padding:12px;border-radius:10px;max-width:180px;font:11px Arial';
 panel.innerHTML='<b>Mode QA fixtures</b><div></div><output id="modes-qa-output" style="display:block;font-size:9px;margin-top:8px"></output>';
 document.body.append(panel);if(!roomEntry)document.getElementById('welcome').hidden=true;let history=[];
 panel.style.maxHeight='calc(100vh - 120px)';panel.style.overflowY='auto';panel.style.overflowX='hidden';
 const toggle=document.createElement('button');toggle.type='button';toggle.id='modes-qa-toggle';toggle.textContent='Hide QA controls';toggle.style.cssText='position:fixed;right:8px;bottom:110px;z-index:40;font:10px Arial;padding:6px;border:0;border-radius:5px';
 const showControls=show=>{panel.style.display=show?'':'none';toggle.textContent=show?'Hide QA controls':'Show QA controls';};
 toggle.onclick=()=>showControls(panel.style.display==='none');document.body.append(toggle);
 // Explicit room-entry QA keeps the real entry/lobby available. Fixtures only
 // appear over a running match, never over the joined room or its menus.
 let roomVisibility=null;
 if(roomEntry){roomVisibility=document.createElement('style');roomVisibility.textContent='body:not(.in-game) #modes-qa,body:not(.in-game) #modes-qa-toggle,body.room-results-open #modes-qa,body.room-results-open #modes-qa-toggle{display:none!important}';document.body.append(roomVisibility);}
 // Existing arrangements below remain fixtures. Entry is delegated to the
 // actual main Play handler, including its readiness/audio/input guards.
 panel.qaSessionEntry=installS5QaSessionEntry(panel.querySelector('div'),{startSession});
 const move=(actor,p)=>{actor.position={x:p.x,y:p.y,z:p.z};actor.velocity={x:0,y:0,z:0};actor.grounded=false;};
 const report=label=>{
  animate(.1);mode.render(.1,{visible:true});resetPose();avatar.group.updateMatrixWorld(true);
  chaserPresentation?.render(.1,{match,combat,avatar,visible:true});
  const state=mode.state,record={label,phase:state.phase,hp:mode.health.hp,scores:state.scores,owner:state.owner??null,ball:state.ball??null,half:state.half,round:state.round??null,chaser:state.chaser??null,outcome:state.outcome??null,players:state.players?[...state.players.values()]:null,position:{...controller.position},fumbiClip:world.fumbi?.animation.clip??null,finite:[...avatar.bones.values()].every(b=>b.matrixWorld.elements.every(Number.isFinite))};
  record.locked=mode.locked;record.scorerId=state.scorerId??null;record.fumbiPosition=world.fumbi?.position.toArray()??null;
  if(touchdown)record.recordedStatistics=Object.fromEntries(['local','bot'].map(id=>[id,state.participantStatistics(id)]));
  if(state.mode==='battleroyal'){record.leader=state.leader;record.remaining=state.remaining;record.pause=state.pause;record.winner=state.winner;record.bots=combat.bots.map(b=>({id:b.id,hp:b.health.hp,dead:b.health.dead,age:b.health.age,position:{...b.actor.position}}));record.nativeCounters=Object.fromEntries(state.ids.map(id=>[id,state.nativeCounters(id)]));}
  if(state.mode==='captain'){record.winner=state.winner;record.maxHp=mode.health.maxHp;record.captainCounts=state.captainCounts();record.bots=combat.bots.map(b=>({id:b.id,hp:b.health.hp,maxHp:b.health.maxHp,dead:b.health.dead,age:b.health.age,position:{...b.actor.position}}));record.nativeCounters=Object.fromEntries(state.ids.map(id=>[id,state.nativeCounters(id)]));}
  if(state.mode==='siege'){record.winner=state.winner;record.points=[...state.points.values()].map(p=>({...p,coreInside:[...p.coreInside],assistInside:[...p.assistInside]}));record.teamLedgers=state.teamLedgers;record.bots=combat.bots.map(b=>({id:b.id,hp:b.health.hp,maxHp:b.health.maxHp,dead:b.health.dead,age:b.health.age,position:{...b.actor.position}}));record.nativeCounters=Object.fromEntries(state.ids.map(id=>[id,state.nativeCounters(id)]));record.roleEffects=mode.roleEffects?.snapshot()??null;}
  if(state.mode==='siege'){record.holdingScores={...state.holdingScores};record.supplies=mode.supplies?.snapshot()??null;record.pickupEffects=mode.pickupEffects?.snapshot()??null;record.supplyAudio=mode.audioSnapshot?.()??null;}
  record.remaining=state.remaining;record.roundRemaining=state.roundRemaining??null;record.playingDelta=state.playingDelta??null;record.pause=state.pause;
  if(chaserPresentation){record.chaserClip=chaserPresentation.entity.animation.clip;record.chaserArm=chaserPresentation.entity.getObjectByName('Bip01 L UpperArm')?.quaternion.toArray();record.botPositions=combat.bots.map(b=>({id:b.id,position:{...b.actor.position}}));}
  history.push(record);panel.querySelector('output').textContent=`${label} · ${state.phase} · HP ${mode.health.hp}`;panel.dataset.results=JSON.stringify(history);panel.dataset.last=JSON.stringify(record);
 };
 const advancePause=()=>{const phase=mode.state.phase,count=Math.ceil(mode.state.pause/.008);for(let i=0;i<count;i++)mode.step(.008,{});if(mode.state.phase===phase&&mode.state.pause>0&&mode.state.pause<.008)mode.step(.008,{});};
 const advanceSeconds=seconds=>advanceModesQaSeconds(mode,seconds);
 const add=(label,run)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.style.cssText='display:block;width:100%;margin-top:6px;font-size:10px;padding:7px;background:#e1f5ec;color:#142735;border:0;border-radius:5px;cursor:pointer';button.onclick=()=>{try{run();report(label);}catch(error){panel.querySelector('output').textContent=`ÉCHEC ${label} : ${error.message}`;throw error;}};panel.querySelector('div').append(button);};
 if(touchdown){
  const pickup=(reset=true)=>{if(reset)mode.reset();combat?.setMode('passive');const p=touchdown.home();move(controller,{x:p.x,y:p.y-.4,z:p.z});touchdown.step(.008,{});mode.render(0,{visible:true});};
  add('Prise du Fumbi',pickup);
  // Explicit arranged lethal receiver fixtures. HP admission, defeat hooks,
  // possession/drop and UI run normally; this is not native combat footage
  // or a weapon hit-geometry comparison. No score/HP value is assigned.
  if(combat)for(const [label,holder]of [['TD : élimination ordinaire',null],['TD : attaque du porteur','local'],['TD : défense sur porteur','bot']])add(label,()=>{
   mode.reset();combat.setMode('passive');
   if(holder){const p=touchdown.home();move(holder==='local'?controller:combat.enemy,{x:p.x,y:p.y-.4,z:p.z});touchdown.step(.008,{});if(mode.state.owner?.id!==holder)throw Error('Spatial Fumbi pickup failed');}
   combat.enemyState.invincible=false;combat.receive(combat.enemy,combat.enemyState,combat.avatar,controller,{weapon:'handgun',kind:'shot',damage:1000});
  });
  // Explicit free-flight fixture: arrange a drop clear of all map surfaces.
  // It does not certify native drop placement, contact response or home Y.
  add('Fumbi : lâcher en hauteur',()=>{pickup();const p=touchdown.home();move(controller,{x:p.x,y:p.y+12,z:p.z});mode.manualRespawn();move(controller,{x:p.x,y:p.y-.4,z:p.z});});
  add('Chute Fumbi +80 ms',()=>{for(let i=0;i<5;i++)mode.step(.016,{});});
  add('Animation Fumbi +1,2 s',()=>{for(let i=0;i<150;i++)mode.render(.008,{visible:true});});
  add('Portage : courir/sauter',()=>{pickup();for(let i=0;i<45;i++){mode.step(.008,{x:1,z:0,facing:Math.PI/2,jump:i===0});animate(.008);mode.render(.008,{visible:true});}});
  add('Touchdown',()=>{pickup(mode.state.phase!=='playing');const enemy=touchdown.team==='alpha'?'beta':'alpha',p=touchdown.markerForTeam?touchdown.markerForTeam(enemy):touchdown.marker(enemy);move(controller,{x:p.x,y:p.y-1,z:p.z});touchdown.step(.008,{});touchdown.step(.5,{});});
  add('Célébration +2 s',()=>{for(let i=0;i<250;i++){mode.step(.008,{});animate(.008);mode.render(.008,{visible:true});}});
  add('Après but : déplacer',()=>{for(let i=0;i<80;i++){mode.step(.008,{x:touchdown.team==='alpha'?-1:1,z:0,facing:0,jump:i===0});animate(.008);mode.render(.008,{visible:true});}});
  add('Laser ennemi',()=>{pickup(mode.state.phase!=='playing');const enemy=touchdown.team==='alpha'?'beta':'alpha',side=touchdown.sideForTeam?touchdown.sideForTeam(enemy):enemy,module=touchdown.laserModule?touchdown.laserModule(side):world.modules.get(`${side}-lasers`),p=module.group.localToWorld(laserBoxes(module)[0].getCenter(new THREE.Vector3()));move(controller,{x:p.x,y:p.y-.9,z:p.z});touchdown.step(.008,{});});
  add('Laser allié',()=>{pickup(mode.state.phase!=='playing');const side=touchdown.sideForTeam?touchdown.sideForTeam(touchdown.team):touchdown.team,module=touchdown.laserModule?touchdown.laserModule(side):world.modules.get(`${side}-lasers`),p=module.group.localToWorld(laserBoxes(module)[0].getCenter(new THREE.Vector3()));move(controller,{x:p.x,y:p.y-.9,z:p.z});touchdown.step(.008,{});});
  add('Remise en jeu',()=>{for(let i=0;i<1300;i++)mode.step(.008,{});});
  add('Mi-temps',()=>{mode.reset();mode.state.remaining=.008;mode.step(.008,{});});
  add('Seconde période',()=>{mode.reset();mode.state.remaining=.008;mode.step(.008,{});advancePause();});
  // Arrange the last clock tick without replacing the accumulated ledger.
  // This is an S5 end-to-end result fixture, not an observed native ending.
  add('TD : fin sur points enregistrés',()=>{if(mode.state.phase!=='playing')throw Error('Touchdown playing phase required');mode.state.half=2;mode.state.remaining=.008;mode.step(.008,{});});
  add('Résultat',()=>{mode.reset();mode.state.half=2;mode.state.scores.alpha=2;mode.state.scores.beta=1;mode.state.remaining=.008;mode.step(.008,{});});
 }else{
  if(mode.state.mode==='siege')installSiegeQA({add,mode,controller,combat,advanceSeconds});
  if(mode.state.mode==='captain'){
   const start=()=>{mode.reset();combat.setMode('passive');};
   const record=id=>id==='local'?{actor:controller,health:combat.playerState,avatar}:combat.bots.find(b=>b.id===id);
   // Controlled receiver fixture; generic Élimination below exercises the
   // actual weapon input/contact solver on a1HP captain separately.
   const lethal=(victimId,killerId)=>{const target=record(victimId),source=record(killerId);target.health.invincible=false;combat.receive(target.actor,target.health,target.avatar,source.actor,{weapon:'revolver',kind:'shot',damage:10000});};
   const win=()=>{for(const bot of combat.bots)lethal(bot.id,'local');};
   add('Captain : rôle et santé',start);
   add('Captain : captain éliminé',()=>{start();lethal('bot','local');});
   add('Captain : réapparaître',()=>advanceSeconds(4.16));
   add('Captain : combattant éliminé',()=>{start();lethal('bot','local');advanceSeconds(4.16);lethal('bot','local');});
   add('Captain : fin manche',()=>{start();win();});
   add('Captain : décompte +0,5 s',()=>{if(mode.state.phase!=='intermission')throw Error('Captain intermission required');advanceSeconds(.5);});
   add('Captain : manche suivante',()=>{if(mode.state.phase==='intermission')advancePause();combat.setMode('passive');});
   add('Captain : suicide',()=>{start();combat.onFall(controller);});
   add('Captain : timeout',()=>{start();mode.state.remaining=.008;mode.step(.008,{});});
   add('Captain : classement',()=>mode.ui.setRoster(true));
   add('Captain : limite score',()=>{start();mode.state.scores[mode.team]=4;win();});
   add('Captain : résultat victoire',()=>{start();mode.state.scores[mode.team]=4;win();advanceSeconds(10.01);});
   add('Captain : résultat défaite',()=>{start();mode.state.scores[mode.team==='alpha'?'beta':'alpha']=4;combat.onFall(controller);advanceSeconds(10.01);});
  }
  if(mode.state.mode==='battleroyal'){
   const start=()=>{mode.reset();combat.setMode('passive');};
   const record=id=>id==='local'?{actor:controller,health:combat.playerState,avatar}:combat.bots.find(b=>b.id===id);
   // Controlled lethal receiver fixture: main-game damage/defeat hooks and
   // HP run normally. The separate generic Élimination uses real weapon input
   // and the contact solver; this fixture does not prove native hit geometry.
   const lethal=(victimId,killerId)=>{const victim=record(victimId),killer=record(killerId);victim.health.invincible=false;victim.health.hp=1;combat.receive(victim.actor,victim.health,victim.avatar,killer.actor,{weapon:'revolver',kind:'shot',damage:100});};
   const finish=()=>{mode.state.remaining=.008;mode.step(.008,{});for(let i=0;i<1251;i++)mode.step(.008,{});};
   add('BR : élimination ordinaire',()=>{start();lethal('bot','local');});
   add('BR : leader attaque',()=>{start();lethal('bot','local');lethal('bot2','local');});
   add('BR : leader éliminé',()=>{start();lethal('bot','local');lethal('local','bot2');});
   add('BR : bot contre bot',()=>{start();lethal('bot2','bot');});
   add('BR : suicide positif',()=>{start();lethal('bot','local');combat.onFall(controller);});
   add('BR : réapparaître',()=>{for(let i=0;i<520;i++)mode.step(.008,{});});
   add('BR : classement',()=>mode.ui.setRoster(true));
   add('BR : limite score',()=>{start();mode.state.players.get('local').score=49;lethal('bot','local');});
   add('BR : résultat victoire',()=>{start();lethal('bot','local');finish();});
   add('BR : résultat · 16 lignes (fixture UI)',()=>{
    start();lethal('bot','local');finish();
    // Presentation stress only: these result records are not spawned players
    // or an assertion about the native room capacity. Normal reset clears them.
    const state=mode.state,source=[...state.players.values()];
    for(let i=state.players.size;i<16;i++)state.players.set(`qa-result-${i}`,{...source[i%source.length],id:`qa-result-${i}`,name:`QA result ${i+1}`,score:0});
   });
   add('BR : résultat défaite',()=>{start();lethal('local','bot');finish();});
   add('BR : résultat égalité',()=>{start();finish();});
  }
  if(mode.state.mode==='chaser'){
   const start=()=>{mode.reset();chaserPresentation?.render(0,{match,combat,avatar,visible:true});const pause=mode.state.pause;advancePause();chaserPresentation?.render(pause,{match,combat,avatar,visible:true});combat.setMode('passive');};
   const place=()=>{const p=controller.position;move(combat.bots[0].actor,{x:p.x-3,y:p.y,z:p.z-4});move(combat.bots[1].actor,{x:p.x+2,y:p.y,z:p.z-5});combat.pauseTick(.008);};
   add('Vision : deux cibles',()=>{start();place();});
   add('Élimination bonus',()=>{start();combat.onFall(combat.bots.find(b=>b.id===mode.state.bonus).actor);});
   add('Élimination ordinaire',()=>{start();combat.onFall(combat.bots.find(b=>b.id!==mode.state.bonus).actor);});
   add('Chaser : éliminer tous',()=>{start();place();for(const bot of combat.bots)combat.receive(bot.actor,bot.health,bot.avatar,controller,{weapon:'revolver',kind:'shot',damage:100});});
   add('Après victoire : déplacer',()=>{for(let i=0;i<60;i++){mode.step(.008,{x:1,z:0,facing:Math.PI/2,jump:i===2});animate(.008);}});
   add('Vision : cible locale',()=>{start();mode.state.endRound('timeout');advancePause();advancePause();combat.setMode('passive');mode.state.bonus='local';mode.state.emit('target',{id:'local'});place();});
   add('Vision : Bot 2 Chaser',()=>{start();for(let i=0;i<2;i++){mode.state.endRound('timeout');advancePause();advancePause();}combat.setMode('passive');place();});
   add('Scores : meilleur hors Chaser',()=>{start();mode.state.award('local','normalPoints',100);mode.state.award('bot2','normalPoints',24);place();});
   add('Scores : changer de cible',()=>{const state=mode.state,id=state.survivors.find(id=>id!==state.bonus);if(state.phase==='playing'&&id){const best=Math.max(...[...state.players.values()].map(p=>p.score));state.award(id,'normalPoints',best-state.players.get(id).score+1);}});
   add('Caméra : survivant éliminé',()=>{start();mode.state.endRound('timeout');advancePause();advancePause();combat.setMode('passive');place();combat.onFall(controller);});
   add('Caméra : déplacer le Chaser',()=>{const bot=combat.bots.find(b=>b.id===mode.state.chaser);if(bot){const p=bot.actor.position;move(bot.actor,{x:p.x+4,y:p.y,z:p.z});combat.pauseTick(.008);}});
   add('Spawn central : Bot 1',()=>{start();mode.state.endRound('timeout');advancePause();combat.setMode('passive');});
   add('Spawn central : Bot 2',()=>{start();for(let i=0;i<2;i++){mode.state.endRound('timeout');advancePause();if(i===0)advancePause();}combat.setMode('passive');});
   add('Classement',()=>mode.ui.setRoster(true));
   add('Effet annonce : +1 s',()=>mode.render(1,{visible:true}));
   add('Effet faucheuse : +0,5 s',()=>{for(let i=0;i<60;i++){animate(.008);chaserPresentation?.render(.008,{match,combat,avatar,visible:true});}});
   add('Défaite Chaser',()=>{start();combat.onFall(controller);});
   add('Survivant : +15',()=>{start();mode.state.endRound('timeout');advancePause();advancePause();combat.setMode('passive');mode.render(0,{visible:true});chaserPresentation?.render(0,{match,combat,avatar,visible:true});mode.state.endRound('timeout');});
   add('Éliminé : +5',()=>{start();mode.state.endRound('timeout');advancePause();advancePause();combat.setMode('passive');mode.render(0,{visible:true});chaserPresentation?.render(0,{match,combat,avatar,visible:true});combat.onFall(controller);mode.state.endRound('timeout');});
   add('Résultat : victoire',()=>{start();for(const bot of combat.bots)combat.onFall(bot.actor);mode.state.remaining=.008;mode.step(.008,{});});
   add('Résultat : défaite',()=>{start();mode.state.endRound('timeout');advancePause();advancePause();combat.setMode('passive');combat.onFall(controller);combat.onFall(combat.bots[1].actor);mode.state.remaining=.008;mode.step(.008,{});});
  }
  if(mode.state.mode==='deathmatch'){
   add('Équipe : contact létal',()=>{mode.reset();combat.setMode('passive');const target=combat.bots?.[0]??{id:'bot',actor:combat.enemy,health:combat.enemyState,avatar:combat.avatar};mode.state.players.get(target.id).team=mode.state.players.get('local').team;target.health.hp=1;target.health.invincible=false;combat.receive(target.actor,target.health,target.avatar,controller,{weapon:'revolver',kind:'shot',damage:100});});
   add('Équipe : réapparaître',()=>{for(let i=0;i<520;i++)mode.step(.008,{});});
  }
  if(mode.state.mode==='chaser'){
   add('Horloge : préparation',()=>{mode.reset();combat.setMode('passive');advanceSeconds(8.25);});
   add('Horloge : rotation',()=>{mode.reset();combat.setMode('passive');advanceSeconds(7);mode.state.endRound('timeout');advanceSeconds(10.5);});
  }
  add('Début de manche',()=>{mode.reset();if(match.state.phase==='preparation')advancePause();combat.setMode('passive');});
  add('Élimination',()=>{
   mode.reset();if(match.state.phase==='preparation')advancePause();combat.setMode('passive');
   const p=controller.position;combat.enemy.position={x:p.x,y:p.y,z:p.z+1.6};combat.enemy.velocity={x:0,y:0,z:0};controller.facing=0;combat.enemy.facing=Math.PI;combat.enemyState.hp=1;
   // Real weapon input and activation/contact solver, not a score injection.
   const enemyInput=combat.enemyInput;combat.enemyInput=()=>({facing:Math.PI});
   try{for(let i=0;i<180&&!combat.enemyState.dead;i++){mode.step(.008,{facing:0,light:true,lightPressed:i===0});animate(.008);}}finally{combat.enemyInput=enemyInput;}
  });
  add('Mi-temps ou rotation',()=>{if(mode.state.phase==='playing'){if(mode.state.mode==='chaser')mode.state.roundRemaining=.008;else mode.state.remaining=.008;mode.step(.008,{});}else advancePause();});
  add('Résultat',()=>{mode.reset();if(['captain','siege'].includes(mode.state.mode)){mode.state.finish();advanceSeconds(10.01);return;}if(mode.state.mode==='deathmatch'){mode.state.half=2;mode.state.remaining=.008;}else mode.state.remaining=.008;mode.step(.008,{});});
 }
 add('Réinitialiser',()=>mode.reset());
 add('Masquer contrôles',()=>showControls(false));
 report('Initial');
 // Record actual FontFaceSet results in the application. Read-only browser
 // DOM adapters do not expose the full FontFaceSet API consistently.
 Promise.all(['S5ModeNetsphimere','S5ModeCondensed','S5ModeStatic','S5ModeAce'].map(family=>document.fonts.load('12px '+family))).then(()=>document.fonts.ready).then(()=>{panel.dataset.fonts=JSON.stringify({status:document.fonts.status,netsphimere:document.fonts.check('12px S5ModeNetsphimere'),condensed:document.fonts.check('12px S5ModeCondensed'),static:document.fonts.check('12px S5ModeStatic'),ace:document.fonts.check('12px S5ModeAce'),faces:[...document.fonts].filter(face=>face.family.startsWith('S5Mode')).map(face=>({family:face.family,status:face.status}))});}).catch(error=>{panel.dataset.fonts=JSON.stringify({status:'error',error:error.message});});
 panel.dispose=()=>{panel.qaSessionEntry.dispose();roomVisibility?.remove();toggle.remove();panel.remove();};
 return panel;
}
