// Native57DE20: elapsed clock / charge duration, float32 interpolation of
// (maximum-minimum), actor condition0x260 flat/rate bonus, upper clamp.
// Input→state-entry latency and the equipment HP pipeline are separate.
export function cannonadeChargePower({minimumPower,maximumPower,elapsedMs,durationMs,flatBonus=0,bonusRate=0}){
 if(![minimumPower,maximumPower,elapsedMs,durationMs,flatBonus,bonusRate].every(Number.isFinite)||durationMs<=0||elapsedMs<0)throw new TypeError('Finite Cannonade charge parameters required');
 const f=Math.fround,minimum=f(minimumPower),maximum=f(maximumPower),delta=f(f(maximum-minimum)*f(f(elapsedMs)/f(durationMs)));
 const adjusted=f(f(delta+f(flatBonus))+f(delta*f(bonusRate)));
 return Math.min(maximum,f(minimum+adjusted));
}
