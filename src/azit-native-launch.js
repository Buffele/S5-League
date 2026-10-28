// Deterministic Azit-only external F0 channel. No scene, Controller, input or
// collision mutation. See work/azit-native-adaptation/jump-audit-v2.json and
// native-launch-handoff.json. The host submits contribution() through its real
// fixed-step collision move, then supplies the resolved position/contact.
import {S5RUNTIME_NATIVE_PHYSICS} from './s5runtime-native-physics-data.js';
import {applyAzitJumpCommands} from './azit-jump-stations.js';

const f=Math.fround;
const number=(n,label)=>{if(!Number.isFinite(n)||!Number.isFinite(f(n)))throw TypeError(`Finite ${label} required`);return n;};
const positive=(n,label)=>{number(n,label);if(n<=0)throw RangeError(`Positive ${label} required`);return n;};
const vector=(v,label)=>{if(!Array.isArray(v)||v.length!==3)throw TypeError(`Explicit ${label} XYZ required`);return v.map(n=>number(n,label));};
const position=p=>vector([p?.x,p?.y,p?.z],'resolved feet position');
const xyz=v=>Object.freeze({x:v[0],y:v[1],z:v[2]});
const immutable=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))immutable(child);Object.freeze(value);}return value;};

// Current project FREE profile, independently captured protected registry.
// F0=distance/second. Normal branch Float47=1; timer22C boost is deliberately
// not manufactured or reset by a pad. Callers with that source timer active
// must pass its CURRENT gravityFactor/movementFactor on beforeMove.
export const AZIT_NATIVE_LAUNCH_PHYSICS=immutable({
 profile:S5RUNTIME_NATIVE_PHYSICS.profile,gravityNative:S5RUNTIME_NATIVE_PHYSICS.values.gravity,
 terminalNative:S5RUNTIME_NATIVE_PHYSICS.values.max_gravity_velocity,scale:.006,
 gravityFactor:1,movementFactor:1,
 source:'526D00/5272F1..527559; S5RUNTIME_NATIVE_PHYSICS GAMETEMPO_FREE',
 qualification:'Source FREE parameters; normal timer22C-inactive branch. 120Hz fractional seconds are S5 scheduling, not native engine integer-ms parity.'
});

// Explicit S5 ordinary-character policy, not invented names for native flags.
// Native3C is constructor classification,44 is enabled/model readiness,94 is
// GetHP, and controller+6C a separate blocker. This policy maps
// current S5 health/body/simulation facts onto those predicates. It does not
// claim source UID-kind0 or the blocker semantic equals any S5 state. The UID
// kind is (actor virtual2C raw64 >>48)&7, not team affiliation virtual38+8.
export function azitS5LaunchGates({simulationEnabled,ordinaryCharacter,enabled,bodyReady,controllerBlocked,hp}={}){
 if(![simulationEnabled,ordinaryCharacter,enabled,bodyReady,controllerBlocked].every(v=>typeof v==='boolean')||!Number.isFinite(hp))return {qualified:false,reason:'explicit-s5-launch-policy-required',gates:null};
 return {qualified:true,nativeEquivalent:false,policy:'S5 ordinary-character launch eligibility',gates:{
  gameStateCode:simulationEnabled?2:0,actor3c:!ordinaryCharacter,actor44:enabled&&bodyReady,
  controllerBlocked,property94:hp,actorUidKind:0
 }};
}

function stateCopy(value){
 if(!value||![0,1,2].includes(value.mode114))throw TypeError('Explicit launch mode0/1/2 required');
 return {mode114:value.mode114,velocityF0:vector(value.velocityF0,'native F0').map(f),lastAreaId:value.lastAreaId??null};
}

