import {RIFLE_DISPERSION} from './rifle-dispersion-data.js';

// Source patterns are exact. Until the native SetPatternRegression algorithm
// is decoded, recovery uses an explicit 0.5 s quiet interval, not a guessed
// random cone or an extra distance multiplier. This policy is not native-certified.
export const BURST_RECOVERY_SECONDS=.5;
export function advanceDispersion(state,dt){
 state.dispersion??={next:0,quiet:Infinity};state.dispersion.quiet+=dt;
}
export function takeShotDispersion(state,weapon){
 const profile=RIFLE_DISPERSION[weapon];if(!profile)return null;
 state.dispersion??={next:0,quiet:Infinity};
 const d=state.dispersion;if(d.quiet>=BURST_RECOVERY_SECONDS)d.next=0;
 const index=d.next,offset=[...profile.points[index]];
 d.next=(index+1)%profile.points.length;d.quiet=0;
 return {index,offset};
}
