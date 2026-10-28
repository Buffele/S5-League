import {Vector3} from 'three';
import {BURST_SHOTGUN_SOURCE as source} from './burst-shotgun-data.js';
import {createNativeMeleePush} from './native-melee-push.js';
export function burstShotgunRayDirections(forward,{right:aimRight}={}){
 const f=new Vector3().copy(forward);if(![f.x,f.y,f.z].every(Number.isFinite)||f.lengthSq()===0)throw new TypeError('Finite nonzero Burst Shotgun forward required');f.normalize();
 const right=new Vector3().crossVectors(f,new Vector3(0,1,0));
 if(right.lengthSq()<1e-12){if(!aimRight)throw new RangeError('Vertical Burst Shotgun forward needs explicit aim basis');right.copy(aimRight);right.addScaledVector(f,-right.dot(f));if(![right.x,right.y,right.z].every(Number.isFinite)||right.lengthSq()<1e-12)throw new TypeError('Valid perpendicular Burst Shotgun aim basis required');}right.normalize();
 const up=new Vector3().crossVectors(right,f).normalize();
 return source.projectiles.map(p=>{const [x,y,z]=p.direction;return {id:p.id,sourceDeclaration:p,direction:f.clone().multiplyScalar(-z).addScaledVector(right,x).addScaledVector(up,y).normalize()};});
}
export function burstShotgunDamageAtSourceDistance(distance,{power=source.ability.power,additionalPower=0}={}){
 if(![distance,power,additionalPower].every(Number.isFinite)||distance<0)throw new TypeError('Finite Burst Shotgun damage inputs required');
 const rate=distance<=4000?1:distance>=8000?.2:1-(distance-4000)/4000*.8;
 return {damage:(power*.25+additionalPower)*rate,rate,additionalPower,nativeEquipmentPipelineVerified:false};
}
// Each CAttack owns this declaration. Do not aggregate four Push conditions
// or assume the shot direction equals the native damage-record direction.
export function createBurstShotgunPush(projectileIndex,recordDirection,nativePolicy){
 const p=source.projectiles[projectileIndex];if(!Number.isInteger(projectileIndex)||!p)throw new RangeError('Burst Shotgun source projectile index required');
 return createNativeMeleePush(p.push,recordDirection,nativePolicy);
}
