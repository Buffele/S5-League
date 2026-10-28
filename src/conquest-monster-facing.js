const f=Math.fround;
const finite=v=>Number.isFinite(v)&&Number.isFinite(f(v));
// 97EC00 turns source -Z into the actor's protected facing. Near +Z it uses
// the exact native half-turn, avoiding the zero cross-product singularity.
export const CONQUEST_FACING_THRESHOLDS=Object.freeze({lower:0.9999899864196777,upper:1.0000009536743164});
export function conquestFacingQuaternion(direction){
 if(!finite(direction?.x)||!finite(direction?.y)||!finite(direction?.z))throw Error('Finite native monster facing required');
 const x=f(direction.x),y=f(direction.y),z=f(direction.z);
 if(x===0&&y===0&&z===0)throw Error('Nonzero native monster facing required');
 if(z>CONQUEST_FACING_THRESHOLDS.lower&&z<CONQUEST_FACING_THRESHOLDS.upper)return [0,1,0,0];
 const length=f(Math.sqrt(f(f(f(x*x)+f(y*y))+f(z*z))));
 let angle=f(Math.acos(f(f(-z)/f(length))));if(Number.isNaN(angle))angle=0; // 100B180/_isnan
 const ax=f(f(0*z)-f(-1*y)),ay=f(f(-1*x)-f(0*z)),az=f(f(0*y)-f(0*x));
 // Scalar D3DX29 normalization retains an already-unit vector within FLT_EPS.
 // Retain each float32 arithmetic stage; avoid transient map/entry arrays.
 const squared=f(ax*ax+ay*ay+az*az),error=squared-1;
 let nx=ax,ny=ay,nz=az;
 if(error< -1.1920928955078125e-7||error>1.1920928955078125e-7){
  if(squared>1.1754943508222875e-38){const length=Math.sqrt(squared);nx=f(ax/length);ny=f(ay/length);nz=f(az/length);}
  else{nx=0;ny=0;nz=0;}
 }
 const half=f(angle*.5),sine=f(Math.sin(half)),cosine=f(Math.cos(half));
 return [f(nx*sine),f(ny*sine),f(nz*sine),cosine];
}
