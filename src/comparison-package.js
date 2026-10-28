// Offline Node-only package adapter. Reuses real scenario implementations;
// never launches native code or promotes a scoped window to full readiness.
import {createHash} from 'node:crypto';
import {Controller} from './controller.js';
import {MOVEMENT_SCENARIOS,movementScenarioWorld} from './movement-comparison-scenarios.js';
import {REACTION_SCENARIOS,runReactionScenario} from './reaction-comparison-scenarios.js';
import {SKILL_SCENARIOS,SKILL_TOLERANCES,runSkillScenario,compareSkillTraces} from './skill-comparison.js';
import {compareMovementTraces,validateMovementTrace,nativeReplayTickDeltasMs,movementReplayInputSchedule,realizedFeetVelocities,REALIZED_VELOCITY_DERIVATION,MOVEMENT_TOLERANCES} from './movement-comparison.js';
import {compareReactionTraces} from './reaction-comparison.js';
import {comparisonActorMpCase,normalizeComparisonActorMpProfile} from './comparison-actor-mp-profile.js';
export const PACKAGE_SCHEMA='s5runtime-comparison-package-v1';
export const CURRENT_PE_SHA256='6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017';
export const EVIDENCE_CHANNELS=Object.freeze(['actorIdentity','logicalDecoding','clockOrigin','cadence','inputDelivery','environmentLoadout','initialState']);
// A replay interval is not the wall duration of the native function call.
export const COMPARISON_TIME_CONVENTION=Object.freeze({engineInterval:'actor51EAB0-uint32-ms',sample0:'before-first-selected-global-tick',postSamples:'after-each-global-tick-return',logicalSampleTime:'cumulative-engine-dt',absoluteClock:'separate-measured-entry-return-keycommit',eventAssociation:'delivered-and-consumed-actor-tick-index',wallDurationEqualsDtRequired:false});
export const COMPARISON_SCOPE=Object.freeze([
 ...MOVEMENT_SCENARIOS.map(s=>({family:'movement',scenario:s.id,scope:'physical-feet-realized-velocity-energy',velocityChannel:'realized-feet-difference',sex:'male'})),
 ...REACTION_SCENARIOS.map(s=>({family:'reaction',scenario:s.id,scope:s.profile==='handgun'?'controlled-Push-condition-window':'received-Blow-condition-window',velocityChannel:'realized-feet-difference',sex:'male'})),
 ...SKILL_SCENARIOS.map(s=>({family:'flying',scenario:s.id,scope:'vertical-Flying-physical-cost-phase-window',velocityChannel:'physical-actor-F0',sex:s.sex})),
]);
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export const inputHash=schedule=>sha256(JSON.stringify(schedule));
export const packageTolerances=family=>family==='flying'?SKILL_TOLERANCES:MOVEMENT_TOLERANCES;
export function nativePackageSchemas(){
 const artifact={type:'object',required:['path','sha256'],properties:{path:{type:'string',minLength:1},sha256:{type:'string',pattern:'^[a-fA-F0-9]{64}$'}}};
 const ids=family=>COMPARISON_SCOPE.filter(s=>s.family===family).map(s=>s.scenario);
 const entry={type:'object',required:['family','scenario','trace','capture','measurement'],properties:{family:{enum:['movement','reaction','flying']},scenario:{type:'string'},trace:artifact,capture:artifact,measurement:artifact},allOf:['movement','reaction','flying'].map(family=>({if:{properties:{family:{const:family}}},then:{properties:{scenario:{enum:ids(family)}}}}))};
 const manifest={$schema:'https://json-schema.org/draft/2020-12/schema',title:PACKAGE_SCHEMA,type:'object',required:['schema','entries'],properties:{schema:{const:PACKAGE_SCHEMA},entries:{type:'array',items:entry}}};
 const measurement={$schema:'https://json-schema.org/draft/2020-12/schema',title:'native-measured-comparison-v1',type:'object',required:['schema','kind','engine','capturedAt','peSha256','captureSha256','nativeExecuted','synthetic','family','scenario','actorVerified','logicalValuesDecoded','clockOrigin','timeConvention','tickDeltasMs','inputFingerprint','initialConditions','environment','loadout','evidence'],properties:{schema:{const:'native-measured-comparison-v1'},kind:{const:'native-measured'},engine:{const:'s5runtime'},capturedAt:{type:'string',format:'date-time'},peSha256:{const:CURRENT_PE_SHA256},captureSha256:{type:'string',pattern:'^[a-fA-F0-9]{64}$'},nativeExecuted:{const:true},synthetic:{const:false},family:entry.properties.family,scenario:{enum:COMPARISON_SCOPE.map(s=>s.scenario)},actorVerified:{const:true},logicalValuesDecoded:{const:true},clockOrigin:{type:'object',required:['event','measured','sourceTimeSeconds'],properties:{event:{type:'string',minLength:1},measured:{const:true},sourceTimeSeconds:{type:'number'}}},timeConvention:{const:COMPARISON_TIME_CONVENTION},tickDeltasMs:{type:'array',minItems:1,items:{type:'integer',minimum:1,maximum:33}},inputFingerprint:{type:'string',pattern:'^[a-fA-F0-9]{64}$'},initialConditions:{type:'object',required:['sex','weapon','energy','facing']},environment:{type:'string',minLength:1},loadout:{type:'string',minLength:1},evidence:{type:'object',required:EVIDENCE_CHANNELS,properties:Object.fromEntries(EVIDENCE_CHANNELS.map(channel=>[channel,artifact]))}},description:'Runtime validator additionally verifies bytes/hashes, rejects placeholders, checks all contract correspondences and replays identical delivered inputs; JSON schema alone is insufficient.'};
 const actorProfile={type:'object',additionalProperties:false,required:['schema','id','version','sex','weapon','currentMp','maximumMp'],properties:{schema:{const:'comparison-actor-mp-profile-v1'},id:{type:'string',pattern:'^[-a-zA-Z0-9_]{1,48}$'},version:{const:1},sex:{enum:['male','female']},weapon:{const:'dagger'},currentMp:{type:'number',minimum:0},maximumMp:{type:'number',minimum:0}}};
 entry.properties.actorProfile=actorProfile;entry.properties.caseId={type:'string',minLength:1};
 entry.allOf.push({if:{required:['actorProfile']},then:{required:['caseId'],properties:{family:{const:'movement'},scenario:{const:'stationary-jump'}}}});
 Object.assign(measurement.properties,{actorProfile,caseId:{type:'string',minLength:1},actorProfileFingerprint:{type:'string',pattern:'^[a-f0-9]{64}$'}});
 measurement.allOf=[{if:{required:['actorProfile']},then:{required:['caseId','actorProfileFingerprint'],properties:{family:{const:'movement'},scenario:{const:'stationary-jump'},initialConditions:{required:['maximumMp']}}}}];
 return {manifest,measurement};
}
export function descriptorFor(family,scenario,{actorProfile}={}){const descriptor=COMPARISON_SCOPE.find(s=>s.family===family&&s.scenario===scenario);if(!descriptor)throw Error('Unknown comparison family/scenario');if(actorProfile===undefined)return descriptor;if(family!=='movement')throw Error('Actor MP profiles require movement stationary-jump');const contract=comparisonActorMpCase(scenario,actorProfile,{sha256});return {...descriptor,...contract,sex:contract.actorProfile.sex};}
export function validArtifactHash(value){return typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value)&&!/^([a-f0-9])\1{63}$/i.test(value);}
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export function placeholderArtifact(bytes){
 if(!bytes.length||bytes.every(byte=>byte===0))return true;
 const text=bytes.toString('utf8').trim();
 if(!text||/^(?:TODO|PLACEHOLDER|SYNTHETIC|FIXTURE|EXAMPLE|null|\{\}|\[\])\s*$/i.test(text))return true;
 try{const value=JSON.parse(text);return value?.synthetic===true||['placeholder','synthetic','fixture','example'].includes(value?.kind);}catch{return false;}
}
export function validatePackageManifest(manifest){
 if(manifest?.schema!==PACKAGE_SCHEMA||!Array.isArray(manifest.entries))throw Error('Invalid comparison package manifest');
 const seen=new Set();for(const entry of manifest.entries){const descriptor=descriptorFor(entry.family,entry.scenario,{actorProfile:entry.actorProfile});if(entry.caseId!==descriptor.caseId)throw Error('Manifest actor profile caseId mismatch');const key=entry.family+'/'+(entry.caseId??entry.scenario);if(seen.has(key))throw Error('Duplicate comparison entry '+key);seen.add(key);
  for(const key of ['trace','capture','measurement'])if(!entry[key]?.path||!validArtifactHash(entry[key].sha256))throw Error('Missing real '+key+' path/SHA256');
 }
 return manifest;
}
// Integrity and attestation consistency are checked here. These checks cannot
// prove that a dishonest attestation describes a real process; reports say so.
export function validateMeasuredComparison({entry,trace,measurement,verifiedArtifacts}){
 const descriptor=descriptorFor(entry.family,entry.scenario,{actorProfile:entry.actorProfile}),m=trace.metadata;
 if(measurement?.schema!=='native-measured-comparison-v1'||measurement.kind!=='native-measured'||measurement.engine!=='s5runtime'||measurement.nativeExecuted!==true||measurement.synthetic!==false)throw Error('Not an explicitly measured native comparison');
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(measurement.capturedAt??'')||!Number.isFinite(Date.parse(measurement.capturedAt))||measurement.peSha256!==CURRENT_PE_SHA256)throw Error('Missing capture date or wrong native executable identity');
 if(measurement.family!==entry.family||measurement.scenario!==entry.scenario||m?.scenario!==entry.scenario)throw Error('Measurement family/scenario mismatch');
 if(/\b(?:placeholder|synthetic|fixture|example|dummy|todo|unmeasured)\b/i.test(m?.source??''))throw Error('Placeholder/synthetic trace source is not native evidence');
 if(!validArtifactHash(m?.captureSha256)||m.captureSha256!==entry.capture.sha256||measurement.captureSha256!==entry.capture.sha256)throw Error('Raw capture SHA mismatch');
 if(measurement.actorVerified!==true||measurement.logicalValuesDecoded!==true)throw Error('Native actor identity/logical decoding not established');
 if(!equal(measurement.timeConvention,COMPARISON_TIME_CONVENTION)||!equal(m?.timeConvention,COMPARISON_TIME_CONVENTION))throw Error('Missing or unsupported three-channel time convention');
 for(const key of EVIDENCE_CHANNELS){const proof=measurement.evidence?.[key];if(!proof?.path||!validArtifactHash(proof.sha256)||verifiedArtifacts?.[proof.path]!==proof.sha256)throw Error('Missing verified evidence '+key);}
 for(const key of ['clockOrigin','inputFingerprint','initialConditions','environment','loadout'])if(!equal(measurement[key],m?.[key]))throw Error('Measurement versus trace '+key+' mismatch');
 for(const key of ['caseId','actorProfile','actorProfileFingerprint'])if(!equal(measurement[key],m?.[key])||!equal(m?.[key],descriptor[key]))throw Error('Measurement versus manifest/trace '+key+' mismatch');
 validateMovementTrace(trace);const tickDeltasMs=nativeReplayTickDeltasMs(trace);
 if(!equal(measurement.tickDeltasMs,tickDeltasMs))throw Error('Measurement cadence differs from physical timestamps');
 if(descriptor.actorProfile){const total=tickDeltasMs.reduce((sum,dt)=>sum+dt,0);if(total<1500||total-tickDeltasMs.at(-1)>=1500)throw Error('Profile stationary-jump requires the complete window through first Tick return at/after1500ms; no cut/drop');}
 if(m.velocityChannel!==descriptor.velocityChannel)throw Error('Wrong velocity channel for comparison family');
 if(!Array.isArray(trace.inputSchedule)||inputHash(trace.inputSchedule)!==m.inputFingerprint)throw Error('Trace input schedule does not match its exact fingerprint');
 return {descriptor,tickDeltasMs,provenance:'artifact-integrity-and-attestation-consistency-verified',nativeReady:false};
}
export function runPackageScenario(family,scenarioId,{tickDeltasMs,runtimeHashes={},actorProfile}={}){
 const descriptor=descriptorFor(family,scenarioId,{actorProfile});let run,schedule,sourceImpulseGate=null,loadout,origin;
 if(family==='movement'){
  const scenario=MOVEMENT_SCENARIOS.find(s=>s.id===scenarioId),world=movementScenarioWorld(scenario),actor=new Controller(world,{sex:actorProfile?.sex??'male'}),samples=[];
  if(actorProfile!==undefined){actorProfile=normalizeComparisonActorMpProfile(actorProfile);actor.setComparisonActorMpDiagnosticProfile(actorProfile);}
  tickDeltasMs??=Array(Math.round(scenario.duration*100)).fill(10);schedule=movementReplayInputSchedule(scenario,tickDeltasMs);
  const initialConditions={sex:actor.sex,weapon:actor.weapon,energy:actor.energy,facing:actor.facing};
  if(actorProfile!==undefined)initialConditions.maximumMp=actorProfile.maximumMp;
  const save=t=>samples.push({t,position:{...actor.position},controllerVelocity:{...actor.velocity},energy:actor.energy,state:actor.state});
  let elapsedMs=0;save(0);for(const row of schedule){actor.step(row.dtMs/1000,row.input);elapsedMs+=row.dtMs;save(elapsedMs/1000);}
  const velocities=realizedFeetVelocities(samples);samples.forEach((s,i)=>{s.velocity=velocities[i];});run={world,samples,initialConditions};loadout='dagger; male; maxEnergy140; FREE';origin='scenario-input-start';
  if(actorProfile!==undefined)loadout=`dagger; ${actorProfile.sex}; actorMpProfile${actorProfile.id}; cap${actorProfile.maximumMp}; FREE`;
 }else if(family==='reaction'){
  run=runReactionScenario(REACTION_SCENARIOS.find(s=>s.id===scenarioId),{tickDeltasMs});tickDeltasMs=run.tickDeltasMs;
  const scenario=REACTION_SCENARIOS.find(s=>s.id===scenarioId);schedule=[{t:0,event:'condition-accepted',parameters:run.definition.parameters,recordDirection:scenario.recordDirection??(run.definition.condition==='push'?[-1,0,0]:[1,0,0]),integration:run.definition.integration},...run.inputSchedule];
  const expected=run.sourceMagnitudes;sourceImpulseGate=expected?{status:Math.abs(run.actualEntryVelocity.x-expected.pushSpeed)<1e-6&&Math.abs(run.actualEntryVelocity.y-expected.liftSpeed)<1e-6?'pass':'fail',expected,actual:run.actualEntryVelocity}:{status:'condition-only',parameters:run.definition.parameters};
  loadout='target dagger; male; maxEnergy140; FREE; neutral reaction modifiers';origin='condition-accepted';
 }else{
  const scenario=SKILL_SCENARIOS.find(s=>s.id===scenarioId);run=runSkillScenario(scenario,{tickDeltasMs});tickDeltasMs=run.tickDeltasMs;schedule=run.inputSchedule;
  loadout=`dagger;${run.initialConditions.sex};skill${scenario.itemKey};FREE;neutral skill modifiers`;origin='native-special1-begin20';
 }
 const metadata={scenario:scenarioId,environment:JSON.stringify(run.world),loadout,initialConditions:run.initialConditions,inputFingerprint:inputHash(schedule),clockOrigin:{event:origin,sourceTimeSeconds:0,measured:true},positionChannel:'physical-feet',velocityChannel:descriptor.velocityChannel,source:'S5 scenario adapter via tools/run-comparison-package.mjs',runtimeHashes,units:'scene',axes:'s5-world',actorVerified:true,logicalValuesDecoded:true,tickDeltasMs,replayCadence:{mode:'explicit-scenario-diagnostic-or-authenticated-replay',tickDeltasMs}};
 metadata.timeConvention=COMPARISON_TIME_CONVENTION;
 if(actorProfile!==undefined){for(const key of ['caseId','actorProfile','actorProfileFingerprint'])metadata[key]=descriptor[key];metadata.mpDiagnosticQualification='Explicit actor current/cap; ordinary recovery suspended; no native regeneration behavior or live measurement inferred';}
 if(family==='flying')metadata.velocityQualification='Source-derived Flying logical cache; actor callbacks/collision/lifecycle certification remains separate';
 else {metadata.velocityDerivation=REALIZED_VELOCITY_DERIVATION;metadata.controllerVelocityChannel='mixed-branch-dependent-command-proxy';}
 if(family==='reaction'){metadata.integration=run.definition.integration;metadata.acceptedConditionVelocityChannel=run.definition.condition==='blow'?'controller-condition-entry-source-gated':'controller-condition-entry-no-F0-write-established';}
 return {descriptor,trace:{schema:1,engine:'s5',metadata,inputSchedule:schedule,samples:run.samples,sourceImpulseGate},sourceImpulseGate,limits:[...(run.limits??[]),...(actorProfile===undefined?[]:['Actor MP profile uses constant energy unless explicit native callbacks provide changes; ordinary recovery is suspended, not source-certified'])]};
}
export function comparePackageScenario(reference,candidate,tickDeltasMs){
 const family=candidate.descriptor.family,view=structuredClone(reference);
 if(family==='flying')view.metadata.tickDeltasMs=[...tickDeltasMs];
 const comparison=family==='flying'?compareSkillTraces(view,candidate.trace):family==='reaction'?compareReactionTraces(view,candidate.trace):compareMovementTraces(view,candidate.trace);
 const physicalComparisonPassed=(comparison.comparisonPassed??comparison.status==='pass')&&candidate.sourceImpulseGate?.status!=='fail';
 return {comparison,sourceImpulseGate:candidate.sourceImpulseGate,validatedPhysicalWindow:physicalComparisonPassed,nativeReady:false,scope:candidate.descriptor.scope,gateBlockers:['Full feature/browser/resources/network fidelity is outside this scenario window',...candidate.limits],tolerances:comparison.tolerances??MOVEMENT_TOLERANCES};
}
