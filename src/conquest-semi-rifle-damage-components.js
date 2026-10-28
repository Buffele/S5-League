import {assertConquestPlayerDamageSource,assertConquestPawnDamageState} from './conquest-player-monster-damage-record.js';
import {conquestNativePartDamageMultipliers} from './conquest-player-defense.js';
import {ConquestSemiRifleEquipmentPower} from './conquest-semi-rifle-equipment-power.js';

const f=Math.fround,receipts=new WeakMap();
const finite=(v,name)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw Error('Finite Semi Rifle '+name+' required');return f(v);};
// Original B8B2A0 -> B8BA20/B8C660 and CMonster B8D640, executed with actual
//type4. The classifier108ECB0 explicitly includes4; no Handgun22 cast is used.
export function conquestSemiRifleDamageComponents({sourcePeerId,weaponType,workingPower,sourceBonusFlat,sourceBonusRate,targetDefenseRate,targetReduction,partNormalMultiplier,partCriticalMultiplier}={}){
 if(!Array.isArray(sourcePeerId)||sourcePeerId.length!==2||sourcePeerId.some(v=>!Number.isInteger(v)||v<0||v>0xffffffff)||(sourcePeerId[1]>>>16&7)!==1||weaponType!==4)throw Error('Actual player kind1 Semi Rifle type4 required');
 const power=finite(workingPower,'power'),flat=finite(sourceBonusFlat,'flat bonus'),rate=finite(sourceBonusRate,'rate bonus'),defense=finite(targetDefenseRate,'defense'),reduction=finite(targetReduction,'reduction'),normal=finite(partNormalMultiplier,'normal part'),critical=finite(partCriticalMultiplier,'critical part');
 let correction=f(f(0+flat)+f(power*rate));const sourceCorrection=correction;
 if(f(power+correction)>0){const defenseAmount=f(f(power*defense)+0);correction=f(correction-defenseAmount);correction=f(correction-f(reduction*flat));correction=f(correction-f(f(power*rate)*reduction));correction=f(correction-f(reduction*power));if(f(power+correction)<0){const difference=f(power-1);correction=f((difference<0?1:-1)*difference);}}
 const total=f(power+correction);return Object.freeze({component0:f(normal*total),component1:f(critical*total),component2:f(normal*sourceCorrection),component3:f(critical*sourceCorrection),nativeReady:false});
}
export function conquestSemiRifleMonsterDefenseRate({resistances,property208Rate}={}){
 if(!Array.isArray(resistances)||resistances.length!==3)throw Error('Actual three monster resistance rows required');let defense=0;
 for(const row of resistances){if(!Number.isInteger(row?.category)||row.category<0||row.category>255)throw Error('Native monster category byte required');const rate=finite(row.rate,'monster resistance');if(row.category===9)defense=f(defense+rate);else if(row.category!==0)throw Error('Source category9A8750 table producer missing for specific resistance category '+row.category);}
 defense=f(defense+finite(property208Rate,'live aura208/4C'));return defense<f(.9998999834060669)?defense:f(.9998999834060669);
}
// Retains the genuine player constructor/equipment fields and the same target
//damageState used by aura/HP owners. Produces components, never final record50.
export class ConquestSemiRifleDamageComponents{
 #config;#disposed=false;
 constructor(config={}){if(!(config.equipmentPowerOwner instanceof ConquestSemiRifleEquipmentPower))throw Error('Actual Semi Rifle equipment owner required');this.#config={...config};this.#live();}
 #live(){if(this.#disposed)throw Error('Disposed Semi Rifle component owner');const c=this.#config;assertConquestPlayerDamageSource(c);if(c.controller.weapon!=='semirifle')throw Error('Actual Semi Rifle source required');c.equipmentPowerOwner.assertSource({controller:c.controller,defenseState:c.sourceState.defenseState});}
 prepare({actor,pawnState,equipmentReceipt,sourcePeerId,hitPart}={}){
  this.#live();const c=this.#config;assertConquestPawnDamageState({pawnState,actor,monsterActors:c.monsterActors});if(!Number.isInteger(hitPart)||hitPart<0||hitPart>255)throw Error('Actual native contact part byte required');
  const equipment=c.equipmentPowerOwner.assertReceipt(equipmentReceipt,{controller:c.controller,defenseState:c.sourceState.defenseState}),state=c.sourceState.defenseState;
  if(!Array.isArray(state.conditions)||state.conditions.length!==0||typeof state.statusManagerPresent!=='boolean')throw Error('Genuine empty Semi Rifle source conditions/status presence required');
  let flat=0,rate=0;const indices=[4,10,hitPart===1?11:12];
  if(state.statusManagerPresent){const a=state.equipment?.flat,b=state.equipment?.rate;if(a?.length!==33||b?.length!==33)throw Error('Actual retained33-field attack equipment arrays required');for(const index of indices){flat=f(flat+finite(a[index],'flat'+index));rate=f(rate+finite(b[index],'rate'+index));}rate=f(rate+finite(c.sourceState.actorRate3d8,'actor3D8'));}
  const defense=conquestSemiRifleMonsterDefenseRate(pawnState);if(!(pawnState.properties instanceof Map))throw Error('Actual retained monster property table required');const reduction=pawnState.properties.has(0x15f4590)?finite(pawnState.properties.get(0x15f4590),'target reduction'):0;
  const components=conquestSemiRifleDamageComponents({sourcePeerId,weaponType:4,workingPower:equipment.declaredWorkingPower,sourceBonusFlat:flat,sourceBonusRate:rate,targetDefenseRate:defense,targetReduction:reduction,...conquestNativePartDamageMultipliers(hitPart)});
  this.#live();const receipt=Object.freeze({actor,weaponType:4,attackAttribute:34,shotSerial:equipment.shotSerial,hitPart,equipmentIndices:Object.freeze(indices),components,sourceBonusFlat:flat,sourceBonusRate:rate,targetDefenseRate:defense,targetReduction:reduction,componentKernelQualified:true,finalRecordQualified:false,nativeReady:false});receipts.set(receipt,{owner:this,actor,pawnState,equipmentReceipt});return receipt;
 }
 assertReceipt(receipt){this.#live();const r=receipts.get(receipt),c=this.#config;if(r?.owner!==this)throw Error('Actual private Semi Rifle component receipt required');assertConquestPawnDamageState({pawnState:r.pawnState,actor:r.actor,monsterActors:c.monsterActors});c.equipmentPowerOwner.assertReceipt(r.equipmentReceipt);return receipt;}
 dispose(){this.#disposed=true;}
}
