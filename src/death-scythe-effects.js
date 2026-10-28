import {readAsset} from './scene-assets.js';
import {withMeleeEffectHierarchies} from './melee-effect-hierarchy.js';
import {DEATH_SCYTHE_EVENT_SOURCES,DEATH_SCYTHE_SOURCE_EVENTS} from './death-scythe-events-data.js';
import {DEATH_SCYTHE_DEFINITION} from './death-scythe-data.js';
import {DEATH_SCYTHE_SPECIAL_PHASES} from './death-scythe-special-state.js';

export const DEATH_SCYTHE_EFFECT_RUNTIME='/assets/s5runtime/death-scythe/effects-runtime.json';
export const loadDeathScytheEffectDefinitions=async()=>withMeleeEffectHierarchies(await readAsset(DEATH_SCYTHE_EFFECT_RUNTIME));
export async function loadDeathScytheEffects(scene){const {loadEffectRuntime}=await import('./combat-effects.js');return loadEffectRuntime(scene,await loadDeathScytheEffectDefinitions());}
const fileKey=path=>path.split(/[\\/]/).at(-1).replace(/\.[^.]+$/,'').toLowerCase();
function events(attack){
 if(attack?.weapon!=='deathscythe')return [];
 const source=DEATH_SCYTHE_EVENT_SOURCES[attack.kind];
 return DEATH_SCYTHE_SOURCE_EVENTS[Array.isArray(source)?source[attack.comboIndex??0]:source]??[];
}
// Keep the source call index: equal sequence/time pairs can be distinct calls.
// Only ex_att has an observed active actor-scene parent. Other follow:false
// entries retain their explicit arena policy; do not extrapolate to ex2.
export function deathScytheStateCues(attack,{sex=attack?.sex??'male'}={}){
 return events(attack).flatMap((e,sourceIndex)=>{
  const a=e.arguments;let sequence,time,end;
  if(e.method==='AddSequence')[,sequence,,time,end]=a;
  else if(e.method==='AddSequenceBySex'){sequence=a[sex==='female'?2:1];time=a[4];end=a[5];}
  else return [];
  const name=sequence?fileKey(sequence):null,actorSceneRoot=name==='deathscythe_ex_att_eff';
  return sequence?[{name,at:time/1000,follow:actorSceneRoot,...(actorSceneRoot?{actorSceneRoot:true}:{}),sourceIndex,sourceMethod:e.method,sourcePath:sequence,sourceSlot:a[0],sourceEndMs:end,sourceClock:'actor-state'}]:[];
 });
}
export function deathScytheSoundCues(attack,{sex=attack?.sex??'male',includeVoices=true}={}){
 return events(attack).flatMap((e,sourceIndex)=>{
  const a=e.arguments;let sound,time,end,bone=null,voice=false;
  if(e.method==='AddSequence')[,,sound,time,end]=a;
  else if(e.method==='AddSequenceBySex')[,,,sound,time,end]=a;
  else if(e.method==='AddSoundBySex'){if(!includeVoices)return [];sound=a[sex==='female'?1:0];bone=a[2];time=a[3];end=a[4];voice=true;}
  else return [];
  return sound?[{name:fileKey(sound),at:time/1000,sourceIndex,sourceMethod:e.method,sourcePath:sound,sourceEndMs:end,sourceClock:'actor-state',bone,voice}]:[];
 });
}
export function deathScytheTrailWindows(attack){return events(attack).flatMap((e,sourceIndex)=>e.method==='AddGhostTrail'&&e.arguments[0]?[{name:e.arguments[0],beginMs:e.arguments[1],endMs:e.arguments[2],sourceIndex}]:[]);}
const names=new Set(['sword_attack','sword_s']);
for(const ev of Object.values(DEATH_SCYTHE_SOURCE_EVENTS))for(const e of ev){const a=e.arguments;if(e.method==='AddSoundBySex'){names.add(fileKey(a[0]));names.add(fileKey(a[1]));}else if(e.method==='AddSequence'&&a[2])names.add(fileKey(a[2]));else if(e.method==='AddSequenceBySex'&&a[3])names.add(fileKey(a[3]));}
export const DEATH_SCYTHE_SOUND_FILES=Object.freeze(Object.fromEntries([...names].map(name=>[name,'/assets/s5runtime/death-scythe/sounds/'+name+'.ogg'])));

// Read-only diagnostic. Native phase timers are verified, but their nominal
// sums are NOT exit times: strict pre-tick checks and cadence determine exit.
// Report an actual exit only after the runtime state completed; never predict
// it, mutate the latch, or infer callback invocation from weapon definitions.
export function deathScytheEventClockReport(attack){
 if(attack?.weapon!=='deathscythe')return null;
 const p=attack.kind==='light'?DEATH_SCYTHE_DEFINITION.light[attack.comboIndex??0]:DEATH_SCYTHE_DEFINITION[attack.kind];
 if(!p?.clip)return null;
 const special=attack.kind==='strong'||attack.kind==='strongFollow',runtime=attack.scytheSpecial,latch=attack.scytheSecondImpact;
 const sourceNominalSumMs=p.actionMs+(p.recoveryMs??0);
 const actualExitMs=runtime?.complete===true&&Number.isFinite(runtime.timeMs)?runtime.timeMs:null;
 const cues=[...deathScytheStateCues(attack),...deathScytheSoundCues(attack)];
 return {sourceClock:'actor-state',nativeDispatcherVerified:special,cadenceDependent:special,
  sourceDurationsMs:special?Object.fromEntries(DEATH_SCYTHE_SPECIAL_PHASES.map(phase=>[phase.name,phase.durationMs])):null,
  sourceNominalSumMs,sourceNominalSumIsRuntimeExit:false,
  sourceNominalRoute:special?(attack.kind==='strong'?'firstAttack + firstDelay (miss)':'finishAttack + finishDelay (subphase only)'):'profile action + recovery',
  runtimeStateTimeMs:runtime?.timeMs??null,runtimePhase:runtime?.phase??null,runtimeClockMode:runtime?.clockMode??null,
  actualExitMs,outsideSourceNominalSum:cues.filter(c=>c.at*1000>sourceNominalSumMs),
  outsideObservedState:actualExitMs===null?null:cues.filter(c=>c.at*1000>actualExitMs),
  automaticSecondImpact:latch?.invoked===true,
  callbackOriginMs:latch?.invoked===true&&Number.isFinite(latch.originMs)?latch.originMs:null};
}
export const DEATH_SCYTHE_EFFECT_LIMITS=Object.freeze([
 'SpecialAttack has two ex_att calls at time0 (AddSequence and AddSequenceBySex) and two identical laughter calls at1000; all are preserved, without deduplication or certification of simultaneous native playback.',
 'The source second-impact callback is not an actor-state event. strongFollow returns no replay of the parent SpecialAttack cues.',
 'Special source timers400/550/500/500 and their dispatcher are verified. The miss nominal sum900ms is not a runtime exit time: cadence, strict pre-tick checks and the qualified callback determine the path. Both laughter calls remain at1000ms; diagnostics never stretch the state to force them.',
 'automaticSecondImpact reports the runtime latch.invoked flag only. No callback is inferred from definitions, a requested-only signal or a phase name; callback contacts keep their independent origin.',
 'Actor following, native sourceEndMs semantics, trail shape and audio spatialization remain unverified.',
]);
