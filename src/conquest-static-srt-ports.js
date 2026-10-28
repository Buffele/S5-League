import {createSrtBaselinePorts,SRT_POLICY} from './s5runtime-srt-math.js';

// NEW explicit canonical Conquest contract: nested tick/provenance slots are
// immutable too. Generic createSrtBaselinePorts remains mutable and unchanged.
export function createConquestStaticSrtPorts(){
 const ports=createSrtBaselinePorts({policy:SRT_POLICY});
 Object.freeze(ports.quaternionSlerp);Object.freeze(ports.matrixTransformation);
 return Object.freeze(ports);
}
