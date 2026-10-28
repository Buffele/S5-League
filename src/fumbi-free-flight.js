// F5C830, PE6bea9d8c…: unheld Fumbi velocity before7B0180 resolves contacts.
// ConstructorF5BC10 / live record145B948: gravity-5000, air drag.5.
//1053900(singleton1642F30+8), entries3/23: milliseconds*.001, capped at.1s.
// Collision response, drop placement and home settling are separate contracts.
const f=Math.fround;
export const FUMBI_FREE_FLIGHT=Object.freeze({gravityNative:f(-5000),drag:f(.5),millisecondsToSeconds:f(.001),maximumSeconds:f(.1)});
export function advanceFumbiFreeFlight(velocityNative,deltaMilliseconds){
 if(!Array.isArray(velocityNative)||velocityNative.length!==3||velocityNative.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Finite native Fumbi velocity required');
 if(!Number.isInteger(deltaMilliseconds)||deltaMilliseconds<0||deltaMilliseconds>0xffffffff)throw RangeError('Native uint32 frame milliseconds required');
 const dt=Math.min(f(f(deltaMilliseconds)*FUMBI_FREE_FLIGHT.millisecondsToSeconds),FUMBI_FREE_FLIGHT.maximumSeconds);
 const velocity=velocityNative.map(f);
 velocity[1]=f(f(FUMBI_FREE_FLIGHT.gravityNative*dt)+velocity[1]);
 const drag=f(1-f(FUMBI_FREE_FLIGHT.drag*dt));
 for(let axis=0;axis<3;axis++)velocity[axis]=f(velocity[axis]*drag);
 return {seconds:dt,velocityNative:velocity,displacementNative:velocity.map(n=>f(n*dt))};
}
