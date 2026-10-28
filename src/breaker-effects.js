import {readAsset} from './scene-assets.js';
import {convertParticleSequence} from './native-particle-sequence.js';
import {BREAKER_ABILITY,BREAKER_SOURCE_EFFECTS} from './breaker-combat-data.js';

const ROOT='/assets/s5runtime/effects/breaker';
const HEAVY_SOURCE='weapon_breaker_chargeattcack';
const AIR_SOURCE='hm_jumpattack';
const AIR_MODELS=Object.freeze({
 'eff_bat_jumpattack.scn':{asset:`${ROOT}/models/eff_bat_jumpattack.json`,animation:'JUMP_ATTACK'},
 'hm_jump.scn':{asset:`${ROOT}/models/hm_jump.json`,animation:'hm_jump'},
});
export const BREAKER_IMPACT_SOCKET=Object.freeze({source:'model/weapon/breaker.scn',model:'breaker',node:'HM_DMGeffect_Dummy'});
export const BREAKER_HEAVY_SOURCE_EVENT=.5;
export const BREAKER_HEAVY_EMISSION_DELAY=.1;

// Decoded source assets stay immutable. Presentation adapters explicitly
// translate their authored origin into the equipped weapon's effect socket.
function particleOnly(raw){
 const nodes=raw?.nodes?.filter(node=>node.type==='CActParticle')??[];
 if(!raw?.coverage?.reachesExactEof||nodes.length===0)throw Error('Complete Breaker particle sequence required');
 return convertParticleSequence({...raw,nodes},ROOT);
}

function sourceFileName(node){
 return node.fields?.fileName?.value?.split(/[\\/]/).at(-1).toLowerCase();
}

function loaderNode(node,tracks){
 const base=node.fields?.base,model=AIR_MODELS[sourceFileName(node)];
 if(!base||!model)throw Error(`Unsupported Breaker aerial loader ${sourceFileName(node)??'unknown'}`);
 return {
  id:node.index,type:'CActNodeLoader',parentType:base.field0c.int32,parent:base.field10.int32,bone:base.name.value,
  start:base.startTimeField.int32/1000,end:base.endTimeField.int32/1000,asset:model.asset,
  loader:{animation:model.animation,loop:!!node.fields.flag80,includeSourceBones:sourceFileName(node)==='eff_bat_jumpattack.scn',sourceTransformTracks:true,
   sourceEffectTracks:tracks.scenes[`effects/${sourceFileName(node)}`],
   sourceOrigin:sourceFileName(node)==='eff_bat_jumpattack.scn'?{bone:'Dummy01'}:{model:'breaker alphablend2  nofog  nocull'},
   fadeInMs:node.fields.field84.int32,fadeOutMs:node.fields.field88.int32},
 };
}

function aerialSequence(raw,tracks){
 if(!raw?.coverage?.reachesExactEof)throw Error('Complete Breaker aerial sequence required');
 const unsupported=raw.nodes.filter(node=>node.type!=='CActParticle'&&node.type!=='CActNodeLoader');
 if(unsupported.length)throw Error(`Unsupported Breaker aerial nodes: ${unsupported.map(node=>node.type).join(', ')}`);
 const particles=particleOnly(raw);for(const node of particles.nodes)node.anchorRotation=true;
 const loaders=raw.nodes.filter(node=>node.type==='CActNodeLoader').map(node=>loaderNode(node,tracks));
 return {...particles,nodes:[...particles.nodes,...loaders].sort((a,b)=>a.id-b.id)};
}

export async function loadBreakerEffectDefinitions(){
 const [heavy,air,tracks]=await Promise.all([
  readAsset(`${ROOT}/sequences/${HEAVY_SOURCE}.json`),
  readAsset(`${ROOT}/sequences/${AIR_SOURCE}.json`),
  readAsset('/assets/weapons/breaker/effect-tracks.json'),
 ]);
 const impact=particleOnly(heavy);
 if(Math.min(...impact.nodes.map(node=>node.start))!==BREAKER_HEAVY_EMISSION_DELAY)throw Error('Breaker impact emission delay changed');
 // Preserve the authored visible timeline while deferring the detached
 // socket snapshot until first emission. At AddSequence time the hammer is
 // still winding up behind the actor; at +100 ms it reaches the impact.
 impact.duration-=BREAKER_HEAVY_EMISSION_DELAY;
 for(const node of impact.nodes){
  node.start-=BREAKER_HEAVY_EMISSION_DELAY;node.end-=BREAKER_HEAVY_EMISSION_DELAY;
  node.anchorRotation=true;
  // The actor-space sequence emits at (0,0,-600). The requested weapon-space
  // presentation puts that emission centre at the evaluated impact dummy.
  node.emitterKeys=node.emitterKeys.map(key=>({...key,'object+1c':key['object+1c']+600}));
 }
 return {
  breaker_heavy_ground:impact,
  breaker_air_strike:aerialSequence(air,tracks),
 };
}

