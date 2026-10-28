// Native11603D0, type5: random start and one new random selection whenever
// uint32(elapsed-start)/delay changes. Missed buckets are not replayed.
// MSVC rand() is divided by32768, then x87 truncates towards zero.
export const randomTextureSample=()=>Math.floor(Math.random()*32768);
export function createNodeLoaderTextureClock({type,delayMs,count},random15=randomTextureSample){
 if(type!==5||!Number.isInteger(delayMs)||delayMs<=0||!Number.isInteger(count)||count<2)throw Error('Qualified type5 texture clock, positive integer delay and frame count required');
 let draws=0;
 const choose=()=>{const value=random15();if(!Number.isInteger(value)||value<0||value>=32768)throw Error('Explicit rand15 sample required');draws++;return Math.trunc(value*count/32768);};
 let frame=choose(),bucket=0;
 return {sample(elapsedMs){
  if(!Number.isInteger(elapsedMs)||elapsedMs<0||elapsedMs>0xffffffff)throw Error('Texture clock requires uint32 milliseconds');
  const next=Math.trunc(elapsedMs/delayMs);if(next!==bucket){bucket=next;frame=choose();}return frame;
 },snapshot(){return {type,delayMs,count,frame,bucket,draws,nativeSeededRngVerified:false};}};
}

export function bindNodeLoaderTextures(effect,definition,maps,random15=randomTextureSample){
 if(maps.length!==definition.frames.length)throw Error('Incomplete NodeLoader texture frames');
 const mesh=effect.byName.get(definition.target);if(!mesh?.isMesh)throw Error('Missing exact NodeLoader texture target '+definition.target);
 const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material],original=materials.map(m=>m.map);
 let clock=null;
 return {update(seconds){
  clock??=createNodeLoaderTextureClock({...definition,count:maps.length},random15);
  const frame=clock.sample(Math.floor(seconds*1000+1e-7));
  for(const material of materials)material.map=maps[frame];
 },clear(){clock=null;materials.forEach((m,i)=>m.map=original[i]);},snapshot(){return clock?{...clock.snapshot(),target:definition.target,texture:definition.frames[clock.snapshot().frame]}:null;}};
}
