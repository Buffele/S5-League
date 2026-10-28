// Native549E70 (uniform),5763D0 (mean of uniform draws),573B60 (gate).
// Exact float32/float64 operation boundaries are preserved; this is NOT a
// Box-Muller normal distribution. A native matching seed/stream is separate.
const f=Math.fround;
function draw(random){const value=random.next();if(!Number.isInteger(value)||value<0||value>32767)throw new RangeError('Expected native15-bit rand value');return value;}
export function nativeUniformDamage(minimum,maximum,random){
 const ratio=f(f(draw(random))/32767);return f(f(f(f(maximum)-f(minimum))*ratio)+f(minimum));
}
export function nativeAverageDamage(minimum,maximum,samples,random){
 if(!Number.isInteger(samples)||samples<1||samples>100000)throw new RangeError('Unsupported native sample count');
 let total=0;for(let i=0;i<samples;i++)total+=draw(random)/32767;
 return f(f(f(maximum)-f(minimum))*(total/samples)+f(minimum));
}
export function nativeAttackRandomBonus({minimum,maximum,probability,samples},random){
 if(![minimum,maximum,probability,samples].every(Number.isInteger))throw new TypeError('Native bonus parameters must be integers');
 if(probability<=0||minimum===maximum)return {bonus:0,gate:null,drawCount:0};
 const gate=nativeUniformDamage(0,100,random);if(gate>f(probability))return {bonus:0,gate,drawCount:1};
 const gaussian=samples>0,bonus=gaussian?nativeAverageDamage(minimum,maximum,samples,random):nativeUniformDamage(minimum,maximum,random);
 return {bonus,gate,drawCount:1+(gaussian?samples:1)};
}
export const ROCKET_RANDOM_DAMAGE=Object.freeze({primary:Object.freeze({minimum:15,maximum:20,probability:50,samples:100}),secondary:Object.freeze({minimum:0,maximum:20,probability:30,samples:1})});
export function nativeRocketExplosionPower(power,mode,random){
 const bonus=nativeAttackRandomBonus(ROCKET_RANDOM_DAMAGE[mode],random),base=f(f(power)*f(mode==='secondary'?1:.5));
 // 56D320 stores original source power + the single random roll, before
 // equipment/critical and per-target distance/owner factors are applied.
 return {...bonus,base,power:f(base+bonus.bonus)};
}
