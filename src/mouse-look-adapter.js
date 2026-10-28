import {nativeMouseFactor} from './mouse-settings.js';
// Pointer lock supplies relative counts. Free-cursor drag also accepts client
// coordinates when a browser delivers zero/missing relative counts after a
// stalled frame. Track inactive moves too, so resuming never accumulates them.
export function createMouseLookDelta(){
 let previous=null;
 return {map(event,{active=true,relative=false}={}){
  const point=Number.isFinite(event.clientX)&&Number.isFinite(event.clientY)?{x:event.clientX,y:event.clientY}:null,last=previous;
  previous=point;
  if(!active)return null;
  const axis=(movement,coordinate,old)=>Number.isFinite(movement)&&(relative||movement!==0)?movement:!relative&&coordinate!==undefined&&old!==undefined?coordinate-old:0;
  return {movementX:axis(event.movementX,point?.x,last?.x),movementY:axis(event.movementY,point?.y,last?.y)};
 },clear(){previous=null;}};
}
// Explicit browser calibration; this is not a native radians/count or active-camera claim.
export function createS5MouseLook({settings,baselineSensitivity,yawPerCount,pitchPerCount,policy}={}){
 if(policy!=='s5-pointer-lock-relative'||!Number.isFinite(yawPerCount)||!Number.isFinite(pitchPerCount)||yawPerCount<=0||pitchPerCount<=0)throw TypeError('Explicit S5 browser look calibration required');
 const baseline=nativeMouseFactor(baselineSensitivity);let current=null,disposed=false;const off=settings.attachConsumer(value=>{current={...value};return true;});
 const snapshot=()=>({policy,baselineSensitivity,sensitivity:current.sensitivity,inverse:current.inverse,relativeGain:nativeMouseFactor(current.sensitivity)/baseline,yawPerCount,pitchPerCount,available:!disposed});
 return {snapshot,map({movementX,movementY,scale=1}){if(disposed)return {accepted:false,reason:'disposed'};if(![movementX,movementY,scale].every(Number.isFinite)||scale<0)return {accepted:false,reason:'invalid-mouse-delta'};
   const gain=snapshot().relativeGain;return {accepted:true,deltaYaw:-movementX*yawPerCount*scale*gain,deltaPitch:movementY*pitchPerCount*scale*gain*(current.inverse?-1:1),policy};
  },dispose(){if(!disposed){disposed=true;off();}}};
}
