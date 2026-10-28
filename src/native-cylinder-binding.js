// MAKECYLINDER's Lua thunk 0x583a60 reads slots 1 (vec3), 2 and 3
// (floats) only. Additional Lua arguments are ignored, not an overload.
// Evidence: work/melee-batch-4/sigma-cylinder-native/README.md.
import {worldMeleeCylinder,meleeCylinderContact} from './native-melee.js';

export function nativeCylinderShapeFromLua(shape){
 if(shape?.type!=='cylinder')throw new TypeError('Expected cylinder shape');
 if(!Array.isArray(shape.anchor)||shape.anchor.length!==3||!shape.anchor.every(Number.isFinite))throw new TypeError('Finite cylinder anchor vec3 required');
 if(!Array.isArray(shape.arguments)||shape.arguments.length<2)throw new TypeError('At least two MAKECYLINDER scalar arguments required');
 const consumed=shape.arguments.slice(0,2);
 if(!consumed.every(v=>Number.isFinite(v)&&v>0))throw new RangeError('Positive finite cylinder height and radius required');
 return {...shape,anchor:[...shape.anchor],arguments:consumed,
  nativeLuaBinding:{entry:'0x583a60',consumedLuaSlots:[1,2,3],ignoredScalarArguments:shape.arguments.slice(2)}};
}

export function worldMeleeLuaCylinder(shape,actor,scale){
 return worldMeleeCylinder(nativeCylinderShapeFromLua(shape),actor,scale);
}

export function meleeLuaCylinderContact(shape,actor,target,options){
 return meleeCylinderContact(nativeCylinderShapeFromLua(shape),actor,target,options);
}
