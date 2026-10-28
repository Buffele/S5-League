import {conquestNativeMoveVector} from './conquest-monster-movement.js';
const f=Math.fround,uint32=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
// CreateAttackCommand ->9FCAD0 -> vtable13EFAF0/native type4. This command
// dispatches input on EXIT; it neither resolves damage nor owns an attack timer.
export class ConquestAttackCommand{
 constructor({kind,gameTime,actorId,input,position,direction}={}){
  if(kind!=='attack'||!uint32(gameTime)||actorId==null||!uint32(input))throw Error('Explicit native Conquest attack command required');
  Object.assign(this,{gameTime,actorId,input,position:conquestNativeMoveVector(position),direction:conquestNativeMoveVector(direction)});
  this.counter={updates:0,durationMs:0,elapsedMs:0,paused:false};
 }
 actor(value){if(value==null)return null;if(value.id!==this.actorId||typeof value.setNativeFacingDirection!=='function')throw Error('Matching actual native attack actor required');return value;}
 enter(value){return !!this.actor(value);}
 tick(deltaMs){if(!uint32(deltaMs))throw Error('Exact native unsigned attack delta required');if(!this.counter.paused){this.counter.updates=(this.counter.updates+1)>>>0;this.counter.elapsedMs=(this.counter.elapsedMs+deltaMs)>>>0;}}
 isRunning(){return this.counter.durationMs>=this.counter.elapsedMs;}
 exit(value,{requestNativeInput,findNativeInputState,acceptsAttackDirection,writeAttackDirection}={}){
  const actor=this.actor(value);if(!actor)return false;
  if(![requestNativeInput,findNativeInputState,acceptsAttackDirection,writeAttackDirection].every(port=>typeof port==='function'))throw Error('Explicit native attack input/state/direction ports required');
  //9FC800 truncates the dispatcher input. A04E10 forwards the lookup DWORD,
  // but A13B10 itself truncates its effective map key to the low byte.
  requestNativeInput(actor,this.input&255);
  const state=findNativeInputState(actor,this.input);
  if(state===undefined)throw Error('Native input state must be explicit or null');
  if(state!==null){
   const accepted=acceptsAttackDirection(state);if(typeof accepted!=='boolean')throw Error('Native direction-state predicate must return a boolean');
   // The state gets the original XYZ vector before the command flattens Y.
   if(accepted)writeAttackDirection(state,{...this.direction});
  }
  this.direction.y=0;
  const {x,y,z}=this.direction,length=f(Math.sqrt(f(f(f(x*x)+f(y*y))+f(z*z))));
  if(length!==0){const inverse=f(1/length);this.direction={x:f(x*inverse),y:f(y*inverse),z:f(z*inverse)};}
  actor.setNativeFacingDirection({...this.direction});return true;
 }
}
