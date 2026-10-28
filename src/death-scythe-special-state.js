// Native special-state timers: Tick 0x64ff30, phase switch 0x651340.
// Evidence: work/death-scythe-native/special-phases.md.
// Does not signal, consume or synthesize SECOND_IMPACT: the caller owns its latch.
export const DEATH_SCYTHE_SPECIAL_PHASES=Object.freeze([
 Object.freeze({name:'firstAttack',index:0,clip:'GR007',durationMs:400,timerOffset:0x2bc}),
 Object.freeze({name:'finishAttack',index:1,clip:'GR009',durationMs:550,timerOffset:0x2cc}),
 Object.freeze({name:'firstDelay',index:2,clip:'GR008',durationMs:500,timerOffset:0x2dc}),
 Object.freeze({name:'finishDelay',index:3,clip:'GR010',durationMs:500,timerOffset:0x2ec}),
]);
const phaseFor=name=>DEATH_SCYTHE_SPECIAL_PHASES.find(p=>p.name===name);
const u32=(value,label)=>{if(!Number.isInteger(value)||value<0||value>0xffffffff)throw new RangeError(label+' must be uint32 milliseconds');return value;};
export function createDeathScytheSpecialState({clockMode='native-u32'}={}){
 if(!['native-u32','arena-fractional-ms'].includes(clockMode))throw new RangeError('Explicit native-u32 or arena-fractional-ms clock mode required');
 return {active:true,complete:false,cancelled:false,clockMode,timeMs:0,phase:'firstAttack',phaseIndex:0,phaseTimeMs:0,phaseStartedAtMs:0,
  timers:Object.fromEntries(DEATH_SCYTHE_SPECIAL_PHASES.map(p=>[p.name,{durationMs:p.durationMs,elapsedMs:0,ticks:0,paused:false}]))};
}
function presentation(state){const p=phaseFor(state.phase);return {phase:p.name,phaseIndex:p.index,clip:p.clip,phaseTimeMs:state.phaseTimeMs,stateTimeMs:state.timeMs,
 requestedDurationMs:state.timers[p.name].durationMs,animationSpeed:1,loop:false,blendTicks:50,reset:true};}
export function sampleDeathScytheSpecialState(state){if(!state?.timers)throw new TypeError('Death Scythe special state required');return {...presentation(state),active:state.active,complete:state.complete,clockMode:state.clockMode};}

export function advanceDeathScytheSpecialState(state,dtMs,{secondImpact=null}={}){
 if(!state?.timers)throw new TypeError('Death Scythe special state required');
 if(state.clockMode==='native-u32')u32(dtMs,'Tick delta');
 else if(!Number.isFinite(dtMs)||dtMs<0||dtMs>0xffffffff)throw new RangeError('Finite nonnegative tick delta required');
 if(!state.active)return {...sampleDeathScytheSpecialState(state),transition:null,movement:null,timerAdvanced:null,exitRequested:state.complete,callback:null};

 // Tick performs MoveBox work BEFORE selecting/incrementing phase timers.
 // This interval retains the old clip even on a transition/exit tick. Native
 // global animation-update scheduling/duration fitting is a separate contract.
 const before=presentation(state),movement={clip:before.clip,fromMs:state.phaseTimeMs,toMs:state.phaseTimeMs+dtMs,
  multiplier:2,animationSpeed:1,order:'before-phase-timers',samplingPolicy:'source-speed; native global animation scheduling not emulated'};
 const qualified=secondImpact?.active!==false&&secondImpact?.requested===true&&secondImpact?.invoked===true;
 const t=state.timers;let selected=null;
 if(t.firstAttack.elapsedMs<=t.firstAttack.durationMs)selected='firstAttack';
 else if(qualified){
  if(t.finishAttack.elapsedMs<=t.finishAttack.durationMs)selected='finishAttack';
  else if(t.finishDelay.elapsedMs<=t.finishDelay.durationMs)selected='finishDelay';
 }else if(t.firstDelay.elapsedMs<=t.firstDelay.durationMs)selected='firstDelay';

 state.timeMs+=dtMs;state.phaseTimeMs+=dtMs;
 if(selected===null){state.active=false;state.complete=true;return {...sampleDeathScytheSpecialState(state),transition:null,movement,timerAdvanced:null,exitRequested:true,callback:null};}
 const timer=t[selected],timerBeforeMs=timer.elapsedMs;
 if(!timer.paused){timer.ticks=(timer.ticks+1)>>>0;timer.elapsedMs=state.clockMode==='native-u32'?(timer.elapsedMs+dtMs)>>>0:timer.elapsedMs+dtMs;}
 // No overflow-time carry, no while loop: exactly one timer branch per Tick.
 // The phase function is called AFTER that timer update, including when paused.
 let transition=null;
 if(selected!==state.phase){
  const next=phaseFor(selected);state.phase=selected;state.phaseIndex=next.index;state.phaseTimeMs=0;state.phaseStartedAtMs=state.timeMs;
  transition={from:before.phase,to:selected,phaseIndex:next.index,clip:next.clip,requestedDurationMs:timer.durationMs,resetAnimation:true,
   blendTicks:50,animationSpeed:1,loop:false,atMs:state.timeMs,order:'after-phase-timer-update',moveBoxClipChanged:true,
   moveBoxIntegrationHint:'Use old movement interval for this tick; start next clip delta from its own origin, never subtract unrelated clip positions.',
   ...(selected==='finishAttack'?{nativeExtraFinishCalls:['0x52f590','0x578580','0x569850'],nativeExtraFinishSideEffectsVerified:true,nativeFinishMotion:{localActorOnly:true,resetVelocity:{x:0,y:0,z:0}},nativeFinishMotionSource:'work/death-scythe-native/finish-motion.md'}:{})};
 }
 return {...sampleDeathScytheSpecialState(state),transition,movement,timerAdvanced:{name:selected,beforeMs:timerBeforeMs,afterMs:timer.elapsedMs,paused:timer.paused},exitRequested:false,callback:null};
}
export function cancelDeathScytheSpecialState(state){if(state){state.active=false;state.cancelled=true;}return state;}
export const DEATH_SCYTHE_SPECIAL_STATE_LIMITATIONS=Object.freeze([
 'native-u32 emulates unsigned native timer addition. arena-fractional-ms is explicit S5 timing policy, not bit-exact uint32 timing.',
 'No signal or Lua callback is generated. Supply the externally qualified and consumed latch; contact origin is never reset by a phase switch.',
 'MoveBox precedes the native timer/phase branch. Returned animation intervals use source speed1; global engine scheduling and requested-duration fitting are not reconstructed.',
 'Finish calls are resolved: protected zero-vector temporary, copy to physical velocityXYZ, no-op destructor. Apply the dedicated finish-motion command once for a local actor only; do not clear position, vertical mode or gravity.',
]);
