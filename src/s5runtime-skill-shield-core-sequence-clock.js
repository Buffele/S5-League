// Source 119F230/119FAE0. This is a controller-clock port, not a particle renderer.
export function createShieldCoreSequenceClock({durationMs=2000,loop,rate=1,provenance}={}){
 if(typeof provenance!=='string'||!provenance.trim())throw Error('Clock provenance required');
 if(typeof loop!=='boolean')throw Error('Qualified resource loop flag required');
 if(!Number.isInteger(durationMs)||durationMs<=0||durationMs>0xffffffff)throw Error('Invalid native duration');
 if(!Number.isFinite(rate)||rate<0)throw Error('Invalid native rate');
 const nativeRate=Math.fround(rate);
 if(!Number.isFinite(nativeRate))throw Error('Native float32 rate overflow');
 return {previousMs:0,currentMs:0,startMs:0,endMs:durationMs,loop,enabled:true,rate:nativeRate,provenance};
}
export function advanceShieldCoreSequenceClock(state,dtMs){
 if(!Number.isInteger(dtMs)||dtMs<0||dtMs>0xffffffff)throw Error('Native uint32 dtMs required');
 state.previousMs=state.currentMs;
 if(state.enabled){
  // Source converts uint dt to float, multiplies rate then truncates with FPU RC=truncate.
  const increment=Math.trunc(Math.fround(dtMs)*state.rate);
  state.currentMs=(state.currentMs+increment)>>>0;
  if(state.currentMs>state.endMs){
   // finished is only this call's diagnostic early-return condition, never a native state field.
   if(!state.loop)return {previousMs:state.previousMs,currentMs:state.currentMs,updateActions:false,finished:true};
   state.currentMs=((state.currentMs-state.endMs)%(state.endMs-state.startMs)+state.startMs)>>>0;
  }
 }
 return {previousMs:state.previousMs,currentMs:state.currentMs,updateActions:true,finished:false};
}
export const SHIELD_CORE_SEQUENCE_ATTACHMENTS=Object.freeze(Array.from({length:4},(_,i)=>`shield_U_core_eff_0${i+1}_Dummy`));
export function shieldCoreSequenceAttachmentPlan({itemKey,modelNodes,provenance}={}){
 if(typeof provenance!=='string'||!provenance.trim())throw Error('Attachment provenance required');
 if(String(itemKey)==='3050001')return [];
 if(String(itemKey)!=='3050002')throw Error('Unsupported Shield item');
 if(!Array.isArray(modelNodes))throw Error('Source model nodes required');
 const entries=SHIELD_CORE_SEQUENCE_ATTACHMENTS.map((name,index)=>{
  const matches=modelNodes.map((node,i)=>({node,i})).filter(v=>v.node.name===name);
  if(matches.length!==1)throw Error('Missing or ambiguous Shield Dummy '+name);
  return {descriptorIndex:index,sourceNodeIndex:matches[0].i,parentName:name,
   sequencePath:'Effects/weapon_shield_u_core_eff_02.seq',modelPath:'',localPosition:[0,0,0],localQuaternion:[0,0,0,1],localScale:[1,1,1],
   provenance,nativeReady:false,nativeWorldTransformVerified:false};
 });
 return entries;
}
