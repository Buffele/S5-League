// Compatibility entry point for the original Counter-only bridge.
import {createSourceMeleeVictimPushes} from './source-melee-victim-push.js';
export {SOURCE_MELEE_PUSH_POLICY as COUNTER_PUSH_POLICY} from './source-melee-victim-push.js';
export function createCounterVictimPushes(){return createSourceMeleeVictimPushes({weapons:['counter']});}
