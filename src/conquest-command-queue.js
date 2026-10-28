const uint32=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
// A23AF0 runs the ACTIVE pass A24570 before the PENDING pass A24700.
// This is a command owner, not a pathfinder or a replacement monster AI.
export class ConquestCommandQueue{
 constructor({handleExpiredResetCommand}={}){
  if(handleExpiredResetCommand!==undefined&&typeof handleExpiredResetCommand!=='function')throw Error('Explicit native reset-command port required');
  this.active=[];this.pending=[];this.mirrored=[];this.owned=new WeakSet();this.stepping=false;
  this.handleExpiredResetCommand=handleExpiredResetCommand;
 }
 enqueue(command,{mirrorEnabled}={}){
  if(!command||!uint32(command.gameTime)||!uint32(command.nativeType)||!['enter','tick','exit','isRunning','destroy'].every(name=>typeof command[name]==='function')||typeof mirrorEnabled!=='boolean')throw Error('Explicit native command lifecycle, time, type and mirror context required');
  if(command.nativeType===15&&!this.handleExpiredResetCommand)throw Error('Native kind15 cleanup must be bound before accepting the command');
  if(this.owned.has(command))throw Error('Command object already belongs to this queue');
  this.owned.add(command);this.pending.push(command);command.queueOwner=this;
  // A23F80 copies references for outgoing serialization; they are not a
  // second playback queue and do not acquire a second destructor owner.
  if(mirrorEnabled)this.mirrored.push(command);
  return command;
 }
 step(deltaMs,{gameTime}={}){
  if(!uint32(deltaMs)||!uint32(gameTime))throw Error('Exact native uint32 delta and absolute game clock required');
  if(this.stepping)throw Error('Reentrant command manager tick');
  this.stepping=true;
  try{
   for(let index=0;index<this.active.length;){
    const command=this.active[index];command.tick(deltaMs);
    const running=command.isRunning();if(typeof running!=='boolean')throw Error('Native command running predicate must return a boolean');
    if(running){index++;continue;}
    command.exit();
    if(command.nativeType===15){this.handleExpiredResetCommand(this,command);break;}
    command.destroy();this.active.splice(index,1);
   }
   // The native comparison is UNSIGNED clock>=timestamp, not a wrap-aware
   // signed difference. Scan the full list in insertion order without sorting
   // or blocking later due entries behind an earlier future command.
   for(let index=0;index<this.pending.length;){
    const command=this.pending[index];
    if(gameTime<command.gameTime){index++;continue;}
    command.enter();this.active.push(command);this.pending.splice(index,1);
   }
  }finally{this.stepping=false;}
 }
 get empty(){return this.active.length===0&&this.pending.length===0;}
}
