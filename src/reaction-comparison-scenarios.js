import {Controller,TUNING} from './controller.js';
import {CombatState} from './combat-state.js';
import {TrainingCombat} from './training-combat.js';
import {nativeBlowComponents} from './native-melee-blow.js';
import {createNativeMeleePush,advanceNativeMeleePush} from './native-melee-push.js';
import {applyNativePushCollision} from './native-push-collision.js';
import {CANNONADE_PUSH_ACTOR_POLICY} from './cannonade-contact.js';
import {S5RUNTIME_NATIVE_PHYSICS} from './s5runtime-native-physics-data.js';
import {realizedFeetVelocities,validateReplayTickDeltasMs} from './movement-comparison.js';

export const REACTION_PROFILES=Object.freeze({
 handgun:{condition:'push',parameters:[100,1600,-5000],source:'work/parallel-gameplay-reference/armes/handgun/source/script/weapon_revolver2.lua:StandardRevolver2',integration:'condition-harness-only'},
 smash:{condition:'blow',parameters:[2500,2000],source:'src/smash-secondary.js:smashSecondaryContacts',attack:{weapon:'smashrifle',kind:'secondary',hits:1},integration:'TrainingCombat.receive'},
 airgun:{condition:'blow',parameters:[2500,2500],source:'work/s5runtime-decoder/airgun/script/weapon_airgun.lua:StandardAirgun',attack:{weapon:'airgun',kind:'shot'},integration:'TrainingCombat.receive'},
 airgunMax:{condition:'blow',parameters:[3000,3000],source:'work/s5runtime-decoder/airgun/script/weapon_airgun.lua:StandardAirgun',attack:{weapon:'airgun',kind:'shotMax'},integration:'TrainingCombat.receive'},
});
const floor={minX:-100,maxX:100,minY:-1,maxY:0,minZ:-100,maxZ:100};
const wall={minX:1.2,maxX:1.3,minY:-100,maxY:100,minZ:-100,maxZ:100};
export const REACTION_SCENARIOS=Object.freeze([
 ...Object.keys(REACTION_PROFILES).flatMap(profile=>['free','wall','floor'].map(surface=>({id:`${profile}-${surface}`,profile,surface,duration:1.5}))),
 {id:'handgun-clock-pause',profile:'handgun',surface:'free',duration:.3,pushClockPauseMs:30},
 {id:'handgun-downward-write-order',profile:'handgun',surface:'corner',duration:.3,initialHeight:1.04,recordDirection:[-1,1,0]},
 {id:'smash-terminal-fall',profile:'smash',surface:'free',duration:3,initialHeight:200},
]);
export function runReactionScenario(scenario,{dtMs=10,sex='male',tickDeltasMs}={}){
 validateReplayTickDeltasMs([dtMs]);
 if(tickDeltasMs===undefined&&!Number.isInteger(scenario.duration*1000/dtMs))throw Error('Fixed diagnostic cadence must cover the duration exactly; no partial/drop tick');
 const deltas=tickDeltasMs===undefined?Array(Math.round(scenario.duration*1000/dtMs)).fill(dtMs):validateReplayTickDeltasMs(tickDeltasMs);
 const definition=REACTION_PROFILES[scenario.profile];if(!definition)throw Error('Unknown reaction profile');
 const world={spawn:{x:0,y:scenario.initialHeight??(scenario.surface==='floor'?0:3),z:0},colliders:scenario.surface==='corner'?[wall,floor]:scenario.surface==='wall'?[wall]:scenario.surface==='floor'?[floor]:[],deathY:-1000};
 const actor=new Controller(world,{weapon:'dagger',sex}),state=new CombatState(),source=new Controller(world);
 source.position={x:-2,y:actor.position.y,z:0};
 const combat=Object.assign(Object.create(TrainingCombat.prototype),{player:source,playerState:new CombatState(),getAvatar:()=>null,getAudio:()=>({play(){}}),effects:{play(){return {clear(){}};},clearForAvatar(){}},pause:0});
 const initialConditions={sex,weapon:actor.weapon,energy:actor.energy,facing:actor.facing,position:{...actor.position},velocity:{...actor.velocity},hp:state.hp};
 const conditionOptions={timeFactor:S5RUNTIME_NATIVE_PHYSICS.floatConstants.find(c=>c.index===3).value,clockMode:'native-u32'};
 let push=null;
 if(definition.condition==='push'){
  // Controlled primitive injection, not a claim that Handgun is equipped or its
  // native received-record direction has been recovered. Reuse shared consumer.
  push=createNativeMeleePush(definition.parameters,scenario.recordDirection??[-1,0,0],conditionOptions);
 }else combat.receive(actor,state,null,source,definition.attack);
 const samples=[],inputSchedule=[];
 const actualEntryVelocity={...actor.velocity};
 const sample=(t,details={})=>samples.push({t,position:{...actor.position},controllerVelocity:{...actor.velocity},energy:actor.energy,hp:state.hp,reaction:state.reaction,grounded:actor.grounded,condition:push?{elapsedMs:push.elapsedMs,active:push.active,paused:push.paused,scalar:push.scalar}:null,...details});
 // t=0 follows accepted condition entry. Impulse evidence is retained in this
 // separate channel; first realized difference is conventionally zero.
 sample(0,{event:'condition-accepted',acceptedConditionVelocity:actualEntryVelocity});
 let elapsedMs=0;
 for(const tickMs of deltas){
  const t=elapsedMs/1000,dt=tickMs/1000,details={writes:[]};
  inputSchedule.push({t,dtMs:tickMs,input:{},conditionClockPaused:!!push&&elapsedMs<(scenario.pushClockPauseMs??0),actorAcceptsUpdate:true});
  state.tick(dt);
  if(push?.active){
   push.paused=elapsedMs<(scenario.pushClockPauseMs??0);
   const {displacement}=advanceNativeMeleePush(push,tickMs);
   const result=applyNativePushCollision(actor,[displacement.x/.006,displacement.y/.006,displacement.z/.006],{actorPolicy:CANNONADE_PUSH_ACTOR_POLICY});
   details.writes=result.steps.map(s=>({flag:s.flag,displacement:s.displacement,contacts:s.result.contacts.map(c=>({kind:c.kind,normal:c.normal.toArray()}))}));
  }
  if(combat.pause>0){combat.pause=Math.max(0,combat.pause-dt);details.hitPause=true;}
  else if(state.locked)combat.stepReaction(actor,dt);
  else actor.step(dt,{});
  elapsedMs+=tickMs;sample(elapsedMs/1000,details);
 }
 const sourceMagnitudes=definition.condition==='blow'?nativeBlowComponents(definition.parameters):null;
 const realized=realizedFeetVelocities(samples);samples.forEach((sample,i)=>{sample.velocity=realized[i];});
 return {scenario:scenario.id,world,definition,initialConditions,inputSchedule,tickDeltasMs:deltas,samples,sourceMagnitudes,actualEntryVelocity,
  limits:['record direction controlled radially, not native authenticated','actor policy neutral gates, historical FREE cap','Training reaction hold/hitpause/friction remain reconstruction',...(push?['Handgun weapon-to-contact integration not exercised']:[])],terminal:TUNING.terminal};
}
