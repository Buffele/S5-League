import {createConquestStaticSrtPorts} from './conquest-static-srt-ports.js';

// Retained identity shared by navigation construction and its optional compiled
// distance kernel. This is the existing analytical policy, not native x87 proof.
export const CONQUEST_NAVIGATION_WORLD_MATH_PROFILE=Object.freeze({qualified:true,
 source:'Explicit analytical JS53/SRT baseline with source float stores, float24 nearest construction and reciprocal .999755859375; native tree arithmetic/x87 control word unobserved',
 transformPorts:createConquestStaticSrtPorts(),reciprocalOneEstimate:.999755859375,precisionBits:24,roundingMode:'nearest',roundX87:value=>value});
