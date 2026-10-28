import {PRACTICE_SOURCE_DATA} from './practice-source-data.js';
const u32=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
// Native B2FD10/B30600/B30650/B306D0 primitive. Caller owns stage ordering,
// callback dispatch, pause origin and graph reconstruction on replay.
export class PracticeNativeAlarm{
 constructor({input,output,delayMs,stopEvent=0,repeat=false}){
  if(![input,output,delayMs,stopEvent].every(u32)||typeof repeat!=='boolean')throw Error('Invalid native Practice alarm');
  Object.assign(this,{input,output,delayMs,stopEvent,repeat,elapsedMs:0,frames:0,active:false,paused:false});
 }
 arm(){this.frames=0;this.elapsedMs=0;this.active=true;}
 begin(){if(this.input===0)this.arm();}
 notify(id){if(!u32(id))throw Error('Invalid Practice notification');if(this.input!==0&&id===this.input)this.arm();if(this.stopEvent!==0&&id===this.stopEvent)this.stop();}
 stop(){this.frames=0;this.elapsedMs=0;this.repeat=false;this.active=false;}
 tick(deltaMs,emit){
  if(!u32(deltaMs)||deltaMs>0x7fffffff||typeof emit!=='function')throw Error('Explicit native integer delta/callback required');
  if(!this.active)return false;
  if(!this.paused){this.frames=(this.frames+1)>>>0;this.elapsedMs=(this.elapsedMs+deltaMs)>>>0;}
  if(this.paused||this.elapsedMs<=this.delayMs||this.output===0)return false;
  // Native callback runs first. Reentrant stop must be able to clear repeat.
  emit(this.output);this.active=this.repeat;
  if(this.active){this.frames=0;this.elapsedMs=0;}
  return true;
 }
}
// Native B42DE0: rand % (max+1-min) + min. Supply an observed/seeded native
// rand result; never substitute a different random generator.
export function practiceRandomNotification(randValue){
 if(!u32(randValue))throw Error('Explicit native rand uint32 required');
 const {randomNotifyFrom:min,randomNotifyToRaw:max}=PRACTICE_SOURCE_DATA.registration;
 return randValue%(max+1-min)+min;
}
// B48CF0/B48D10/B48C60 consume source created/destroy notifications. They do
// not decide whether a real Sentry was spawned or killed.
export class PracticeSpawnCount{
 constructor(){this.count=0;this.limit=PRACTICE_SOURCE_DATA.registration.spawnLimit;}
 get available(){return this.count<this.limit;}
 notify(id){
  if(!u32(id))throw Error('Invalid Practice notification');
  const previous=this.count,events=PRACTICE_SOURCE_DATA.events;
  if(id===events.created&&this.available)this.count++;
  if(id===events.destroy)this.count=Math.max(0,this.count-1);
  return this.count!==previous;
 }
}
