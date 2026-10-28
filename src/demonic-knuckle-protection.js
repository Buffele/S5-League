// Verified portion of SetImmune / SetPlusDefensePowerRate.
// Evidence: work/melee-batch-5/demonic-knuckle/native-defense/README.md.
export const DEMONIC_KNUCKLE_PROTECTION=Object.freeze({
 immuneMs:1500,conditionType:0x800,defenseRate:.2,defenseSlot:0,
});

// Actor-owned, independent of the attack object. Do not clear on weapon switch
// or normal attack exit: only the defense rate belongs to CAttackState lifetime.
export function createDemonicKnuckleProtection({clockMode='native-u32'}={}){
 if(!['native-u32','arena-fractional-ms'].includes(clockMode))throw new RangeError('Explicit clock mode required');
 return {clockMode,immune:null,defenseRate:0};
}
export function enterDemonicKnuckleProtection(state){
 state.defenseRate=DEMONIC_KNUCKLE_PROTECTION.defenseRate;
 // 986160 refuses the new condition if an existing 0x800 condition is present.
 // Re-entry therefore does not refresh that condition's clock.
 if(!state.immune?.active)state.immune={active:true,elapsedMs:0,ticks:0,paused:false};
 return state;
}
export function leaveDemonicKnuckleProtection(state){
 state.defenseRate=0;
 return state;
}
export function advanceDemonicKnuckleProtection(state,dtMs){
 if(!Number.isFinite(dtMs)||dtMs<0||dtMs>0xffffffff||
    (state.clockMode==='native-u32'&&!Number.isInteger(dtMs)))throw new RangeError('Valid tick delta required');
 const immune=state.immune;
 if(!immune?.active)return false;
 if(!immune.paused){
  immune.ticks=(immune.ticks+1)>>>0;
  immune.elapsedMs=state.clockMode==='native-u32'?(immune.elapsedMs+dtMs)>>>0:immune.elapsedMs+dtMs;
  // 54ef40 returns elapsed <= duration; manager54ade0 removes on false.
  if(immune.elapsedMs>DEMONIC_KNUCKLE_PROTECTION.immuneMs)immune.active=false;
 }
 return immune.active;
}
// Port of the gate in 986160. It is not a damage/invincibility predicate.
// The caller must supply a real condition-add operation, not ordinary HP damage.
export function demonicKnuckleCanAddCondition(state,{bypassFlag=0}={}){
 return bypassFlag===1||!state?.immune?.active;
}

// Native b8b2a0 arithmetic, after initial component calculation. Components2/3
// are not reduced. Slot1 is an independent actor field and is not set by this
// Lua API. No inferred HP/SP mapping is embedded here.
export function demonicKnuckleDefenseComponents(components,rate){
 if(!Array.isArray(components)||components.length!==4||!components.every(Number.isFinite)||!Number.isFinite(rate))throw new TypeError('Four finite native components and a rate required');
 return components.map((value,index)=>index<2?demonicKnuckleDefenseValue(value,rate):value);
}
export function demonicKnuckleDefenseValue(value,rate){
 if(!Number.isFinite(value)||!Number.isFinite(rate))throw new TypeError('Finite damage and rate required');
 // The branch is >0, with no clamp to [0,1]. Runtime arène may call this for its
 // normalized damage, but that is not the full native equipment damage formula.
 if(rate<=0)return value;
 const v=Math.fround(value),r=Math.fround(rate);
 return Math.fround(v-Math.fround(v*r));
}
