// The observed copied-client point import passes through bootstrap module0
// to d3dx9_43's SSE implementation. MatrixMultiply is replaced by module0's
// AVX function19032AB0. Row-major D3DX memory, float32 stores at every op.
// Geometry-stage arithmetic only; not a complete native collision solver.
const f=Math.fround;
const finite=value=>Number.isFinite(value)&&Number.isFinite(f(value));
function floats(value,count){
 if(!Array.isArray(value)||value.length!==count||!value.every(finite))throw TypeError(`Explicit finite ${count}-float input required`);
 return value.map(f);
}

// Caller supplies the measured RCPPS(1) estimate for the reference hardware.
// This helper cannot manufacture reciprocal estimates for perspective matrices.
export function nativeAffineCollisionPoint(matrix,point,{reciprocalOneEstimate}={}){
 const m=floats(matrix,16),p=floats(point,3);
 if(m[3]!==0||m[7]!==0||m[11]!==0||m[15]!==1)throw TypeError('Qualified affine matrix required');
 if(!finite(reciprocalOneEstimate)||reciprocalOneEstimate<=0)throw TypeError('Explicit reference reciprocal estimate required');
 const r=f(reciprocalOneEstimate),inverse=f(f(r+r)-f(f(r*1)*r));
 const result=[0,1,2].map(axis=>{
  const xy=f(f(p[1]*m[4+axis])+f(p[0]*m[axis]));
  const zt=f(f(p[2]*m[8+axis])+m[12+axis]);
  return f(inverse*f(xy+zt));
 });
 if(!result.every(Number.isFinite))throw RangeError('Collision transform overflow');
 return result;
}

// Source AVX uses (product0+product2)+(product1+product3), without FMA.
export function nativeCollisionMatrixMultiply(left,right){
 const a=floats(left,16),b=floats(right,16);
 const result=Array.from({length:16},(_,slot)=>{
  const row=Math.floor(slot/4),column=slot%4;
  const products=[0,1,2,3].map(k=>f(a[row*4+k]*b[k*4+column]));
  return f(f(products[0]+products[2])+f(products[1]+products[3]));
 });
 if(!result.every(Number.isFinite))throw RangeError('Collision matrix overflow');
 return result;
}
