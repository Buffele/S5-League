// Dagger numeric kernel only; current equipment/critical/contact owners are separate gates.
// Proof: conquest-dagger-20261023/qualify-components.py executes original type24.
const f=Math.fround;
const finite=(v,name)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw Error('Finite Spy Dagger '+name+' required');return f(v);};
// Original B8B2A0 -> B8BA20/B8C660 and CMonster B8D640, executed with actual
//type24. Type24 selects melee equipment indices4/5; no rifle or Handgun22 cast.
export function conquestDaggerDamageComponents({sourcePeerId,weaponType,workingPower,sourceBonusFlat,sourceBonusRate,targetDefenseRate,targetReduction,partNormalMultiplier,partCriticalMultiplier}={}){
 if(!Array.isArray(sourcePeerId)||sourcePeerId.length!==2||sourcePeerId.some(v=>!Number.isInteger(v)||v<0||v>0xffffffff)||(sourcePeerId[1]>>>16&7)!==1||weaponType!==24)throw Error('Actual player kind1 Spy Dagger type24 required');
 const power=finite(workingPower,'power'),flat=finite(sourceBonusFlat,'flat bonus'),rate=finite(sourceBonusRate,'rate bonus'),defense=finite(targetDefenseRate,'defense'),reduction=finite(targetReduction,'reduction'),normal=finite(partNormalMultiplier,'normal part'),critical=finite(partCriticalMultiplier,'critical part');
 let correction=f(f(0+flat)+f(power*rate));const sourceCorrection=correction;
 if(f(power+correction)>0){const defenseAmount=f(f(power*defense)+0);correction=f(correction-defenseAmount);correction=f(correction-f(reduction*flat));correction=f(correction-f(f(power*rate)*reduction));correction=f(correction-f(reduction*power));if(f(power+correction)<0){const difference=f(power-1);correction=f((difference<0?1:-1)*difference);}}
 const total=f(power+correction);return Object.freeze({component0:f(normal*total),component1:f(critical*total),component2:f(normal*sourceCorrection),component3:f(critical*sourceCorrection),nativeReady:false});
}
export function conquestDaggerMonsterDefenseRate({resistances,property208Rate}={}){
 if(!Array.isArray(resistances)||resistances.length!==3)throw Error('Actual three monster resistance rows required');let defense=0;
 for(const row of resistances){if(!Number.isInteger(row?.category)||row.category<0||row.category>255)throw Error('Native monster category byte required');const rate=finite(row.rate,'monster resistance');if(row.category===9)defense=f(defense+rate);else if(row.category!==0)throw Error('Source category9A8750 table producer missing for specific resistance category '+row.category);}
 defense=f(defense+finite(property208Rate,'live aura208/4C'));return defense<f(.9998999834060669)?defense:f(.9998999834060669);
}
