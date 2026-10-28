import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {SIEGE_POINT3_SOURCE} from './siege-zone-data.js';
// 11B4BF0 tests OBB vs actor[0x48], called by AEF290 and AED920. Native
//149F250 controls the parallel-axis optimization; inclusivity is <=.
export const SIEGE_PARALLEL_THRESHOLD=0.9999989867210388;
const identity=()=>[[1,0,0],[0,1,0],[0,0,1]];
const f=Math.fround,mul=(a,b)=>f(f(a)*f(b)),add=(a,b)=>f(f(a)+f(b));
const dot=(a,b)=>add(add(mul(a[0],b[0]),mul(a[1],b[1])),mul(a[2],b[2]));
const valid=box=>Array.isArray(box?.center)&&box.center.length===3&&box.center.every(Number.isFinite)&&Array.isArray(box.halfExtents)&&box.halfExtents.length===3&&box.halfExtents.every(v=>Number.isFinite(v)&&v>=0)&&Array.isArray(box.axes)&&box.axes.length===3&&box.axes.every(a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite));
export function siegeObbOverlap(a,b){
 if(!valid(a)||!valid(b))throw Error('Two explicit Siege OBBs required');
 const A=a.halfExtents.map(f),B=b.halfExtents.map(f),R=a.axes.map(x=>b.axes.map(y=>dot(x,y))),abs=R.map(row=>row.map(Math.abs));
 const translation=b.center.map((v,i)=>f(f(v)-f(a.center[i]))),t=a.axes.map(axis=>dot(translation,axis));
 for(let i=0;i<3;i++)if(Math.abs(t[i])>add(A[i],add(add(mul(B[2],abs[i][2]),mul(B[1],abs[i][1])),mul(B[0],abs[i][0]))))return false;
 for(let j=0;j<3;j++){
  const distance=Math.abs(add(add(mul(t[0],R[0][j]),mul(t[1],R[1][j])),mul(t[2],R[2][j])));
  const radius=add(B[j],add(add(mul(A[2],abs[2][j]),mul(A[1],abs[1][j])),mul(A[0],abs[0][j])));
  if(distance>radius)return false;
 }
 // Any near-parallel pair bypasses the nine cross tests in the native body.
 if(abs.some(row=>row.some(v=>v>SIEGE_PARALLEL_THRESHOLD)))return true;
 for(let i=0;i<3;i++)for(let j=0;j<3;j++){
  const i1=(i+1)%3,i2=(i+2)%3,j1=(j+1)%3,j2=(j+2)%3;
  const distance=Math.abs(f(mul(t[i2],R[i1][j])-mul(t[i1],R[i2][j])));
  const ra=add(mul(A[i1],abs[i2][j]),mul(A[i2],abs[i1][j]));
  const rb=add(mul(B[j1],abs[i][j2]),mul(B[j2],abs[i][j1]));
  if(distance>add(ra,rb))return false;
 }
 return true;
}
// Local placement anchors the captured core bottom to the supplied S5 floor.
// Native dimensions/relative assist offset are preserved. Basis identity is
// declared local because the historical capture omitted all nine axis floats.
export function siegePoint3ZonesAt({id,x,y,z},scale=SCN_SCENE_SCALE){
 if(typeof id!=='string'||![x,y,z,scale].every(Number.isFinite)||scale<=0)throw Error('Explicit Siege placement and positive scale required');
 const source=SIEGE_POINT3_SOURCE,coreCenter=[x,y+source.coreHalfExtents[1]*scale,z];
 const center=source.assistCenter.map((v,i)=>coreCenter[i]+(v-source.coreCenter[i])*scale);
 return {id,x,y,z,core:{center:coreCenter,halfExtents:source.coreHalfExtents.map(v=>v*scale),axes:identity()},assist:{center,halfExtents:source.assistHalfExtents.map(v=>v*scale),axes:identity()},source:'native-point3-dimensions-local-placement-and-basis'};
}
export function siegeActorObb(actor,scale=SCN_SCENE_SCALE){
 const half=SIEGE_POINT3_SOURCE.actorHalfExtents.map(v=>v*scale),yaw=actor.facing||0,c=Math.cos(yaw),s=Math.sin(yaw);
 return {center:[actor.position.x,actor.position.y+half[1],actor.position.z],halfExtents:half,axes:[[c,0,-s],[0,1,0],[s,0,c]]};
}
export function siegeZonePresence(actor,zone){const obb=siegeActorObb(actor);return {core:siegeObbOverlap(zone.core,obb),assist:siegeObbOverlap(zone.assist,obb)};}
