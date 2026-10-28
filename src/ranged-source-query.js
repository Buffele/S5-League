import {RANGED_SOURCE_QUERY_DATA}from './ranged-source-query-data.js';
import {queryS5RuntimeShieldSegment}from './s5runtime-skill-shield-contact.js';
const vector=(v,label)=>{if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw Error('Explicit finite '+label+' vector required');return [...v];};
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
export const RANGED_SOURCE_QUERY_WEAPONS=Object.freeze(Object.keys(RANGED_SOURCE_QUERY_DATA));
export function rangedSourceQueryProfile(weaponKey,{attackId=1,expectedFunction,expectedBodySha256}={}){
 const source=Object.hasOwn(RANGED_SOURCE_QUERY_DATA,weaponKey)&&RANGED_SOURCE_QUERY_DATA[weaponKey];
 if(!source)throw Error('Unsupported authenticated ranged source weapon');
 if(!source.attackIds.includes(attackId))throw Error('Unsupported source attack identity');
 if(expectedFunction!==undefined&&expectedFunction!==source.sourceFunction)throw Error('Source function identity mismatch');
 if(expectedBodySha256!==undefined&&expectedBodySha256!==source.bodySha256)throw Error('Source function SHA mismatch');
 return{...source,attackIds:[...source.attackIds],attackId,attackVariable:source.sourceAttackVariable??'Attack'+attackId,...(source.attackIdKind==='one-based-pattern-index'?{sourceIteration:attackId}:{}),nativeReady:false,shieldGeometryNativeVerified:false,damagePipelineNativeVerified:false};
}
// S5 bridge: caller supplies its current world cutoff and actor query remains
// downstream. No actor volumes, native epsilon, damage or class ordering guessed.
export function clipRangedSourceContactSegment({weaponKey,attackId=1,expectedFunction,expectedBodySha256,from,to,worldContact=null,shields=[],requesterSlot1c4,nativeContext,coordinateSpace,queryShield=queryS5RuntimeShieldSegment}={}){
 const source=rangedSourceQueryProfile(weaponKey,{attackId,expectedFunction,expectedBodySha256});
 if(typeof coordinateSpace!=='string'||!coordinateSpace.trim())throw Error('Explicit common coordinate space required');
 if(typeof requesterSlot1c4!=='boolean')throw Error('Explicit raw requester slot1C4 boolean required');
 if(!Array.isArray(shields)||typeof queryShield!=='function')throw Error('Shield candidates and query callback required');
 const origin=vector(from,'origin'),originalEnd=vector(to,'endpoint'),range=distance(origin,originalEnd);
 let end=[...originalEnd],cutoffDistance=range,blockedByShield=false,shieldId=null;
 if(worldContact?.hit){const p=vector(worldContact.point,'world cutoff'),d=distance(origin,p);if(d<=cutoffDistance){end=p;cutoffDistance=d;}}
 const reports=[];
 for(const shield of shields){
  if(typeof shield.ownerSlot1c4!=='boolean')throw Error('Explicit raw Shield owner slot1C4 boolean required');
  const report=queryShield({from:[...origin],to:[...end],worldTriangles:shield.worldTriangles,triangles:shield.worldTriangles,sphere:shield.worldSphere,queryMask:source.queryMask,ownerSlot1c4:shield.ownerSlot1c4,requesterSlot1c4,shieldId:shield.shieldId,nativeContext});
  reports.push(report);
  if(report?.hit){const point=vector(report.point,'Shield hit'),d=distance(origin,point);if(d<cutoffDistance){end=point;cutoffDistance=d;blockedByShield=true;shieldId=shield.shieldId;}}
 }
 const sourceTriangleAlgorithmApplied=queryShield!==queryS5RuntimeShieldSegment&&reports.length>0&&reports.every(r=>r.nativeTriangleAlgorithmVerified===true);
 return{from:origin,to:end,originalEnd,cutoffDistance,originalDistance:range,blockedByShield,shieldId,coordinateSpace,sourceQuery:source,shieldReports:reports,sourceTriangleAlgorithmApplied,nativeReady:false,geometryQualification:sourceTriangleAlgorithmApplied?'source triangle algorithm/broadphase; native comparison and x87 parity unverified; downstream actor/damage unchanged':'source query classification and Shield selection; geometric preview; downstream actor/damage unchanged'};
}
