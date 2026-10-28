export const BREAKER_PREVIEW_ATTACKS=Object.freeze({
 weak:Object.freeze({state:'SwordAtkAfterDash1State_Breaker',clips:['HM001','HM002'],normalMs:600,minimumUpdateMs:40,delayMs:500,hitMs:200,sound:'breaker_smash'}),
 strong:Object.freeze({state:'SwordAtkStrongState_Breaker',clips:['HM001','HM002'],normalMs:600,minimumUpdateMs:40,delayMs:500,hitMs:200,sound:'breaker_big_smash'}),
 jump:Object.freeze({state:'SwordJumpAtkState_Breaker',clips:['HM016','HM017'],clipSpeeds:[.85,1],normalMs:300,minimumUpdateMs:40,delayMs:600,hitMs:250,sound:'breaker_jump'}),
});

export class BreakerPreviewCombat{
 constructor(){this.action=null;this.serial=0;}
 start(kind){
  const profile=BREAKER_PREVIEW_ATTACKS[kind];
  if(!profile||this.action)return [];
  this.action={kind,profile,timeMs:0,substate:'normal',substateMs:0,hit:false,serial:++this.serial};
  return [{type:'attack',kind,clip:profile.clips[0],speed:profile.clipSpeeds?.[0]||1,state:profile.state,sound:profile.sound}];
 }
 step(dt){
  const action=this.action;if(!action)return [];
  const elapsed=Math.max(0,dt)*1000,previous=action.timeMs;action.timeMs+=elapsed;action.substateMs+=elapsed;const events=[];
  if(!action.hit&&previous<=action.profile.hitMs&&action.timeMs>action.profile.hitMs){action.hit=true;events.push({type:'hit',kind:action.kind,thresholdMs:action.profile.hitMs,elapsedMs:action.timeMs,sound:'breaker_hit'});}
  if(action.substate==='normal'&&action.substateMs>action.profile.normalMs){action.substate='minimum';action.substateMs=0;events.push({type:'substate',kind:action.kind,substate:'minimum'});}
  else if(action.substate==='minimum'&&action.substateMs>action.profile.minimumUpdateMs){action.substate='delay';action.substateMs=0;events.push({type:'phase',kind:action.kind,substate:'delay',clip:action.profile.clips[1],speed:action.profile.clipSpeeds?.[1]||1});}
  else if(action.substate==='delay'&&action.substateMs>action.profile.delayMs){events.push({type:'complete',kind:action.kind,timeMs:action.timeMs});this.action=null;}
  return events;
 }
 reset(){this.action=null;}
}
