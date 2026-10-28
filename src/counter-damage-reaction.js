import {nativeRequestedAnimationSpeed} from './native-animation-duration-speed.js';
import {SCN_TICKS_PER_SECOND} from './root-motion.js';

// CounterAttackDamage19, after an already admitted guard reflection. The
// Deathmatch reference registry has previous700ms / total3000ms. This is
// separate from Stun13 and from the Lua effect's authored2500ms lifetime.
export const COUNTER_DAMAGE_REACTION=Object.freeze({totalMs:3000,precedingMs:700,loopBlendTicks:1000});

export function counterDamageReactionPlayback(avatar,state,animation){
 if(state.reaction!=='stun'||!state.counterAttackDamage||!animation)return null;
 const clip=avatar.actions?.get(animation.clip)?.getClip();
 if(!clip||!Number.isFinite(clip.duration)||clip.duration<=0)return null;
 const preceding=state.counterDamageLoopAge===null;
 const speed=nativeRequestedAnimationSpeed({durationTicks:Math.round(clip.duration*SCN_TICKS_PER_SECOND),requestedMs:preceding?COUNTER_DAMAGE_REACTION.precedingMs:0,luaAnimationSpeed:animation.speed});
 return {speed,time:preceding?state.counterDamageElapsedMs/1000*speed:state.counterDamageLoopAge,fade:preceding?0:COUNTER_DAMAGE_REACTION.loopBlendTicks/SCN_TICKS_PER_SECOND};
}
