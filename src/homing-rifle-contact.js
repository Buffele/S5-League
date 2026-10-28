import {HOMING_RIFLE_SOURCE as source} from './homing-rifle-data.js';
export function homingRifleDamageAtSourceDistance(distance,{power=source.ability.power,additionalPower=0}={}){
 if(![distance,power,additionalPower].every(Number.isFinite)||distance<0)throw new TypeError('Finite Homing Rifle damage inputs required');const rate=distance<=4000?1:distance>=12000?.2:1-(distance-4000)/8000*.8;
 return {damage:(power+additionalPower)*rate,rate,randomDamageSource:{min:-3,max:3,probability:100},randomDamageApplied:false,criticalDeclared:false,nativeEquipmentPipelineVerified:false};
}
export function homingRifleSourceAttack(id){const a=source.attacks.find(a=>a.id===id);if(!a)throw new RangeError('Homing Rifle CAttack id1..3 required');return {...a,direction:[...a.direction],projectileOffsets:a.projectileOffsets.map(p=>[...p]),offsetSemanticsVerified:false,homingTrajectoryDeclared:false,nativeReady:false};}
