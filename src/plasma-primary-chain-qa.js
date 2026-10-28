import {MovementInput} from './input.js';
import {SIM_STEP_MS,SimulationClock} from './simulation-clock.js';
import {meleeClipSample} from './melee-weapons.js';

// Diagnostic only: exercise the real mouse classifier and combat clock.
// No direct attack creation, queued input injection or receiver teleport.
export function runPlasmaPrimaryChainQa({combat,controller,graph,avatar,animate,seconds=1.744,periodMs=600,contact=false}){
 if(!Number.isFinite(seconds)||seconds<0||seconds>3||!Number.isFinite(periodMs)||periodMs<100||periodMs>2000)throw new RangeError('Invalid Plasma diagnostic timing');
 controller.reset();graph.reset();combat.reset();combat.setMode('passive');combat.autoRespawn=false;
 controller.position={x:0,y:0,z:0};controller.facing=0;
 combat.enemy.position={x:0,y:0,z:contact?1.59:20};combat.enemy.facing=Math.PI;combat.avatar.group.visible=true;
 const input=new MovementInput(),clock=new SimulationClock(),edges=[],created=[],hits=[];
 for(let at=0;at<seconds*1000;at+=periodMs)edges.push({at,down:true},{at:at+50,down:false});
 let index=0,lastAttack=null,lastHp=combat.enemyState.hp,now=0;
 const frames=Math.ceil(seconds*1000/SIM_STEP_MS);
 for(let frame=0;frame<frames;frame++)clock.advance(SIM_STEP_MS,(dt,time)=>{
  now=time;
  while(index<edges.length&&edges[index].at<=time){const edge=edges[index++];(edge.down?input.attack:input.releaseAttack).call(input,0,edge.at/1000);}
  const events=combat.tick(dt,input.sample(0,time/1000));input.consumeEvents(events);graph.events(events);animate(dt);
  if(controller.attack&&controller.attack!==lastAttack)created.push({atMs:time,comboIndex:controller.attack.comboIndex,clip:controller.attack.profile?.clip,actionMs:controller.attack.profile?.actionMs});
  if(combat.enemyState.hp<lastHp)hits.push({atMs:time,damage:lastHp-combat.enemyState.hp,hp:combat.enemyState.hp});
  lastAttack=controller.attack;lastHp=combat.enemyState.hp;
 });
 const clip=controller.attack?meleeClipSample(controller.attack):null;
 return {nativeExecuted:false,attackerWeapon:controller.weapon,receiverWeapon:combat.enemy.weapon,receiverMode:combat.mode,contact,periodMs,stepMs:SIM_STEP_MS,atMs:now,created,hits,hp:lastHp,attackTimeMs:controller.attack?.timeMs??null,clip,playback:avatar.playbackTimes(),received:{reaction:combat.enemyState.reaction,ageMs:combat.enemyState.age*1000,holdMs:combat.enemyState.hold*1000}};
}
