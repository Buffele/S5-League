const f=Math.fround;
const u32=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;
const scalar=v=>Number.isFinite(v)&&Number.isFinite(f(v));
export function conquestNativeMoveVector(value){
 if(!scalar(value?.x)||!scalar(value?.y)||!scalar(value?.z))throw Error('Explicit finite native movement vector required');
 return {x:f(value.x),y:f(value.y),z:f(value.z)};
}
const zero=()=>({x:0,y:0,z:0});
// CreateMoveToCommand9FEEE0 -> command vtable13EFC50. Scheduling/actor lookup
// remain upstream: gameTime and command start are retained, not interpolated.
export class ConquestMoveToCommand{
 constructor({kind,gameTime,actorId,start,end,speedMultiplier}={}){
  if(kind!=='move'||!u32(gameTime)||actorId==null||!scalar(speedMultiplier))throw Error('Explicit source Conquest move command required');
  Object.assign(this,{gameTime,actorId,start:conquestNativeMoveVector(start),end:conquestNativeMoveVector(end),speedMultiplier:f(speedMultiplier)});
  this.counter={updates:0,durationMs:300,elapsedMs:0,paused:false};
 }
 actor(value){if(value==null)return null;if(value.id!==this.actorId||typeof value.setNativeMoveDirection!=='function'||typeof value.setNativeFacingDirection!=='function')throw Error('Matching actual native movement actor required');return value;}
 enter(value){const actor=this.actor(value);if(!actor)return false;Object.assign(this.counter,{updates:0,durationMs:1000,elapsedMs:0});actor.commandSpeedMultiplier=this.speedMultiplier;return true;}
 advanceCounter(deltaMs){if(!this.counter.paused){this.counter.updates=(this.counter.updates+1)>>>0;this.counter.elapsedMs=(this.counter.elapsedMs+deltaMs)>>>0;}}
 tick(value,deltaMs,{clearNativeInput}={}){
  if(!u32(deltaMs))throw Error('Explicit native unsigned movement delta required');
  const actor=this.actor(value);this.advanceCounter(deltaMs);
  if(actor){
   const p=conquestNativeMoveVector(actor.positionNative),dx=f(this.end.x-p.x),dz=f(this.end.z-p.z),distanceSquared=f(f(dx*dx)+f(dz*dz));
   if(distanceSquared>400){
    const length=f(Math.sqrt(f(f(f(dx*dx)+f(0*0))+f(dz*dz)))),inverse=f(1/length);
    const direction={x:f(dx*inverse),y:0,z:f(dz*inverse)};
    actor.setNativeMoveDirection(direction);actor.setNativeFacingDirection(direction);
    return {actorPresent:true,reached:false,facingUpdated:true};
   }
   if(typeof clearNativeInput!=='function')throw Error('Native monster input cancellation port required');
   actor.setNativeMoveDirection(zero());
  }
  Object.assign(this.counter,{updates:0,durationMs:0,elapsedMs:0});this.advanceCounter(deltaMs);
  if(actor)clearNativeInput(actor);
  return {actorPresent:!!actor,reached:!!actor,facingUpdated:false};
 }
 exit(value){const actor=this.actor(value);if(!actor)return false;actor.setNativeMoveDirection(zero());actor.commandSpeedMultiplier=1;return true;}
}
// Ordinary run state's requested displacement before virtual70/A03B30. This
// does not perform pathfinding, collision resolution or state/animation ticks.
export function conquestRunDisplacement({direction,baseSpeed,commandMultiplier,statusRate,deltaMs}={}){
 if(!u32(deltaMs)||!scalar(baseSpeed)||!scalar(commandMultiplier)||statusRate!==null&&!scalar(statusRate))throw Error('Explicit native run speed/status/delta required');
 const d=conquestNativeMoveVector(direction);if(d.x===0&&d.y===0&&d.z===0)return null;
 let speed=f(f(baseSpeed)*f(commandMultiplier));if(statusRate!==null)speed=f(speed*f(statusRate));
 const step=f(speed*f(f(deltaMs)*f(.001)));
 return {x:f(d.x*step),y:f(d.y*step),z:f(d.z*step)};
}
