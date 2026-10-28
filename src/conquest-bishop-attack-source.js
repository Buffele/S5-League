import {CONQUEST_BISHOP_SOURCE} from './conquest-bishop-source.js';

// Authenticated MonsterAI_Bishop_Normal Create, not a Knight/Pawn attack.
// Ray length is deliberately absent: A22410 captures the current limit when
// Lua creates the real shape, through the separate Bishop range owner.
export const CONQUEST_BISHOP_ATTACK=Object.freeze({id:'5:1',stateInput:5,index:1,
 weaponType:60,attributeId:152,collisionDelayMs:800,rawPower:20,rawAdditionalPower:0,
 shapeType:7,rayWidth:50,initAttack2:Object.freeze([1,1,false]),
 collisionRangeAdjust:Object.freeze([false,false]),pushConditions:Object.freeze([]),
 blow:Object.freeze([1000,2000]),scriptSha256:CONQUEST_BISHOP_SOURCE.scriptSha256});
export const CONQUEST_BISHOP_ATTACK_STATES=Object.freeze([Object.freeze({
 stateId:5,input:5,durationMs:1600,animationSpeed:1.5,updatePosDir:true,
 attacks:Object.freeze([CONQUEST_BISHOP_ATTACK]),
})]);
