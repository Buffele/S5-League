// maingame_ingame.xui, GroupBox_szmode, legacy1024x768.
// Placement of S5 local-center in source center is an explicit S5 binding.
export const SIEGE_SOURCE_POINT_SLOTS=Object.freeze({
 left:Object.freeze({node:'alpha_l_Image',rect:Object.freeze([398,107,66,66])}),
 center:Object.freeze({node:'alpha_c_Image',rect:Object.freeze([479,107,66,66])}),
 right:Object.freeze({node:'alpha_r_Image',rect:Object.freeze([561,107,66,66])}),
});
export function siegeSourcePointSlot(point){
 if(point.sourceUiSlot!==undefined){if(!Object.hasOwn(SIEGE_SOURCE_POINT_SLOTS,point.sourceUiSlot))throw Error('Unknown Siege source UI slot');return point.sourceUiSlot;}
 return point.id==='local-center'?'center':null;
}
