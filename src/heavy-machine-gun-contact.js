import {Vector3} from 'three';
import {HEAVY_MACHINE_GUN_SOURCE as source} from './heavy-machine-gun-data.js';
import {nativeCVectorRotateY,nativeCVectorRotateZ} from './native-cvector-rotation.js';
// Local rotation signs/order and float stores come from the named native
// CVector3 methods. Conversion to the current S5 aim frame stays separate.
export function heavyMachineGunSourceShot(index,{oneShotTime,power=source.ability.power,additionalPower=0}={}){
 if(!Number.isInteger(index)||index<0||index>=20)throw new RangeError('Heavy Machine Gun source index0..19 required');
 if(![oneShotTime,power,additionalPower].every(Number.isFinite)||oneShotTime<0)throw new TypeError('Explicit finite Heavy Machine Gun OneShotTime required');
 return {index,atMs:index*oneShotTime,power:power+additionalPower,rotateYDegrees:.9*source.sourceYScales[index],rotateZDegrees:source.sourceZDegrees[index],part:['LOWER','MIDDLE','UPPER'][source.sourceYScales[index]-1],critical:[2.5,0],consumeAmmo:null,nativeReady:false};
}
export function heavyMachineGunDamageAtSourceDistance(distance,{power=source.ability.power,additionalPower=0}={}){
 if(![distance,power,additionalPower].every(Number.isFinite)||distance<0)throw new TypeError('Finite Heavy Machine Gun damage inputs required');
 const rate=distance<=3000?1:distance>=6000?.2:1-(distance-3000)/3000*.8;
 return {damage:(power+additionalPower)*rate,rate,nativeEquipmentPipelineVerified:false};
}
export function heavyMachineGunSourceDirection(index){
 const declaration=heavyMachineGunSourceShot(index,{oneShotTime:0});
 return nativeCVectorRotateZ(nativeCVectorRotateY([0,0,-1],declaration.rotateYDegrees),declaration.rotateZDegrees);
}
export function heavyMachineGunArenaDirection(index,forward,{right:aimRight}={}){
 const local=heavyMachineGunSourceDirection(index),f=new Vector3().copy(forward);if(![f.x,f.y,f.z].every(Number.isFinite)||f.lengthSq()===0)throw new TypeError('Finite Heavy Machine Gun forward required');f.normalize();
 const right=new Vector3().crossVectors(f,new Vector3(0,1,0));if(right.lengthSq()<1e-12){if(!aimRight)throw new RangeError('Vertical Heavy Machine Gun aim needs explicit right');right.copy(aimRight).addScaledVector(f,-f.dot(aimRight));}if(right.lengthSq()<1e-12)throw new RangeError('Perpendicular Heavy Machine Gun right required');right.normalize();
 const up=new Vector3().crossVectors(right,f).normalize();
 return {direction:f.multiplyScalar(-local[2]).addScaledVector(right,local[0]).addScaledVector(up,local[1]).normalize(),sourceLocalDirection:local,
  policy:'source-local-CVector3-rotations-S5-aim-frame-unverified',sourceRotationArithmeticCompared:true,nativeCrtTrigCompared:false,nativeWorldAimFrameCompared:false,nativeReady:false};
}
