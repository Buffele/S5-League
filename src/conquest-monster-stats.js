import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
const f=Math.fround,profiles=new Map();
export const CONQUEST_STAT_DRAW_ORDER=Object.freeze(['size','moveSpeed','attackPower','health']);
export function conquestMonsterProfile(monsterKey){
 if(!Number.isInteger(monsterKey)||!Object.hasOwn(CONQUEST_SOURCE_DATA.monsters,monsterKey))throw Error('Explicit source Conquest monster key required');
 if(profiles.has(monsterKey))return profiles.get(monsterKey);
 const ability=CONQUEST_SOURCE_DATA.monsters[monsterKey].Ability;
 const value=key=>{const raw=ability[key],number=Number(raw);if(typeof raw!=='string'||!raw.trim()||!Number.isFinite(number))throw Error('Native monster attribute unresolved: '+key);return number;};
 const range=(min,max)=>Object.freeze([f(value(min)),f(value(max))]);
 const attack=value('base_attack');if(!Number.isInteger(attack)||attack< -0x80000000||attack>0x7fffffff)throw Error('Native signed32 base_attack required');
 const profile=Object.freeze({monsterKey,size:range('size_min','size_max'),moveSpeed:range('move_speed_min','move_speed_max'),attackPower:range('min_AP','max_AP'),health:range('min_HP','max_HP'),baseAttackRaw:attack>>>0});
 profiles.set(monsterKey,profile);return profile;
}
export function conquestSpawnStats(monsterKey,randValues){
 const profile=conquestMonsterProfile(monsterKey);
 if(!Array.isArray(randValues)||randValues.length!==4||![...randValues].every(n=>Number.isInteger(n)&&n>=0&&n<=32767))throw Error('Four explicit native CRT rand values required');
 // 549E70 consumes a draw even when the endpoints are equal. Keep descending
 // source ranges too (Pawn1013 AP15->5); do not sort or clamp them.
 const sample=(range,index)=>f(f(f(range[1]-range[0])*f(randValues[index]/32767))+range[0]);
 const size=sample(profile.size,0),moveSpeed=sample(profile.moveSpeed,1),attackPower=sample(profile.attackPower,2),health=sample(profile.health,3);
 return Object.freeze({monsterKey,size,moveSpeed,attackPower,healthRaw16:Math.trunc(health)&0xffff,baseAttackRaw:profile.baseAttackRaw});
}
