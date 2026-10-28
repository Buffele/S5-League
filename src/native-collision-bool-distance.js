import {NATIVE_BOOL_DISTANCE_PROGRAM as source} from './native-collision-bool-program.js';
import {nativePointTriangleDistanceSquared} from './native-post-move-query.js';
import {tryPreparedNativeBooleanDistance} from './native-collision-bool-wasm.js';
const f=Math.fround,table=new Map(Object.values(source.programs).flat().map(row=>[row[0],row]));
const constants=new Map(Object.entries(source.constants).map(([address,entry])=>[Number(address),Uint8Array.from(entry.hex.match(/../g),v=>parseInt(v,16))]));
const xyz=v=>{if(!Array.isArray(v)||v.length!==3||v.some(x=>!Number.isFinite(x)||!Number.isFinite(f(x))))throw Error('Finite native XYZ required');return v.map(f);};
export const NATIVE_BOOL_TRIANGLE_THRESHOLD=9.999999960041972e-13;

// Bounded interpreter for only128BF40/128B500. This retains their source
// branch/float-store order, including degeneracies, rather than substituting
// the closest-ray triangle test or a generic segment intersection routine.
// x87 arithmetic is explicitly host-selected; this JS53 profile is not an
// observation of the client's extended-precision control word.
export function nativeBooleanSegmentTriangleDistance({origin,direction,packet,arithmeticProfile}={}){
 // Capture public input getters once. Unsupported profiles, tracing, reentrancy
 // and unavailable acceleration retain the complete source interpreter below.
 const input={origin,direction,packet,arithmeticProfile};
 return tryPreparedNativeBooleanDistance(input)??interpretNativeBooleanSegmentTriangleDistance(input);
}

