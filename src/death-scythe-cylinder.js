// Authenticated PE binding, not an intended-design correction of the Lua.
// MAKECYLINDER(vec3, MAKEVECTOR2(...), radius, ignored) reads the userdata
// through Lua's numeric reader: tag7 -> 0, without invoking a metamethod.
// Evidence: work/death-scythe-native/cylinder-binding.md.
export function deathScytheCylinderShapeFromLua(shape){
 if(shape?.type!=='cylinder'||!Array.isArray(shape.anchor)||shape.anchor.length!==3||!shape.anchor.every(Number.isFinite))throw new TypeError('Expected finite cylinder anchor');
 if(!Array.isArray(shape.direction)||shape.direction.length!==2||!shape.direction.every(Number.isFinite))throw new TypeError('Expected source MAKEVECTOR2 argument');
 if(!Array.isArray(shape.arguments)||shape.arguments.length!==2||!shape.arguments.every(v=>Number.isFinite(v)&&v>0))throw new TypeError('Expected two source numeric arguments after MAKEVECTOR2');
 return {...shape,anchor:[...shape.anchor],direction:[...shape.direction],arguments:[0,shape.arguments[0]],
  nativeLuaBinding:{entry:'0x583a60',numericReader:'0x401560',consumedLuaSlots:[1,2,3],
   vectorUserdataTag:7,coercedHeight:0,ignoredScalarArguments:[shape.arguments[1]],
   sourceArguments:[{type:'MAKEVECTOR2',value:[...shape.direction]},...shape.arguments]}};
}
