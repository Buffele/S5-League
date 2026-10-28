// BishopSnipe1314: independent typed ownership; inherited type7 kernels qualified in bishop-snipe1314-20261023.
import {practiceSentryFilterImpacts,practiceSentryOrderRayContacts} from './practice-sentry-impact.js';
import {sentryNativeVector} from './practice-sentry-perception.js';

// 56E870 weapon60 keeps allowMultiple=false; Bishop's authored second
// SetCollisionRangeAdjust flag is false.575BA0 sorts the full type7 list,
// truncates to one BEFORE probing, then5F5AD0 flattens endpointY to originY.
// Generic573CD0 and53BFD0 helpers are reused, never the type1 BOX classifier.
export function classifyConquestBishopSnipeThickRayContacts({requester,contacts,shape,excludePeerSubtype2,probeSegment,resolveEqualDistance,geometryPassesResolved}={}){
 if(shape?.type!==7||shape.collisionRangeAdjust!==false||shape.adjustedQueryRequired!==false||typeof probeSegment!=='function')throw Error('Source Bishop type7/false range adjustment and actual segment query required');
 if(geometryPassesResolved!==true)return {status:'unknown-primary-critical-query-passes',hits:[],blocked:[],nativeReady:false};
 const filtered=practiceSentryFilterImpacts({requester,contacts,rawMode:1,excludePeerSubtype2}),ordered=practiceSentryOrderRayContacts({contacts:filtered,sourcePosition7c:requester.position7c,resolveEqualDistance});
 if(ordered===null)return {status:'unknown-qsort-tie-order',hits:[],blocked:[],nativeReady:false};
 const origin=sentryNativeVector(shape.origin),selected=ordered.slice(0,1),hits=[],blocked=[];
 for(const contact of selected){const target=sentryNativeVector(contact.actor.position7c);if(!Number.isFinite(contact.actor.height6c))throw Error('Actual candidate height6C required');
  //575BA0 still reads/adds height*.5 before5F5AD0 replaces Y for type7.
  target[1]=Math.fround(target[1]+Math.fround(Math.fround(contact.actor.height6c)*.5));target[1]=origin[1];
  const result=probeSegment({source:'575BA0(type7)→5F5AD0',coordinateSpace:'native',from:[...origin],to:target,queryMask:0x2107c0,rawQueryFlag:false,shapeType:7,requesterIdentity:requester.identity,candidateIdentity:contact.actor.identity});
  if(result===null)return {status:'unknown-obstruction',hits:[],blocked:[],nativeReady:false};if(!result||typeof result.blocked!=='boolean')throw Error('Actual type7 probe {blocked,point} or explicit null required');
  if(result.blocked)blocked.push({...contact,point:sentryNativeVector(result.point)});else hits.push(contact);
 }
 return {status:'contacts-classified',hits,blocked,selectedContacts:selected.length,filteredContacts:filtered.length,shapeAfterQueryType:ordered.length?7:4,emptyQueryConvertsWorkingShapeToRay:ordered.length===0,sourcePartitionQualified:true,nativeReady:false};
}
