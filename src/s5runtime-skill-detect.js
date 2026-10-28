import {s5runtimeSkillDefinition} from './s5runtime-skill-data.js';
const f=Math.fround;
export function s5runtimeDetectNativeSquaredDistance(a,b){for(const v of [a,b])if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw Error('Explicit native actorSlot7C positions required');const d=a.map((v,i)=>f(f(b[i])-f(v)));return f(f(f(d[0]*d[0])+f(d[1]*d[1]))+f(d[2]*d[2]));}
//51B830 actorSlot174→componentB85F20. TickB85F10 is a no-op;
//this read-only query never consumes Action required_mp or changes equipment.
export function queryS5RuntimeDetectObserver({observerPositionNative,targetPositionNative,equippedItemKey=null,nativeCurrentActionType,effectiveActionFloat0,flat15b=0,percent15b=0,gameTempoFlat32,nativeContext}={}){
 if(nativeContext?.enabled!==true||nativeContext.observerDetectComponentOwnerConfirmed!==true)return {accepted:false,observerSlot174Result:null,reason:'native-detect-component-owner-required',nativeReady:false};
 if(nativeContext.observerDetectComponentExists!==true)return {accepted:true,observerSlot174Result:false,reason:'native-detect-component-absent',nativeReady:false};
 if(![flat15b,percent15b,gameTempoFlat32].every(Number.isFinite))throw Error('Explicit Detect15B/GameTempo32 required');
 const definition=s5runtimeSkillDefinition(equippedItemKey),sourceType=definition?.action?.resources.type,type=nativeCurrentActionType??(sourceType===undefined?null:Number(sourceType));let range=0;
 if(type===3){const base=effectiveActionFloat0??(sourceType==='3'?Number(definition.action.Float.Float_Value1):undefined);if(!Number.isFinite(base))return {accepted:false,observerSlot174Result:null,reason:'native-type3-action-float0-required',nativeReady:false};range=f(f(f(base)+f(flat15b))+f(f(base)*f(percent15b)));}
 const distanceSquared=s5runtimeDetectNativeSquaredDistance(observerPositionNative,targetPositionNative),thresholdSquared=f(f(range*range)+f(f(gameTempoFlat32)*f(gameTempoFlat32)));
 return {accepted:true,observerSlot174Result:thresholdSquared>=distanceSquared,distanceSquared,thresholdSquared,rangeNative:range,reason:'source-detect-observer-query',nativeReady:false};
}
