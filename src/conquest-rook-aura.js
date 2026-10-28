import {assertConquestRookActor,CONQUEST_ROOK_SOURCE} from './conquest-rook-source.js';
const components=new WeakMap(),owners=new WeakMap(),requests=new WeakMap(),u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
export function advanceConquestRookAuraTimer(counter,deltaMs){
 if(!counter||![counter.updates,counter.durationMs,counter.elapsedMs,deltaMs].every(u32)||typeof counter.paused!=='boolean')throw Error('Exact retained Rook aura DWORD counter required');
 if(!counter.paused){counter.updates=(counter.updates+1)>>>0;counter.elapsedMs=(counter.elapsedMs+deltaMs)>>>0;}
 const queryDue=counter.elapsedMs>counter.durationMs;if(queryDue){counter.updates=0;counter.elapsedMs=0;}return queryDue;
}
export function assertConquestRookAura(owner,{actor}={}){const r=owners.get(owner);if(!r||r.actor!==actor)throw Error('Typed actual Rook defense-aura owner required');r.live();return owner;}
export function assertConquestRookAuraRequest(request,{owner,actor}={}){const r=owners.get(owner);if(!r||r.actor!==actor||requests.get(request)!==r)throw Error('Actual current Rook defense-aura request required');r.live();return request;}
// A04E30/B7CF90/B7D0A0 retain a component, not an offensive attack. Its
// scene/candidate/condition-command consumer must be supplied explicitly.
// Missing geometry never becomes a list of guessed nearby characters.
export function createConquestRookAura({actor,readCurrentActor,queryAndQueueDefense}={}){
 assertConquestRookActor(actor);if(typeof readCurrentActor!=='function'||typeof queryAndQueueDefense!=='function'||components.has(actor))throw Error('Distinct actual Rook aura/current actor and source query/command consumer required');
 const model=actor.model,counter={updates:0,durationMs:200,elapsedMs:0,paused:false};let disposed=false,busy=false,fault=null,lastResult=null,queries=0;
 const live=()=>{if(disposed||fault||components.get(actor)!==api||readCurrentActor()!==actor||actor.model!==model)throw Error('Current live Rook aura component required'+(fault?': '+fault:''));assertConquestRookActor(actor);};
 const record={actor,live};
 const api=Object.freeze({actor,
  tick(deltaMs){live();if(busy||!u32(deltaMs))throw Error('Nonreentrant uint32 Rook aura tick required');busy=true;
   try{
    if(advanceConquestRookAuraTimer(counter,deltaMs)){
     queries++;
     const request=Object.freeze({kind:'conquest-rook-defense-aura-query',actorId:actor.id,monsterKey:1100,querySerial:queries,
      intervalMs:200,radius:1000,defenseFactor:1,effect:CONQUEST_ROOK_SOURCE.aura.effect,shapeType:5,sourceConsumer:0xb7d200,sourceFilter:0xb7d740,
      requiredGates:Object.freeze(['managerHost20','worldPhase2','actualActorAI','registeredAIQueue']),commandFactory:0x9fdf70,commandTimeOffsetMs:112,conditionMask:0x100,nativeReady:false});
     requests.set(request,record);lastResult=queryAndQueueDefense(request,{owner:api,actor});
     if(lastResult?.then||typeof lastResult?.accepted!=='boolean'||typeof lastResult?.queryQualified!=='boolean')throw Error('Actual synchronous Rook aura query/command result required');live();
    }
    return api.snapshot();
   }catch(error){fault=error.message;throw error;}finally{busy=false;}
  },
  readCanSufferDefenseAura35B(){live();return false;},
  snapshot(){return {actorId:actor.id,monsterKey:1100,counter:{...counter},queryCount:queries,lastResult:lastResult&&{accepted:lastResult.accepted,queryQualified:lastResult.queryQualified,reason:lastResult.reason??null},canSufferDefenseAura35B:false,disposed,fault,sourceTickQualified:true,consumerReportedQueryQualified:lastResult?.queryQualified===true,sourceQueryExecutionQualified:false,nativeReady:false};},
  dispose(){if(disposed)return;if(busy)throw Error('Cannot release Rook aura during retained source query');disposed=true;if(components.get(actor)===api)components.delete(actor);},
 });owners.set(api,record);components.set(actor,api);live();return api;
}
