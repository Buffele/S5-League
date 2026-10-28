const uint=(v,n)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw Error('Explicit uint32 '+n+' required');return v;},bool=(v,n)=>{if(typeof v!=='boolean')throw Error('Explicit raw '+n+' required');return v;};
//56D320/56D890 timer subset, two independent paused source clocks.
//Power preparation, damage generation, effects and networking stay consumers.
export class PracticeSentryAttackClock{
 constructor({startMs,onCollision,onSecondary}){this.startMs=uint(startMs,'startMs');if(typeof onCollision!=='function'||typeof onSecondary!=='function')throw Error('Actual collision/secondary consumers required');this.onCollision=onCollision;this.onSecondary=onSecondary;this.active=false;this.first={elapsed:0,paused:false,ticks:0};this.second={elapsed:0,paused:false,ticks:0};this.nativeReady=false;}
 begin({actorGate3c}){bool(actorGate3c,'actor3C');this.active=true;for(const timer of [this.first,this.second]){timer.elapsed=0;timer.ticks=0;timer.limit=this.startMs;}}
 tick(deltaMs,raw){uint(deltaMs,'deltaMs');if(!this.active)return [];for(const k of ['field34c','field3d4','actor1ec','field403','actorGate3c','field305'])bool(raw?.[k],k);
  const events=[];if(raw.field34c&&!raw.field3d4&&!raw.actor1ec)return events;
  const advance=timer=>{if(timer.elapsed>timer.limit||timer.paused)return false;timer.ticks=(timer.ticks+1)>>>0;timer.elapsed=(timer.elapsed+deltaMs)>>>0;return timer.elapsed>timer.limit;};
  if(advance(this.first)){if(!raw.field403)return events;if(!raw.actorGate3c||raw.field305){const result=this.onCollision();events.push({type:'collision-window',result,nativeReady:false});}}
  if(advance(this.second)){const result=this.onSecondary();events.push({type:'secondary-window',result,nativeReady:false});}return events;
 }
 end(){this.active=false;}
}
//AF3AA0 constructs exactly4components with start+period*i, uint32 arithmetic.
//An attack state's duration can end before the fourth component expires.
export function practiceSentryComponentStarts(profile){if(profile?.attack?.style!==1)throw Error('Authentic Sentry style1 required');const start=uint(profile.attack.collisionStartMs,'collisionStartMs'),period=uint(profile.attack.collisionPeriodMs,'collisionPeriodMs');return Array.from({length:4},(_,i)=>(start+period*i)>>>0);}
