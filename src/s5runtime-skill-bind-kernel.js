import {s5runtimeSkillDefinition} from './s5runtime-skill-data.js';
const f=Math.fround,keys=new Set([3070001,3070002]);
//642C07..642C4E Float0*constant128(1000)→FE6050→state+2A4;
//64314F..64316F→packet vslot28 DD1B30 stores protected condition+18.
export function s5runtimeBindPacketDuration(itemKey){if(!keys.has(itemKey))throw Error('Unsupported Bind Action');return Math.trunc(f(f(Number(s5runtimeSkillDefinition(itemKey).action.Float.Float_Value1))*f(1000)));}
export function s5runtimeBindRequiredSp(itemKey,{flat=0,percent=0,effectiveItemRequired}={}){if(!keys.has(itemKey))throw Error('Unsupported Bind Action');const item=effectiveItemRequired??Number(s5runtimeSkillDefinition(itemKey).action.ability.required_mp);if(![item,flat,percent].every(Number.isFinite))throw Error('Invalid Bind attribute160');return Math.max(0,f(f(f(item)-f(flat))-f(f(item)*f(percent))));}
export function s5runtimeBindTargetEligible({sameActor,sourceSlot1c4,targetSlot1c4,targetSlotD4,targetSlot94}={}){
 //5488E0 called with filters2/4/1 by643E00. Raw getters, no inferred team/HP identity.
 if(typeof sameActor!=='boolean'||typeof sourceSlot1c4!=='boolean'||typeof targetSlot1c4!=='boolean'||typeof targetSlotD4!=='boolean'||!Number.isFinite(targetSlot94))return false;
 return !sameActor&&sourceSlot1c4!==targetSlot1c4&&targetSlotD4&&targetSlot94!==0;
}
export function createS5RuntimeBindCondition({id,ownerId,sourceId,durationMs,packetFlag}={}){if(!Number.isInteger(durationMs)||durationMs<0||durationMs>0xffffffff||typeof packetFlag!=='boolean')throw Error('Explicit native Bind condition packet required');return {id,ownerId,sourceId,durationMs,packetFlag,installed:false,active:false,elapsedMs:0,counter:0,timerBlocked:false,nativeQueryFlags:[1,8]};}
export function applyS5RuntimeBindCondition(state,{nativeContext}={}){
 if(nativeContext?.enabled!==true||nativeContext.conditionOwnerConfirmed!==true)return {accepted:false,commands:{},reason:'native-condition-owner-required',nativeReady:false};
 state.installed=true;state.counter=0;state.elapsedMs=0;if(state.packetFlag)state.active=true;
 return {accepted:true,active:state.active,commands:{bindPresentationRequest:{id:state.id,ownerId:state.ownerId,sourceId:state.sourceId,packetFlag:state.packetFlag}},nativeReady:false};
}
export function endS5RuntimeBindCondition(state,{reason='explicit-native-condition-end'}={}){state.installed=false;if(state.packetFlag)state.active=false;return {active:state.active,commands:{bindPresentationRemove:{id:state.id}},events:[{type:'s5runtime-bind-condition-ended',id:state.id,reason}],nativeReady:false};}
export function advanceS5RuntimeBindCondition(state,dtMs,{nativeContext}={}){
 if(!Number.isInteger(dtMs)||dtMs<0||dtMs>0xffffffff)throw Error('Native Bind tick requires uint32 milliseconds');
 if(nativeContext?.enabled!==true||nativeContext.conditionOwnerConfirmed!==true)return {active:state.active,commands:{},events:[],reason:'native-condition-owner-required',nativeReady:false};
 if(!state.installed)return {active:state.active,commands:{},events:[],reason:'condition-not-installed',nativeReady:false};
 //54EF40 timer preserves at equality;54AE58 calls End/remove when Tick returnsfalse.
 if(!state.timerBlocked){state.counter=(state.counter+1)>>>0;state.elapsedMs=(state.elapsedMs+dtMs)>>>0;if(state.elapsedMs>state.durationMs)return endS5RuntimeBindCondition(state,{reason:'native-condition-timer-expired'});}
 return {active:state.active,commands:{},events:[],nativeReady:false};
}
export function queryS5RuntimeBindNativeConditions(conditions,flag){if(!Number.isInteger(flag))throw Error('Explicit native condition query required');return conditions.some(c=>c?.active===true&&Array.isArray(c.nativeQueryFlags)&&c.nativeQueryFlags.includes(flag));}
function vec(v){if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw Error('Explicit native vec3 required');return [...v];}
export function s5runtimeBindNativeInputVector(vector,conditions){const out=vec(vector);return queryS5RuntimeBindNativeConditions(conditions,1)?[0,0,0]:out;}
export function s5runtimeBindNativeActor70Displacement(vector,conditions){const out=vec(vector);if(queryS5RuntimeBindNativeConditions(conditions,1)){out[0]=0;out[2]=0;}return out;}
export function composeS5RuntimeBindActorPolicy(conditions,actorPolicy={}){return {...actorPolicy,horizontalBlocked:actorPolicy.horizontalBlocked===true||queryS5RuntimeBindNativeConditions(conditions,1)};}
