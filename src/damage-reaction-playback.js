import {nativeRequestedAnimationSpeed} from './native-animation-duration-speed.js';
import {SCN_TICKS_PER_SECOND} from './root-motion.js';

// Damage18 passes its received duration to B77CB0 (60BF8A and sibling scenes).
// Use the selected victim clip, including its sex/direction-specific length.
export function damageReactionPlayback(avatar,state,animation){
 if(state.reaction!=='damage'||!animation)return null;
 const clip=avatar.actions?.get(animation.clip)?.getClip();
 if(!clip||!Number.isFinite(clip.duration)||clip.duration<=0)return null;
 const requestedMs=Math.round(state.hold*1000),durationTicks=Math.round(clip.duration*SCN_TICKS_PER_SECOND);
 if(!Number.isSafeInteger(requestedMs)||requestedMs<=0)return null;
 const speed=nativeRequestedAnimationSpeed({durationTicks,requestedMs,luaAnimationSpeed:animation.speed});
 return {speed,time:Math.max(0,state.age)*speed,fade:0};
}
