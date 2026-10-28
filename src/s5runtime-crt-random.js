// MSVCR120 rand(): unsigned32 LCG, returning15 bits. Verified against the
// fingerprinted copied CRT; the native game's seed/interleaving remains open.
export function createS5RuntimeCRTRandom(seed=1){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new RangeError('Expected uint32 CRT seed');
 let state=seed>>>0,draws=0;
 return {next(){state=(Math.imul(state,214013)+2531011)>>>0;draws++;return (state>>>16)&32767;},get state(){return state;},get draws(){return draws;}};
}
