import {assertConquestKingAttackDeclaration} from './conquest-king-attack.js';
import {practiceSentryFilterImpacts,practiceSentryOrderRayContacts} from './practice-sentry-impact.js';
import {sentryNativeVector} from './practice-sentry-perception.js';
const f=Math.fround,vec=v=>sentryNativeVector(v).map(f);
// Authenticated XML/XBN constant_float33, selected by1053900. This is not
// GameTempo33; the existing collision-body source proof qualifies .5.
export const CONQUEST_KING_CYLINDER_CONSTANTS=Object.freeze({halfFactor33:.5,sourceGetter:0x1053900,nativeRoomSelectionRequired:false,nativeReady:false});
const dimension=(v,name)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v))||v<0)throw Error('Nonnegative King cylinder '+name+' required');return f(v);};
export function conquestKingWorldAttackCylinder({attack,position7c,direction8c}={}){
 assertConquestKingAttackDeclaration(attack);if(attack.shapeType!==2)throw Error('Actual King CYLINDER2 declaration required');const p=vec(position7c),d=vec(direction8c);
 if(d[1]!==0||Math.abs(Math.hypot(...d)-1)>1e-5)throw Error('Actual normalized horizontal King8C required');
 const c=attack.cylinder;if(c.origin[0]!==0||c.origin[2]!==0)throw Error('Only authenticated King vertical cylinder origin supported');
 return {type:2,origin:p.map((n,i)=>f(n+c.origin[i])),height:c.height,radius:c.radius,coordinateSpace:'native',sourceWorldTransform:0x5f5790,orientDirection280:true,placeOrigin281:true,nativeReady:false};
}
// Full5403A0 consumes eligible44 + position7C, width68, height6C. It never
// uses80/AABB/OBB: strict radial and vertical comparisons remain distinct.
export function queryConquestKingCylinderGeometry({shape,candidates}={}){
 if(shape?.type!==2||!Array.isArray(candidates))throw Error('Actual King type2 cylinder and ordered candidates required');const origin=vec(shape.origin),radius=dimension(shape.radius,'radius'),height=dimension(shape.height,'height'),factor=CONQUEST_KING_CYLINDER_CONSTANTS.halfFactor33,contacts=[];
 if(radius<=0||height<=0)throw Error('Positive King cylinder dimensions required');
 for(const actor of candidates){if(!actor||actor.identity===undefined||typeof actor.eligible44!=='boolean')throw Error('Actual cylinder actor identity/eligible44 required');if(!actor.eligible44)continue;
  const p=vec(actor.position7c),width=dimension(actor.width68,'candidate68'),targetHeight=dimension(actor.height6c,'candidate6C'),dx=f(p[0]-origin[0]),dz=f(p[2]-origin[2]),distance=f(Math.sqrt(f(f(dx*dx)+f(dz*dz))));
  if(!(f(f(width*factor)+radius)>distance))continue;
  const half=f(height*factor);if(!(f(origin[1]+half)>p[1]&&f(p[1]+targetHeight)>f(origin[1]-half)))continue;
  const ratio=f(radius/f(width+radius)),point=[f(origin[0]+f(dx*ratio)),Math.max(p[1],Math.min(f(p[1]+targetHeight),origin[1])),f(origin[2]+f(dz*ratio))];contacts.push({actor,point,flag16:0});
 }
 return {contacts,primaryQueries:1,adjustedQueries:0,geometryPassesResolved:false,completeQueryWrapperQualified:true,candidateProducerQualified:false,numericParity:'original5403A0 bounded scalar CPU cases',sourceQuery:0x5403a0,nativeReady:false};
}
//575BA0 non-ray branch: generic filter/order, then5F5AD0 straight segment
//to actual target7C+height6C*.5, all contacts retained rather than ray-first.
export function classifyConquestKingAttackContacts({requester,contacts,shape,excludePeerSubtype2,probeSegment,resolveEqualDistance,geometryPassesResolved}={}){
 if(shape?.type!==2||typeof probeSegment!=='function')throw Error('Actual King cylinder2 and scene segment owner required');if(geometryPassesResolved!==true)return {status:'unknown-primary-critical-query-passes',hits:[],blocked:[],nativeReady:false};
 const filtered=practiceSentryFilterImpacts({requester,contacts,rawMode:1,excludePeerSubtype2}),ordered=practiceSentryOrderRayContacts({contacts:filtered,sourcePosition7c:requester.position7c,resolveEqualDistance});if(ordered===null)return {status:'unknown-qsort-tie-order',hits:[],blocked:[],nativeReady:false};
 const origin=vec(shape.origin),hits=[],blocked=[];
 for(const contact of ordered){const center=vec(contact.actor.position7c);if(!Number.isFinite(contact.actor.height6c))throw Error('Actual cylinder target height6C required');center[1]=f(center[1]+f(f(contact.actor.height6c)*CONQUEST_KING_CYLINDER_CONSTANTS.halfFactor33));const result=probeSegment({source:'575BA0(type2)→5F5AD0',coordinateSpace:'native',from:[...origin],to:center,queryMask:0x2107c0,rawQueryFlag:false,shapeType:2,requesterIdentity:requester.identity,candidateIdentity:contact.actor.identity});if(result===null)return {status:'unknown-obstruction',hits:[],blocked:[],nativeReady:false};if(typeof result?.blocked!=='boolean')throw Error('Actual current cylinder obstruction result required');if(result.blocked)blocked.push({...contact,point:vec(result.point)});else hits.push(contact);}
 return {status:'contacts-classified',hits,blocked,nativeReady:false};
}
