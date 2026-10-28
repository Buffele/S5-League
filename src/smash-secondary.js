import {SMASH_RIFLE} from './smash-rifle-data.js';
import {emitMeleeActivation} from './melee-activations.js';
import {nativeRequestedAnimationSpeed} from './native-animation-duration-speed.js';
import {meleeShapeContact} from './native-melee.js';
import {meleeRayEllipsoidContact,worldMeleeRay} from './native-melee-ray.js';

// StandardSmg3sword / UseWeapon2WeakState_SMG3Sword; item2010006.
// Factory837980 uses s32[58]=1000 for the main timer, NOT InitLua's40.
// Source CRC/SHA, factory bytes and shared MovingState timing evidence:
// work/smash-secondary-recovery/source-contract.json and native/.
export const SMASH_SECONDARY_ABILITY=Object.freeze({itemKey:2010006,nativeType:21,power:6,range:500});
export const SMASH_SECONDARY_PROFILE=Object.freeze({clip:'DD022',actionMs:1000,recoveryMs:0,hits:Object.freeze([400]),strictHits:true,
 moveRate:.8,locked:false,allowMouseRotation:true,lowerBeginMs:200,lowerIdle:'A0024',lowerWalk:SMASH_RIFLE.fireLower,
 nativeMinimumSceneUpdateMs:40,nativeRequestedAnimationDurationMs:1000,nativeAnimationDurationOverrideMs:900,nativeAnimationSpeed:1,
 sourceAction:'StandardSmg3sword',initLua:Object.freeze([40,200,false,false]),hitStop:Object.freeze([450,650]),stealthCancel:true,
 trail:Object.freeze({name:'GhostTrail_bat_sword_01',beginMs:50,endMs:350}),
 voice:Object.freeze({male:'sound/voice_man_attack_1.ogg',female:'sound/voice_girl_attack_2.ogg',bone:'Bip01',beginMs:0,endMs:2500}),
 effects:Object.freeze({attackSequence:'effects/blank_1sec.seq',attackSound:'sound/sword_s.ogg',damageSequence:'effects/backattack_sword_s.seq',damageSound:'sound/sword_attack.ogg'}),
});
export const SMASH_SECONDARY_LIMITS=Object.freeze([
 'AlwaysCritical ray and ordinary box are distinct source CAttack objects with no DependOn; native critical arbitration/damage is unresolved.',
 'Default arena selection is normal-only: one10-power box contact with source Blow. It does not prove native HP or critical suppression.',
 'The separate AddtionalPower Lua argument, equipment/armor/critical pipeline and authored camera-shake magnitudes remain unverified.',
 'Native uint32 main/lower timers are exposed; adapter callers must supply their scene delta, not infer it from animation cursor.',
 'Hitstop450/650, stealth cancellation, native dispatcher permissions and mouse-follow policy remain separately unverified.',
 'Declared GhostTrail_bat_sword_01 has a type13 XML entry but no matching type21 entry; no guessed Smash ribbon is substituted.',
 'AttackSequence blank_1sec contains a textureless particle node; it is not routed by the textured S5 renderer and native behavior remains unverified.',
]);
export function smashSecondaryContacts(kind='secondary',comboIndex=0,{range=SMASH_SECONDARY_ABILITY.range,criticalPolicy='normal-only'}={}){
 if(!['secondary','heavy'].includes(kind))return [];
 if(comboIndex!==0)throw new RangeError('Smash secondary combo index is native-internal, not a new sourced attack');
 if(!Number.isFinite(range)||range<=125)throw new RangeError('Smash source ray requires range*.8-100 positive');
 if(!['normal-only','include-declared'].includes(criticalPolicy))throw new RangeError('Explicit Smash critical selection required');
 const common={timeMs:400,atMs:400,damage:10,baseDamage:10,powerScale:0,attribute:'ATTACKATTRIB_SMG3_SWORD',initAttack2:[1,1,false],dependsOn:null,counterable:true,
  reaction:{sourceGuardData:[300,'GUARDCRUSH_DISABLE'],sourceDamageData:[400,'DAMAGEMOVING_DISABLE','DAMAGEBYPART_DISABLE']},
  effects:{...SMASH_SECONDARY_PROFILE.effects,nativeDamageSound:SMASH_SECONDARY_PROFILE.effects.damageSound,damageSound:'smashSecondaryHit'}};
 const critical={...common,id:'Attack1',alwaysCritical:true,condition:null,conditions:[],shape:{type:'ray',anchor:[0,250,100],direction:[0,0,-1],length:range*.8-100}};
 const blow={type:'blow',arguments:[2500,2000]};
 const normal={...common,id:'Attack2',alwaysCritical:false,shape:{type:'box',anchor:[0,250,100],direction:[0,0,-1],dimensions:[500,100,range*.8]},condition:blow,conditions:[blow],
  cameraShake:{enable:[true,true,0],factor1:[100,50,20],factor2:[0,20,2000,3000],whenSuccess:true}};
 return criticalPolicy==='include-declared'?[critical,normal]:[normal];
}
// Evaluate declarations without deciding which native result wins. The native
// actor branch uses skeletal volumes (7AF0F0), not the fallback ellipsoid.
// This API is for runtime diagnostics/comparisons; it never changes HP, claims
// an activation, supplies a critical multiplier or invents a DependOn link.
export function smashSecondaryContactCandidates(actor,target,{range=SMASH_SECONDARY_ABILITY.range,width,height,scale,rayCollisionMode}={}){
 if(!['ellipsoid','detailed-unresolved'].includes(rayCollisionMode))throw new TypeError('Explicit Smash ray collision branch required');
 const [critical,normal]=smashSecondaryContacts('secondary',0,{range,criticalPolicy:'include-declared'});
 const body={width,height,...(scale===undefined?{}:{scale})};
 const box=meleeShapeContact(normal.shape,actor,target,body);
 const ray=worldMeleeRay(critical.shape,actor,scale);
 const rayIntersects=rayCollisionMode==='ellipsoid'?meleeRayEllipsoidContact(critical.shape,actor,target,{...body,collisionMode:'ellipsoid'}):null;
 return {contacts:[
  {...critical,intersects:rayIntersects,geometry:rayCollisionMode==='ellipsoid'?'native-ray-ellipsoid':'native-ray-detailed-unresolved',worldRay:ray,
   bodyModelVerified:false},
  {...normal,...box,bodyModelVerified:false},
 ],nativeCriticalArbitrationVerified:false,nativeReady:false,
  classification:rayIntersects===null?'ray-unresolved':rayIntersects?(box.intersects?'both':'ray-only'):(box.intersects?'box-only':'neither')};
}
export function createSmashSecondary({sex='male',facing=0}={}){
 if(!['male','female'].includes(sex)||!Number.isFinite(facing))throw new TypeError('Smash actor sex/facing required');
 return {weapon:'smashrifle',kind:'secondary',type:'secondary',sex,facing,profile:SMASH_SECONDARY_PROFILE,phase:'action',phaseTimeMs:0,timeMs:0,time:0,fractionalMs:0,previousTimeMs:0,previousPhaseTimeMs:0,hits:0,lowerActive:false,finished:false,contactLedger:new Map()};
}
// CAttackMovingState +268 lower timer switches only after200ms; main5617F0
// requests exit only after1000ms. Contact events stay available on exit tick.
export function advanceSmashSecondary(attack,deltaMs,events){
 if(!Number.isInteger(deltaMs)||deltaMs<0||deltaMs>0xffffffff)throw new RangeError('Native uint32 Smash scene delta required');
 if(attack.finished)return true;
 attack.previousTimeMs=attack.timeMs;attack.previousPhaseTimeMs=attack.phaseTimeMs;
 attack.timeMs=(attack.timeMs+deltaMs)>>>0;attack.time=attack.timeMs/1000;attack.phaseTimeMs=attack.timeMs;attack.lowerActive=attack.timeMs>200;
 if(!attack.hits&&attack.timeMs>400){attack.hits=1;emitMeleeActivation(events,attack,0,400);}
 attack.finished=attack.timeMs>1000;return attack.finished;
}
export function smashSecondaryPose(attack,direction,moving,durationTicks=0){
 const speed=nativeRequestedAnimationSpeed({durationTicks,requestedMs:1000,luaAnimationSpeed:1,durationOverrideMs:900});
 const pose={clip:'DD022',loop:false,speed:1,time:attack.timeMs/1000*speed,fade:200/4800};
 if(attack.lowerActive){pose.lower=moving?SMASH_RIFLE.fireLower[direction]:'A0024';if(!pose.lower)throw new RangeError('Unknown Smash movement direction');}
 return pose;
}
