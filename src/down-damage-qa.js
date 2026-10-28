// Main-game diagnostic: real Plasma inputs, real received contacts and clocks.
// A controlled S5 reposition separates setup from the ordinary follow-up hit;
// no native process, HP write, forced state or replaced animation is involved.
export function runDownDamageQA({combat,controller,step,followSeconds=.15}){
 if(controller.weapon!=='plasma'||combat.gameMode!=='deathmatch'||typeof step!=='function')throw new Error('Plasma Deathmatch and the main simulation step required');
 if(!Number.isFinite(followSeconds)||followSeconds<0||followSeconds>.45)throw new RangeError('Down20 diagnostic cursor0..450ms required');
 const state=combat.enemyState,target=combat.enemy;
 let setupTicks=0;
 for(;setupTicks<800&&state.blowReaction?.stateId!==14;setupTicks++)step({facing:0,x:0,z:0,light:setupTicks===0,lightShort:false,lightLong:setupTicks===0});
 if(state.blowReaction?.stateId!==14)return {qualified:false,reason:'The actual setup contact did not reach Down14',setupTicks,hp:state.hp,clip:combat.avatar.clip};
 const before={stateId:14,hp:state.hp,position:{...target.position},velocity:{...target.velocity},setupMs:setupTicks*10};
 controller.position={x:target.position.x,y:target.position.y,z:target.position.z-1.59};
 controller.velocity.x=0;controller.velocity.z=0;controller.facing=0;
 let hitTicks=0;
 for(;hitTicks<150&&state.blowReaction?.stateId!==20;hitTicks++)step({facing:0,x:0,z:0,light:hitTicks<5,lightPressed:hitTicks===0,lightShort:hitTicks===5,lightReleased:hitTicks===5});
 if(state.blowReaction?.stateId!==20)return {qualified:false,reason:'The follow-up did not enter Down20',before,hp:state.hp,clip:combat.avatar.clip,hitTicks};
 const entry={stateId:20,hp:state.hp,position:{...target.position},velocity:{...target.velocity},clip:state.animation().clip};
 for(let i=0;i<Math.round(followSeconds*1000/10);i++)step({facing:0,x:0,z:0});
 return {qualified:true,qualificationScope:'S5 received-state scenario only',nativeReady:false,controlledS5Reposition:true,before,entry,
  after:{hp:state.hp,stateId:state.blowReaction?.stateId,phaseAgeMs:state.blowReaction?.age*1000,clip:combat.avatar.clip,playback:combat.avatar.playbackTimes(),position:{...target.position},velocity:{...target.velocity},targetSex:combat.avatar.sex},
  sourceWeapon:controller.weapon,hitTicks,followSeconds};
}
