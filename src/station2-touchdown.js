import * as THREE from 'three';
import {TouchdownState,crossesBox} from './touchdown-state.js';
import {CombatState} from './combat-state.js';
import {beamSpans} from './station2-detail-kit.js';
import {createTouchdownUI} from './touchdown-ui.js';
import {createLocalNavigation} from './local-navigation.js';
import {createFumbiPresentation} from './fumbi-presentation.js';
import {STATION2_GOAL_BOXES,STATION2_SPAWNS} from './station2-goal-data.js';
import {touchesTouchdownGoal} from './touchdown-goal-contact.js';
import {advanceFumbiFreeFlight} from './fumbi-free-flight.js';

const COLORS={alpha:0x75f6ce,beta:0xffae79};
const opposite=side=>side==='alpha'?'beta':'alpha';
// Authenticated station2_td.scn Box records, converted with .006,-Z and
// expressed relative to the existing modular bases. Native current-body OBB
// contact is distinct from the laser sweep and from scoring/server policy.
export const TD_GOALS=Object.fromEntries(Object.entries(STATION2_GOAL_BOXES).map(([side,box])=>[side,[...box.center]]));
export function laserBoxes(module){
 const mesh=module.meshes.find(m=>/alphablend2.*nofog/i.test(m.name));if(!mesh)return [];
 mesh.updateMatrix();return beamSpans(mesh.geometry).map(([a,b])=>new THREE.Box3().setFromPoints([a.applyMatrix4(mesh.matrix),b.applyMatrix4(mesh.matrix)]).expandByScalar(.075));
}
function touchesModule(module,boxes,from,to){
 if(!module||module.definition.enabled===false)return false;
 module.group.updateWorldMatrix(true,false);const inv=module.group.matrixWorld.clone().invert();
 const a=new THREE.Vector3(from.x,from.y+.9,from.z).applyMatrix4(inv),b=new THREE.Vector3(to.x,to.y+.9,to.z).applyMatrix4(inv);
 // Transform the world-space actor AABB extents, including rotations/scales.
 const e=inv.elements,r=new THREE.Vector3(Math.abs(e[0])*.35+Math.abs(e[4])*.9+Math.abs(e[8])*.35,Math.abs(e[1])*.35+Math.abs(e[5])*.9+Math.abs(e[9])*.35,Math.abs(e[2])*.35+Math.abs(e[6])*.9+Math.abs(e[10])*.35);
 return boxes.some(box=>crossesBox(a,b,box.min.clone().sub(r),box.max.clone().add(r)));
}
// Float directly above the carrier's head, as in the S5Runtime presentation.
export const FUMBI_CARRY={height:2,behind:0};
export function createStation2Touchdown({world,scene,controller,team='alpha',getAvatar=()=>null,onReset=()=>{},uiFactory=createTouchdownUI,rules={}}){
 const classic=world.touchdownProfile?.kind==='station2-classic-source-v1'?world.touchdownProfile:null;
 const state=new TouchdownState(rules),ball=world.fumbi;let health=new CombatState(),combat=null,deathReason='laser';const respawnOrigins=new Map();
 if(!ball)throw Error('Station 2 : Fumbi manquant');
 const presentation=createFumbiPresentation(ball.animation);
 const homeParent=ball.parent,homeLocal=ball.position.clone(),localRotation=ball.quaternion.clone(),localScale=ball.scale.clone();scene.attach(ball);
 // attach decomposes the native negative-Z scale as negative-X + a rotation.
 // Keep that conversion rotation when applying the carrier/celebration yaw.
 const homeRotation=ball.quaternion.clone(),yawRotation=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0);
 const goalBoxes={},rings={},laserCache=new WeakMap();let deadIn=0,elapsed=0,dropSpeed=0,scoredGoal=null;
 const participants=()=>[{id:'local',team,actor:controller,health},...(combat?[{id:'bot',team:team==='alpha'?'beta':'alpha',actor:combat.enemy,health:combat.enemyState}]:[])];
 const base=side=>classic?.bases[side]??world.modules.get(`${side}-base`);
 const marker=side=>classic?new THREE.Vector3(...classic.goalCenters[side]):base(side).group.localToWorld(new THREE.Vector3(...TD_GOALS[side]));
 const laserModule=side=>classic?.lasers[side]??world.modules.get(`${side}-lasers`);
 // A module ID names the authored physical side. Teams retain their identity
 // and score when native71A600 reinterprets the scene's team IDs at halftime.
 const sideForTeam=team=>state.sidesSwapped?opposite(team):team;
 const markerForTeam=team=>marker(sideForTeam(team));
 const home=()=>homeParent.localToWorld(homeLocal.clone());
 for(const side of ['alpha','beta']){
  const center=classic?new THREE.Vector3(...classic.goalCenters[side]):new THREE.Vector3(...TD_GOALS[side]),half=new THREE.Vector3(...STATION2_GOAL_BOXES[side].halfExtents);
  goalBoxes[side]=classic?classic.goalBoxes[side].map(box=>box.clone()):[new THREE.Box3(center.clone().sub(half),center.clone().add(half))];
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.5,.035,8,64),new THREE.MeshBasicMaterial({color:COLORS[side],transparent:true,opacity:.75,depthWrite:false}));ring.name=`S5 ${side} touchdown goal`;base(side).group.add(ring);ring.position.copy(center);rings[side]=ring;
 }
 const pulse=new THREE.Mesh(new THREE.TorusGeometry(.5,.022,6,48),new THREE.MeshBasicMaterial({color:0xefffba,transparent:true,opacity:.7,depthWrite:false}));pulse.rotation.x=Math.PI/2;scene.add(pulse);
 const spawnPoint=side=>{
  // Both teams have explicit SCN spawn markers; Beta is not a mirror of Alpha.
  // Resolve the authored point against this modular base's real surfaces.
  const p=classic?new THREE.Vector3(...classic.spawns[side].position):base(side).group.localToWorld(new THREE.Vector3(...STATION2_SPAWNS[side].position));
  const ray=new THREE.Raycaster(p.clone().add(new THREE.Vector3(0,1,0)),new THREE.Vector3(0,-1,0),0,100);const hit=ray.intersectObjects(world.meshes,false)[0];if(hit)p.y=hit.point.y+.02;
  return {x:p.x,y:p.y,z:p.z};
 };
 const spawn=()=>{
  const side=sideForTeam(team);world.spawn=spawnPoint(side);controller.reset();controller.facing=side==='alpha'?0:Math.PI;health.reset();
  if(combat){const enemySide=sideForTeam(opposite(team));combat.enemyHome=spawnPoint(enemySide);combat.reset();combat.enemy.facing=enemySide==='alpha'?0:Math.PI;}
  for(const person of participants()){state.registerParticipant(person.id,person.team);state.statistics.respawn(person.id);}
  deadIn=0;onReset();
 };
 const reset=()=>{state.reset();presentation.reset();spawn();placeBall();};
 const ui=uiFactory({team,onRestart:()=>api.reset()});
 function placeBall(presented=false){
  if(state.ball==='home'){ball.position.copy(home());ball.quaternion.copy(homeRotation);}
  else if(state.owner){const owner=participants().find(p=>p.id===state.owner.id),a=owner?.actor;if(a){
   const group=presented?(owner.id==='local'?getAvatar()?.group:combat?.avatar?.group):null;
   const p=group?group.getWorldPosition(new THREE.Vector3()):a.position;
   const forward=group?new THREE.Vector3(0,0,-1).applyQuaternion(group.getWorldQuaternion(new THREE.Quaternion())):null,facing=forward?Math.atan2(forward.x,forward.z):a.facing;
   ball.position.set(p.x-Math.sin(facing)*FUMBI_CARRY.behind,p.y+FUMBI_CARRY.height,p.z-Math.cos(facing)*FUMBI_CARRY.behind);ball.quaternion.copy(yawRotation.setFromAxisAngle(up,facing)).multiply(homeRotation);
  }}
 }
 function drop(actor=controller){if(state.drop()){ball.position.set(actor.position.x,actor.position.y+.2,actor.position.z);ball.quaternion.copy(homeRotation);dropSpeed=0;}}
 function fallBall(dt){
  if(state.ball!=='dropped')return;
  // Keep velocity in native units so gravity/drag round in the source order.
  // Main's simulation supplies integral frame milliseconds. Ground
  // placement remains the existing S5 ray policy, not certified native physics.
  const flight=advanceFumbiFreeFlight([0,dropSpeed,0],Math.trunc(dt*1000));dropSpeed=flight.velocityNative[1];
  const distance=-flight.displacementNative[1]*.006;
  const ray=new THREE.Raycaster(ball.position.clone().add(new THREE.Vector3(0,.1,0)),new THREE.Vector3(0,-1,0),0,distance+.2),hit=ray.intersectObjects(world.meshes,false)[0];
  if(hit){ball.position.y=hit.point.y+.1;dropSpeed=0;}else ball.position.y-=distance;
  if(ball.position.y<world.deathY)state.returnBall();
 }
 function kill(p){if(state.owner?.id===p.id)drop(p.actor);p.health.invincible=false;p.health.receive({damage:p.health.hp});if(p.health.dead)state.recordDefeat(p.id);if(p.id==='local'){deadIn=state.rules.respawnSeconds;deathReason='laser';}combat?.cancel(p.actor);p.actor.attack=null;p.actor.fireball=null;p.actor.velocity={x:0,y:0,z:0};p.actor.sprinting=false;}
 const api={state,get health(){return health;},team,ui,goalBoxes,marker,markerForTeam,sideForTeam,laserModule,home,reset,get deadIn(){return deadIn;},get celebrating(){return state.phase==='goal'&&state.scorerId==='local';},get locked(){return health.dead||(state.phase!=='playing'&&!api.celebrating);},
  attachCombat(value){
   combat=value;health=combat.playerState;
   combat.enemyHome=spawnPoint(sideForTeam(opposite(team)));combat.setMode('attack');
   const actorId=actor=>actor===controller?'local':actor===combat.enemy?'bot':null;
   combat.onDamage=(victim,source,amount)=>state.recordDamage(actorId(source),actorId(victim),amount);
   combat.onDefeat=(victim,source)=>{const victimId=actorId(victim);state.recordDefeat(victimId,actorId(source));if(state.owner?.id===victimId)drop(victim);if(victimId==='local')deathReason='combat';};
   combat.onRespawn=a=>{state.statistics.respawn(actorId(a));respawnOrigins.set(a,{serial:a.resetSerial,position:{...a.position}});if(a===controller)onReset();};
   combat.onFall=a=>{const id=actorId(a);state.recordDefeat(id);if(state.owner?.id===id)state.returnBall();if(id==='bot'){a.position={...combat.enemyHome};combat.enemyState.reset();combat.cancel(a);combat.graph?.reset();state.statistics.respawn(id);}};
   combat.damagePolicy=({profile})=>state.phase==='playing'?profile:null;
   const navigation=createLocalNavigation(world);let path=[],planIn=0,jumpIn=0,progressIn=0,lastProgress={...combat.enemy.position},stuck=false;
   combat.enemyInput=({dt,distance,facing,swing})=>{
    if(distance<3&&!health.dead)return {facing,light:swing,lightShort:swing};
    const target=state.owner?.id==='bot'?markerForTeam(team):state.owner?.id==='local'?new THREE.Vector3(controller.position.x,controller.position.y,controller.position.z):ball.position;
    const a=combat.enemy,p=a.position;planIn-=dt;jumpIn=Math.max(0,jumpIn-dt);progressIn+=dt;
    if(progressIn>=.4){stuck=Math.hypot(p.x-lastProgress.x,p.z-lastProgress.z)<.12;lastProgress={...p};progressIn=0;}
    if(planIn<=0){path=navigation.path(p,target);planIn=1.5;}
    while(path.length>1&&Math.hypot(path[0].x-p.x,path[0].z-p.z)<.8&&Math.abs(path[0].y-p.y)<1.8)path.shift();
    const next=path[0]||target,dx=next.x-p.x,dz=next.z-p.z,n=Math.hypot(dx,dz)||1,jump=a.grounded&&jumpIn===0&&(next.y>p.y+.35||stuck);
    if(jump)jumpIn=.8;return {facing:Math.atan2(dx,dz),x:dx/n,z:dz/n,jump};
   };
   api.navigation=navigation;
   spawn();
  },
  manualRespawn(){if(api.locked)return;drop();spawn();},
  step(dt,input){
   const result=state.tick(dt);fallBall(dt);if(result==='restart'||result==='halftime'){spawn();placeBall();return ['respawn'];}
   if(state.phase==='goal'){
    const scorer=participants().find(p=>p.id===state.scorerId),events=[];
    for(const person of participants())person.health.tick(dt);
    if(scorer&&!scorer.health.dead){
     // Only the scorer keeps control during the goal pause. Combat, scoring
     // and possession remain paused; movement still uses real map collisions.
     for(let remaining=dt;remaining>1e-10;){const step=Math.min(remaining,1/120);events.push(...scorer.actor.step(step,scorer.id==='local'?input:{}));remaining-=step;}
     if(scorer.id==='bot'&&events.includes('respawn'))scorer.actor.position={...combat.enemyHome};
     if(combat)combat.pose?.(combat.avatar,combat.enemy,combat.enemyState,dt,combat.graph);
    }
    return events;
   }
   if(!combat&&health.dead){health.tick(dt);deadIn=Math.max(0,deadIn-dt);if(deadIn===0){spawn();return ['respawn'];}return [];}
   if(state.phase!=='playing')return [];
   respawnOrigins.clear();
   const people=participants(),before=new Map(people.map(p=>[p.id,{...p.actor.position}])),events=combat?combat.tick(dt,input):controller.step(dt,input);
   // Preserve real post-respawn motion, but do not sweep the teleport to its origin.
   for(const p of people){const origin=respawnOrigins.get(p.actor);if(origin&&origin.serial===p.actor.resetSerial)before.set(p.id,origin.position);}
   if(combat&&health.dead)deadIn=Math.max(0,state.rules.respawnSeconds-health.age);
   if(events.includes('respawn')){if(!combat)state.recordDefeat('local');state.statistics.respawn('local');if(state.owner?.id==='local')state.returnBall();health.reset();onReset();placeBall();return events;}
   for(const p of people){if(p.health.dead)continue;
    for(const side of ['alpha','beta']){const lasers=laserModule(side);if(!lasers)continue;
     if(!laserCache.has(lasers))laserCache.set(lasers,laserBoxes(lasers));
     if(!touchesModule(lasers,laserCache.get(lasers),before.get(p.id),p.actor.position))continue;
     // Any laser returns the carried Fumbi immediately. Clear possession
     // before lethal damage so an enemy beam cannot turn it into a dropped ball.
     if(state.owner?.id===p.id){state.returnBall();dropSpeed=0;}
     if(sideForTeam(side)!==p.team){kill(p);if(p.id==='local')events.push('tdDeath');break;}
    }
   }
   placeBall();
   if(!state.owner&&(state.ball==='home'||state.ball==='dropped')){
    for(const person of people){if(person.health.dead)continue;const p=person.actor.position,dx=p.x-ball.position.x,dz=p.z-ball.position.z;
     if(Math.hypot(dx,dz)<.95&&Math.abs(p.y+.65-ball.position.y)<1.4&&state.pickup(person.id,person.team))break;
    }
   }
   const owner=people.find(p=>p.id===state.owner?.id),enemy=owner?.team==='alpha'?'beta':'alpha',enemySide=sideForTeam(enemy);
   if(owner&&touchesTouchdownGoal(base(enemySide),goalBoxes[enemySide],owner.actor.position)&&state.goal(owner.id,enemy)){
    for(const p of people){p.actor.attack=null;p.actor.fireball=null;combat?.cancel(p.actor);if(p.id!==state.scorerId){p.actor.velocity={x:0,y:0,z:0};p.actor.sprinting=false;p.actor.state='idle';}else p.actor.state=p.actor.grounded?'idle':'fall';}
    scoredGoal=enemySide;ball.position.copy(marker(enemySide));return [...events,'touchdown'];
   }
   return events;
  },
  render(dt,{visible=true}={}){
   elapsed+=dt;placeBall(true);
   if(state.phase==='goal'){const t=state.rules.goalPause-state.pause;ball.position.y=marker(scoredGoal).y+Math.sin(Math.min(1,t/1.3)*Math.PI/2)*1.5;ball.quaternion.copy(yawRotation.setFromAxisAngle(up,t*1.8)).multiply(homeRotation);}
   ball.visible=state.phase!=='halftime'&&state.phase!=='result';presentation.update(dt,state);
   pulse.visible=ball.visible;pulse.position.copy(ball.position);pulse.position.y-=.12;pulse.scale.setScalar(state.phase==='goal'?1+(state.rules.goalPause-state.pause)%1.5*3:1+Math.sin(elapsed*3)*.08);
   pulse.material.opacity=state.phase==='goal'?.7*(1-((state.rules.goalPause-state.pause)%1.5)/1.5):.45;
   for(const [side,ring] of Object.entries(rings)){const owner=sideForTeam(side);ring.rotation.z=elapsed*.2;ring.scale.setScalar(1+Math.sin(elapsed*2)*.03);ring.material.color.setHex(COLORS[owner]);ring.material.opacity=owner!==team?.8:.35;}
   world.blenderSlice?.teamColors?.setSwapped?.(state.sidesSwapped);
   const distance=new THREE.Vector3(controller.position.x,controller.position.y,controller.position.z).distanceTo(markerForTeam(opposite(team)));
   const roster=participants().map(person=>({id:person.id,team:person.team,name:person.id==='local'?'You':'Simulated opponent',local:person.id==='local',dead:person.health.dead,goals:state.goalCount(person.id),carrying:state.owner?.id===person.id,statistics:state.participantStatistics(person.id)}));
   ui.update(state,{dead:health.dead&&state.phase==='playing',deathIn:deadIn,deathReason,distance,visible,opponent:!!combat,participants:roster});
  },dispose(){world.blenderSlice?.teamColors?.setSwapped?.(false);if(combat){combat.damagePolicy=null;combat.onDamage=null;combat.onDefeat=null;combat.onRespawn=null;combat.onFall=null;combat.enemyInput=null;}ui.dispose();homeParent.add(ball);ball.position.copy(homeLocal);ball.quaternion.copy(localRotation);ball.scale.copy(localScale);pulse.geometry.dispose();pulse.material.dispose();pulse.removeFromParent();for(const ring of Object.values(rings)){ring.geometry.dispose();ring.material.dispose();ring.removeFromParent();}}
 };
 spawn();placeBall();return api;
}
