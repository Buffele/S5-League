import {s5runtimeShieldBodyDurationFromNativeTicks} from './s5runtime-skill-shield-body.js';

// Authenticated offline carriers; selecting this profile does not identify the
// model collection actually loaded by the native client or the S5 host.
const carriers = Object.freeze({
  male: Object.freeze({path:'model/character/male_bip.scn',sha256:'d9953bde346c6b242e8d45d4ea885a581203c3999a78ab13d60aa7ea3997dba5'}),
  female: Object.freeze({path:'model/character/female_bip.scn',sha256:'98caac4c4f8ee8900a9b28b050e7900fbb8c4c1b65a5f968a20110ae7653d465'}),
});
const proofPath = 'work/parallel-gameplay-reference/competences/shield/duration-source/rig-duration-proof.json';

export function createS5RuntimeShieldDurationProfile({sex,carrierSourceSha256,provenance}={}) {
  const carrier = carriers[sex];
  if (!carrier || carrierSourceSha256 !== carrier.sha256) throw Error('Exact authenticated Shield carrier and sex required');
  if (typeof provenance !== 'string' || !provenance.trim()) throw Error('Explicit host carrier-selection provenance required');
  return Object.freeze({kind:'s5runtime-shield-authenticated-carrier-duration-v1',sex,carrierSource:carrier.path,carrierSourceSha256,provenance,proofPath,nativeRuntimeCarrierBindingVerified:false,nativeReady:false});
}

export function selectS5RuntimeShieldBodyDuration(profile,{clip}={}) {
  const carrier = carriers[profile?.sex];
  if (profile?.kind !== 's5runtime-shield-authenticated-carrier-duration-v1' || !carrier || profile.carrierSource !== carrier.path || profile.carrierSourceSha256 !== carrier.sha256 || typeof profile.provenance !== 'string' || !profile.provenance.trim()) throw Error('Authenticated Shield duration profile required');
  const rawTicks = clip === 'I0003' ? 1200 : clip === 'I0004' ? 4800 : null;
  if (rawTicks === null) throw Error('Shield duration proof only covers I0003 and I0004');
  return {clip,rawTicks,durationMs:s5runtimeShieldBodyDurationFromNativeTicks(rawTicks),sex:profile.sex,carrierSource:carrier.path,carrierSourceSha256:carrier.sha256,provenance:profile.provenance,proofPath,sourceQualification:'SCN duration DWORD → KeyData+38 → first-success transform lookup → channel+2C → float32/4.8f → truncation',nativeRuntimeCarrierBindingVerified:false,nativeReady:false};
}
