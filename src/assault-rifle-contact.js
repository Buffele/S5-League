import {ASSAULT_RIFLE_SOURCE as source} from './assault-rifle-data.js';
export function assaultRifleDamageAtSourceDistance(distance,{power=source.ability.power,additionalPower=0}={}){
 if(![distance,power,additionalPower].every(Number.isFinite)||distance<0)throw new TypeError('Finite Assault Rifle damage inputs required');
 const [start,end,min]=source.dropoff,rate=distance<=start?1:distance>=end?min:1-(distance-start)/(end-start)*(1-min);
 return {damage:(power+additionalPower)*rate,rate,additionalPower,nativeEquipmentPipelineVerified:false};
}
