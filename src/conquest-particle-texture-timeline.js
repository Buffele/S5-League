const uint=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;
// Complete11385E0 modes0/2/3. Mode3 chooses a NEW CRT frame after each
// strictly advancing interval, independently of the retained base frameA0.
// This low-level kernel does not authenticate its control/table producer.
export function advanceConquestParticleTexture11385e0(p,{textureMode,textureCount,textureIntervalMs,nextRandom15}={}){
 if(!(p instanceof DataView)||p.byteLength!==0xac||![0,2,3].includes(textureMode)||!Number.isInteger(textureCount)||textureCount<0||textureCount>0x7fffffff)throw Error('Qualified source particle layout/mode0,2,3/table count required');
 let changed=false,randomDraws=0;
 if(textureMode!==0&&textureCount>1){
  if(!uint(textureIntervalMs)||textureIntervalMs===0)throw Error('Nonzero native unsigned texture interval required');
  const step=Math.floor(p.getUint32(4,true)/textureIntervalMs)>>>0;
  if(step>p.getUint32(0xa8,true)){
   p.setUint32(0xa8,step,true);
   if(textureMode===2)p.setUint32(0xa4,((p.getUint32(0xa0,true)+step)>>>0)%textureCount,true);
   else{if(typeof nextRandom15!=='function')throw Error('Actual source CRT15 texture stream required');const value=nextRandom15();randomDraws=1;if(!Number.isInteger(value)||value<0||value>32767)throw Error('Native CRT15 texture sample required');p.setUint32(0xa4,Math.trunc(value/32768*Math.fround(textureCount))>>>0,true);}
   changed=true;
  }
 }
 return Object.freeze({changed,randomDraws,textureIndex:p.getUint32(0xa4,true),stepA8:p.getUint32(0xa8,true),source:0x11385e0,textureTimelineQualified:true,controlProducerQualified:false,nativeRandomStreamObserved:false,nativeReady:false});
}
