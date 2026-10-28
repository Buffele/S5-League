import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';
import {SIEGE_POINT3_SOURCE} from './siege-zone-data.js';

// Item virtual0C (7D8490) calls53E240 with its solver position and radius100.
// 53E240 builds a vertical segment from actor virtual7C/68/6C, using float21
// (.5), then requires squared distance119C230 STRICTLY below (100+radius)^2.
// Dimensions here are explicit inputs, not inferred from an attack or a mesh.
const f=Math.fround;
export function siegeSupplyCapsuleOverlap({position,width,height},itemPosition){
 if(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite)||
    !Array.isArray(itemPosition)||itemPosition.length!==3||!itemPosition.every(Number.isFinite)||
    !Number.isFinite(width)||!Number.isFinite(height)||width<0||height<0)throw Error('Explicit finite Siege pickup body required');
 const w=f(width),h=f(height),radius=f(.5*Math.min(w,h)),length=f(Math.abs(f(h-w)));
 const origin=[f(position[0]),f(f(position[1])+radius),f(position[2])];
 const delta=itemPosition.map((value,i)=>f(f(value)-origin[i]));
 // The source clamps projection onto its segment, including a zero-length
 // segment. SSE products/subtractions and the returned distance store round.
 const projection=f(delta[1]*length),lengthSquared=f(length*length);
 if(projection>0){
  const along=projection>=lengthSquared?length:f(f(projection/lengthSquared)*length);
  delta[1]=f(delta[1]-along);
 }
 const squares=delta.map(v=>f(v*v));
 const distanceSquared=f(f(squares[0]+squares[1])+squares[2]);
 const reach=f(100+radius),reachSquared=f(reach*reach);
 return distanceSquared<reachSquared;
}

export function siegeSupplyContact(actor,itemPosition){
 const scale=SCN_SCENE_SCALE;
 // Current ordinary S5 avatars use the captured140x320 body. This adapter
 // still needs a live comparison of native virtual68/6C in altered states;
 // the capture OBB does not establish every dynamic getter/state admission.
 return siegeSupplyCapsuleOverlap({position:['x','y','z'].map(k=>actor.position[k]/scale),
  width:SIEGE_POINT3_SOURCE.actorHalfExtents[0]*2,height:SIEGE_POINT3_SOURCE.actorHalfExtents[1]*2},
  itemPosition.map(v=>v/scale));
}
