// CSwordAtkState retains its lower dispatcher across uses. Weak enters it
// immediately; strong enters it only after its strict animation-delay timer.
// See PLASMA-DEPLACEMENT-AU-SOL.md and plasma-ground-locomotion.json.
export const PLASMA_LOWER_LAND_MS=300;
export function createPlasmaLowerHistory(){
 return {light:{mode:'walk',landingMs:0},strong:{mode:'walk',landingMs:0}};
}
export function advancePlasmaLowerMotion(attack,history,dtMs,grounded){
 if(attack?.weapon!=='plasma'||!['light','strong'].includes(attack.kind))return null;
 const lower=history[attack.kind],delay=attack.profile.lowerBeginMs||0;
 const enter=()=>{lower.mode=grounded?'walk':'air';lower.landingMs=0;};
 if(!attack.lowerMotionStarted){
  attack.lowerMotionStarted=true;
  if(!delay||attack.timeMs>delay)enter();
 }
 // Native movement precedes both the landing timer and the strong phase change.
 const movement=lower.mode==='walk'?'walk':'air';
 if(lower.mode==='landing'){
  lower.landingMs+=dtMs;
  if(lower.landingMs>PLASMA_LOWER_LAND_MS){lower.mode='walk';lower.landingMs=0;}
 }else if(lower.mode==='air'&&grounded){lower.mode='landing';lower.landingMs=0;}
 if(delay&&attack.timeMs<=delay&&attack.timeMs+dtMs>delay)enter();
 return movement;
}
