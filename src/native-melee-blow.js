import {SCN_SCENE_SCALE} from './s5runtime-coordinates.js';

// CAttack::AddBlowCondition 570320 -> 54cb50 stores horizontal at+4c,
// vertical at+58, extra horizontal+64 and rate+70 initially zero.
// CBlowCondition::Enter 54cde0 computes horizontal+extra+horizontal*rate,
// multiplies the record direction, then OVERWRITES Y with the vertical value.
// Source proof: work/melee-batch-5/blow-native.md. This exposes magnitudes,
// not the native record direction, equipment lookup or condition lifecycle.
export function nativeBlowComponents(parameters,{additionalHorizontal=0,horizontalRate=0,scale=SCN_SCENE_SCALE}={}){
 if(!Array.isArray(parameters)||parameters.length!==2||!parameters.every(Number.isFinite))
  throw new TypeError('Two finite native blow parameters required');
 if(![additionalHorizontal,horizontalRate,scale].every(Number.isFinite)||scale<=0)
  throw new TypeError('Finite blow modifiers and positive scale required');
 const horizontal=Math.fround(parameters[0]),vertical=Math.fround(parameters[1]);
 const sum=Math.fround(horizontal+Math.fround(additionalHorizontal));
 const adjusted=Math.fround(sum+Math.fround(horizontal*Math.fround(horizontalRate)));
 return {pushSpeed:adjusted*scale,liftSpeed:vertical*scale};
}
