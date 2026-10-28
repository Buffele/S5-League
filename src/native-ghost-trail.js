import {buildTrailSegments,ageTrailSample,trailVertexAttributes} from './native-ghost-trail-math.js';

// Static PE: 11a4f30, 11a52f0, 11a51d0, 11a5150. Caller supplies native
// uint32 time units and evaluated world endpoints; no guessed clock/socket.
const uint32=v=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw new RangeError('Expected native uint32 time');};
function pairCopy(pair){
 if(!Array.isArray(pair)||pair.length!==2||pair.some(p=>!(Array.isArray(p)||ArrayBuffer.isView(p))||p.length!==3||!Array.from(p).every(Number.isFinite)))throw new TypeError('Expected finite world endpoint pair');
 return pair.map(p=>Array.from(p));
}
export class NativeGhostTrail {
 constructor({sampleLifetime,spacing,riseTime,fallTime},initialEndpoints){
  uint32(sampleLifetime);uint32(riseTime);uint32(fallTime);
  if(!sampleLifetime||!Number.isFinite(spacing)||spacing<=0)throw new RangeError('Positive lifetime and spacing required');
  this.config=Object.freeze({sampleLifetime,spacing,riseTime,fallTime});
  // Initial coordinates require an explicit seed: native segment constructor
  // coordinate initialization is outside this verified controller contract.
  this.history=Array.from({length:3},()=>pairCopy(initialEndpoints));
  this.samples=[];this.opacity=0;this.emitting=true;
 }
 get inactive(){return !this.emitting&&this.opacity<0.009999999776482582;}
 update(deltaNative,endpoints,{emitting=this.emitting,reset=false}={}){
  uint32(deltaNative);
  if(typeof emitting!=='boolean'||typeof reset!=='boolean')throw new TypeError('Expected boolean emission/reset');
  const current=pairCopy(endpoints),c=this.config;
  if(!reset&&deltaNative<=250&&deltaNative===0&&((emitting&&this.opacity<1&&c.riseTime===0)||(!emitting&&this.opacity>0&&c.fallTime===0)))throw new RangeError('Native zero/zero opacity domain is unverified');
  this.emitting=emitting;this.history=[this.history[1],this.history[2],current];
  if(reset||deltaNative>250){
   this.history=Array.from({length:3},()=>pairCopy(current));this.samples=[];
   return this; // Preserves opacity; skips aging and emission.
  }
  if(emitting&&this.opacity<1)this.opacity=Math.min(1,Math.fround(this.opacity+Math.fround(deltaNative)/Math.fround(c.riseTime)));
  else if(!emitting&&this.opacity>0)this.opacity=Math.fround(this.opacity-Math.fround(deltaNative)/Math.fround(c.fallTime));
  if(this.opacity<0){this.opacity=0;this.samples=[];}
  if(emitting||this.opacity>0){
   const generated=buildTrailSegments(this.history,this.samples.length,c.spacing);
   this.samples=[...generated.reverse().map(endpoints=>({endpoints,remaining:c.sampleLifetime})),...this.samples];
  }
  this.samples=this.samples.flatMap(sample=>{
   const remaining=ageTrailSample(sample.remaining,deltaNative);
   return remaining===null?[]:[{...sample,remaining}];
  });
  return this;
 }
 vertices(externalOpacity=1){
  if(!Number.isFinite(externalOpacity)||externalOpacity<0||externalOpacity>1)throw new RangeError('Expected external opacity in [0,1]');
  return trailVertexAttributes(this.samples,this.config.sampleLifetime,this.opacity*externalOpacity);
 }
}
