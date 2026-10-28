// ActorState_BoundJump and the checked CBoundJumpState consumers:
// Tick607E0C..607EE7 selects phase2/3 from abs(flat camera dot actor forward).
// Threshold PE13B37F4 is float32(.75); phase608B50 maps them to params1/2.
// Camera and actor headings here share S5's existing horizontal world axes.
export const WALL_JUMP_RISE_B_MIN_DOT=.75;
// BoundJump::Enter607330 initializes timer+150 from s32 index0x39=500ms.
// Tick608283..60859E repeatedly slerps CURRENT flat facing toward the camera
// with accumulated/duration, then snaps on the first timer overshoot.
export const WALL_JUMP_TURN_MS=500;
export function wallJumpFallFacing(current,view,elapsedMs){
 const amount=Math.min(1,Math.max(0,elapsedMs/WALL_JUMP_TURN_MS));
 const delta=Math.atan2(Math.sin(view-current),Math.cos(view-current));
 return current+delta*amount;
}
export function wallJumpRiseClip(cameraFacing,actorFacing){
 if(!Number.isFinite(cameraFacing)||!Number.isFinite(actorFacing))throw new TypeError('Finite camera and actor walljump headings required');
 const f=Math.fround;
 const dot=f(f(f(Math.sin(cameraFacing))*f(Math.sin(actorFacing)))+f(f(Math.cos(cameraFacing))*f(Math.cos(actorFacing))));
 return Math.abs(dot)>=WALL_JUMP_RISE_B_MIN_DOT?'00067_2':'00067';
}

// Presentation restored from the user-tested S5 English portable edition.
// The source-derived riseB selection above is retained as an audit helper,
// but applying it here reversed the visible body rotation in a full diagonal
// jump comparison. Keep 00067 at its original rate and the portable fades.
// This is an S5 reference choice, not certification of native S5Runtime playback.
export function wallJumpPose(action,restartKey){
 if(action.phase==='prepare')return {clip:'00066',loop:false,speed:1,fade:.025,nextFadePadding:0,time:action.timeMs/1000,restartKey};
 if(['fail','fall'].includes(action.phase))return {clip:'00002',loop:true,speed:1,fade:.1,nextFadePadding:0,restartKey};
 return {clip:'00067',loop:false,speed:1,fade:.025,nextFadePadding:0,time:action.timeMs/1000,restartKey};
}
