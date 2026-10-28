// Local CAttackSpyDaggerState: constructor5dc700 sets +368 to 1;
// Enter5dce50 toggles 1->0 / 0->1 before phase5de490 samples that slot.
// One native child belongs to Sigma's aerial state45 (factory805470,type26).
export function createSigmaBladeAirAnimation(){return {index:1};}
export function enterSigmaBladeAirAnimation(state){
 if(!state||![0,1].includes(state.index))throw new TypeError('Sigma air animation state must have native index 0 or 1');
 state.index=state.index===0?1:0;return state.index;
}
