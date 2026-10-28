// Devil tag, authenticated slaughtertagattribindexer.lua lines 58–64.
// Damage and recovery use the proven native factors.
// Native dda4f0 computes factors from the initial chased account count:
// s/(s+3)*4, .1/(s+2), s/(s+2)*3. Native 9817e0 selects the first
// two by actor identity; 51e8e0 multiplies recovery by +d0 for the Chaser.
// See work/chaser-visuals/audit/native-combat-factors.json.
export const CHASER_ATTRIBUTES=Object.freeze({attackAdd:3,attackFactor:4,receivedAdd:2,receivedFactor:.1,energyAdd:2,energyFactor:3,reloadReduction:.4,moveFactor:1.3});
// Native 62dc30 subtracts trunc(f32(f32(baseMs) * f32(coefficient))).
// This covers the role reduction without equipment reductions; see
// work/chaser-visuals/audit/native-reload-movement.json.
export function chaserReloadTimeScale(baseMs,reduction=CHASER_ATTRIBUTES.reloadReduction){
 if(!Number.isInteger(baseMs)||baseMs<1||baseMs>0xffffffff||!Number.isFinite(reduction)||reduction<0||reduction>=1)throw new RangeError('Positive uint32 duration and reduction in [0,1) required');
 const reducedMs=(baseMs-Math.trunc(Math.fround(Math.fround(baseMs)*Math.fround(reduction))))>>>0;
 if(!reducedMs)throw new RangeError('Chaser reload duration must remain positive');
 return baseMs/reducedMs;
}
export function chaserCombatFactors(initialChased){
 const s=Math.fround(Math.max(0,initialChased||0));if(!s)return {attack:1,received:1,energy:1};
 return {attack:Math.fround(Math.fround(s/Math.fround(s+CHASER_ATTRIBUTES.attackAdd))*CHASER_ATTRIBUTES.attackFactor),
  received:Math.fround(Math.fround(1/Math.fround(s+CHASER_ATTRIBUTES.receivedAdd))*Math.fround(CHASER_ATTRIBUTES.receivedFactor)),
  energy:Math.fround(Math.fround(s/Math.fround(s+CHASER_ATTRIBUTES.energyAdd))*CHASER_ATTRIBUTES.energyFactor)};
}
export function chaserRoleModifiers(initialChased){
 return {...CHASER_ATTRIBUTES,energyAdd:0,energyFactor:chaserCombatFactors(initialChased).energy};
}
export function chaserDamage(profile,{attacking=false,receiving=false,initialChased=0}={}){
 let damage=profile.damage;
 const factors=chaserCombatFactors(initialChased);
 // Native reader returns one for equal actor flags; never stack both roles.
 if(damage>0&&attacking!==receiving)damage=Math.fround(Math.fround(damage)*(attacking?factors.attack:factors.received));
 return {...profile,damage};
}
