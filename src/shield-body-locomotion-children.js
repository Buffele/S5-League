import {tickShieldGroundLocomotion,enterShieldAirLocomotion,leaveShieldAirLocomotion,tickShieldAirLocomotion,enterShieldSpecialLower,leaveShieldSpecialLower,tickShieldSpecialLower} from './shield-body-locomotion.js';
import {shieldGroundAnimationCommands,shieldAirAnimationCommands,shieldGroundPostCounter,shieldGroundPostEvent} from './shield-body-locomotion-animation.js';

function check(p,name){if(typeof p?.tick!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(p.tick.constructor.name)||!['source-port','explicit-unverified'].includes(p.provenance?.kind)||typeof p.provenance?.source!=='string'||!p.provenance.source.trim())throw new TypeError(`${name} qualified synchronous port required`);}
function invoke(p,...args){const v=p.tick(...args);if(v?.then)throw new TypeError('Async lower callback unsupported');return v;}
const qualified=(source,tick)=>({tick,provenance:{kind:'source-port',source}});

// Each set gets its own state. Values/ports are explicit; this factory does
// not pretend fixture durations, native getters or renderer masks are proved.
export function createShieldLocomotionChildren({airState,ports}={}){
 const names=['readGroundFrame','readGroundAnimationContext','readGroundPostContext','emitAnimation','emitGroundPostEvent','readAirFrame','actor70','writeLaunchF0','setActorMode','airPhase1Effects','airPhase3Effects','readActorSlot190','readActorSlot194','readActorSlot180','readActorSlot3c','requestActorSlot178','nativeChildInput','switchChild'];
 for(const name of names)check(ports?.[name],name);
 if(!airState||![0,1,2,3].includes(airState.phase))throw new TypeError('Explicit initialized air state required');
 for(const timer of ['animation','launch','landing']){
  const t=airState[timer];for(const field of ['counter','elapsedMs','durationMs'])if(!Number.isInteger(t?.[field])||t[field]<0||t[field]>0xffffffff)throw new TypeError(`air.${timer}.${field} required`);
  if(typeof t.blocked!=='boolean')throw new TypeError(`air.${timer}.blocked required`);
 }
 // Copy state to prevent two sets sharing native timer storage accidentally.
 const air=structuredClone(airState),ground={phase:9,active:false,postCounter:0},special={phase:4,active:false};
 const requireSwitch=next=>invoke(ports.switchChild,next);
 const emit=commands=>{for(const command of commands)invoke(ports.emitAnimation,command);};
 const applyGround=()=>emit(shieldGroundAnimationCommands({...invoke(ports.readGroundAnimationContext),phase:ground.phase}).map(c=>({...c,child:0})));
 const selectGround=phase=>{if(phase<9&&phase!==ground.phase){ground.phase=phase;if(ground.active)applyGround();}};
 const postGround=()=>{
  const context=invoke(ports.readGroundPostContext),next=shieldGroundPostCounter(context);
  const event=shieldGroundPostEvent({previousCounter:ground.postCounter,nextCounter:next,phase:ground.phase,actorMode114:context.actorMode114});
  if(event.emit)invoke(ports.emitGroundPostEvent,{...event,context});ground.postCounter=next;
 };
 const airPhase=phase=>{
  emit(shieldAirAnimationCommands({phase,active:air.active,animationDurationMs:air.animation.durationMs,launchDurationMs:air.launch.durationMs,landingDurationMs:air.landing.durationMs}).map(c=>({...c,child:1})));
  if(phase===1)invoke(ports.airPhase1Effects,{phase,source:'629B50'});
  if(phase===3)invoke(ports.airPhase3Effects,{phase,source:'629D40'});
 };
 const airPorts={readFrame:ports.readAirFrame,actor70:ports.actor70,writeLaunchF0:ports.writeLaunchF0,setActorMode:ports.setActorMode,selectPhase:qualified('629880 animation and qualified effects',airPhase),switchToGround:qualified('628BE0 container slot20 saved ground',()=>requireSwitch(0)),animationExpired:qualified('628BE0 animation expiry index2',()=>emit([{method:'B77CB0',animationIndex:2,child:1,channel:1,argument:0,weight:1,extra:0,source:'628BE0 timer expiry'}]))};
 const specialPorts={...ports,playPhase:qualified('628220/628310 special animation',phase=>emit([{method:'B77CB0',animationIndex:phase,child:2,channel:1,argument:0,weight:1,extra:0,source:'628220/628310'}])),switchToAir:qualified('628310 container slot20 saved air',()=>requireSwitch(1))};
 const child=(id,enter,leave,tick)=>({enter:qualified(`lower child${id} Enter`,enter),leave:qualified(`lower child${id} Leave`,leave),tick:qualified(`lower child${id} Tick`,tick),input:qualified('native child slot14 explicit consumer',code=>invoke(ports.nativeChildInput,{child:id,code}))});
 return {
  children:[
   child(0,()=>{ground.phase=9;ground.postCounter=shieldGroundPostCounter(invoke(ports.readGroundPostContext));applyGround();ground.active=true;},()=>{ground.active=false;},dtMs=>tickShieldGroundLocomotion(dtMs,{readFrame:ports.readGroundFrame,selectPhase:qualified('62BCE0',selectGround),actor70:ports.actor70,post62c390:qualified('62C390 with explicit event consumer',postGround)})),
   child(1,()=>enterShieldAirLocomotion(air,airPorts),()=>leaveShieldAirLocomotion(air),dtMs=>tickShieldAirLocomotion(air,dtMs,airPorts)),
   child(2,()=>enterShieldSpecialLower(special,specialPorts),()=>leaveShieldSpecialLower(special),dtMs=>tickShieldSpecialLower(special,dtMs,specialPorts)),
  ],
  snapshot:()=>({ground:{...ground},air:structuredClone(air),special:{...special},nativeReady:false,callbackTruthVerified:false,portProvenance:Object.fromEntries(names.map(n=>[n,{...ports[n].provenance}]))}),
 };
}
