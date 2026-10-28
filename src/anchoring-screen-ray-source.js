const f=Math.fround;
function float(v,label){if(typeof v!=='number'||!Number.isFinite(v)||!Number.isFinite(f(v)))throw TypeError(`${label}: finite float32 required`);return f(v);}
function matrix(value,label){if(!Array.isArray(value)||value.length!==16)throw TypeError(`${label}: explicit native16 matrix required`);return value.map(x=>float(x,label));}
function integer(v,label){if(!Number.isInteger(v)||v< -0x80000000||v>0x7fffffff)throw TypeError(`${label}: int32 required`);return v;}
function normalize(v){const s=f(f(f(v[0]*v[0])+f(v[1]*v[1]))+f(v[2]*v[2])),length=f(Math.sqrt(s));if(!Number.isFinite(length)||length===0)throw RangeError('Degenerate/overflow native ray unsupported');const inv=f(1/length);return Object.freeze(v.map(x=>float(f(x*inv),'normalized direction')));}
//119EC20 math fragment, camera/matrix binding and msvcr/x87 parity remain unverified.
export function screenRay119ec20FromMatrices({projectionMode,pixelX,pixelY,viewportWidth,viewportHeight,projectionMatrix,inverseViewMatrix,coordinateSpace}={}){
 if(coordinateSpace!=='s5runtime-source'||![0,1].includes(projectionMode))throw TypeError('Explicit source coordinates and native projection mode0/1 required');
 integer(pixelX,'pixelX');integer(pixelY,'pixelY');integer(viewportWidth,'viewportWidth');integer(viewportHeight,'viewportHeight');
 if(viewportWidth<=0||viewportHeight<=0)throw RangeError('Positive viewport dimensions required');
 const p=matrix(projectionMatrix,'projectionMatrix'),m=matrix(inverseViewMatrix,'inverseViewMatrix');
 if(p[0]===0||p[5]===0)throw RangeError('Degenerate projection unsupported');
 const x=float((f(pixelX)*2/f(viewportWidth)-1)/p[0],'rayX'),y=float(-(f(pixelY)*2/f(viewportHeight)-1)/p[5],'rayY');
 const origin=projectionMode===0?[m[12],m[13],m[14]]:[0,1,2].map(i=>float(x*m[i]+y*m[4+i]+m[8+i]+m[12+i],'orthographic origin'));
 const direction=projectionMode===0?[0,1,2].map(i=>float(x*m[i]+y*m[4+i]+m[8+i],'perspective direction')):[m[8],m[9],m[10]];
 return Object.freeze({origin:Object.freeze(origin),direction:normalize(direction),coordinateSpace:'s5runtime-source',sourceFunction:'119EC20',cameraBindingVerified:false,x87BitwiseParityVerified:false,nativeCompared:false});
}