export function createAzitNativeLaunch({stations,scale=AZIT_NATIVE_LAUNCH_PHYSICS.scale,
 gravityNative=AZIT_NATIVE_LAUNCH_PHYSICS.gravityNative,terminalNative=AZIT_NATIVE_LAUNCH_PHYSICS.terminalNative}={}){
 if(typeof stations?.query!=='function'||stations.profiles?.length!==9)throw TypeError('Exact nine-station Azit query required');
 positive(scale,'source scale');number(gravityNative,'native gravity');number(terminalNative,'native terminal speed');
 if(gravityNative>=0||terminalNative>=0)throw RangeError('Source downward gravity and terminal speed required');
 let state={mode114:0,velocityF0:[0,0,0],lastAreaId:null},pending=null;
 const exportState=()=>immutable(stateCopy(state));
 const contribution=()=>pending?.contribution??immutable({active:false,ownsVerticalMotion:false,displacement:xyz([0,0,0]),velocity:xyz([0,0,0])});
 return Object.freeze({
  beforeMove({dt,position:feet,actorBox,gates,gravityFactor=1,movementFactor=1}={}){
   if(pending)throw Error('Azit launch move requires afterMove before another fixed step');
   number(dt,'fixed-step seconds');if(dt<0)throw RangeError('Nonnegative fixed-step seconds required');
   number(gravityFactor,'current gravity factor');number(movementFactor,'current movement factor');
   if(gravityFactor<0||movementFactor<0)throw RangeError('Nonnegative source factors required');
   const before=position(feet),query=stations.query({actorBox,gates});
   if(query.qualified!==true)throw Error('Azit launch eligibility/OBB unqualified: '+query.reason);
   let next=applyAzitJumpCommands(state,query.commands);
   if(query.commands.length)next.lastAreaId=query.commands.at(-1).areaId;
   const active=next.mode114!==0,seconds=f(dt);
   // No normalization or addition at launch; only Y acceleration
   // and terminal clamp occur during physical integration5272F1..5273AC.
   if(active){
    next.velocityF0[1]=f(next.velocityF0[1]+f(f(gravityNative)*f(seconds*f(gravityFactor))));
    if(terminalNative>next.velocityF0[1])next.velocityF0[1]=f(terminalNative);
   }
   const travel=f(seconds*f(movementFactor));
   const delta=active?next.velocityF0.map(v=>f(v*travel)*scale):[0,0,0];
   const view=immutable({active,ownsVerticalMotion:active,displacement:xyz(delta),velocity:xyz(next.velocityF0.map(v=>v*scale)),
    mode114:next.mode114,launches:query.commands,qualification:{sourcePhysicsDerived:true,nativeExecutionCompared:false,globalNativeOrderingCertified:false}});
   state=stateCopy(next);pending={before,contribution:view};return view;
  },
  contribution,
  afterMove({position:feet,groundContact}={}){
   if(!pending)throw Error('Azit launch afterMove requires one pending fixed step');
   if(typeof groundContact!=='boolean')throw TypeError('Explicit current resolved ground contact required');
   const after=position(feet),commands=[],modeBefore=state.mode114;
   // Preserve source ELSE-IF: a mode1→2 transition cannot also land in this
   // same afterMove. Ceiling/wall contact does not erase upward velocity.
   if(modeBefore===1){if(state.velocityF0[1]<0||f(after[1]-pending.before[1])<0)state.mode114=2;}
   else if(modeBefore===2&&groundContact){state.mode114=0;commands.push(0x37);}
   pending=null;
   return immutable({state:stateCopy(state),actor28Commands:commands,landed:modeBefore===2&&state.mode114===0,
    contactQualification:'S5 groundSupport proxy for source controller6B4; caller must not pass walls/ceilings or stale grounded.'});
  },
  exportState,
  reset(value=null){state=value===null?{mode114:0,velocityF0:[0,0,0],lastAreaId:null}:stateCopy(value);pending=null;return exportState();},
  qualification:immutable({map:'Azit15',separateInputAndF0:true,nativeReady:false,
   limits:['Global native pad/actor frame ordering not compared','Current native opaque gates need explicit S5 policy','GroundSupport to6B4 mapping is an S5 adaptation','No built-in timer22C boost or input lock']})
 });
}
