// Original578090/579A30/579AE0/578620 and the0..360 branch of577850.
// Qualified against266seed/two-draw executions of the original x86 code in
// an isolated CPU emulator. This is not a new live-client RNG observation.
const WORDS=624,OFFSET=397;
export function supplyLaunchAngles(pickupId){
 if(!Number.isInteger(pickupId)||pickupId<1||pickupId>0xffffffff)throw Error('Positive uint32 supply identity required');
 const words=new Uint32Array(WORDS);words[0]=pickupId;
 for(let i=1;i<WORDS;i++)words[i]=(Math.imul(0x6c078965,words[i-1]^(words[i-1]>>>30))+i)>>>0;
 // The first twist uses bit31 of word0; source5797F0 normalizes its unused
 // low31bits during seeding. They do not participate in either launch draw.
 const twist=()=>{for(let i=0;i<WORDS;i++){
  const joined=(words[i]&0x80000000)|(words[(i+1)%WORDS]&0x7fffffff);
  words[i]=words[(i+OFFSET)%WORDS]^(joined>>>1)^((joined&1)?0x9908b0df:0);
 }};twist();
 let cursor=0;
 const next=()=>{
  // Two launch draws ordinarily consume two words. An exhausted block would
  // require more than622 consecutive rejected draws; keep the generator exact.
  if(cursor===WORDS){
   twist();cursor=0;
  }
  let value=words[cursor++];value^=value>>>11;value^=(value<<7)&0x9d2c5680;
  value^=(value<<15)&0xefc60000;value^=value>>>18;return value>>>0;
 };
 return [supplyLaunchDegree(next),supplyLaunchDegree(next)];
}

export function supplyLaunchDegree(next){
 // Native divides into equal buckets, then REJECTS excess words; modulo361
 // or rounding a continuous uniform sample produces different angles.
 const bucket=Math.floor(0x100000000/361);
 for(;;){
  const word=next();if(!Number.isInteger(word)||word<0||word>0xffffffff)throw Error('Supply RNG requires a uint32 word');
  const angle=Math.floor(word/bucket);if(angle<=360)return angle;
 }
}