export async function loadBreakerEffects(scene){
 const {loadEffectRuntime}=await import('./combat-effects.js');
 return loadEffectRuntime(scene,await loadBreakerEffectDefinitions());
}

// Exact AddSequence calls from StandardBreakerAfterDash4 / JumpDash. Their
// source end parameter is recorded for audit; the SEQ's authored duration
// remains the runtime clock. Socket policies below are the user's corrected
// presentation requirement; do not mislabel them as a proven native binding.
export function breakerStateCues(attack){
 if(attack?.weapon!=='breaker')return [];
 if(attack.kind==='heavy')return [{name:'breaker_heavy_ground',at:BREAKER_HEAVY_SOURCE_EVENT+BREAKER_HEAVY_EMISSION_DELAY,sourceEventAt:BREAKER_HEAVY_SOURCE_EVENT,emissionDelay:BREAKER_HEAVY_EMISSION_DELAY,follow:false,weaponSocket:BREAKER_IMPACT_SOCKET,surfaceImpact:{maxDrop:BREAKER_ABILITY.range*.006},sourcePath:'Effects/weapon_breaker_chargeattcack.seq',sourceEndMs:5000,sourceMethod:'AddSequence',anchor:'weapon-surface-snapshot'}];
 if(attack.kind==='air')return [{name:'breaker_air_strike',at:0,follow:true,weaponSocket:BREAKER_IMPACT_SOCKET,cancelOnExit:true,sourcePath:'Effects/hm_jumpattack.seq',sourceEndMs:5000,sourceMethod:'AddSequence',anchor:'weapon-follow'}];
 return [];
}

// A missing visual SEQ does not remove its separately declared audio event.
export function breakerSoundCues(attack){
 if(attack?.weapon!=='breaker')return [];
 return (BREAKER_SOURCE_EFFECTS[attack.kind]?.sequences??[]).flatMap((event,sourceIndex)=>event.sound?
  [{key:attack.kind==='heavy'?'rush':'breakerAirPower',timeMs:event.startMs,sourceIndex,sourceMethod:'AddSequence',sourceEndMs:event.endParameter}]:[]);
}

// This per-state source ledger is intentionally executable. A future weapon
// port must either wire every authored presentation event or record the exact
// source-backed reason it remains unavailable; a missing effect cannot be
// mistaken for a completed state.
export const BREAKER_PRESENTATION_COVERAGE=Object.freeze({
 heavy:{cue:'breaker_heavy_ground',source:'StandardBreakerAfterDash4 / weapon_breaker_chargeattcack.seq'},
 air:{cue:'breaker_air_strike',source:'JumpDash / hm_jumpattack.seq'},
 light:{trail:'breaker actor GhostTrail',source:'StandardBreakerAfterDash1–3'},
 strong:{trail:'breaker actor GhostTrail',source:'StandardBreakerAfterDash4'},
 charge:{absent:'VFX declarations are commented out in the active source body',source:'StandardBreakerAfterDash5'},
 gather:{absent:'VFX declarations are commented out in the active source body',source:'StandardBreakerGatherGuage'},
});

export const BREAKER_EFFECT_LIMITS=Object.freeze([
 'Heavy particles and the complete supported hm_jumpattack particle/NodeLoader tree are sourced from complete decoded sequences and run in the main combat runtime.',
 'The separate skill_bat_strike and skill_bat_strike1 branches have not been attached: their external Bat anchor and one source asset remain unresolved.',
 'Impact dummy, origin rebasing and weapon-follow policy implement the user correction of 2026-10-25; native external-node semantics and frame-by-frame visual comparison remain open.',
]);
