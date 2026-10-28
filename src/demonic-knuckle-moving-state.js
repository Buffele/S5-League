// Local CAttackMovingState port for LeftAttack_DemonicKnuckle only.
// Native proof: work/melee-batch-5/demonic-knuckle/native/README.md.
export const DEMONIC_KNUCKLE_MOVING_CONTRACT=Object.freeze({
 actionMs:500,lowerBeginMs:50,contactMs:240,sceneParameterMs:800,
 nativeAnimationContainerCount:3,nativeAnimationCountAdjustment:-1,
 clips:Object.freeze(['KN012','KN011']),hands:Object.freeze(['right','left']),
});
// Store for the lifetime of this actor's native weapon state, across exits,
// interruptions and weapon switching. Do not recreate it for every swing.
export function createDemonicKnuckleHandState(){return {animationIndex:0};}
export function beginDemonicKnuckleLight(handState,{clockMode='native-u32'}={}){
 if(!handState||![0,1].includes(handState.animationIndex))throw new TypeError('Persistent Demonic Knuckle hand state required');
 if(!['native-u32','arena-fractional-ms'].includes(clockMode))throw new RangeError('Explicit native-u32 or arena-fractional-ms clock mode required');
 // 5c7c00 increments before selecting. Constructor index0, three slots and
 // factory adjustment-1 produce first index1, then0, then1.
 handState.animationIndex=(handState.animationIndex+1)%2;
 const index=handState.animationIndex;
 return {active:true,cancelled:false,exitRequested:false,clockMode,animationIndex:index,
  hand:DEMONIC_KNUCKLE_MOVING_CONTRACT.hands[index],clip:DEMONIC_KNUCKLE_MOVING_CONTRACT.clips[index],
  elapsedMs:0,ticks:0,paused:false,lowerElapsedMs:0,lowerTicks:0,lowerPaused:false,phase:0};
}
export function advanceDemonicKnuckleLight(state,dtMs){
 if(!state||!['native-u32','arena-fractional-ms'].includes(state.clockMode))throw new TypeError('Demonic Knuckle light state required');
 if(!Number.isFinite(dtMs)||dtMs<0||dtMs>0xffffffff||(state.clockMode==='native-u32'&&!Number.isInteger(dtMs)))throw new RangeError('Valid tick delta required');
 if(!state.active)return {exitRequested:state.exitRequested,lowerTransition:false,phase:state.phase,elapsedMs:state.elapsedMs};
 const add=(x,y)=>state.clockMode==='native-u32'?(x+y)>>>0:x+y;
 // 5617f0 advances first and asks for parent state when elapsed >500.
 if(!state.paused){state.ticks=(state.ticks+1)>>>0;state.elapsedMs=add(state.elapsedMs,dtMs);}
 const exitRequested=state.elapsedMs>DEMONIC_KNUCKLE_MOVING_CONTRACT.actionMs;
 let lowerTransition=false;
 // 5c8381 advances the independent lower timer only while phase0.
 if(state.phase===0&&!state.lowerPaused){
  state.lowerTicks=(state.lowerTicks+1)>>>0;state.lowerElapsedMs=add(state.lowerElapsedMs,dtMs);
  if(state.lowerElapsedMs>DEMONIC_KNUCKLE_MOVING_CONTRACT.lowerBeginMs){state.phase=1;lowerTransition=true;}
 }
 state.exitRequested=exitRequested;
 if(exitRequested)state.active=false;
 // Native exit is pending until actor state change; contacts and remaining
 // work of this same tick must still run. No contact time is clamped here.
 return {exitRequested,lowerTransition,phase:state.phase,elapsedMs:state.elapsedMs,processContactsThisTick:true};
}
export function cancelDemonicKnuckleLight(state){if(state){state.active=false;state.cancelled=true;}return state;}
