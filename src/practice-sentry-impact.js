import {sentryNativeVector,sentryNativeSubtract,sentryNativeLengthSquared,sentryNativePeerId} from './practice-sentry-perception.js';
const f=Math.fround,finite=(v,n)=>{if(!Number.isFinite(v))throw Error('Finite '+n+' required');return f(v);},bool=(v,n)=>{if(typeof v!=='boolean')throw Error('Explicit raw '+n+' required');return v;};
//573CD0, raw mode passed by5FD1F0→56D890→56E870. This differs from
//5488E0 perception: do not add D4/HP filters to this source stage.
export function practiceSentryFilterImpacts({requester,contacts,rawMode,excludePeerSubtype2}){
 if(!requester||requester.identity===undefined||!Array.isArray(contacts)||!Number.isInteger(rawMode))throw Error('Actual requester, ordered contacts and raw filter mode required');
 bool(requester.slot1c4,'requester1C4');bool(excludePeerSubtype2,'component17C0');
 return contacts.filter(contact=>{const a=contact.actor;if(!a||a.identity===undefined)throw Error('Actual candidate actor required');bool(a.slot1c4,'candidate1C4');let keep=true;
  if(rawMode===1)keep=requester.slot1c4!==a.slot1c4;
  else if(rawMode===2)keep=requester.identity===a.identity||requester.slot1c4!==a.slot1c4;
  else if(rawMode===3)keep=requester.identity!==a.identity&&!a.slot1c4;
  if(keep&&excludePeerSubtype2&&requester.identity!==a.identity){const id=sentryNativePeerId(a.peerId2c);keep=((id[1]>>>16)&7)!==2;}
  return keep;
 });
}
//53BFD0→qsort(compare549750) orders ACTOR CENTER distance, not hitpoint.
//qsort ties are not stable. Require their real order instead of guessing it.
export function practiceSentryOrderRayContacts({contacts,sourcePosition7c,halfFactor=.5,resolveEqualDistance}){
 if(!Array.isArray(contacts))throw Error('Actual contact collection required');const origin=sentryNativeVector(sourcePosition7c),half=finite(halfFactor,'constant float33');
 const entries=contacts.map(contact=>{const center=sentryNativeVector(contact.actor.position7c);center[1]=f(center[1]+f(finite(contact.actor.height6c,'candidate6C')*half));return {contact,distanceSquared:sentryNativeLengthSquared(sentryNativeSubtract(center,origin))};}).sort((a,b)=>a.distanceSquared-b.distanceSquared);
 const result=[];for(let i=0;i<entries.length;){let end=i+1;while(end<entries.length&&entries[end].distanceSquared===entries[i].distanceSquared)end++;const tied=entries.slice(i,end).map(e=>e.contact);
  if(tied.length>1){if(typeof resolveEqualDistance!=='function')return null;const ordered=resolveEqualDistance([...tied],entries[i].distanceSquared);if(ordered===null)return null;if(!Array.isArray(ordered)||ordered.length!==tied.length||new Set(ordered).size!==tied.length||ordered.some(c=>!tied.includes(c)))throw Error('Native equal-distance order must be a permutation');result.push(...ordered);}else result.push(tied[0]);i=end;
 }return result;
}
//575BA0 branch type4: truncate BEFORE obstruction test, then partition.
//An obstructed nearest actor does not cause selection of a farther actor.
export function practiceSentryPartitionRayContacts({requester,shape,contacts,allowMultiple,probeSegment,resolveEqualDistance}){
 if(shape?.type!==4||typeof probeSegment!=='function')throw Error('Source type4 shape and actual segment query required');bool(allowMultiple,'allowMultiple');
 const ordered=practiceSentryOrderRayContacts({contacts,sourcePosition7c:requester.position7c,resolveEqualDistance});if(ordered===null)return {status:'unknown-qsort-tie-order',hits:[],blocked:[],nativeReady:false};
 const selected=allowMultiple?ordered:ordered.slice(0,1),hits=[],blocked=[];
 for(const contact of selected){const request={source:'575BA0→5F5AD0',coordinateSpace:'native',from:sentryNativeVector(shape.origin),to:sentryNativeVector(contact.point),queryMask:0x210fc0,rawQueryFlag:true,shapeType:4,requesterIdentity:requester.identity,candidateIdentity:contact.actor.identity};
  const result=probeSegment(request);if(result===null)return {status:'unknown-obstruction',hits:[],blocked:[],nativeReady:false};if(!result||typeof result.blocked!=='boolean')throw Error('Actual probe result {blocked,point} or unknown null required');
  if(result.blocked)blocked.push({...contact,point:sentryNativeVector(result.point,'actual obstacle intersection')});else hits.push(contact);
 }return {status:'contacts-classified',hits,blocked,nativeReady:false};
}
//56E870 has no direct HP write. Services retain actual query/record receivers
//and distinct source/credit owner. No profile.damageOnce fallback is allowed.
export function createPracticeSentryImpactPipeline({lookupAttackAttribute,queryCandidates,produceDamageRecord,receiveDamageRecord,probeSegment,resolveEqualDistance,onContact=()=>{}}){
 for(const [name,fn] of Object.entries({lookupAttackAttribute,queryCandidates,produceDamageRecord,receiveDamageRecord,probeSegment,onContact}))if(typeof fn!=='function')throw Error('Explicit source impact service required: '+name);
 return {resolve({requester,creditOwner,shape,rawMode,excludePeerSubtype2,componentId,effectivePower,geometryPassesResolved}){
  if(geometryPassesResolved!==true)return {status:'unknown-primary-critical-query-passes',nativeReady:false};
  const attribute=lookupAttackAttribute(16);if(attribute===null)return {status:'unknown-attack-attribute',nativeReady:false};if(attribute===undefined)return {status:'missing-attack-attribute',nativeReady:false};
  const candidates=queryCandidates({shape,requester,componentId,source:'5448C0(type4)→542060'});if(candidates===null)return {status:'unknown-query-candidates',nativeReady:false};
  const filtered=practiceSentryFilterImpacts({requester,contacts:candidates,rawMode,excludePeerSubtype2}),partition=practiceSentryPartitionRayContacts({requester,shape,contacts:filtered,allowMultiple:false,probeSegment,resolveEqualDistance});if(partition.status!=='contacts-classified')return partition;
  const deliveries=[];for(const contact of partition.hits){const context={requester,creditOwner,contact,shape,componentId,attributeId:16,weaponType:8,attribute,effectivePower,source:'56E870→570890'};onContact({...context,kind:'actor',nativeReady:false});
   const record=produceDamageRecord(context);if(record===null){deliveries.push({status:'unknown-damage-record',targetIdentity:contact.actor.identity,damageApplied:false});continue;}
   const delivery=receiveDamageRecord(record,context);deliveries.push({status:delivery===null?'unknown-target-receiver':'record-delivered',targetIdentity:contact.actor.identity,delivery,nativeReady:false});
  }
  for(const contact of partition.blocked)onContact({requester,creditOwner,contact,shape,componentId,kind:'world',nativeReady:false});
  return {...partition,deliveries,sourceQueryDispatchVerified:false,damageScalarProducerVerified:false};
 },nativeReady:false};
}
//97FA20's HP-write prefix. Applies ONLY to a class whose slotB8 is97FA20.
//The rest of that function's owner/mode/stat side effects are separate ports.
export function practiceSentryNativeHealthDecision({hp94,maxHp9c,slot44,slot4c,attributeId,amount}){
 const hp=finite(hp94,'HP94'),maxHp=finite(maxHp9c,'maximumHP9C'),value=finite(amount,'record+50 amount');bool(slot44,'actor44');bool(slot4c,'actor4C');if(!Number.isInteger(attributeId))throw Error('Actual record attribute required');
 if(hp<=0||!slot44||(attributeId!==0x12&&slot4c))return {accepted:false,hpBefore:hp,hpAfter:hp,amountConsumed:0};
 const consumed=value<hp?value:hp,next=f(hp-consumed);return {accepted:true,hpBefore:hp,hpAfter:next>=maxHp?maxHp:next,amountConsumed:consumed};
}
export function createPracticeSentryDamageReceiver({targetIdentity,validateRecordType,prepareRecord,applyConditions,readHealth,writeHealth,onSourceNotice=()=>{},onHealthSideEffects=()=>null}){
 if(targetIdentity===undefined)throw Error('Actual target identity required');
 for(const [name,fn] of Object.entries({validateRecordType,prepareRecord,applyConditions,readHealth,writeHealth,onSourceNotice,onHealthSideEffects}))if(typeof fn!=='function')throw Error('Explicit Sentry damage receiver service required: '+name);
 let disposed=false;
 return {receive(record){if(disposed)return {accepted:false,status:'disposed',nativeReady:false};const valid=validateRecordType(record);if(valid===null)return {accepted:false,status:'unknown-record-type',nativeReady:false};if(valid!==true)throw Error('SentryF0 requires authenticated CDamageRecord type');
   //AF1910 stores158 and invokesAF4EF0 synchronously. Preparation and
   //conditions run before the protected50 value is read and B8 is invoked.
   if(prepareRecord(record,targetIdentity)!==true)return {accepted:false,status:'unknown-record-preparation',nativeReady:false};
   const sourcePeerId=sentryNativePeerId(record.sourcePeerId10),notice=onSourceNotice({sourcePeerId:[...sourcePeerId],targetIdentity,record,nativeReady:false});
   if(applyConditions(record,targetIdentity)!==true)return {accepted:false,status:'unknown-record-conditions',nativeReady:false};
   const health=readHealth();if(health===null)return {accepted:false,status:'unknown-target-health-gates',nativeReady:false};const decision=practiceSentryNativeHealthDecision({...health,attributeId:record.attributeId8,amount:record.damage50});
   if(decision.accepted){writeHealth(decision.hpAfter,{sourcePeerId:[...sourcePeerId],attributeId:record.attributeId8,targetIdentity,source:'97FA20→9879B0→property15F4578',nativeReady:false});onHealthSideEffects({...decision,sourcePeerId:[...sourcePeerId],attributeId:record.attributeId8,targetIdentity,record});}
   return {...decision,status:decision.accepted?'source-hp-write':'source-hp-rejected',sourcePeerId,targetIdentity,sourceNoticeDelivered:notice===true,otherNativeHealthSideEffectsVerified:false,nativeReady:false};
  },dispose(){disposed=true;},nativeReady:false,receiverClass:'SentryActor slotsF0=AF1910,210=AF4EF0,B8=97FA20; not a player receiver claim'};
}
