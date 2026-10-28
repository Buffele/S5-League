// Initialized lower properties, current-PE ctor+current XBN declarations.
// This is a named SOURCE DECLARATION, not proof of a live selected registry.
export const SHIELD_LOWER_FREE_DECLARATION=Object.freeze({
 schema:'shield-lower-registry-declaration-v1',kind:'source-declaration',id:'current-xbn-free',profile:'GAMETEMPO_FREE',
 source:'work/parallel-gameplay-reference/physique/movement-registry/source/native-constant_info.xml; SHA256170db9deb71847e98e2f4a6cea87e465ec0ef7f494a40a7d29f6564be41f7189',
 values:Object.freeze({jumpForce:2700,jumpTimeMs:700,jumpPredelayMs:0,jumpLanddelayMs:300,animationMoveSpeed:915,frontRate:1,sideRate:.95,backRate:.9,jumpMoveRate:1}),
 measured:false,
});
export const SHIELD_LOWER_PROFILE_SOURCES=Object.freeze({
 peSha256:'6bea9d8cc2503a1e660c1d8a9dfd1241f394207c4f1cb84a9d4a1fea3d3c8017',
 xbnPath:'work/parallel-gameplay-reference/physique/movement-registry/source/native-constant_info.xml',xbnSha256:'170db9deb71847e98e2f4a6cea87e465ec0ef7f494a40a7d29f6564be41f7189',
 luaPath:'work/parallel-gameplay-reference/competences/flying-body-state-source/script/actorstates_gameplay.lua',luaSha256:'2a5f44262ffaeb13b5d16f8c8bbaa513c16903ad801b93c038cbfe95037ce996',
});
const scalar=(v,name)=>{if(!Number.isFinite(v))throw new TypeError(`${name} finite logical value required`);return Math.fround(v);};
const uint=(v,name)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw new TypeError(`${name} uint32 required`);return v;};
const timer=durationMs=>({counter:0,elapsedMs:0,durationMs,blocked:false});
export function createShieldLowerInitializationProfile({registry}={}){
 if(!registry||!['source-declaration','measured-logical-registry','s5-explicit-adaptation'].includes(registry.kind)||typeof registry.profile!=='string'||!registry.profile.trim()||typeof registry.source!=='string'||!registry.source.trim())throw new TypeError('Explicit named registry/profile provenance required');
 const v=registry.values;if(!v)throw new TypeError('Logical registry values required');
 const jumpForce=scalar(v.jumpForce,'GameTempo1B'),jumpTimeMs=uint(v.jumpTimeMs,'GameTempo1E'),jumpPredelayMs=uint(v.jumpPredelayMs,'GameTempo1F'),jumpLanddelayMs=uint(v.jumpLanddelayMs,'GameTempo20');
 const animationMoveSpeed=scalar(v.animationMoveSpeed,'GameTempo16');if(animationMoveSpeed===0)throw new RangeError('Zero animation ratio denominator unsupported');
 const rates={frontRate:scalar(v.frontRate,'GameTempo17'),sideRate:scalar(v.sideRate,'GameTempo18'),backRate:scalar(v.backRate,'GameTempo19'),jumpMoveRate:scalar(v.jumpMoveRate,'GameTempo1C')};
 return {
  schema:'shield-lower-initialization-profile-v1',registry:{kind:registry.kind,id:registry.id??null,profile:registry.profile,source:registry.source},
  ground:{phase:9,active:false,groundProperty14:1,normalBlendMs:0,allChannels:false,speedFlag:false},
  airState:{phase:0,active:false,zeroInputAtLaunch:false,animation:timer(jumpTimeMs),launch:timer(jumpPredelayMs),landing:timer(jumpLanddelayMs)},
  air:{airProperty18:jumpForce,airProperty28:1,speedFlag:false},
  animation:{gameTempo16:animationMoveSpeed},rates,float3:Math.fround(.001),
  provenance:{groundProperty14:'62B120→Float2F source declaration1',normalBlendMs:'62B120 direct store ground+24=0; raw argument name only',allChannels:'62B120 direct store ground+2C=false',airProperty18:'628570→GameTempo1B logical jump_force',airProperty28:'628570 initializes protected logical1 via4CA7E0; random XOR key is storage',animation:'628570→GameTempo1E jump_time integer getter1053ED0/4CA2D0',launch:'628570→GameTempo1F jump_predelay',landing:'628570→GameTempo20 jump_landdelay',speedFlag:'648960 overrides both sets62A5F0(false)',lua:'Skill_Shield3583..3625 changes WalkAnimParam entries, not these movement fields'},
  sources:SHIELD_LOWER_PROFILE_SOURCES,nativeReady:false,nativeRuntimeSelectionVerified:false,runtimeRegistrySelectionVerified:false,sourceActorGetterRequired:true,
 };
}
export function createShieldLowerSourceProfile({declaration,provenance}={}){
 if(declaration!=='FREE')throw new TypeError('Explicit supported declaration FREE required');
 const source=typeof provenance==='string'?provenance:provenance?.source;
 if(typeof source!=='string'||!source.trim())throw new TypeError('Named caller source-selection provenance required');
 const profile=createShieldLowerInitializationProfile({registry:SHIELD_LOWER_FREE_DECLARATION});
 return {...profile,declaration,selectionProvenance:{kind:'explicit-source-declaration-selection',source},
  groundProperty14:profile.ground.groundProperty14,groundAnimationArgument24:profile.ground.normalBlendMs,allChannels:profile.ground.allChannels,
  airProperty18:profile.air.airProperty18,airProperty28:profile.air.airProperty28,speedFlag:false,
 };
}
