const scales=[1,2,1,3,2,1,3,2,3,2,2,3,2,2,2,1,3,3,3,3];
const rotations=[90,45,180,45,225,270,315,90,180,0,135,90,180,270,315,0,0,135,225,270];
// Independent declarations only: no assumed factory period, consumption,
// camera/body state transitions, or replacement for missing lower TR031.
export function turretSourceShot(index,{installed=false,oneShotTime,power=12,additionalPower=0}={}){
 if(!Number.isInteger(index)||index<0||index>=20)throw new RangeError('Turret source index0..19 required');
 if(typeof installed!=='boolean'||![oneShotTime,power,additionalPower].every(Number.isFinite)||oneShotTime<0)throw new TypeError('Explicit finite Turret OneShotTime and mode required');
 return {index,installed,atMs:index*oneShotTime,power:power*(installed?1:.5)+additionalPower,rotateYDegrees:(installed?.2:.9)*scales[index],rotateZDegrees:rotations[index],attribute:installed?'ATTACKATTRIB_TURRET_INSTALL':'ATTACKATTRIB_TURRET_NORMAL',critical:[installed?1.9:2.5,0],dropoff:installed?[4000,24000,.2]:[4000,8000,.2],consumeAmmo:null,nativeReady:false};
}
export function turretDamageAtSourceDistance(distance,{installed=false,power=12,additionalPower=0}={}){
 if(typeof installed!=='boolean'||![distance,power,additionalPower].every(Number.isFinite)||distance<0)throw new TypeError('Finite Turret damage inputs required');
 const end=installed?24000:8000,rate=distance<=4000?1:distance>=end?.2:1-(distance-4000)/(end-4000)*.8;
 return {damage:(power*(installed?1:.5)+additionalPower)*rate,rate,nativeEquipmentPipelineVerified:false};
}
