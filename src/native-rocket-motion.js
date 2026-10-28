// s5runtimegame.exe F61210 (tick), 5805F0 (multishot initialization), F60D80
// (center initialization). Work/rocket-launcher-recovery/native-fidelity.
// Positions/velocities stay in native units until the scene boundary.
// SSE arithmetic is rounded at each instruction. D3DX rotation is compared
// with the copied DLL oracle; JS trig/normalization is not bit-identical x87.
const f=Math.fround;
export const NATIVE_ROCKET_MOTION=Object.freeze({timeFactor:0.0010000000474974513,maxStep:0.10000000149011612,twoPi:6.2831854820251465,degreeFactor:0.017453292521994});
const vector=(v,name)=>{if(!v||v.length!==3||!Array.from(v).every(Number.isFinite))throw new TypeError(`Invalid rocket ${name}`);return Array.from(v,f);};

// D3DXMatrixRotationAxis + D3DXVec3TransformCoord: row-vector convention.
export function rotateNativeRocketOffset(offset,axis,angle){
 const a=axis.map(f),squared=f(f(f(a[0]*a[0])+f(a[1]*a[1]))+f(a[2]*a[2]));if(!squared)throw new RangeError('Rocket rotation axis is zero');
 // DLL dispatch606917 uses RSQRTSS + one Newton iteration. Camera axes
 // round to unit length: preserve its recovered unit-bucket seed. General
 // nonunit axes use JS reciprocal sqrt, subject to the oracle tolerance.
 const seed=.999755859375,inverse=Math.abs(squared-1)<1e-6?f(f(3-f(f(seed*squared)*seed))*f(seed*.5)):f(1/Math.sqrt(squared));
 const [x,y,z]=a.map(v=>f(v*inverse)),s=f(Math.sin(f(angle))),c=f(Math.cos(f(angle))),t=f(1-c),xy=f(x*y*t);
 const m=[f(x*x*t+c),f(xy+z*s),f(x*z*t-y*s),f(xy-z*s),f(y*y*t+c),f(y*z*t+x*s),f(x*z*t+y*s),f(y*z*t-x*s),f(z*z*t+c)];
 // 6052E3: rounded x+y, then z; RCPPS(w=1), one Newton iteration.
 // Its reciprocal is 0.9999999403953552, not mathematically exact1.
 return [0,1,2].map(i=>f(f(f(f(offset[0]*m[i])+f(offset[1]*m[i+3]))+f(offset[2]*m[i+6]))*.9999999403953552));
}

export function nativeRocketOffsets(axis,cameraUp,count=3,radius=300){
 if(!Number.isInteger(count)||count<1||count>100)throw new RangeError('Invalid rocket count');
 const base=vector(cameraUp,'camera up').map(v=>f(v*f(radius))),step=Math.trunc(360/count);
 return Array.from({length:count},(_,i)=>i?rotateNativeRocketOffset(base,axis,f(step*i*NATIVE_ROCKET_MOTION.degreeFactor)):base.slice());
}

export function createNativeRocketMotion({position,velocity,axis=[0,0,1],offset=[0,0,0],angularRate=0,angle=0,spreadMs=0,remainingSpreadMs=spreadMs,center=position,gravity=0,damping=0}){
 return {position:vector(position,'position'),center:vector(center,'center'),velocity:vector(velocity,'velocity'),axis:vector(axis,'axis'),offset:vector(offset,'offset'),angularRate:f(angularRate),angle:f(angle),totalSpreadMs:spreadMs,remainingSpreadMs,gravity:f(gravity),damping:f(damping)};
}

export function advanceNativeRocketMotion(state,elapsedMs){
 if(!Number.isInteger(elapsedMs)||elapsedMs<0||elapsedMs>0xffffffff)throw new RangeError('Expected uint32 rocket frame duration');
 const dt=Math.min(NATIVE_ROCKET_MOTION.maxStep,f(f(elapsedMs)*NATIVE_ROCKET_MOTION.timeFactor));
 state.velocity[1]=f(state.velocity[1]+f(state.gravity*dt));
 const damping=f(1-f(state.damping*dt));state.velocity=state.velocity.map(v=>f(v*damping));
 if(state.angularRate!==0){
  state.center=state.center.map((v,i)=>f(v+f(state.velocity[i]*dt)));
  state.angle=f(state.angle+f(state.angularRate*dt));
  if(state.angle>NATIVE_ROCKET_MOTION.twoPi||state.angle<-NATIVE_ROCKET_MOTION.twoPi)state.angle=f(state.angle%NATIVE_ROCKET_MOTION.twoPi);
  let offset=state.offset;
  if(state.remainingSpreadMs>0){
   const spread=f(1-f(f(state.remainingSpreadMs)/f(state.totalSpreadMs)));
   offset=offset.map(v=>f(v*spread));
   // Native code uses the remaining value BEFORE this subtraction, and the
   // raw millisecond delta here even when movement has been clamped to100ms.
   state.remainingSpreadMs=(state.remainingSpreadMs-elapsedMs)|0;
  }
  offset=rotateNativeRocketOffset(offset,state.axis,state.angle);
  state.position=state.center.map((v,i)=>f(v+offset[i]));
 }else state.position=state.position.map((v,i)=>f(v+f(state.velocity[i]*dt)));
 return state;
}

// 7B0180 -> 7B11C0, free-path branch 7B2349..7B23F0. The native world
// solver consumes a skin distance even in empty space. Contacts are separate.
export function applyNativeRocketFreeTravel(state,previousPosition,radii=[16,16,16],margin=f(.015)){
 const start=previousPosition.map((v,i)=>f(v/radii[i])),delta=state.position.map((v,i)=>f(f(v-previousPosition[i])/radii[i]));
 const length=f(Math.sqrt(delta[0]*delta[0]+delta[1]*delta[1]+delta[2]*delta[2]));
 if(length<margin){state.position=previousPosition.slice();return state;}
 const scale=f(f(length-margin)/length);
 state.position=start.map((v,i)=>f(f(v+f(delta[i]*scale))*radii[i]));
 return state;
}
