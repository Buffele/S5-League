import {assertConquestKingActor} from './conquest-king-ai.js';
import {assertConquestKingRandom} from './conquest-king-random.js';
const owners=new WeakMap(),leases=new WeakMap();
export function conquestKingShuffleProbability({percent,nextRandom15}={}){
 if(!Number.isInteger(percent)||percent<0||percent>100||typeof nextRandom15!=='function'||nextRandom15.constructor?.name!=='Function')throw Error('Explicit King percent0..100 and synchronous CRT source required');
 const flags=Array.from({length:100},(_,i)=>i<percent?1:0);let draws=0;
 // Original4A1F70 is a forward shuffle, bounds2..100.4A9AD0 rejects
 // the incomplete high quotient; modulo-only changes both order and CRT consumption.
 for(let i=1;i<100;i++){const bound=i+1,limit=Math.floor(32768/bound)*bound;let draw;do{draw=nextRandom15();if(!Number.isInteger(draw)||draw<0||draw>32767)throw Error('Actual King CRT rand15 required');draws++;}while(draw>=limit);const chosen=draw%bound;[flags[i],flags[chosen]]=[flags[chosen],flags[i]];}
 return Object.freeze({flags:Object.freeze(flags),drawCount:draws,sourceShuffleKernelQualified:true,nativeCRTSeedObserved:false,nativeReady:false});
}
export function assertConquestKingProbabilityOwner(owner,{actor,monsterActors}={}){const r=owners.get(owner);if(!r||r.actor!==actor||r.monsters!==monsterActors)throw Error('Typed actual King probability owner required');r.live();return owner;}
export function createConquestKingProbabilityOwner({actor,monsterActors,randomOwner,nextRandom15}={}){
 assertConquestKingActor(actor);assertConquestKingRandom(randomOwner);if(!(monsterActors instanceof Map)||monsterActors.get(actor.id)!==actor||leases.has(randomOwner)||typeof nextRandom15!=='function'||nextRandom15.constructor?.name!=='Function')throw Error('Distinct retained King MT owner and current actor/CRT source required');
 const model=actor.model,stats=actor.spawnStats;let disposed=false,busy=false,fault=null,last=null,count=0,api;
 const live=()=>{if(disposed||fault||leases.get(randomOwner)!==api||monsterActors.get(actor.id)!==actor||actor.model!==model||actor.spawnStats!==stats)throw Error('Current owned King probability source required'+(fault?': '+fault:''));assertConquestKingActor(actor);assertConquestKingRandom(randomOwner);};
 api=Object.freeze({bindings:Object.freeze({isProbOn(target,percent){live();if(busy||target!==actor||percent!==30)throw Error('Actual King IsProbOn30 source call required');busy=true;try{const shuffled=conquestKingShuffleProbability({percent,nextRandom15}),index=randomOwner.below(100),value=shuffled.flags[index]!==0;live();count++;last=Object.freeze({index,value,crtDraws:shuffled.drawCount,mtDraws:randomOwner.snapshot().draws,sourceKernelQualified:true,nativeReady:false});return value;}catch(error){fault=error.message;throw error;}finally{busy=false;}}}),snapshot(){live();return {actorId:actor.id,monsterKey:1500,calls:count,last,nativeSeedObserved:false,nativeReady:false};},dispose(){if(disposed)return;if(busy)throw Error('Cannot dispose King probability while sampling');disposed=true;if(leases.get(randomOwner)===api)leases.delete(randomOwner);}});
 leases.set(randomOwner,api);owners.set(api,{actor,monsters:monsterActors,live});live();return api;
}
