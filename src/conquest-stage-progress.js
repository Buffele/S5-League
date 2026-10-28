// A1D670 controller consumer, A1CFD0 one-shot sequence completion and the
// A21FB0 counter suffix. This is a kernel, not an authenticated actor finalizer.
// The caller supplies the real destruction count; HP0,359 and unlink do not
// increment it here. All unported service boundaries are mandatory ports.
const u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const i32=n=>Number.isInteger(n)&&n>=-0x80000000&&n<=0x7fffffff;
function counter(t,duration=false){if(!t||!u32(t.updates)||!u32(t.elapsedMs)||typeof t.paused!=='boolean'||duration&&!u32(t.durationMs))throw Error('Explicit source DWORD timer required');}
function advance(t,delta){if(!t.paused){t.updates=(t.updates+1)>>>0;t.elapsedMs=(t.elapsedMs+delta)>>>0;}}
function sequence(s){if(!s||typeof s.active!=='boolean'||!i32(s.destroyedCount)||s.round!==null&&!i32(s.round?.expectedCount))throw Error('Explicit source stage sequence and int32 count required');if(s.active&&s.round===null)throw Error('Active source sequence requires its attached round');}

export function conquestStageSequenceContinues(s){
 sequence(s);
 // A1CFD0 does not compare >=. Inactive sequences return true, even at equality.
 if(s.active&&s.destroyedCount===s.round.expectedCount){s.active=false;return false;}
 return true;
}

export function conquestRoundPhase(timer,deltaMs){
 counter(timer,true);if(!u32(deltaMs))throw Error('Source DWORD delta required');
 // Ordered record updates must already have run before this suffix.
 if(timer.elapsedMs>timer.durationMs)return 2;
 advance(timer,deltaMs);return timer.elapsedMs>timer.durationMs?1:0;
}

function uiTarget(ports){
 // Preserve the repeated original getters: source virtual2C can be stateful.
 if(ports.readUI5().readPayload()===null)return null;
 if(ports.readUI5().readPayload().field70===null)return null;
 return ports.readUI5().readPayload().field70;
}

export function bindConquestStageRound(state,round,ports){
 if(!round||!i32(round.expectedCount))throw Error('Actual source round required');
 state.sequence.round=round;const target=uiTarget(ports);if(target!==null)ports.setUIPhase(target,0);
}

export function startConquestStageSequence(state,ports){
 sequence(state.sequence);if(state.sequence.round===null)throw Error('Attach the actual round before start');
 state.sequence.active=true;state.sequence.destroyedCount=0;
 // A1CE40's optional player/rule UI branch precedes the A21730 reset. Its
 // producer is deliberately explicit rather than omitted as an assumed no-op.
 ports.beforeRoundStart(state.sequence.round);
 ports.startRound(state.sequence.round);
}

// Controller virtual40=A1D960. Re-entering it does not clear stoppedA and
// does not reset timer30 or rawRound78. The reset/round-end owner is separate.
export function activateConquestStageProgress(state,ports){
 if(!state||typeof state.enabled9!=='boolean'||typeof state.stoppedA!=='boolean'||!u32(state.rawRound78))throw Error('Explicit source controller fields required');
 counter(state.timer40);sequence(state.sequence);
 for(const name of ['readRound','readUI5','setUIPhase','resetTransient58','beforeRoundStart','startRound','initializeRoundPresentation','notifyActivityB6DA60'])if(typeof ports?.[name]!=='function')throw Error(`Explicit source activation boundary ${name} required`);
 state.enabled9=true;state.timer40.updates=0;state.timer40.elapsedMs=0;
 const round=ports.readRound(state.rawRound78);
 if(round!==null){
  ports.resetTransient58();bindConquestStageRound(state,round,ports);startConquestStageSequence(state,ports);
  // The optional UI5 health/start/hide block is its own boundary, after start.
  ports.initializeRoundPresentation(state);ports.notifyActivityB6DA60();
 }
}

export function tickConquestStageProgress(state,deltaMs,ports){
 if(!state||typeof state.enabled9!=='boolean'||typeof state.stoppedA!=='boolean'||typeof state.localReportFlag18!=='boolean'||!u32(state.rawRound78))throw Error('Explicit source controller fields required');
 sequence(state.sequence);counter(state.timer40);counter(state.timer30);
 if(!u32(deltaMs))throw Error('Source DWORD delta required');
 for(const name of ['readMode','readRound','tickRound','readUI5','setUIPhase','finishUI','resetTransient58','beforeRoundStart','startRound','onLocalCompletion','tickDefenseTail'])if(typeof ports?.[name]!=='function')throw Error(`Explicit source boundary ${name} required`);
 if(!state.enabled9)return {advanced:false,localCompleted:false};
 if(ports.readMode()!==12)return {advanced:false,localCompleted:false};
 if(!state.stoppedA)advance(state.timer40,deltaMs);
 advance(state.timer30,deltaMs);
 const current=ports.readRound(state.rawRound78);
 if(current!==null){
  const phase=ports.tickRound(current,deltaMs);if(![0,1,2].includes(phase))throw Error('Actual A21FB0 phase code required');
  if(phase===1){const target=uiTarget(ports);if(target!==null)ports.setUIPhase(target,2);}
 }
 let advanced=false,localCompleted=false;
 if(!conquestStageSequenceContinues(state.sequence)){
  // A1CFC0 is empty. Do not reset counts, timers or the attached pointer here.
  state.rawRound78=(state.rawRound78+1)>>>0;advanced=true;
  const next=ports.readRound(state.rawRound78);
  if(next===null){
   if(!state.stoppedA){
    // Qualified A1DFC0 local/non-host prefix. Host statistics/RMI2029 remain
    // the explicit port below; this cannot establish ACK, result or winner.
    state.stoppedA=true;state.localReportFlag18=true;localCompleted=true;ports.onLocalCompletion(state);
   }
   const target=uiTarget(ports);if(target!==null)ports.finishUI(target);
  }else{
   ports.resetTransient58();bindConquestStageRound(state,next,ports);startConquestStageSequence(state,ports);
  }
 }
 // The real A1FAF0 defense-failure consumer is not replaced by success logic.
 ports.tickDefenseTail(state);return {advanced,localCompleted};
}
