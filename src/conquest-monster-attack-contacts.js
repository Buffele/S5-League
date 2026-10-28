import {practiceSentryFilterImpacts,practiceSentryOrderRayContacts} from './practice-sentry-impact.js';
import {sentryNativeVector} from './practice-sentry-perception.js';
const f=Math.fround;

// These existing helpers port the generic 573CD0 / 53BFD0 functions, despite
// their historical Sentry names. Do not reuse Sentry's attribute16, type4 ray
// truncation, damage scalar, record or HP receiver for a Pawn box.
export function classifyConquestBoxAttackContacts({requester,contacts,shape,excludePeerSubtype2,probeSegment,resolveEqualDistance,geometryPassesResolved}){
 if(shape?.type!==1||typeof probeSegment!=='function')throw new TypeError('Native type1 box and segment query required');
 if(geometryPassesResolved!==true)return {status:'unknown-primary-critical-query-passes',hits:[],blocked:[],nativeReady:false};
 const filtered=practiceSentryFilterImpacts({requester,contacts,rawMode:1,excludePeerSubtype2});
 const ordered=practiceSentryOrderRayContacts({contacts:filtered,sourcePosition7c:requester.position7c,resolveEqualDistance});
 if(ordered===null)return {status:'unknown-qsort-tie-order',hits:[],blocked:[],nativeReady:false};
 const origin=sentryNativeVector(shape.origin),hits=[],blocked=[];
 for(const contact of ordered){
  const center=sentryNativeVector(contact.actor.position7c);
  if(!Number.isFinite(contact.actor.height6c))throw new TypeError('Actual candidate height6C required');
  center[1]=f(center[1]+f(f(contact.actor.height6c)*f(.5)));
  const result=probeSegment({source:'575BA0(type1)→5F5AD0',coordinateSpace:'native',from:[...origin],to:center,queryMask:0x2107c0,rawQueryFlag:false,shapeType:1,requesterIdentity:requester.identity,candidateIdentity:contact.actor.identity});
  if(result===null)return {status:'unknown-obstruction',hits:[],blocked:[],nativeReady:false};
  if(!result||typeof result.blocked!=='boolean')throw new TypeError('Actual segment result {blocked,point} or explicit null required');
  if(result.blocked)blocked.push({...contact,point:sentryNativeVector(result.point)});else hits.push(contact);
 }
 return {status:'contacts-classified',hits,blocked,nativeReady:false};
}