export function interpretNativeBooleanSegmentTriangleDistance({origin,direction,packet,arithmeticProfile}={}){
 if(typeof arithmeticProfile?.roundX87!=='function'||!arithmeticProfile.source?.trim())throw Error('Explicit bool-distance x87 arithmetic profile required');
 const q=arithmeticProfile.roundX87,buffer=new ArrayBuffer(0x10000),mem=new DataView(buffer),regs={eax:0,ebx:0,ecx:0,edx:0,esi:0,edi:0,ebp:0,esp:0x8000},xmm={},fp=[];
 let cf=false,zf=false,ip=0x128bf40,steps=0;const sourceTrace=arithmeticProfile.captureSourceTrace===true?[]:null;
 const address=o=>((o[1]?regs[o[1]]:0)+(o[2]?regs[o[2]]:0)*o[3]+o[4])>>>0;
 function readMemory(at,size,float=false){
  if(at>=buffer.byteLength){
   if(!float&&at===0x15f67b0)return 0;
   const entry=constants.get(at);if(!entry)throw Error('Unqualified source memory '+at.toString(16));
   const view=new DataView(entry.buffer,entry.byteOffset,entry.byteLength);return float?(size===8?view.getFloat64(0,true):view.getFloat32(0,true)):view.getUint32(0,true);
  }
  return float?(size===8?mem.getFloat64(at,true):mem.getFloat32(at,true)):size===1?mem.getUint8(at):size===2?mem.getUint16(at,true):mem.getUint32(at,true);
 }
 function register(name){if(Object.hasOwn(regs,name))return regs[name];if(name==='al')return regs.eax&255;if(name==='cl')return regs.ecx&255;if(name==='dl')return regs.edx&255;throw Error('Unsupported source register '+name);}
 function read(o,float=false){if(o[0]==='i')return o[1];if(o[0]==='r')return o[1].startsWith('xmm')?xmm[o[1]]:o[1].startsWith('st(')?fp[Number(o[1].slice(3,-1))]:register(o[1]);return readMemory(address(o),o[5],float);}
 function write(o,value,float=false){
  if(o[0]==='r'){
   if(o[1].startsWith('xmm'))xmm[o[1]]=f(value);
   else if(o[1].startsWith('st('))fp[Number(o[1].slice(3,-1))]=value;
   else if(Object.hasOwn(regs,o[1]))regs[o[1]]=value>>>0;
   else if(o[1]==='al')regs.eax=((regs.eax&0xffffff00)|(value&255))>>>0;
   else throw Error('Unsupported source write register '+o[1]);
  }else{
   const at=address(o),size=o[5];if(float){if(size===8)mem.setFloat64(at,value,true);else mem.setFloat32(at,value,true);}
   else if(size===1)mem.setUint8(at,value);else if(size===2)mem.setUint16(at,value,true);else mem.setUint32(at,value>>>0,true);
  }
 }
 const push=value=>{regs.esp-=4;mem.setUint32(regs.esp,value>>>0,true);},pop=()=>{const value=mem.getUint32(regs.esp,true);regs.esp+=4;return value;};
 const vec=at=>[0,4,8].map(i=>mem.getFloat32(at+i,true)),put=(at,v)=>v.forEach((x,i)=>mem.setFloat32(at+i*4,x,true));
 const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
 function builtin(target){
  const self=regs.ecx,a=mem.getUint32(regs.esp+4,true),b=mem.getUint32(regs.esp+8,true);let cleanup=0;
  if(target===0x100ad10){put(self,[0,0,0]);regs.eax=self;}
  else if(target===0x119b970){mem.setUint32(self,0x149e5a0,true);put(self+4,[0,0,0]);put(self+16,[0,0,0]);regs.eax=self;}
  else if(target===0x119b9e0){}
  else if(target===0x5785c0||target===0x7aff90){const x=vec(self),y=vec(b);put(a,x.map((n,i)=>f(target===0x5785c0?n-y[i]:n+y[i])));regs.eax=a;cleanup=8;}
  else if(target===0x100af90){fp.unshift(dot(vec(self),vec(a)));cleanup=4;}
  else if(target===0x100b5f0){const v=vec(self);fp.unshift(dot(v,v));}
  else if(target===0x100b040){const x=vec(a),y=vec(b);put(self,[f(f(x[1]*y[2])-f(x[2]*y[1])),f(f(x[2]*y[0])-f(x[0]*y[2])),f(f(x[0]*y[1])-f(x[1]*y[0]))]);regs.eax=self;cleanup=8;}
  else if(target===0x119c440){const result=nativePointTriangleDistanceSquared({point:vec(a),packet:{origin:vec(b+4),edge1:vec(b+16),edge2:vec(b+28)},arithmeticProfile});fp.unshift(result.distanceSquared);}
  else throw Error('Unqualified source distance callee '+target.toString(16));
  ip=pop();regs.esp+=cleanup;
 }
 mem.setUint32(0x100,0x149e5a0,true);put(0x104,xyz(origin));put(0x110,xyz(direction));
 mem.setUint32(0x200,0x149fe64,true);put(0x204,xyz(packet?.origin));put(0x210,xyz(packet?.edge1));put(0x21c,xyz(packet?.edge2));
 push(0x200);push(0x100);push(0);
 while(ip!==0){
  if(++steps>100000)throw Error('Bounded source distance control flow exceeded');
  const row=table.get(ip);if(!row)throw Error('Unknown source distance instruction '+ip.toString(16));
  sourceTrace?.push(ip);
  const [,op,args,next]=row;ip=next;const [a,b]=args;
  switch(op){
   case 'mov':case 'movzx':write(a,read(b));break;
   case 'lea':write(a,address(b));break;
   case 'movss':write(a,read(b,true),true);break;
   case 'push':push(read(a));break;
   case 'pop':write(a,pop());break;
   case 'add':write(a,read(a)+read(b));break;
   case 'sub':write(a,read(a)-read(b));break;
   case 'xor':write(a,read(a)^read(b));break;
   case 'xorps':{const bits=new DataView(new ArrayBuffer(4));bits.setFloat32(0,read(a,true),true);bits.setUint32(0,bits.getUint32(0,true)^read(b),true);write(a,bits.getFloat32(0,true),true);break;}
   case 'test':zf=(read(a)&read(b))===0;cf=false;break;
   case 'fld':fp.unshift(q(read(a,true)));break;
   case 'fldz':fp.unshift(0);break;
   case 'fld1':fp.unshift(1);break;
   case 'fstp':write(a,fp[0],true);fp.shift();break;
   case 'fchs':fp[0]=-fp[0];break;
   case 'fxch':{const operand=b??a,i=Number(operand[1].slice(3,-1));[fp[0],fp[i]]=[fp[i],fp[0]];break;}
   case 'fmul':fp[0]=q(fp[0]*read(a,true));break;
   case 'fadd':fp[0]=q(fp[0]+read(a,true));break;
   case 'fdiv':fp[0]=q(fp[0]/read(a,true));break;
   case 'faddp':fp[1]=q(fp[1]+fp[0]);fp.shift();break;
   case 'fsubp':fp[1]=q(fp[1]-fp[0]);fp.shift();break;
   case 'fdivrp':fp[1]=q(fp[0]/fp[1]);fp.shift();break;
   case 'fcompi':{const x=fp[0],y=read(a,true);cf=Number.isNaN(x)||Number.isNaN(y)||x<y;zf=Number.isNaN(x)||Number.isNaN(y)||x===y;fp.shift();break;}
   case 'jb':if(cf)ip=read(a);break;
   case 'jbe':if(cf||zf)ip=read(a);break;
   case 'je':if(zf)ip=read(a);break;
   case 'jmp':ip=read(a);break;
   case 'call':{const target=read(a);push(ip);if(table.has(target))ip=target;else builtin(target);break;}
   case 'ret':ip=pop();if(a)regs.esp+=read(a);break;
   default:throw Error('Unsupported source distance opcode '+op);
  }
  if(fp.length>8)throw Error('Invalid bounded source x87 stack');
 }
 if(fp.length!==1)throw Error('Source distance return must own one x87 result');
 const distanceSquared=fp[0];return {qualified:Number.isFinite(distanceSquared),distanceSquared,hit:distanceSquared<=NATIVE_BOOL_TRIANGLE_THRESHOLD,sourceInstructions:steps,nativeReady:false,x87BitwiseParityVerified:false,numericProfile:arithmeticProfile.source,...(sourceTrace?{sourceTrace}:{})};
}
