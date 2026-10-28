import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {conquestNativeMoveVector} from './conquest-monster-movement.js';
const f=Math.fround,u32=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;
const scalar=v=>Number.isFinite(v)&&Number.isFinite(f(v));
export const CONQUEST_MONSTER_COLLISION_BODY_CONSTANTS=Object.freeze({
 actorInitialMask:0x5807bf,userClashBit:0x1000,conquestRemovedBit:0x80000,
 solverConstructorMask:0x17bf,bodyFactor:f(.5),constructorRadius:1,responseMask:0xffffffff,maximumIterations:5,
});

// A0C215/A0D050..77 and A0F085/A101A2..DC bind user_clash_check to
// record+274 as (signed XML/binary integer !=0), not as (integer==1).
export function conquestMonsterUserClashFlag(raw){
 if(!Number.isInteger(raw)||raw< -0x80000000||raw>0x7fffffff)throw Error('Explicit native signed user_clash_check value required');
 return raw!==0;
}
export function conquestMonsterSourceCollisionFlag(monsterKey){
 const raw=CONQUEST_SOURCE_DATA.monsters[monsterKey]?.Ability?.user_clash_check;
 if(typeof raw!=='string'||!/^[-+]?\d+$/.test(raw.trim()))throw Error('Authenticated monster user_clash_check required');
 return conquestMonsterUserClashFlag(Number(raw));
}
// A01170 +318, then A01B30. An absent native rule object is explicit null.
export function conquestMonsterCollisionMask({userClashCheck,ruleId}={}){
 if(typeof userClashCheck!=='boolean'||ruleId!==null&&(!u32(ruleId)||ruleId>255))throw Error('Explicit native monster clash flag and rule byte/null required');
 const c=CONQUEST_MONSTER_COLLISION_BODY_CONSTANTS;let mask=c.actorInitialMask;
 if(userClashCheck)mask|=c.userClashBit;if(ruleId===12)mask&=~c.conquestRemovedBit;
 return mask>>>0;
}

// Fresh actor+118 only: A02770 creates7AFFF0, anchors via7B0C10, then
// applies offset7B0BE0 and radii7B0B80 from its actual property getters.
// Immediate0x21 means table index33 (0.5), NOT decimal21 (0.05).
// This factory must not reset a running solver every frame.
export function conquestMonsterFreshCollisionBody({width,height,position,userClashCheck,ruleId}={}){
 if(![width,height].every(value=>scalar(value)&&value>=0))throw Error('Explicit stored native monster width/height required');
 const p=conquestNativeMoveVector(position),w=f(width),h=f(height),c=CONQUEST_MONSTER_COLLISION_BODY_CONSTANTS;
 const halfWidth=f(w*c.bodyFactor),halfHeight=f(h*c.bodyFactor),anchor=[p.x,p.y,p.z];
 const collisionMask=conquestMonsterCollisionMask({userClashCheck,ruleId});
 return {collisionMask,width:w,height:h,userClashCheck,ruleId,
  state:{offset678:[0,halfHeight,0],anchor684:[...anchor],radii690:[halfWidth,halfHeight,halfWidth],lastSafe69c:[...anchor],
   contactPoint660:[0,0,0],normal66c:[0,0,0],grounded6b4:false,found650:false,nearest658:-1,history:[],accumulatedCategoriesC:0},
  solverDefaults:{constructorMask:c.solverConstructorMask,responseMask:c.responseMask,maximumIterations:c.maximumIterations,nativeField6B8:0},
  nativeReady:false};
}

// XML dimensions × sampled size are stored by the real A0/A8 setters without
// an extra scale; actor creation's property getters60/64 return those bits.
export function conquestMonsterSourceCollisionBody({monsterKey,size,position,ruleId}={}){
 const ability=CONQUEST_SOURCE_DATA.monsters[monsterKey]?.Ability;
 if(!ability||!scalar(size)||f(size)<f(Number(ability.size_min))||f(size)>f(Number(ability.size_max)))throw Error('Authenticated monster and sampled native size required');
 const width=f(f(Number(ability.boundWidth))*f(size)),height=f(f(Number(ability.boundHeight))*f(size));
 return {...conquestMonsterFreshCollisionBody({width,height,position,userClashCheck:conquestMonsterSourceCollisionFlag(monsterKey),ruleId}),monsterKey,nativeSize:f(size)};
}
