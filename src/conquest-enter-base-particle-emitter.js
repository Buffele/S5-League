import {conquestEnterBaseParticleSourceNode} from './conquest-enter-base-particle-source.js';
import {CONQUEST_PAWN_PARTICLE_NUMERICS} from './conquest-pawn-particle-simulation.js';
import {assertConquestPawnDeathFrame,assertConquestPawnDeathFrameReceipt} from './conquest-pawn-death-frame.js';
const f=Math.fround,integerOffsets=new Set([0x34,0x58,0x5c,0x60]);
const owners=new WeakMap(),receipts=new WeakMap();

// The retained Death root has an identity quaternion. This scope is explicit:
// other rotations require the actual D3DX transform implementation/adapter.
export const CONQUEST_ENTER_BASE_EMITTER_IDENTITY_TRANSFORM=Object.freeze({name:'enter-base-emitter-retained-identity-quaternion',quaternion:Object.freeze([0,0,0,1]),nativeD3DXImplementationQualified:false});

// Original123A380 scalar clone +1137A3E..1137C34 inherited fields. The seven
// authenticated source tracks have exactly one key, so123B010 selects it at
// every time. Never scale a previously evaluated row (scale would accumulate).
// This is a low-level stage: a caller-supplied frame is not a typed root owner.
export function updateConquestEnterBaseParticleEmitterFields(fields,{source,nodeIndex,numericalProfile,transformProfile,runtimeFrame,burstLatch}={}){
 if(!(fields instanceof DataView)||fields.byteLength<0x64)throw Error('Retained current emitter layout required');
 if(numericalProfile!==CONQUEST_PAWN_PARTICLE_NUMERICS||transformProfile!==CONQUEST_ENTER_BASE_EMITTER_IDENTITY_TRANSFORM)throw Error('Explicit Pawn emitter numerical and transform profiles required');
 const node=conquestEnterBaseParticleSourceNode(source,nodeIndex),q=runtimeFrame?.quaternionNative,scale=f(runtimeFrame?.parentScale);
 if(!Array.isArray(q)||q.length!==4||q.some((x,i)=>x!==transformProfile.quaternion[i])||!Number.isFinite(scale)||scale<0||typeof burstLatch!=='boolean')throw Error('Current identity quaternion, nonnegative finite scale and retained burst latch required');
 // Native clone destroys a non-null optional key-owned object at+8. This
 // scoped S5 scalar row owns no such object; refuse that branch before writes.
 if(fields.getUint32(8,true)!==0)throw Error('Emitter scalar row cannot discard an unowned native key object');
 const oldKeyTime=fields.getUint32(0x0c,true),next=new DataView(new ArrayBuffer(0x64));
 next.setUint32(0x0c,node.emitterKeyTime,true);next.setUint8(0x10,Number(node.emitterContinuous));
 for(let off=0x14;off<=0x60;off+=4){if(integerOffsets.has(off))next.setUint32(off,node.emitter[off]>>>0,true);else next.setFloat32(off,node.emitter[off],true);}
 // FILD(uint32)->FSTP(float32)->multiply->FISTP(int64,trunc), low32.
 for(const [off,mask] of [[0x58,8],[0x5c,2]]){const factor=(node.inheritanceMask&mask)?scale:1,product=f(next.getUint32(off,true))*factor;next.setUint32(off,product>=2**63?0:Math.trunc(product)>>>0,true);}
 const spatialScale=(node.inheritanceMask&1)?scale:1;
 // TransformCoord(v, identity rotation matrix) preserves the source vector;
 //1135880 and x87 callers then store each multiplication as float32.
 for(const off of [0x14,0x18,0x1c,0x38,0x3c,0x40,0x44])next.setFloat32(off,f(next.getFloat32(off,true)*spatialScale),true);
 // Preserve row base/vtable and null optional ownership; source clone writes
 // only+C, byte10 and14..60, leaving bytes11..13 unchanged.
 fields.setUint32(0x0c,next.getUint32(0x0c,true),true);fields.setUint8(0x10,next.getUint8(0x10));
 for(let off=0x14;off<=0x60;off+=4)fields.setUint32(off,next.getUint32(off,true),true);
 return Object.freeze({sourceKeyTime:node.emitterKeyTime,burstLatch:oldKeyTime===node.emitterKeyTime?burstLatch:false,sourceScalarCloneQualified:true,oneKeySelectionQualified:true,inheritanceStageQualified:true,numericalProfile:numericalProfile.name,transformProfile:transformProfile.name,runtimeFrameProducerQualified:false,emitterRowProducerQualified:false,nativeD3DXImplementationQualified:false,emissionAdmissionQualified:false,effectLifetimeQualified:false,nativeReady:false});
}

