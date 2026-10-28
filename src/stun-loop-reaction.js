import {SCN_TICKS_PER_SECOND} from './root-motion.js';

// Stun13/registry0=0 enters phase1 directly (655320); Lua StunState
// selects00007, speed1, loop and blend1000ticks. No total-duration inference.
export function stunLoopReactionPlayback(avatar,state,animation){
 if(state.reaction!=='stun'||!state.stunDirectLoop||state.counterAttackDamage||state.dead||animation?.clip!=='00007')return null;
 return {speed:1,time:Math.max(0,state.age),fade:1000/SCN_TICKS_PER_SECOND};
}
