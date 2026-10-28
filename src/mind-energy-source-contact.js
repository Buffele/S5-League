import{MIND_ENERGY_SOURCE_DATA as source}from './mind-energy-source-data.js';
const vector=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
// Diagnostic cone only; target ordering, self exclusion and native LOS/angles
// remain unverified. Callers supply explicit team and visibility acceptance.
export function mindEnergySourceConeCandidate({origin,forward,targetPosition,sourceUnitScale,allyAccepted,lineOfSightAccepted}={}){
 if(![origin,forward,targetPosition].every(vector)||!Number.isFinite(sourceUnitScale)||sourceUnitScale<=0||typeof allyAccepted!=='boolean'||typeof lineOfSightAccepted!=='boolean')throw Error('Explicit Mind Energy cone vectors/scale/team/visibility required');
 const delta=targetPosition.map((v,i)=>v-origin[i]),distance=Math.hypot(...delta),length=Math.hypot(...forward);if(!length)throw Error('Nonzero Mind Energy forward required');
 const cosine=distance?delta.reduce((n,v,i)=>n+v*forward[i],0)/(distance*length):1,angleDegrees=Math.acos(Math.min(1,Math.max(-1,cosine)))*180/Math.PI;
 return{eligiblePreview:allyAccepted&&lineOfSightAccepted&&distance<=source.findLimit[0]*sourceUnitScale&&angleDegrees<=source.findLimit[1],distance,angleDegrees,sourceFindLimit:[...source.findLimit],targetOrderingNativeVerified:false,selfTargetPolicyNativeVerified:false,nativeReady:false};
}
export function mindEnergySourceHealingCommand(request,{targetId,allyAccepted,rangeAngleAccepted,lineOfSightAccepted,normalizedHealingRate,healingScale,conversionPolicy}={}){
 if(request?.sourceFunction!=='MindHeal'||request.sourceFunctionSha256!==source.sourceFunctionSha256)throw Error('Authenticated MindHeal request required');
 if(typeof allyAccepted!=='boolean'||typeof rangeAngleAccepted!=='boolean'||typeof lineOfSightAccepted!=='boolean')throw Error('Explicit healing target acceptance required');
 if(!allyAccepted||!rangeAngleAccepted||!lineOfSightAccepted)return{accepted:false,reason:'target-not-accepted',nativeReady:false};
 if(targetId===undefined||!Number.isFinite(normalizedHealingRate)||normalizedHealingRate<0||normalizedHealingRate>1||!Number.isFinite(healingScale)||healingScale<0||typeof conversionPolicy!=='string'||!conversionPolicy.trim())throw Error('Explicit healing target/rate/units conversion policy required');
 const[min,max]=source.healingHP;return{accepted:true,kind:'healing',targetId,requestSerial:request.serial,healingHp:(min+(max-min)*normalizedHealingRate)*healingScale,damageHp:0,conversionPolicy,sourceDocumentedFormula:true,nativeConsumerBindingVerified:false,nativeReady:false};
}
