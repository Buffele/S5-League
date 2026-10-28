const owners=new WeakMap(),u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
// A seed is mandatory and remains an explicit S5 birth policy. No native
// clock/seed/room stream is inferred from the exact algorithm below.
export const CONQUEST_KING_DECLARED_RANDOM_SEED=Object.freeze({name:'s5-explicit-king-actor-ai-mt-seed',seedProducerQualified:false,nativeReady:false});
export function createConquestKingRandom({seed32,policy}={}){
 if(!u32(seed32)||policy!==CONQUEST_KING_DECLARED_RANDOM_SEED)throw Error('Actual explicit King uint32 seed and immutable declared seed policy required');
 const words=new Uint32Array(624);words[0]=seed32;for(let i=1;i<624;i++)words[i]=(Math.imul(1812433253,words[i-1]^(words[i-1]>>>30))+i)>>>0;
 // Original5797F0 canonicalizes word0 after579A30. Omitting this is not
 // equivalent to this client's seed path, even for a standard MT algorithm.
 let canonical=(words[396]^words[623])>>>0;canonical=canonical&0x80000000?(((canonical^0x9908b0df)<<1)|1)>>>0:(canonical<<1)>>>0;words[0]=((words[0]&0x80000000)|(canonical&0x7fffffff))>>>0;if(words.every(v=>v===0))words[0]=0x80000000;
 let index=624,draws=0,disposed=false;
 const live=()=>{if(disposed)throw Error('King random owner disposed');};
 const next=()=>{live();if(index===624){for(let i=0;i<623;i++){const y=((words[i]&0x80000000)|(words[i+1]&0x7fffffff))>>>0;words[i]=(words[(i+397)%624]^(y>>>1)^((words[i+1]&1)?0x9908b0df:0))>>>0;}const y=((words[623]&0x80000000)|(words[0]&0x7fffffff))>>>0;words[623]=(words[396]^(y>>>1)^((words[0]&1)?0x9908b0df:0))>>>0;index=0;}let value=words[index++];value^=value>>>11;value^=(value<<7)&0x9d2c5680;value^=(value<<15)&0xefc60000;value^=value>>>18;draws++;return value>>>0;};
 const owner=Object.freeze({nextUint32:next,below(maximum){live();if(!Number.isInteger(maximum)||maximum<=0||maximum>0x7fffffff)throw Error('Positive signed King random bound required');if(maximum===1)return 0;const divisor=Math.floor(0xffffffff/maximum)+(0xffffffff%maximum===maximum-1?1:0);let result;do{result=Math.floor(next()/divisor);}while(result>maximum-1);return result;},snapshot(){live();return {seed32,index,draws,sourceSeedKernel:0x579a30,sourceCanonicalization:0x5797f0,sourceTwist:0x579ae0,sourceDraw:0x578620,sourceBound:0x577850,nativeSeedObserved:false,seedPolicy:policy.name,nativeReady:false};},dispose(){if(disposed)return;disposed=true;words.fill(0);}});owners.set(owner,{live});return owner;
}
export function assertConquestKingRandom(owner){const r=owners.get(owner);if(!r)throw Error('Typed actual King AI random owner required');r.live();return owner;}
