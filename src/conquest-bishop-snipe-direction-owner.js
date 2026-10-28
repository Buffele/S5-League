import {assertConquestBishopSnipeActor} from './conquest-bishop-snipe-ai.js';
import {assertConquestBishopSnipePlayerFacing,assertConquestBishopSnipePlayerFacingReceipt} from './conquest-bishop-snipe-player-facing.js';
import {conquestBishopSnipeDirectionRand} from './conquest-bishop-snipe-direction.js';
const owners=new WeakMap();
export function assertConquestBishopSnipeDirectionOwner(owner,{actor,monsterActors,authority}={}){const r=owners.get(owner);if(!r||r.actor!==actor||r.monsters!==monsterActors||r.authority!==authority)throw Error('Typed actual Snipe random-direction owner required');r.live();return owner;}
export function createConquestBishopSnipeDirectionOwner({actor,monsterActors,authority,playerFacingOwner,playerActors,world,renderOwner,nextRandom15}={}){
 assertConquestBishopSnipeActor(actor);if(!(monsterActors instanceof Map)||typeof nextRandom15!=='function'||nextRandom15.constructor?.name!=='Function')throw Error('Actual Snipe Map and synchronous shared CRT producer required');
 const model=actor.model,stats=actor.spawnStats;let disposed=false,last=null,busy=false,drawCount=0;
 const live=()=>{if(disposed||monsterActors.get(actor.id)!==actor||actor.model!==model||actor.spawnStats!==stats||authority.actor(actor.id)!==actor)throw Error('Current actual Snipe random-direction owner required');assertConquestBishopSnipeActor(actor);assertConquestBishopSnipePlayerFacing(playerFacingOwner,{authority,playerActors,world,renderOwner});};
 const draw=()=>{const n=nextRandom15();if(!Number.isInteger(n)||n<0||n>32767)throw Error('Actual source Snipe CRT rand15 required');drawCount++;return n;};
 const bindings=Object.freeze({direction2To1Rand(near,monster,width,height,scriptRounds){live();if(busy||monster!==actor||near?.kind!=='conquest-owned-player-navigation'||width!==400||height!==200||scriptRounds!==2)throw Error('Current Snipe target and authored Rand400/200/2 required');busy=true;try{
  //6C5320 draws before reading target direction and actor getter operands.
  const random15X=draw(),random15Y=draw(),facing=playerFacingOwner.readDirection8c(near),targetPosition7c=Object.values(authority.position(near)),targetHeight6c=authority.height(near),monsterPosition7c=Object.values(authority.position(actor)),monsterHeight6c=authority.height(actor);
  assertConquestBishopSnipePlayerFacingReceipt(facing,{owner:playerFacingOwner,actor:near});
  const value=conquestBishopSnipeDirectionRand({monsterPosition7c,monsterHeight6c,targetPosition7c,targetHeight6c,targetDirection8c:facing.direction8c,width,height,scriptRounds,random15X,random15Y});live();assertConquestBishopSnipePlayerFacingReceipt(facing,{owner:playerFacingOwner,actor:near});last={...value,targetId:near.id,nativePlayerDirectionWriterQualified:false,nativeObserved:false};return {x:value.direction[0],y:value.direction[1],z:value.direction[2]};
 }finally{busy=false;}}});
 const api=Object.freeze({bindings,snapshot(){live();return {actorId:actor.id,monsterKey:1314,drawCount,last,sourceKernelQualified:true,nativePlayerDirectionWriterQualified:false,nativeReady:false};},dispose(){if(busy)throw Error('Cannot dispose Snipe direction during read');disposed=true;}});owners.set(api,{actor,monsters:monsterActors,authority,live});live();return api;
}
