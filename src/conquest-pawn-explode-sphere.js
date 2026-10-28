import {practiceSentryFilterImpacts,practiceSentryOrderRayContacts} from './practice-sentry-impact.js';
import {sentryNativeVector} from './practice-sentry-perception.js';
const f=Math.fround;
// 4AE0A0→1053900 selects constant_float. It is NOT GameTempo1053CF0.
// XML and XBN both contain float33=.5, float47=1 (collision-body proof).
export const CONQUEST_PAWN_EXPLODE_CONSTANTS=Object.freeze({heightFactor33:.5,damageFactor47:1,sourceGetter:0x1053900,nativeRoomSelectionRequired:false});
const finite=(v,name)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw Error('Finite source '+name+' required');return f(v);};
const sub=(a,b)=>a.map((v,i)=>f(v-b[i]));
const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
// Original119C230, including projection float stores and endpoint branches.
export function conquestExplosionPointSegmentDistanceSquared({point,origin,direction}){
 const d=sub(sentryNativeVector(point),sentryNativeVector(origin)),v=sentryNativeVector(direction),projection=dot(d,v);
 if(projection>0){const lengthSquared=dot(v,v);const end=projection>=lengthSquared?v:v.map(x=>f(x*f(projection/lengthSquared)));for(let i=0;i<3;i++)d[i]=f(d[i]-end[i]);}
 return dot(d,d);
}
// 5448C0 type5→5426F0: eligible44, actual capsule80/68/6C, strict
// expanded-radius test, then the source contact point and vertical clamp.
export function queryConquestPawnExplodeSphere({origin,radius,candidates}){
 const center=sentryNativeVector(origin),r=finite(radius,'sphere radius');if(r<=0||!Array.isArray(candidates))throw Error('Positive source sphere radius and actual ordered candidates required');
 const contacts=[];
 for(const actor of candidates){
  if(typeof actor?.eligible44!=='boolean')throw Error('Actual candidate virtual44 required');if(!actor.eligible44)continue;
  const p=sentryNativeVector(actor.position80),feet=sentryNativeVector(actor.position7c),width=finite(actor.width68,'candidate width68'),height=finite(actor.height6c,'candidate height6C');
  if(width<0||height<0)throw Error('Nonnegative source candidate dimensions required');
  const capsuleRadius=f(Math.min(width,height)*CONQUEST_PAWN_EXPLODE_CONSTANTS.heightFactor33),segmentOrigin=[p[0],f(p[1]+capsuleRadius),p[2]],direction=[0,height>width?f(height-width):f(width-height),0];
  const threshold=f(f(r+capsuleRadius)*f(r+capsuleRadius)),distanceSquared=conquestExplosionPointSegmentDistanceSquared({point:center,origin:segmentOrigin,direction});
  if(!(threshold>distanceSquared))continue;
  const ratio=f(r/f(width+r)),d=sub([p[0],center[1],p[2]],center),point=center.map((v,i)=>f(v+f(d[i]*ratio)));
  point[1]=Math.max(Math.min(point[1],f(feet[1]+height)),feet[1]);contacts.push({actor,point,contactFlag16:false});
 }
 return {contacts,shapeType:5,completeQueryWrapperQualified:true,nativeReady:false};
}
// 573CD0 / 53BFD0 /575BA0(type5)→5F5AD0. Unlike type4, the sphere does
// not truncate the ordered list. Actual center endpoints preserve their Y.
export function classifyConquestPawnExplodeContacts({requester,contacts,origin,excludePeerSubtype2,probeSegment,resolveEqualDistance}){
 if(typeof probeSegment!=='function')throw Error('Actual sphere scene segment consumer required');
 const filtered=practiceSentryFilterImpacts({requester,contacts,rawMode:1,excludePeerSubtype2}),ordered=practiceSentryOrderRayContacts({contacts:filtered,sourcePosition7c:requester.position7c,halfFactor:CONQUEST_PAWN_EXPLODE_CONSTANTS.heightFactor33,resolveEqualDistance});
 if(ordered===null)return {status:'unknown-qsort-tie-order',hits:[],blocked:[],nativeReady:false};
 const from=sentryNativeVector(origin),hits=[],blocked=[];
 for(const contact of ordered){
  const to=sentryNativeVector(contact.actor.position7c);to[1]=f(to[1]+f(f(contact.actor.height6c)*CONQUEST_PAWN_EXPLODE_CONSTANTS.heightFactor33));
  const result=probeSegment({source:'575BA0(type5)→5F5AD0',coordinateSpace:'native',from:[...from],to,queryMask:0x2107c0,rawQueryFlag:false,shapeType:5,requesterIdentity:requester.identity,candidateIdentity:contact.actor.identity});
  if(result===null)return {status:'unknown-obstruction',hits:[],blocked:[],nativeReady:false};
  if(typeof result?.blocked!=='boolean')throw Error('Actual sphere scene obstruction result required');
  if(result.blocked)blocked.push({...contact,point:sentryNativeVector(result.point)});else hits.push(contact);
 }
 return {status:'contacts-classified',hits,blocked,nativeReady:false};
}
// CExplosion601870 strict boundaries. The full scalar also includes
// 601C10's team/identity scale and5737D0→CMonster9817E0, qualified separately.
export function conquestPawnExplodeDistanceRate(distance){
 const d=finite(distance,'explosion center distance'),r=f(800);if(d<0)throw Error('Nonnegative explosion distance required');
 if(d>f(r*f(.8)))return f(.25);if(d>f(r*f(.6)))return f(.5);if(d>f(r*f(.4)))return f(.75);return 1;
}
