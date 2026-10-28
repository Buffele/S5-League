// S5 presentation containment, not a change to the native arithmetic.
// Native1137C50 can divide by zero at an exact appearance key (Pawn node4,
// life171/age133). Nonfinite cosmetic fields must not stop the match owner.
export function retireNonFiniteConquestParticle(fields){
 if(!(fields instanceof DataView)||fields.byteLength!==0xac)throw Error('Actual retained particle layout required');
 const offsets=[0,...Array.from({length:37},(_,i)=>0x0c+i*4)];
 if(offsets.every(offset=>Number.isFinite(fields.getFloat32(offset,true))))return false;
 fields.setUint32(4,0xffffffff,true);return true;
}
