import {CONQUEST_PLAYER_DAMAGE_PROFILES} from './conquest-monster-damage-player.js';
import {CONQUEST_NATIVE_PART_NORMAL,CONQUEST_NATIVE_PART_CRITICAL} from './conquest-player-defense-data.js';
import {CONQUEST_PAWN_SOURCE_ATTACK_ENUMS} from './conquest-pawn-ai-runtime-constants.js';
const f=Math.fround;
const finite=(value,name)=>{if(!Number.isFinite(value))throw new TypeError('Explicit finite '+name+' required');return f(value);};
const validProfile=vtable=>{if(!CONQUEST_PLAYER_DAMAGE_PROFILES[vtable])throw new TypeError('Qualified native player vtable required');};

//6D5970 initializes both33-float equipment arrays from constant_float0;
//B75710 initializes81 empty condition vectors;513FC0 initializes the class
//defense fields;97CC55→97CD20 initializes property15F4590 fromfloat0.
//Use once at actual actor construction, then retain/apply real item changes.
export function createInitialConquestPlayerDefenseState({playerVtable}){
 validProfile(playerVtable);
 return {playerVtable,statusManagerPresent:true,conditions:[],equipment:{flat:new Float32Array(33),rate:new Float32Array(33)},properties:new Map([[0x15f4590,0]]),fields:{field3e4:0,part43c:0,part440:0},nativeReady:false};
}

export function conquestNativePartDamageMultipliers(hitPart){
 if(!Number.isInteger(hitPart))throw new TypeError('Explicit native hit part required');
 return Object.freeze({partNormalMultiplier:hitPart<0||hitPart>=38?0:CONQUEST_NATIVE_PART_NORMAL[hitPart],partCriticalMultiplier:hitPart<0||hitPart>=38?0:CONQUEST_NATIVE_PART_CRITICAL[hitPart]});
}

const families=[
 [0x13,[52,0,1,13,14,20,24,26,33,38,39,42,43,47,50]],
 [0x14,[53,5,37]],
 [0x15,[54,8,9,19,36]],
 [0x16,[55,10,29,30,35,46]],
 [0x17,[56,11,25,12]],
 [0x18,[57,15,2,4,3,16,21,22,23,27,28,31,32,34,41,44,45,48,49]],
 [0x1c,[58,6,7,40]]
];

//B8CE20's exact native predicate order.7AE830 has an unconditional nonzero
//fallthrough, so non-head parts reach index26/30, including part0. Preserve
//that real behavior rather than replacing it with intuitive body-part groups.
export function conquestPlayerEquipmentDefenseIndices(weaponType,hitPart){
 if(!Number.isInteger(weaponType)||weaponType<0||weaponType>61)throw new TypeError('Qualified current native weaponType0..61 required');
 if(!Number.isInteger(hitPart)||hitPart<0||hitPart>255)throw new TypeError('Native contact part byte required');
 const indices=[0x12],family=families.find(([,types])=>types.includes(weaponType));
 if(family){const index=family[0];indices.push(index);if(index===0x18||index===0x1c)indices.push(index+(hitPart===1?1:2));}
 return Object.freeze(indices);
}

//No-buff player branchB8C2F5: every B75960 lookup traverses a genuinely
//empty condition vector. It contributes zero regardless of category lookup
//or the low-HP threshold. Numeric equipment and class fields still apply.
export function conquestPlayerDefenseProfile({playerVtable,weaponType,hitPart,playerState}){
 validProfile(playerVtable);
 if(playerState?.playerVtable!==playerVtable||typeof playerState.statusManagerPresent!=='boolean'||!Array.isArray(playerState.conditions)||!(playerState.properties instanceof Map))throw new TypeError('Actual retained player defense state required');
 if(playerState.conditions.length!==0)throw new TypeError('Active native condition aggregation is not yet qualified');
 const indices=conquestPlayerEquipmentDefenseIndices(weaponType,hitPart),flat=playerState.equipment?.flat,rate=playerState.equipment?.rate;
 if(flat?.length!==33||rate?.length!==33)throw new TypeError('Actual33-field equipment arrays required');
 let targetDefenseFlat=0,targetDefenseRate=0;
 if(playerState.statusManagerPresent){
  for(const index of indices){targetDefenseFlat=f(targetDefenseFlat+finite(flat[index],'equipment flat'+index));targetDefenseRate=f(targetDefenseRate+finite(rate[index],'equipment rate'+index));}
  targetDefenseRate=f(targetDefenseRate+finite(playerState.fields?.field3e4,'player field3E4'));
 }
 //980DB0 initializes a logical zero before querying property15F4590.
 const targetReduction=playerState.properties.has(0x15f4590)?finite(playerState.properties.get(0x15f4590),'property15F4590'):0;
 //52D7B0 selects440 forpart1; every other byte selects43C.
 const playerPartReduction=finite(playerState.fields?.[hitPart===1?'part440':'part43c'],'player part reduction');
 return Object.freeze({targetDefenseFlat,targetDefenseRate,targetReduction,playerPartReduction,...conquestNativePartDamageMultipliers(hitPart)});
}

// Authenticated BOSSSHOTA_LASER136 config calls SetDamageData(0,2,2).
//5F71D0 stores by-part2 atattributeEC;570FA7..570FFE only copies a contact
//part whenEC==1, so this actual Pawn branch uses map index0 for every hit.
export function conquestPawnPlayerDefenseProfile({playerVtable,weaponType,attackAttribute,playerState}){
 if(weaponType!==CONQUEST_PAWN_SOURCE_ATTACK_ENUMS.weaponType||attackAttribute!==CONQUEST_PAWN_SOURCE_ATTACK_ENUMS.attackAttribute)throw new TypeError('Authenticated Pawn attack enums55/136 required');
 return conquestPlayerDefenseProfile({playerVtable,weaponType,hitPart:0,playerState});
}
