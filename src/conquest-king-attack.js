import {CONQUEST_KING_ATTACK_STATES} from './conquest-king-attack-source.js';
import {assertConquestKingActor} from './conquest-king-ai.js';
import {assertConquestKingSpecialState} from './conquest-king-special-states.js';
import {ConquestMonsterAttackState} from './conquest-monster-state-manager.js';
const u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff,owners=new WeakMap(),events=new WeakMap(),components=new WeakMap();
const call=(fn,value,label)=>{if(typeof fn!=='function')throw Error('Actual King attack consumer required: '+label);const result=fn(value);if(result?.then)throw Error('Synchronous King attack consumer required: '+label);return result;};
export function readConquestKingAttackOwner(actor){const owner=components.get(actor);if(!owner)return null;owners.get(owner).live();return owner;}
export function assertConquestKingAttackEvent(event,{owner,actor}={}){const r=owners.get(owner),e=events.get(event);if(!r||!r.active||e?.owner!==r||r.actor!==actor||e.generation!==r.generation||r.input!==event.stateInput)throw Error('Actual current private King attack event required');r.live();return event;}
export function conquestKingAttackDeclaration(input){const state=CONQUEST_KING_ATTACK_STATES.find(s=>s.input===input);if(!state)throw Error('Authored King input5/10 required');return state;}
export function assertConquestKingAttackDeclaration(attack){if(!CONQUEST_KING_ATTACK_STATES.some(s=>s.attacks.includes(attack)))throw Error('Actual immutable authenticated King attack declaration required');return attack;}
// Original5FD350/5FD1F0/56D890 group semantics, one independent CAttack
//clock/preparation per authored declaration. Native vector order is retained.
export function createConquestKingAttackOwner({actor,readCurrentActor,ports}={}){
 assertConquestKingActor(actor);if(typeof readCurrentActor!=='function'||!['prepareAttack','readTickGate','consumeAttackEvent','exitAttack'].every(k=>typeof ports?.[k]==='function'))throw Error('Actual King current identity/preparation/gates/geometry/HP consumers required');if(components.has(actor))throw Error('Release the previous King attack group owner first');
 const retained=Object.freeze({...ports}),model=actor.model,record={actor,generation:0,input:null,active:false,disposed:false,fault:null,busy:false,attacks:[],emitted:0,last:null,api:null};
 record.live=()=>{if(record.disposed||record.fault||components.get(actor)!==record.api||readCurrentActor()!==actor||actor.model!==model)throw Error('Current owned King attack component required');assertConquestKingActor(actor);};
 const execute=fn=>{record.live();if(record.busy)throw Error('Nonreentrant King attack group required');record.busy=true;try{return fn();}catch(error){record.fault=error.message;throw error;}finally{record.busy=false;}};
 const release=()=>{for(const a of record.attacks)call(retained.exitAttack,{actor,attack:a.attack,prepared:a.prepared,generation:record.generation,stateInput:record.input},'5FD5A0/56D7E0');record.active=false;};
 const validateState=state=>{if(state?.actor!==actor||![5,10].includes(state.stateId))throw Error('Actual King attack5/10 state required');if(state.stateId===10)assertConquestKingSpecialState(state,{actor,stateId:10});else if(!(state instanceof ConquestMonsterAttackState))throw Error('Actual CMonsterAttackState5 required');};
 const api={actor,
  enter(activeState){return execute(()=>{validateState(activeState);const input=activeState.stateId,state=conquestKingAttackDeclaration(input);record.state=activeState;if(record.active)throw Error('Exit the current King attack state before entering another');record.input=input;record.generation++;record.attacks=[];
   for(const attack of state.attacks){const prepared=call(retained.prepareAttack,{actor,attack,generation:record.generation,stateInput:input},'5FD350/56D320');if(prepared==null)throw Error('Actual prepared King CAttack context required');record.live();record.attacks.push({attack,prepared,counter:{updates:0,durationMs:attack.collisionDelayMs,elapsedMs:0,paused:false}});}
   record.active=true;return api.snapshot();});},
  tick(activeState,deltaMs){return execute(()=>{if(record.state!==activeState)throw Error('Actual current King attack state required');validateState(activeState);
   if(!u32(deltaMs))throw Error('Source uint32 King attack delta required');const deliveries=[];if(!record.active)return {...api.snapshot(),updated:false,deliveries};
   for(const a of record.attacks){
    const request={actor,attack:a.attack,prepared:a.prepared,generation:record.generation,stateInput:record.input},gate=call(retained.readTickGate,request,'current56D890 predicates');
    if(gate?.qualified!==true||typeof gate.enabled!=='boolean'||typeof gate.collisionAllowed!=='boolean')throw Error('Current qualified King attack gates required');record.live();
    const c=a.counter;if(!gate.enabled||c.paused||c.elapsedMs>c.durationMs)continue;c.updates=(c.updates+1)>>>0;c.elapsedMs=(c.elapsedMs+deltaMs)>>>0;
    if(c.elapsedMs>c.durationMs&&gate.collisionAllowed){
     const event=Object.freeze({...request,elapsedMs:c.elapsedMs,source:'5FD1F0â†’56D890â†’56E870',nativeReady:false});events.set(event,{owner:record,generation:record.generation});record.emitted++;
     const result=call(retained.consumeAttackEvent,event,'actual King scene query/record/HP recipient');if(result?.qualified!==true)throw Error('King attack consumer refused: '+(result?.reason??result?.status??'unqualified result'));record.live();record.last=result;deliveries.push({event,result});
    }
   }
   return {...api.snapshot(),updated:true,deliveries};
  });},
  exit(activeState){return execute(()=>{if(record.state!==activeState)throw Error('Owned King attack exit state required');release();return api.snapshot();});},
  snapshot(){const last=record.last;return {actorId:actor.id,monsterKey:1500,stateInput:record.input,generation:record.generation,active:record.active,attacks:record.attacks.map(a=>({attackId:a.attack.id,counter:{...a.counter}})),emittedEvents:record.emitted,lastResult:last&&{qualified:last.qualified,status:last.status,attackId:last.attackId,attributeId:last.attributeId,deliveryCount:last.deliveries?.length??null,nativeReady:false},disposed:record.disposed,groupExecutionQualified:true,nativeReady:false};},
  dispose(){if(record.disposed)return;if(record.busy)throw Error('Cannot dispose King group during consumption');let error;try{release();}catch(e){error=e;}record.disposed=true;if(components.get(actor)===api)components.delete(actor);if(error)throw error;},
 };
 record.api=Object.freeze(api);components.set(actor,record.api);owners.set(record.api,record);record.live();return record.api;
}
