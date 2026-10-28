// Pure116A3B0/116A6C0/116A7B0 transcription; not a material alpha binding.
const f=Math.fround,u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
export function sampleScnScalar116a3b0(keys,timeTicks){
 if(!u32(timeTicks)||!Array.isArray(keys))throw Error('Raw uint32 SCN ticks and keys required');
 let previous=0;for(let i=0;i<keys.length;i++){const k=keys[i];if(!Array.isArray(k)||k.length!==2||!u32(k[0])||(i&&k[0]<previous)||typeof k[1]!=='number'||!Number.isFinite(k[1])||f(k[1])!==k[1])throw Error('Source-order finite float32 scalar keys required');previous=k[0];}
 //116AC50 +1171850: lower_bound, comparator searchTime<=keyTime unsigned.
 let lo=0,hi=keys.length;while(lo<hi){const mid=lo+Math.floor((hi-lo)/2);if(timeTicks<=keys[mid][0])hi=mid;else lo=mid+1;}
 const index=lo===keys.length?keys.length-1:(keys[lo][0]===timeTicks?lo:lo-1);
 if(index<0)return {value:1,index,branch:'no-preceding-key',scalarSamplingSourceVerified:true,materialBindingVerified:false,nativeX87BitExact:false,nativeReady:false};
 const first=keys[index],next=keys[index+1];
 if(!next)return {value:first[1],index,branch:'hold-last',scalarSamplingSourceVerified:true,materialBindingVerified:false,nativeX87BitExact:false,nativeReady:false};
 const numerator=f((timeTicks-first[0])>>>0),denominator=f((next[0]-first[0])>>>0),ratio=f(numerator/denominator);
 const value=f((next[1]-first[1])*ratio+first[1]); // x87 un-stored intermediates approximated by JS Number
 return {value,index,branch:'linear',ratio,numerator,denominator,scalarSamplingSourceVerified:true,materialBindingVerified:false,nativeX87BitExact:false,nativeReady:false};
}
export function evaluateScnVisibility1257e90({keys,timeTicks,destinationBound,selectedKeyDataPresent}={}){
 if(!u32(timeTicks)||typeof destinationBound!=='boolean'||typeof selectedKeyDataPresent!=='boolean')throw Error('Raw visibility time/destination/selection predicates required');
 const result={rawAnimatorTime44:timeTicks,commands:[],sourceDestinationOffset:0xc4,materialAlphaBindingVerified:false,nativeReady:false};
 if(!destinationBound||!selectedKeyDataPresent)return {...result,reason:'source-destination-or-selection-absent'};
 const sampled=sampleScnScalar116a3b0(keys,timeTicks);
 return {...result,commands:[{operation:'writeNodeFloat',fieldOffset:0xc4,value:sampled.value,absolute:true}],sampling:sampled};
}
