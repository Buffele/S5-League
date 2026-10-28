const f=Math.fround;
// CAttackAimedShotState 57DE20: unsigned elapsed clock/state+28, modified
// duration+244, decoded powers+268/+274, actor attribute260 add/scale.
export function railGunChargePower({elapsedMs,chargeDurationMs,minPower,maxPower,attributeAdd,attributeScale}={}){
 if(!Number.isInteger(elapsedMs)||elapsedMs<0||elapsedMs>0xffffffff||!Number.isInteger(chargeDurationMs)||chargeDurationMs<=0||![minPower,maxPower,attributeAdd,attributeScale].every(Number.isFinite))throw new TypeError('Explicit native charge clock, duration, powers and actor modifiers required');
 const delta=f(f(maxPower)-f(minPower)),ratio=f(f(elapsedMs)/f(chargeDurationMs)),increment=f(delta*ratio),modified=f(f(increment+f(attributeAdd))+f(increment*f(attributeScale))),power=f(f(minPower)+modified);
 return {power:power>f(maxPower)?f(maxPower):power,full:power>=f(maxPower),ratio,clockProvenance:'57DE20 wall clock minus actor-state+28',nativeReady:false};
}
