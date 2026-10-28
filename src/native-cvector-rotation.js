// CVector3::RotateY100B960 / RotateZ100BA20, PE6bea9d8c….
// The degree operand, radians, trig results and SSE products/stores round
// separately. These helpers do not supply a native world aim frame or prove
// the MSVCR120 transcendental implementation for every possible input.
const f=Math.fround,DEGREES_TO_RADIANS=.017453292521994;
function inputs(vector,degrees){
 if(!Array.isArray(vector)||vector.length!==3||vector.some(v=>!Number.isFinite(v)||!Number.isFinite(f(v)))||!Number.isFinite(degrees)||!Number.isFinite(f(degrees)))throw TypeError('Finite float32 CVector3 and rotation required');
 const radians=f(f(degrees)*DEGREES_TO_RADIANS);
 return {v:vector.map(f),s:f(Math.sin(radians)),c:f(Math.cos(radians))};
}
export function nativeCVectorRotateY(vector,degrees){
 const {v:[x,y,z],s,c}=inputs(vector,degrees);
 return [f(f(x*c)+f(z*s)),y,f(f(z*c)-f(x*s))];
}
export function nativeCVectorRotateZ(vector,degrees){
 const {v:[x,y,z],s,c}=inputs(vector,degrees);
 return [f(f(x*c)-f(y*s)),f(f(x*s)+f(y*c)),z];
}
