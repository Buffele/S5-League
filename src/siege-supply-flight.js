// Pinned client7D7720 /7D7DC0 /7D8140. Registry floats3/23/124 observed
// in private native copies; raw literal gravity/impulse/radii read from PE.
const f=Math.fround;
export const SIEGE_SUPPLY_FLIGHT=Object.freeze({gravityNative:-4000,drag:.5,verticalNative:3000,horizontalNative:500,oddMultiplier:f(2.3),radiusNative:10,millisecondsToSeconds:f(.001),maximumSeconds:f(.1),contactFactor:1.5,tangentialDrag:3,queueMilliseconds:180});
export function supplyLaunchVelocity(pickupId,anglesDegrees){
 if(!Number.isSafeInteger(pickupId)||pickupId<1||!Array.isArray(anglesDegrees)||anglesDegrees.length!==2||anglesDegrees.some(v=>!Number.isInteger(v)||v<0||v>360))throw Error('Explicit supply identity and two integer launch angles required');
 const amplitude=f(SIEGE_SUPPLY_FLIGHT.horizontalNative*(pickupId%2?SIEGE_SUPPLY_FLIGHT.oddMultiplier:1));
 const radians=anglesDegrees.map(v=>f(v*0.017453292521994));
 //7D7A67 -> FE644E imports MSVCR120.cos;7D7AE6 -> FE6454 imports sin.
 return [f(amplitude*f(Math.cos(radians[0]))),f(SIEGE_SUPPLY_FLIGHT.verticalNative),f(amplitude*f(Math.sin(radians[1])))];
}
export function advanceSupplyVelocity(velocityNative,milliseconds){
 if(!Array.isArray(velocityNative)||velocityNative.length!==3||velocityNative.some(v=>!Number.isFinite(v)||!Number.isFinite(f(v))))throw Error('Finite native supply velocity required');
 if(!Number.isInteger(milliseconds)||milliseconds<0||milliseconds>0xffffffff)throw Error('Native frame milliseconds required');
 const seconds=Math.min(f(f(milliseconds)*SIEGE_SUPPLY_FLIGHT.millisecondsToSeconds),SIEGE_SUPPLY_FLIGHT.maximumSeconds),velocity=velocityNative.map(f);
 velocity[1]=f(velocity[1]+f(SIEGE_SUPPLY_FLIGHT.gravityNative*seconds));
 const drag=f(1-f(SIEGE_SUPPLY_FLIGHT.drag*seconds));
 for(let i=0;i<3;i++)velocity[i]=f(velocity[i]*drag);
 return {seconds,velocityNative:velocity,displacementNative:velocity.map(v=>f(v*seconds))};
}
export function supplyContactVelocity(velocityNative,normal,seconds){
 if(!Array.isArray(normal)||normal.length!==3||normal.some(v=>!Number.isFinite(v))||!Number.isFinite(seconds)||seconds<0)throw Error('Finite supply contact required');
 const n=normal.map(f),v=velocityNative.map(f),dot=f(f(f(v[0]*n[0])+f(v[1]*n[1]))+f(v[2]*n[2]));
 const component=n.map(value=>f(value*dot)),tangent=v.map((value,i)=>f(value-component[i]));
 const normalFactor=f(1-SIEGE_SUPPLY_FLIGHT.contactFactor),tangentFactor=f(1-f(SIEGE_SUPPLY_FLIGHT.tangentialDrag*seconds));
 return tangent.map((value,i)=>f(f(value*tangentFactor)-f(component[i]*normalFactor)));
}
