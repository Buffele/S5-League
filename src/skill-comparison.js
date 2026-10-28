import {Controller} from './controller.js';
import {compareMovementTraces} from './movement-comparison.js';

export const SKILL_SCENARIOS=Object.freeze([3020001,3020002,3020004].flatMap(itemKey=>
 ['male','female'].flatMap(sex=>['hover','end','ceiling','exhaustion'].map(kind=>({id:`skill-${itemKey}-${sex}-${kind}`,itemKey,sex,kind})))));
export const SKILL_TOLERANCES=Object.freeze({position:.01,velocity:.001,energy:.001,time:.001,maxSampleGap:.034});
export function runSkillScenario(scenario,{tickDeltasMs=Array(157).fill(16),sex=scenario.sex??'male'}={}){
 // Native damping is per Tick. Subdividing a long frame changes the result;
 // reject unsupported cadence instead of silently replaying it at another FPS.
 if(!tickDeltasMs.length||!tickDeltasMs.every(dt=>Number.isInteger(dt)&&dt>0&&dt<=33))throw Error('Exact native tick deltas1..33ms required; no splitting or dropping ticks');
 const floor={minX:-100,maxX:100,minY:-1,maxY:0,minZ:-100,maxZ:100};
 const world={spawn:{x:0,y:0,z:0},colliders:[floor,...(scenario.kind==='ceiling'?[{minX:-10,maxX:10,minY:2.5,maxY:3,minZ:-10,maxZ:10}]:[])]};
 const actor=new Controller(world,{sex,skill:scenario.itemKey});
 actor.setS5RuntimeSkillDiagnosticContext({enabled:true,decrementMultiplier:1,decrementDelayMs:0});
 if(scenario.kind==='exhaustion')actor.energy=20.2;
 const initialConditions={sex,weapon:actor.weapon,energy:actor.energy,facing:actor.facing};
 const samples=[],inputSchedule=[];
 const save=t=>samples.push({t,position:{...actor.position},velocity:{...actor.velocity},energy:actor.energy,flyState:actor.s5runtimeSkill.flyState,active:actor.s5runtimeSkill.active,gravityScale:actor.s5runtimeSkill.gravityScale});
 let elapsedMs=0,hoverSent=false,fallSent=false;save(0);
 for(let i=0;i<tickDeltasMs.length;i++){
  const dtMs=tickDeltasMs[i],hover=scenario.kind==='hover'||scenario.kind==='end';
  const input={skillHeld:!hover||elapsedMs<800};
  if(i===0){input.skillPressed=true;input.skillNativeInputCode=20;}
  else if(hover&&elapsedMs>=800&&!hoverSent){input.skillNativeInputCode=21;hoverSent=true;}
  if(['end','ceiling'].includes(scenario.kind)&&elapsedMs>=1250&&!fallSent){input.skillNativeInputCode=17;fallSent=true;}
  inputSchedule.push({t:elapsedMs/1000,dtMs,input});actor.step(dtMs/1000,input);
  elapsedMs+=dtMs;save(elapsedMs/1000);
 }
 return {world,initialConditions,inputSchedule,samples,tickDeltasMs};
}
export function compareSkillTraces(reference,candidate){
 for(const trace of [reference,candidate]){
  const deltas=trace.metadata?.tickDeltasMs;
  if(!Array.isArray(deltas)||deltas.length!==trace.samples?.length-1||!deltas.every(dt=>Number.isInteger(dt)&&dt>0&&dt<=33))throw Error('Missing or unsupported exact per-Tick skill cadence');
 }
 if(JSON.stringify(reference.metadata.tickDeltasMs)!==JSON.stringify(candidate.metadata.tickDeltasMs))throw Error('Native per-Tick cadence differs; interpolation cannot replace damping ticks');
 const movement=compareMovementTraces(reference,candidate,SKILL_TOLERANCES);
 const phaseErrors=[];
 if(reference.samples.length!==candidate.samples.length)throw Error('Exact per-Tick skill sample count required');
 let expectedTime=0;
 for(let i=0;i<reference.samples.length;i++){
  const a=reference.samples[i],b=candidate.samples[i];
  if(i)expectedTime+=candidate.metadata.tickDeltasMs[i-1]/1000;
  if(Math.abs(a.t-expectedTime)>1e-6||Math.abs(b.t-expectedTime)>1e-6)throw Error('Skill timestamps do not match the measured tick cadence');
  for(const key of ['flyState','active','gravityScale']){
   if(a[key]===undefined)throw Error('Missing native skill channel '+key);
   if(key==='flyState'&&(!Number.isInteger(a[key])||a[key]<0||a[key]>5))throw Error('Invalid native flight state');
   if(key==='active'&&typeof a[key]!=='boolean')throw Error('Invalid native flight active flag');
   if(key==='gravityScale'&&![0,1].includes(a[key]))throw Error('Invalid native flight gravity scale');
   if(a[key]!==b[key])phaseErrors.push({tick:i,t:b.t,channel:key,reference:a[key],candidate:b[key]});
  }
 }
 const comparisonPassed=movement.status==='pass'&&!phaseErrors.length;
 return {...movement,status:movement.status==='blocked'?'blocked':comparisonPassed?'pass':'fail',phaseErrors,
  comparisonPassed,nativeReady:false,gateBlockers:['Both-sex animation/resources and main-browser skill flow remain unverified','Only the supplied physical/cost/phase scenario can pass this comparator']};
}
