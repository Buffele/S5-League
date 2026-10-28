import {Vector3} from 'three';
import {nativeBoxIntersection} from '../tools/s5runtime-arsenal/attack-box-intersection.mjs';
import {STATION2_GOAL_SOURCE,STATION2_GOAL_BODY} from './station2-goal-data.js';

const scale=STATION2_GOAL_SOURCE.scale,f=Math.fround;
const identity=[[1,0,0],[0,1,0],[0,0,1]];
// F5EA30 constructs a fresh, axis-aligned carrier OBB at the current actor
// position. It does not sweep the previous position or test the rendered ball.
// The default unscaled body is measured; changed native actor shapes remain
// an open comparison. Keep this separate from the laser's existing sweep.
export function touchdownCarrierBox(position){
 const center=[position.x,position.y,position.z].map(v=>f(v/scale));
 for(let i=0;i<3;i++)center[i]=f(center[i]+STATION2_GOAL_BODY.centerOffsetNative[i]);
 return {center,halfExtents:[...STATION2_GOAL_BODY.halfExtentsNative],axes:identity.map(axis=>[...axis])};
}
export function touchdownGoalBox(module,box){
 module.group.updateWorldMatrix(true,false);
 const matrix=module.group.matrixWorld,e=matrix.elements;
 const center=box.getCenter(new Vector3()).applyMatrix4(matrix).toArray().map(v=>v/scale);
 const half=box.getSize(new Vector3()).multiplyScalar(.5).toArray(),axes=[],halfExtents=[];
 for(let axis=0;axis<3;axis++){
  const basis=new Vector3(e[axis*4],e[axis*4+1],e[axis*4+2]),length=basis.length();
  if(!(length>0))return null;
  axes.push(basis.divideScalar(length).toArray());halfExtents.push(half[axis]*length/scale);
 }
 return {center,axes,halfExtents};
}
export function touchesTouchdownGoal(module,boxes,position){
 if(!module||module.definition.enabled===false)return false;
 const body=touchdownCarrierBox(position);
 return boxes.some(box=>{const goal=touchdownGoalBox(module,box);return !!goal&&nativeBoxIntersection(goal,body).intersects;});
}
