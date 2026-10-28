import {ConquestMonsterActor} from './conquest-monster-actor.js';
import {ConquestMonsterAttackState} from './conquest-monster-state-manager.js';
import {conquestNativeMoveVector} from './conquest-monster-movement.js';
const f=Math.fround;

// A28D60 copies state+D4 before clearing local Y. 100B100/100B580 use
// (X*X + Y*Y) + Z*Z in float32, then a float32 sqrt and reciprocal.
// A zero length leaves the copied vector unchanged; no default heading exists.
export function conquestPawnAttackFacingVector(rememberedDirection){
 const value=conquestNativeMoveVector(rememberedDirection),direction={x:value.x,y:0,z:value.z};
 const length=f(Math.sqrt(f(f(f(direction.x*direction.x)+f(direction.y*direction.y))+f(direction.z*direction.z))));
 if(length!==0){const inverse=f(1/length);for(const key of ['x','y','z'])direction[key]=f(direction[key]*inverse);}
 return direction;
}

// Port for ConquestPawnRuntime.attackPorts.faceAttackDirection. The caller
// retains runtime lifecycle; this checks the actual state/actor ownership.
// Actor97ED10 preserves the prior facing when the resulting vector is zero.
export function applyConquestPawnAttackFacing(state,{actor}={}){
 if(!(actor instanceof ConquestMonsterActor)||actor.model.monsterKey!==1003||!(state instanceof ConquestMonsterAttackState)||state.actor!==actor)throw Error('Actual owned Pawn attack state and actor required');
 const direction=conquestPawnAttackFacingVector(state.directionNative);
 const facingUpdated=actor.setNativeFacingDirection(direction);
 return Object.freeze({directionNative:Object.freeze(direction),facingUpdated,rememberedDirectionUnchanged:true,sourceWrapperQualified:true,nativeReady:false});
}
