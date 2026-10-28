const f=Math.fround;
const finite=(value,name)=>{if(!Number.isFinite(value))throw new TypeError('Explicit finite '+name+' required');return f(value);};

// Original B8B2A0 arithmetic for a source whose peer kind is 6 and whose
// status getter154 is CMonster's ACD900 (null). B8BA20 supplies zero bonuses
// in that branch. AP338 and the XML base_attack are not inputs to this code.
// Defense/part/contact producers remain explicit; zero is not a default.
export function conquestMonsterDamageComponents({sourcePeerId,sourceStatusGetter,weaponType,rawPower,targetDefenseFlat,targetDefenseRate,targetReduction,partNormalMultiplier,partCriticalMultiplier,playerPartReduction}){
 if(!Array.isArray(sourcePeerId)||sourcePeerId.length!==2||!sourcePeerId.every(value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff)||(sourcePeerId[1]>>>16&7)!==6)throw new TypeError('Native source peer kind6 required');
 if(sourceStatusGetter!==0xacd900)throw new TypeError('Qualified CMonster status getter ACD900 required');
 if(!Number.isInteger(weaponType)||weaponType<0)throw new TypeError('Explicit nonnegative native weaponType required');
 const power=finite(rawPower,'working rawPower'),flat=finite(targetDefenseFlat,'target defense flat'),rate=finite(targetDefenseRate,'target defense rate'),reduction=finite(targetReduction,'target reduction');
 const normal=finite(partNormalMultiplier,'part normal multiplier'),critical=finite(partCriticalMultiplier,'part critical multiplier'),partReduction=finite(playerPartReduction,'player part reduction');
 let correction=0;
 if(power>0){
  const defense=f(f(power*rate)+flat);
  correction=f(correction-defense);
  correction=f(correction-f(reduction*0));
  correction=f(correction-f(f(power*0)*reduction));
  correction=f(correction-f(reduction*power));
  if(f(power+correction)<0){const difference=f(power-1);correction=f((difference<0?1:-1)*difference);}
 }
 const total=f(power+correction),normalBefore=f(normal*total),criticalBefore=f(critical*total);
 return Object.freeze({component0:partReduction>0?f(normalBefore-f(normalBefore*partReduction)):normalBefore,
  component1:partReduction>0?f(criticalBefore-f(criticalBefore*partReduction)):criticalBefore,
  component2:f(normal*0),component3:f(critical*0),nativeReady:false});
}

