// Current copied s5runtimegame.exe + authenticated constant_info.x7.
// Proof and exact native function addresses: work/melee-batch-3/bat/input-fixes.
// INPUT_USE_WEAPON2_BEGIN is 10: this consumes press, not held or release.
const branches={heavy:['spin2','spin4'],spin2:['spin3','spin5'],spin4:['spin3','spin5']};
export const BAT_SPIN_INPUT_RANGES=Object.freeze(Object.fromEntries(Object.entries(branches).map(([kind,targets])=>[
 kind,Object.freeze([
  Object.freeze({fromMs:0,toMs:350,afterMs:400,kind:targets[0],combo:0}),
  Object.freeze({fromMs:301,toMs:400,afterMs:400,kind:targets[1],combo:0}),
 ]),
])));

// Preserve every native queued request, including the authored 301..350 overlap.
// 6230c0 visits every range; 6243d0 closes the handler after its first accepted
// input. 6231b0/6242b0 dispatch on strict elapsed > delay, in insertion order.
export function batNativeInputRequests(attack,input,dtMs){
 if(attack?.weapon!=='bat'||attack.batInputsDispatched)return [];
 const ranges=BAT_SPIN_INPUT_RANGES[attack.kind];
 if(!ranges)return [];
 if(input.heavy&&!attack.batInputAccepted){
  const matching=ranges.filter(r=>attack.timeMs>=r.fromMs&&attack.timeMs<=r.toMs);
  if(matching.length){attack.batInputAccepted=true;attack.batQueuedInputs=matching;}
  else if(attack.timeMs>=401&&attack.timeMs<=1500)attack.batInputAccepted=true;
 }
 const ready=(attack.batQueuedInputs??[]).filter(r=>attack.timeMs+dtMs>r.afterMs);
 if(ready.length)attack.batInputsDispatched=true;
 return ready;
}

export function batInputTransition(attack,input,dtMs){
 // CActor::virtual+24 (518b20) only stores pendingState at actor+274.
 // Native range tick submits all requests in insertion order before commit.
 // Therefore the second authored range wins their 301..350 ms overlap.
 return batNativeInputRequests(attack,input,dtMs).at(-1)??null;
}

// CAttackMovingSpinState Tick5f3cb0 applies input locomotion only in phase0.
// Phase1 advances its delay and exits; the BB003/BB004 tail cannot walk.
export function batMovementPolicy(attack){
 if(attack?.weapon!=='bat'||!['heavy','spin2','spin3','spin4','spin5'].includes(attack.kind))return null;
 const recovery=attack.phase==='recovery';
 return {moveRate:recovery?0:attack.profile.moveRate,immobile:recovery};
}

export function batInputPolicy(attack){
 if(attack?.weapon!=='bat'||!['light','strong'].includes(attack.kind))return null;
 // Phase boundary is native: InitLua arg2 -> +26c, Tick5c8381 strict >.
 // Jump/dodge permissions are the user's explicit S5Runtime behavioral correction;
 // the full native input-parent route was not established in this bounded pass.
 const phase2=attack.timeMs>attack.profile.lowerBeginMs;
 // The lower-body phase permits a jump while BB001 keeps playing. It is
 // not the end of the strike and must not unlock a dodge that clears it.
 // Once the native action timer exits, there is no attack policy to block Dodge.
 return {phase2,canDodge:false,canJump:phase2,preserveUpperOnJump:phase2,
  source:{boundary:'CAttackMovingState:5c8381, InitLua(40,300,false,false)',permissions:'user-observed S5Runtime correction; native parent route unresolved'}};
}
