// Browser-safe value contract. It neither reads an actor nor establishes that
// these values were measured; identity/loadout/initial-state proofs are external.
export const COMPARISON_ACTOR_MP_PROFILE_SCHEMA='comparison-actor-mp-profile-v1';
const keys=['schema','id','version','sex','weapon','currentMp','maximumMp'];
export function normalizeComparisonActorMpProfile(value){
 if(!value||value.schema!==COMPARISON_ACTOR_MP_PROFILE_SCHEMA||value.version!==1||typeof value.id!=='string'||!/^[-a-zA-Z0-9_]{1,48}$/.test(value.id)||!['male','female'].includes(value.sex)||typeof value.weapon!=='string'||!value.weapon||Object.keys(value).some(key=>!keys.includes(key)))throw new TypeError('Explicit versioned actor MP profile required');
 if(![value.currentMp,value.maximumMp].every(n=>Number.isFinite(n)&&Math.fround(n)===n)||value.currentMp<0||value.maximumMp<0||value.currentMp>value.maximumMp)throw new RangeError('Explicit float32 current/max MP with 0<=current<=cap required');
 return Object.fromEntries(keys.map(key=>[key,value[key]]));
}
export function serializeComparisonActorMpProfile(value){return JSON.stringify(normalizeComparisonActorMpProfile(value));}
// Hashing is injected so Controller can reuse the value validator without a
// Node crypto import. Runners use their existing SHA256 implementation.
export function comparisonActorMpCase(scenarioId,value,{sha256}={}){
 if(scenarioId!=='stationary-jump'||typeof sha256!=='function')throw new TypeError('Actor MP variants currently require stationary-jump and explicit SHA256');
 const actorProfile=normalizeComparisonActorMpProfile(value),actorProfileFingerprint=sha256(JSON.stringify(actorProfile));
 if(actorProfile.weapon!=='dagger')throw new TypeError('Current stationary-jump actor profile requires dagger');
 if(typeof actorProfileFingerprint!=='string'||!/^[a-f0-9]{64}$/.test(actorProfileFingerprint))throw new TypeError('Canonical profile SHA256 required');
 return {scenario:scenarioId,caseId:`${scenarioId}@actor-mp-v1:${actorProfile.id}:${actorProfileFingerprint}`,actorProfile,actorProfileFingerprint};
}
export function validateComparisonActorMpCase(metadata,{sha256}={}){
 const hasProfile=metadata?.actorProfile!==undefined;
 if(!hasProfile){if(metadata?.actorProfileFingerprint!==undefined||metadata?.caseId!==undefined)throw new Error('Profile case metadata cannot omit the explicit actor profile');return null;}
 const expected=comparisonActorMpCase(metadata.scenario,metadata.actorProfile,{sha256});
 if(metadata.caseId!==expected.caseId||metadata.actorProfileFingerprint!==expected.actorProfileFingerprint)throw new Error('Actor profile case identity/fingerprint mismatch');
 const initial=metadata.initialConditions;
 if(initial?.sex!==expected.actorProfile.sex||initial?.weapon!==expected.actorProfile.weapon||initial?.energy!==expected.actorProfile.currentMp||initial?.maximumMp!==expected.actorProfile.maximumMp)throw new Error('Actor profile differs from initial current/max MP or identity');
 return expected;
}
