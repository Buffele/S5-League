// Source branch adapter. General numeric/native parity is deliberately not asserted.
const f=Math.fround;
const compiledKeyLists=new WeakMap();
function u32(x){if(!Number.isInteger(x)||x<0||x>0xffffffff)throw TypeError('Explicit uint32 native ticks required');return x;}
function vector(v,n){if(!Array.isArray(v)||v.length!==n)throw TypeError('Exact vector arity required');return Object.freeze(v.map(x=>{const y=f(x);if(!Number.isFinite(x)||!Number.isFinite(y))throw TypeError('Finite float32 components required');return y;}));}
function port(p,label){if(typeof p?.tick!=='function'||!['source-port','s5-explicit-adaptation'].includes(p.provenance?.kind)||!p.provenance.source)throw TypeError(`Qualified synchronous port required: ${label}`);if(['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(p.tick.constructor?.name))throw TypeError('Synchronous non-generator port required');return args=>{const r=p.tick(args);if(r&&(typeof r.then==='function'||typeof r.next==='function'))throw TypeError('Synchronous result required');return r;};}
function keysSnapshot(keys,n){if(!Array.isArray(keys))throw TypeError('Explicit key list required');let previous=-1;return keys.map(k=>{if(!Array.isArray(k)||k.length!==n+1)throw TypeError('Key arity');const t=u32(k[0]);if(t<previous)throw TypeError('Source unsigned time order required; never sort copies implicitly');previous=t;return Object.freeze([t,...vector(k.slice(1),n)]);});}
export function compileTransformTrack({track,provenance}={}){
 if(!track||typeof track!=='object'||typeof provenance?.source!=='string'||!provenance.source.trim())throw TypeError('Explicit source track snapshot provenance required');
 const result={};for(const [kind,singular,plural,n]of [['position','position','positions',3],['scale','scale','scales',3],['rotation','rotation','rotations',4]]){const fallback=vector(track[singular],n),keys=Object.freeze(keysSnapshot(track[plural],n));result[singular]=fallback;result[plural]=keys;compiledKeyLists.set(keys,{width:n,fallback});}
 return Object.freeze({...result,immutableSnapshot:Object.freeze({policy:'explicit-immutable-scn-f32-track-v1',source:provenance.source,nativeReady:false})});
}
export function sampleTransformChannel({keys,defaultValue,clockTicks,kind},ports={}){
 const n=kind==='rotation'?4:3;if(!['position','scale','rotation'].includes(kind))throw TypeError('Explicit transform channel required');
 const clock=u32(clockTicks),prepared=compiledKeyLists.get(keys),fallback=prepared?.width===n&&prepared.fallback===defaultValue?defaultValue:vector(defaultValue,n),list=prepared?.width===n?keys:keysSnapshot(keys,n);let lo=0,hi=list.length;
 // Native comparator 1171850 uses query<=middle. Exact duplicates select the first equal key.
 while(lo<hi){const mid=lo+Math.floor((hi-lo)/2);if(clock<=list[mid][0])hi=mid;else lo=mid+1;}
 const index=lo===list.length?list.length-1:(clock===list[lo][0]?lo:lo-1);
 if(index<0)return {value:fallback,index,branch:'default',nativeCompared:false};
 const left=list[index],right=list[index+1];if(!right)return {value:vector(left.slice(1),n),index,branch:'last',nativeCompared:false};
 const numerator=f((clock-left[0])>>>0),denominator=f((right[0]-left[0])>>>0),ratio=f(numerator/denominator);
 // Duplicate exact-first keys can produce 0/0. Preserve descriptor; do not silently choose last duplicate.
 if(!Number.isFinite(ratio))return {value:null,index,branch:'non-finite-native-ratio',ratio,nativeCompared:false};
 let value;if(kind==='rotation')value=vector(port(ports.quaternionSlerp,'D3DXQuaternionSlerp')({left:vector(left.slice(1),4),right:vector(right.slice(1),4),ratio}),4);
 else value=vector(left.slice(1).map((v,i)=>f(v+f(f(right[i+1]-v)*ratio))),3);
 return {value,index,branch:'interpolate',ratio,nativeCompared:false,x87Parity:false};
}
export function createTransformSampler11353b0(ports){
 const compose=port(ports.matrixTransformation,'D3DXMatrixTransformation'),write=port(ports.writeDestination48,'matrix destination +48'),last=port(ports.writeLastClock0c,'animator clock +0C');let running=false;
 return Object.freeze({qualification:Object.freeze({sourceBranchModel:true,selectedTrackProducerVerified:false,parentLocalSpaceVerified:false,d3dxParity:false,x87Parity:false,nativeCompared:false}),evaluate({selectedTrack,clockTicks,transitionActive,destinationPresent,selectionProvenance}){
  if(running)throw Error('Reentrant sampler refused');const clock=u32(clockTicks);if(typeof transitionActive!=='boolean'||typeof destinationPresent!=='boolean'||!selectionProvenance?.source)throw TypeError('Explicit branch/selection context required');
  if(selectedTrack===null)return {sampled:false,branch:'no-selected-keydata',clock44:clock,lastClock0cUnchanged:true};
  if(!selectedTrack||typeof selectedTrack!=='object')throw TypeError('Explicit selected KeyData required, never first clip');
  const transition=transitionActive?port(ports.applyTransition1135480,'transition1135480'):null;
  running=true;try{const channels={position:sampleTransformChannel({keys:selectedTrack.positions,defaultValue:selectedTrack.position,clockTicks:clock,kind:'position'},ports),scale:sampleTransformChannel({keys:selectedTrack.scales,defaultValue:selectedTrack.scale,clockTicks:clock,kind:'scale'},ports),rotation:sampleTransformChannel({keys:selectedTrack.rotations,defaultValue:selectedTrack.rotation,clockTicks:clock,kind:'rotation'},ports)};
  if(Object.values(channels).some(c=>c.value===null))return {sampled:false,branch:'non-finite-native-ratio',channels,clock44:clock,lastClock0cUnchanged:true};
  let components=Object.freeze({position:channels.position.value,scale:channels.scale.value,rotation:channels.rotation.value});if(transition) {const r=transition({components,clockTicks:clock});components=Object.freeze({position:vector(r.position,3),scale:vector(r.scale,3),rotation:vector(r.rotation,4)});}
   const matrix=vector(compose({scalingCenter:null,scalingRotation:null,scale:components.scale,rotationCenter:null,rotation:components.rotation,translation:components.position}),16);
   if(destinationPresent)write({matrix});last({clockTicks:clock});return {sampled:true,components,matrix,channels,clock44:clock,clock0c:clock,destinationWritten:destinationPresent};
  }finally{running=false;}
 }});
}
