const f=Math.fround,u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
function entries(array,size){if(!Array.isArray(array))throw Error('Source morph arrays required');for(const a of array)if(!Array.isArray(a)||a.length!==size||!u32(a[0])||a.slice(1).some(n=>!Number.isFinite(n)||f(n)!==n))throw Error('Raw morph index/float32 entry required');}
const compiledFrames=new WeakSet();
function validateFrames(frames){
 if(!Array.isArray(frames))throw Error('Source morph frames required');
 let previous=0;for(let i=0;i<frames.length;i++){const a=frames[i];if(!u32(a.time)||(i&&a.time<previous))throw Error('Source-order uint32 morph times required');previous=a.time;entries(a.vertices,4);entries(a.uv,3);}
}
// Explicit opt-in for immutable authenticated assets. Raw arrays retain the
// original per-call validation and mutation semantics. A frozen lookalike is
// not branded; only this private WeakSet can bypass validation.
export function compileScnMorphFrames(frames){
 validateFrames(frames);
 const snapshot=Object.freeze(frames.map(a=>Object.freeze({time:a.time,vertices:Object.freeze(a.vertices.map(v=>Object.freeze([...v]))),uv:Object.freeze(a.uv.map(v=>Object.freeze([...v])))})));
 compiledFrames.add(snapshot);return snapshot;
}
export function planScnMorph116ba90({frames,timeTicks,durationTicks}={}){
 if(!Array.isArray(frames)||!u32(timeTicks)||!u32(durationTicks))throw Error('Raw morph frames, time and KeyData duration required');
 if(!compiledFrames.has(frames))validateFrames(frames);
 let lo=0,hi=frames.length;while(lo<hi){const mid=lo+Math.floor((hi-lo)/2);if(timeTicks<=frames[mid].time)hi=mid;else lo=mid+1;}
 const index=lo===frames.length?(timeTicks<durationTicks?frames.length-1:-1):(frames[lo].time===timeTicks?lo:lo-1);
 const result={index,writes:[],sourceSamplerBranchesVerified:true,bufferBindingVerified:false,nativeX87BitExact:false,nativeReady:false};
 if(index<0)return {...result,branch:'no-frame-no-writes'};
 const left=frames[index],right=frames[index+1];
 if(!right){for(const a of left.vertices)result.writes.push({kind:'position',index:a[0],value:a.slice(1),absolute:true});for(const a of left.uv)result.writes.push({kind:'uv0',index:a[0],value:a.slice(1),absolute:true});return {...result,branch:'last-frame-absolute'};}
 const numerator=f((timeTicks-left.time)>>>0),denominator=f((right.time-left.time)>>>0),ratio=f(numerator/denominator);
 result.ratio=ratio;result.branch='two-frames';
 // Source116C381 AND116C3BF load [ebp+8]. Preserve two LEFT reads.
 // Never replace this by interpolation to right.vertices.
 for(const a of left.vertices){const second=a;result.writes.push({kind:'position',index:a[0],value:a.slice(1).map((n,j)=>f(n+f(f(second[j+1]-n)*ratio))),absolute:true});}
 for(let i=0;i<left.uv.length;i++){
  const a=left.uv[i],b=right.uv[i];if(!b)throw Error('Right UV range unqualified; no native fallback is established');
  if(a[0]!==b[0])return {...result,aborted:true,stopReason:'uv-index-mismatch-source-return',uvWritesBeforeAbort:i};
  result.writes.push({kind:'uv0',index:a[0],value:a.slice(1).map((n,j)=>f(n+f(f(b[j+1]-n)*ratio))),absolute:true});
 }
 return {...result,aborted:false};
}
export function consumeScnMorphWrites(plan,{writePosition,writeUv0,provenance}={}){
 for(const [name,fn] of Object.entries({writePosition,writeUv0})){if(typeof fn!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name))throw Error('Synchronous qualified morph writer required: '+name);if(typeof provenance?.[name]!=='string'||!provenance[name].trim())throw Error('Morph writer provenance required');}
 let consumed=0;for(const write of plan.writes){const fn=write.kind==='position'?writePosition:writeUv0,receipt=fn({...write,value:[...write.value]});if(receipt&&(typeof receipt.then==='function'||typeof receipt.next==='function'))throw Error('Async/iterator morph writer forbidden');if(receipt?.executedSourceBranch!==true)throw Error('Executed morph writer receipt required');consumed++;}
 return {executedSourceBranch:true,consumed,aborted:plan.aborted??false,nativeReady:false,normalWritesRequested:0};
}
