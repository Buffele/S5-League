// Scalar transcription. JS Number approximates x87/transcendentals.
// This is an explicit selected-baseline model, never a native-parity assertion.
export const SCALAR_POLICY='d3dx9_29-baseline-js-number-v1';
const f=Math.fround,eps=2**-23,minNormal=2**-126;
const add=(a,b)=>f(a+b),mul=(a,b)=>f(a*b),sub=(a,b)=>f(a-b),div=(a,b)=>f(a/b);
function v(value,n){if((!Array.isArray(value)&&!ArrayBuffer.isView(value))||value.length!==n)throw Error('Raw float32 vector required');const a=Array.from(value);if(a.some(x=>typeof x!=='number'||(!Number.isNaN(x)&&!Object.is(f(x),x))))throw Error('Raw float32 values required');return a;}
function scalar(value){if(typeof value!=='number'||(!Number.isNaN(value)&&!Object.is(f(value),value)))throw Error('Raw float32 scalar required');return value;}
const nearOne=value=>value-1>=-eps&&value-1<=eps; //43F7DF inclusive, unordered false
export function floatBits(value){const a=new Float32Array([value]);return new Uint32Array(a.buffer)[0].toString(16).padStart(8,'0');}
export function fromFloatBits(hex){const a=new Uint32Array([Number.parseInt(hex,16)]);return new Float32Array(a.buffer)[0];}

// 100AF90/100B580: each mulss/addss rounds, ((x*x+y*y)+z*z).
export function sourceDot100af90(a,b){a=v(a,3);b=v(b,3);return add(add(mul(a[0],b[0]),mul(a[1],b[1])),mul(a[2],b[2]));}
export function sourceLength100b580(a){a=v(a,3);return f(Math.sqrt(sourceDot100af90(a,a)));}
export function sourceNormalize100b100(a){a=v(a,3);const length=sourceLength100b580(a);if(length===0)return a;const reciprocal=div(1,length);return a.map(x=>mul(x,reciprocal));}
export function sourceCross100b040(a,b){a=v(a,3);b=v(b,3);return [sub(mul(a[1],b[2]),mul(a[2],b[1])),sub(mul(a[2],b[0]),mul(a[0],b[2])),sub(mul(a[0],b[1]),mul(a[1],b[0]))];}
export function sourceAngle100b180(a,b){a=v(a,3);b=v(b,3);const dot=sourceDot100af90(a,b),left=sourceLength100b580(a),right=sourceLength100b580(b),denominator=mul(left,right),cosine=div(dot,denominator),angle=f(Math.acos(cosine));return {angle:Number.isNaN(angle)?0:angle,rawAngle:angle,cosine,denominator,dot,zeroOnNaN:Number.isNaN(angle)};}

// D3DX baseline4438C4, NOT the source100B100 normalizer above.
export function baselineVec3Normalize(a){a=v(a,3);const squared=f((a[0]*a[0]+a[1]*a[1])+a[2]*a[2]);if(nearOne(squared))return a;if(!(squared>minNormal))return [0,0,0];const reciprocal=1/Math.sqrt(squared);return a.map(x=>f(x*reciprocal));}
export function baselineQuaternionRotationAxis(axis,angle){axis=baselineVec3Normalize(axis);scalar(angle);const half=f(angle*.5),sine=f(Math.sin(half)),cosine=f(Math.cos(half));return [...axis.map(x=>f(x*sine)),cosine];}
export function sourceFromTo100e660(from,to){from=v(from,3);to=v(to,3);const axis=sourceCross100b040(from,to),angle=sourceAngle100b180(from,to);return {quaternion:baselineQuaternionRotationAxis(axis,angle.angle),axis,...angle};}

export function baselineQuaternionSlerp(a,b,t){a=v(a,4);b=v(b,4);scalar(t);
 const dot=((a[0]*b[0]+a[2]*b[2])+a[1]*b[1])+a[3]*b[3],sign=dot>=0?1:-1,cosine=dot*sign;
 let first=1-t,second=t,branch='linear';
 if(1-cosine>eps){const sine=Math.sqrt(1-cosine*cosine),angle=f(Math.atan2(sine,f(cosine))),inverseSine=f(1/sine);first=Math.sin(angle*(1-t))*inverseSine;second=Math.sin(angle*t)*inverseSine;branch='trigonometric';}
 second*=sign;return {quaternion:a.map((x,i)=>f(first*x+second*b[i])),branch,dot,sign};
}
export function baselineMatrixRotationQuaternion(q){q=v(q,4);const [x,y,z,w]=q,x2=f(2*x),y2=f(2*y),z2=2*z,xx=f(x2*x),xy=f(y2*x),xz=f(z2*x),yy=f(y2*y),yz=f(z2*y),zz=z2*z,wx=x2*w,wy=y2*w,wz=z2*w,oneMinusXX=1-xx;
 return [f(1-yy-zz),f(xy+wz),f(xz-wy),0,f(xy-wz),f(oneMinusXX-zz),f(yz+wx),0,f(xz+wy),f(yz-wx),f(f(oneMinusXX)-yy),0,0,0,0,1];
}
export function baselineVec3TransformCoord(a,m){a=v(a,3);m=v(m,16);const components=[0,1,2,3].map(i=>f(((a[0]*m[i]+a[1]*m[i+4])+a[2]*m[i+8])+m[i+12])),w=components[3],xyz=components.slice(0,3);if(nearOne(w))return xyz;const reciprocal=1/w;return xyz.map(x=>f(x*reciprocal));}

export function createAnchoringScalarModel({policy}={}){
 if(policy!==SCALAR_POLICY)throw Error('Explicit selected-baseline JS arithmetic policy required');
 return {policy,normalize100b100:({vector})=>sourceNormalize100b100(vector),fromTo100e660:({from,to})=>sourceFromTo100e660(from,to).quaternion,quaternionSlerp:({from,to,ratio})=>baselineQuaternionSlerp(from,to,ratio).quaternion,matrixRotationQuaternion:({quaternion})=>baselineMatrixRotationQuaternion(quaternion),transformCoord:({vector,matrix})=>baselineVec3TransformCoord(vector,matrix),
  provenance:{kind:'s5-explicit-adaptation',source:'Pinned S5Runtime SSE branches + authenticated d3dx9_29 reference baseline; JS Number for x87/transcendentals'},gates:{instructionOrderModelled:true,sourceBranchesModelled:true,selectedBaselineOnly:true,nativeTrigonometryBitExact:false,nativeX87BitExact:false,nativeMxcsrObserved:false,runtimeMathDispatchObserved:false,nativeCompared:false,nativeReady:false}};
}