export function createConquestEnterBaseParticleEmitter({source,nodeIndex,numericalProfile,frameOwner,actor,world,scene}={}){
 conquestEnterBaseParticleSourceNode(source,nodeIndex);
 if(numericalProfile!==CONQUEST_PAWN_PARTICLE_NUMERICS)throw Error('Explicit Pawn emitter numerical profile required');
 const retained={actor,world,scene},live=()=>assertConquestPawnDeathFrame(frameOwner,retained);
 live();
 const initial=frameOwner.readFrame();assertConquestPawnDeathFrameReceipt(initial,{owner:frameOwner});
 if(!initial.enterBase||initial.sequencePath!=='Resources/Effects/enter_base.seq')throw Error('Exact Enter Base Death sequence frame required');
 // FE75B8 clears optional+8;123A04E initializes keytime0. The runtime
 //1135CBA owns the initial false burst latch. Other constructor defaults are
 // overwritten from the one source row before exposing a receipt.
 const fields=new DataView(new ArrayBuffer(0x64));let burstLatch=false,revision=0,disposed=false,lastStage=null;
 function valid(){if(disposed)throw Error('Pawn emitter disposed');live();}
 function read(){valid();if(!lastStage)throw Error('Pawn emitter source row has not been evaluated');const currentFields=new DataView(fields.buffer.slice(0)),receipt=Object.freeze({...lastStage,kind:'conquest-owned-enter-base-particle-emitter',nodeIndex,currentFields,revision,runtimeFrameProducerQualified:true,emitterRowProducerQualified:true,sourceRetainedFieldInitializationQualified:true,initializedSourceFields:Object.freeze(['key+8=null','key+C=0','runtime+38=false'])});receipts.set(receipt,{owner:api,revision});return receipt;}
 const api=Object.freeze({nodeIndex,
  update(frameReceipt){valid();const frame=assertConquestPawnDeathFrameReceipt(frameReceipt,{owner:frameOwner});if(!frame.enterBase||frame.sequencePath!==initial.sequencePath)throw Error('Current Enter Base Death source frame required');lastStage=updateConquestEnterBaseParticleEmitterFields(fields,{source,nodeIndex,numericalProfile,transformProfile:CONQUEST_ENTER_BASE_EMITTER_IDENTITY_TRANSFORM,runtimeFrame:frame,burstLatch});burstLatch=lastStage.burstLatch;revision++;return read();},
  readCurrentFields:read,
  dispose(){disposed=true;},
 });
 owners.set(api,{source,nodeIndex,valid,fields,get revision(){return revision;}});return api;
}
export function assertConquestEnterBaseParticleEmitterReceipt(receipt,{owner}={}){
 const retained=owners.get(owner),proof=receipts.get(receipt);
 if(!retained||proof?.owner!==owner||proof.revision!==retained.revision)throw Error('Original current Pawn emitter receipt required');retained.valid();
 const bytes=new Uint8Array(receipt.currentFields.buffer,receipt.currentFields.byteOffset,receipt.currentFields.byteLength),actual=new Uint8Array(retained.fields.buffer);
 if(bytes.length!==actual.length||bytes.some((x,i)=>x!==actual[i]))throw Error('Pawn emitter receipt fields changed');return receipt;
}
