// BishopSnipe1314: independent typed ownership; inherited type7 kernels qualified in bishop-snipe1314-20261023.
import {createConquestBishopSnipeLocalAttackShape,conquestBishopSnipeTrackedAttackShape} from './conquest-bishop-snipe-thick-ray.js';
import {CONQUEST_BISHOP_SNIPE_ATTACK_STATES} from './conquest-bishop-snipe-attack-source.js';
import {assertConquestBishopSnipeActor} from './conquest-bishop-snipe-ai.js';
import {conquestPawnAttackFacingVector} from './conquest-pawn-attack-facing.js';
import {ConquestMonsterAttackState} from './conquest-monster-state-manager.js';
const u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff,owners=new WeakMap(),events=new WeakMap(),components=new WeakMap();
const call=(fn,value,label)=>{if(typeof fn!=='function')throw Error('Actual Bishop attack consumer required: '+label);const result=fn(value);if(result?.then)throw Error('Synchronous Bishop attack consumer required: '+label);return result;};
export function readConquestBishopSnipeAttackOwner(actor){const owner=components.get(actor);if(!owner)return null;owners.get(owner).live();return owner;}
export function assertConquestBishopSnipeAttackEvent(event,{owner,actor}={}){const r=owners.get(owner),e=events.get(event);if(!r||!r.active||e?.owner!==r||r.actor!==actor||e.generation!==r.generation||r.input!==event.stateInput)throw Error('Actual current private Bishop attack event required');r.live();return event;}
export function conquestBishopSnipeAttackDeclaration(input){const state=CONQUEST_BISHOP_SNIPE_ATTACK_STATES.find(s=>s.input===input);if(!state)throw Error('Authored Bishop input5 required');return state;}
export function assertConquestBishopSnipeAttackDeclaration(attack){if(!CONQUEST_BISHOP_SNIPE_ATTACK_STATES.some(s=>s.attacks.includes(attack)))throw Error('Actual immutable authenticated Bishop attack declaration required');return attack;}
// Original5FD350/5FD1F0/56D890 group semantics, one independent CAttack
//clock/preparation per authored declaration. Native vector order is retained.
export function createConquestBishopSnipeAttackOwner({actor,readCurrentActor,ports,rangeCapture}={}){
 assertConquestBishopSnipeActor(actor);if(typeof readCurrentActor!=='function'||!['prepareAttack','readTickGate','consumeAttackEvent','exitAttack'].every(k=>typeof ports?.[k]==='function'))throw Error('Actual Bishop current identity/preparation/gates/geometry/HP consumers required');if(components.has(actor))throw Error('Release the previous Bishop attack group owner first');
 const retained=Object.freeze({...ports}),model=actor.model,record={actor,generation:0,input:null,active:false,disposed:false,fault:null,busy:false,attacks:[],emitted:0,last:null,api:null,states:new WeakSet(),localShape:rangeCapture===undefined?null:createConquestBishopSnipeLocalAttackShape({actor,rangeCapture}),trackedShape:null};
 record.live=()=>{if(record.disposed||record.fault||components.get(actor)!==record.api||readCurrentActor()!==actor||actor.model!==model)throw Error('Current owned Bishop attack component required');assertConquestBishopSnipeActor(actor);};
 const execute=fn=>{record.live();if(record.busy)throw Error('Nonreentrant Bishop attack group required');record.busy=true;try{return fn();}catch(error){record.fault=error.message;throw error;}finally{record.busy=false;}};
 const release=()=>{for(const a of record.attacks)call(retained.exitAttack,{actor,attack:a.attack,prepared:a.prepared,generation:record.generation,stateInput:record.input},'5FD5A0/56D7E0');record.active=false;};
 const api={actor,
  captureTransform(state){record.live();if(record.busy||!record.states.has(state)||state.actor!==actor||state.stateId!==5||!record.active||!record.localShape)throw Error('Actual current Bishop attack state and captured source range required');const p=actor.positionNative,d=state.directionNative;record.trackedShape=conquestBishopSnipeTrackedAttackShape({actor,localShape:record.localShape,position7c:[p.x,p.y,p.z],height6c:actor.height,attackDirectionD4:[d.x,d.y,d.z]});return record.trackedShape;},
  enter(input){return execute(()=>{const state=conquestBishopSnipeAttackDeclaration(input);if(record.active)throw Error('Exit the current Bishop attack state before entering another');record.input=input;record.generation++;record.attacks=[];record.trackedShape=null;
   for(const attack of state.attacks){const prepared=call(retained.prepareAttack,{actor,attack,generation:record.generation,stateInput:input},'5FD350/56D320');if(prepared==null)throw Error('Actual prepared Bishop CAttack context required');record.live();record.attacks.push({attack,prepared,counter:{updates:0,durationMs:attack.collisionDelayMs,elapsedMs:0,paused:false}});}
   record.active=true;return api.snapshot();});},
  tick(deltaMs){return execute(()=>{
   if(!u32(deltaMs))throw Error('Source uint32 Bishop attack delta required');const deliveries=[];if(!record.active)return {...api.snapshot(),updated:false,deliveries};
   for(const a of record.attacks){
    const request={actor,attack:a.attack,prepared:a.prepared,generation:record.generation,stateInput:record.input},gate=call(retained.readTickGate,request,'current56D890 predicates');
    if(gate?.qualified!==true||typeof gate.enabled!=='boolean'||typeof gate.collisionAllowed!=='boolean')throw Error('Current qualified Bishop attack gates required');record.live();
    const c=a.counter;if(!gate.enabled||c.paused||c.elapsedMs>c.durationMs)continue;c.updates=(c.updates+1)>>>0;c.elapsedMs=(c.elapsedMs+deltaMs)>>>0;
    if(c.elapsedMs>c.durationMs&&gate.collisionAllowed){
     const event=Object.freeze({...request,elapsedMs:c.elapsedMs,worldShape:record.trackedShape,source:'5FD1F0→56D890→56E870',nativeReady:false});events.set(event,{owner:record,generation:record.generation});record.emitted++;
     const result=call(retained.consumeAttackEvent,event,'actual Bishop scene query/record/HP recipient');if(result?.qualified!==true)throw Error('Bishop attack consumer refused: '+(result?.reason??result?.status??'unqualified result'));record.live();record.last=result;deliveries.push({event,result});
    }
   }
   return {...api.snapshot(),updated:true,deliveries};
  });},
  exit(){return execute(()=>{release();return api.snapshot();});},
  snapshot(){const last=record.last;return {actorId:actor.id,monsterKey:1314,stateInput:record.input,generation:record.generation,active:record.active,attacks:record.attacks.map(a=>({attackId:a.attack.id,counter:{...a.counter}})),emittedEvents:record.emitted,lastResult:last&&{qualified:last.qualified,status:last.status,attackId:last.attackId,attributeId:last.attributeId,deliveryCount:last.deliveries?.length??null,nativeReady:false},disposed:record.disposed,groupExecutionQualified:true,sourceRangeCaptureQualified:record.localShape?.sourceRangeCaptureQualified===true,sourceTrackingQualified:record.trackedShape?.sourceTrackingQualified===true,nativeReady:false};},
  dispose(){if(record.disposed)return;if(record.busy)throw Error('Cannot dispose Bishop group during consumption');let error;try{release();}catch(e){error=e;}record.disposed=true;if(components.get(actor)===api)components.delete(actor);if(error)throw error;},
 };
 record.api=Object.freeze(api);components.set(actor,record.api);owners.set(record.api,record);record.live();return record.api;
}
// Concrete CMonsterAttackState5 integration ports. Base lifecycle/MoveBox,
//animation/audio and SetUpdatePosDir consumers remain supplied separately.
export function createConquestBishopSnipeAttackStates({actor,attackOwner,ports}={}){
 assertConquestBishopSnipeActor(actor);if(typeof ports?.updateAttackTransform!=='function')throw Error('Actual Bishop SetUpdatePosDir tracking consumer required');if(attackOwner!==readConquestBishopSnipeAttackOwner(actor))throw Error('Actual Bishop attack group owner required');
 const states=CONQUEST_BISHOP_SNIPE_ATTACK_STATES.map(declaration=>new ConquestMonsterAttackState({actor,stateId:declaration.stateId,durationMs:declaration.durationMs,trackAttackTransform:true,
  ports:{...ports,attackEnter:state=>attackOwner.enter(state.stateId),attackExit:()=>attackOwner.exit(),attackTick:(state,delta)=>attackOwner.tick(delta),faceAttackDirection:state=>{if(state.actor!==actor)throw Error('Current actual Bishop attack state required');actor.setNativeFacingDirection(conquestPawnAttackFacingVector(state.directionNative));}}}));
 for(const [i,state]of states.entries()){owners.get(attackOwner).states.add(state);Object.defineProperty(state,'bishopSnipeSourceDeclaration',{value:CONQUEST_BISHOP_SNIPE_ATTACK_STATES[i],enumerable:true});}
 return Object.freeze(states);
}
