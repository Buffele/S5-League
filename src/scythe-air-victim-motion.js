// Blow16 Tick603A50, special source-current-weapon42 / received-attribute171.
// This is the RECEIVER'S extra actor.virtual70 displacement, not the attacker's
// CAttack StaySky500 gate. It neither freezes physics nor writes the F0 velocity.
// Actor virtual8C=5300E0 supplies the source's decoded actor+A8 direction.
// Source proof: blow-tick603AB4..603E51; RotateX100B8A0; normalize100B100.
// All live fields and registry values are explicit. No5/45/500 defaults.
const f=Math.fround;
export const SCYTHE_AIR_VICTIM_MOTION=Object.freeze({nativeReady:false,
 sourceWeaponType:42,receivedAttributeId:171,degreesToRadians:0.017453292521994,
 displacementBasis:'native actor axes and units; convert once at the world boundary'});

function uint(value,label){
 if(!Number.isInteger(value)||value<0||value>0xffffffff)throw new TypeError(`Explicit uint32 ${label} required`);
 return value;
}
function float(value,label){
 if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw new TypeError(`Finite float32 ${label} required`);
 return f(value);
}
function boolean(value,label){if(typeof value!=='boolean')throw new TypeError(`Explicit ${label} required`);return value;}
const skipped=reason=>({eligible:false,nativeReady:false,actorMode114:null,displacementNative:null,reason});

export function scytheAirVictimMotion({dtMs,actorRole3C,actorMode114,sourceResolved,
 sourceCurrentWeaponType,recordPresent,receivedAttributeId,sourceHeadingNative,
 float0,float47,float87,stateRate138}={}){
 if(boolean(actorRole3C,'actor slot3C result'))return skipped('Native role excludes local Blow progression');
 if(uint(actorMode114,'actor mode114')===0)return skipped('Native physical mode0 excludes the extra motion');
 if(!boolean(sourceResolved,'last damaging source identity resolution'))return skipped('Source actor not resolved');
 if(uint(sourceCurrentWeaponType,'current source weapon type')!==42)return skipped('Current source equipment is not42');
 if(!boolean(recordPresent,'current received-record presence'))return skipped('Current received record absent');
 if(uint(receivedAttributeId,'current received attribute')!==171)return skipped('Current received attribute is not171');

 uint(dtMs,'native engine delta');
 if(!Array.isArray(sourceHeadingNative)||sourceHeadingNative.length!==3)throw new TypeError('Explicit source actor+A8 XYZ required');
 const [x,,z]=sourceHeadingNative.map((n,i)=>float(n,`source heading component${i}`));
 const zero=float(float0,'registry Float0'),downRate=float(float47,'registry Float47');
 const angle=f(-float(float87,'registry Float87'));
 const rate=float(stateRate138,'current Blow state+138');

 //100B8A0: float argument -> double multiplication by the PE constant ->
 // float radians -> msvcr120 sin/cos(double) -> float sin/cos results.
 const radians=f(angle*SCYTHE_AIR_VICTIM_MOTION.degreesToRadians);
 const sin=f(Math.sin(radians)),cos=f(Math.cos(radians));
 // Float0 replaces temporary.Y BEFORE RotateX; preserve its original Z
 // while computing both rotated components, exactly as100B8A0 does.
 let y=f(f(zero*cos)-f(z*sin));
 let rz=f(f(zero*sin)+f(z*cos));
 let rx=x;
 //100B580 sums X²+Y² first, then Z², before double sqrt -> float length.
 const length=f(Math.sqrt(f(f(f(rx*rx)+f(y*y))+f(rz*rz))));
 if(length!==0){
  const inverse=f(1/length);rx=f(rx*inverse);y=f(y*inverse);rz=f(rz*inverse);
 }
 //603CD9..603D7C: the now-rotated vector.Y is compared with Float0.
 // Only the positive-above-Float0 branch multiplies by -Float47.
 if(y>zero)y=f(y*f(-downRate));
 const magnitude=f(f(dtMs)*rate);
 return {eligible:true,nativeReady:false,actorMode114:2,
  displacementNative:[f(rx*magnitude),f(y*magnitude),f(rz*magnitude)]};
}
