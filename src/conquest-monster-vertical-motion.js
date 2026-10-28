// Complete A033D0 branch/arithmetic port. A031D0 calls it through virtual1F8
// BEFORE state-manager A13680; ordinary Run supplies only its separate XZ move.
// Real collision, grounded and property owners remain explicit. No ground snap.
const f=Math.fround,u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const vector=value=>{if(!Array.isArray(value)||value.length!==3||value.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw Error('Current finite native vertical vector required');return value.map(f);};
const scalar=(fn,label)=>{if(typeof fn!=='function')throw Error('Source vertical '+label+' required');const value=fn();if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw Error('Finite source vertical '+label+' required');return f(value);};
export const CONQUEST_MONSTER_VERTICAL_CONSTANTS=Object.freeze({secondsPerMs:f(.001),fallEntryRate:f(.1),nativeReady:false});
export function conquestMonsterVerticalTick(state,deltaMs,ports){
 if(!state||!u32(state.phase)||!u32(deltaMs))throw Error('Explicit source114 phase and DWORD delta required');
 const next={phase:state.phase,velocity:vector(state.velocity)},seconds=f(f(deltaMs)*CONQUEST_MONSTER_VERTICAL_CONSTANTS.secondsPerMs);
 for(const key of ['readPosition','clearGrounded','readGrounded','move'])if(typeof ports?.[key]!=='function')throw Error('Source vertical '+key+' required');
 const before=vector(ports.readPosition());ports.clearGrounded();
 const grounded=()=>{const value=ports.readGrounded();if(typeof value!=='boolean')throw Error('Actual body6B4 vertical contact flag required');return value;};
 const move=delta=>{const receipt=ports.move(delta);if(receipt?.qualified!==true)return {qualified:false,state:{phase:state.phase,velocity:vector(state.velocity)},reason:receipt?.reason??'Unqualified vertical collision operation'};return null;};
 if(next.phase===0){
  const terminal=scalar(ports.readTerminal,'virtualB0 terminal'),refused=move([0,f(terminal*seconds),0]);if(refused)return refused;
  if(!grounded()&&f(vector(ports.readPosition())[1]-before[1])<0){
   next.phase=2;next.velocity=[0,f(scalar(ports.readTerminal,'virtualB0 terminal')*CONQUEST_MONSTER_VERTICAL_CONSTANTS.fallEntryRate),0];
  }
 }else{
  next.velocity[1]=f(next.velocity[1]+f(scalar(ports.readGravity,'virtualB4 gravity')*seconds));
  const terminal=scalar(ports.readTerminal,'virtualB0 terminal');if(terminal>next.velocity[1])next.velocity[1]=terminal;
  const refused=move(next.velocity.map(n=>f(n*seconds)));if(refused)return refused;
  if(next.phase===1){if(next.velocity[1]<0||f(vector(ports.readPosition())[1]-before[1])<0)next.phase=2;}
  else if(next.phase===2&&grounded())next.phase=0;
 }
 return {qualified:true,state:next,seconds,position:vector(ports.readPosition()),grounded:grounded(),nativeReady:false};
}
