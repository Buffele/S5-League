import {HANDGUN_SOURCE} from './handgun-data.js';
import {createNativeMeleePush,advanceNativeMeleePush} from './native-melee-push.js';
import {nativePushActorWrites} from './native-push-actor.js';
// Reaction inputs must come from the accepted native hit record and registry.
// The shot's direction is NOT automatically the native record direction.
export function createHandgunPush(recordDirection,nativePolicy){return createNativeMeleePush(HANDGUN_SOURCE.push,recordDirection,nativePolicy);}
export function advanceHandgunPush(state,deltaMs,{actorAcceptsUpdate,actorPolicy}={}){
 if(typeof actorAcceptsUpdate!=='boolean')throw new TypeError('Explicit Hand Gun actor acceptance required');
 const result=advanceNativeMeleePush(state,deltaMs,{actorAcceptsUpdate});
 const d=result.displacement;
 const writes=nativePushActorWrites([d.x/state.scale,d.y/state.scale,d.z/state.scale],actorPolicy);
 return {...result,actorWrites:writes,coordinateSpace:'native-source',nativeReady:false};
}
// Damage expression's raw power and AdditionalPower are retained separately.
// No equipment precedence or critical/armor pipeline is inferred here.
export function handgunDamageAtSourceDistance(distance,{power=HANDGUN_SOURCE.ability.power,additionalPower=0}={}){
 if(![distance,power,additionalPower].every(Number.isFinite)||distance<0)throw new TypeError('Finite Hand Gun damage inputs required');
 const rate=distance<=4000?1:distance>=8000?.2:1-(distance-4000)/4000*.8;
 return {damage:(power+additionalPower)*rate,rate,additionalPower,nativeEquipmentPipelineVerified:false};
}
