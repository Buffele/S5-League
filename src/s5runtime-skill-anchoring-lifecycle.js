import {s5runtimeAnchoringRequiredSp} from './s5runtime-skill-anchoring-kernel.js';
import {requestS5RuntimeAnchoringPrimaryPhase,requestS5RuntimeAnchoringSecondaryPhase} from './s5runtime-skill-anchoring-machine.js';
const f=Math.fround;
const names=['baseEnter','baseLeave','readActorSlot3c','readStateProperty4','readActionFloat','readConstantFloat','readSceneResource','readActionF4fa00','readBody19c','modelCommand','modelLookup','modelParent','configure19c','readAttribute15A','readMp','writeMp','readNativeSpWritePermitted','actorWrite','releaseBody1a4','globalEnterToggle','globalLeavePrelude','globalLeaveToggle','sequenceCacheEntry'];
function finite(v,label){if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw Error('Finite float32 '+label+' required');return f(v);}
function uint(v){const n=Math.trunc(v);if(!Number.isFinite(v)||n<0||n>0xffffffff)throw Error('Supported native uint32 conversion required');return n;}
function invoke(l,name,args){const r=l.ports[name](args);if(r&&(typeof r.then==='function'||typeof r.next==='function'))throw Error('Suspended lifecycle result forbidden: '+name);return r;}
function run(l,name,args){const r=invoke(l,name,args);if(r?.executedSourceBranch!==true)throw Error('Qualified lifecycle branch execution required: '+name);return r;}
function bool(l,name,args){const r=invoke(l,name,args);if(typeof r!=='boolean')throw Error('Raw lifecycle bool required: '+name);return r;}
function writeActor(l,field,value){run(l,'actorWrite',{field,value,state:l.state});}
function command(l,model,operation,args=[]){return run(l,'modelCommand',{model,operation,args,state:l.state});}
function matches(l,m,nc){return nc?.enabled===true&&nc.bodyVtable===0x13b6884&&nc.bodyEntrySerial===l.state.bodyEntrySerial&&m?.state?.bodyEntrySerial===l.state.bodyEntrySerial&&m.state.itemKey===l.state.itemKey;}
function detach(l,model){
 if(!model)return;
 const guard=invoke(l,'modelParent',{model,state:l.state,readStage:'guard'});if(guard===undefined)throw Error('Explicit null or actual model parent required');
 if(guard){
  //Native calls vslot88 again after the guard. Do not reuse its snapshot.
  const parent=invoke(l,'modelParent',{model,state:l.state,readStage:'consumer'});
  if(!parent)throw Error('Actual second parent required after nonnull guard');
  command(l,parent,'vslot9c',[model]);command(l,model,'vslot8c',[null]);
 }
}
export function createS5RuntimeAnchoringLifecycle({itemKey,bodyEntrySerial,ports,provenance}={}){
 if(![3010001,3010002].includes(itemKey)||!Number.isSafeInteger(bodyEntrySerial)||bodyEntrySerial<0)throw Error('Actual Anchoring body identity required');
 for(const name of names){const fn=ports?.[name];if(typeof fn!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name))throw Error('Synchronous lifecycle port required: '+name);if(typeof provenance?.[name]!=='string'||!provenance[name].trim())throw Error('Lifecycle source/adaptation provenance required: '+name);}
 return {ports:{...ports},provenance:{...provenance},state:{itemKey,bodyEntrySerial,status:'new',nativeFields:{},models:{190:null,194:null,198:null},component19c:null},nativeReady:false,nativeCompared:false};
}
export function enterS5RuntimeAnchoringLifecycle(l,{machine,nativeContext}={}){
 if(!matches(l,machine,nativeContext))return {accepted:false,reason:'matching-installed-body32-required',nativeReady:false};
 if(l.state.status!=='new')return {accepted:false,reason:'body-entry-already-consumed',nativeReady:false};
 const s=l.state,ms=machine.state;
 try{
  run(l,'baseEnter',{machine,state:s,nativeFunction:'561590'});
  ms.rawBody1a0=false;ms.primaryPhase=0;ms.secondaryPhase=0;
  const c=index=>finite(invoke(l,'readConstantFloat',{index,state:s}),'constant'+index);
  const a=index=>finite(invoke(l,'readActionFloat',{index,itemKey:s.itemKey,state:s}),'actionFloat'+index);
  for(const [index,field] of [[0,'148'],[1,'154'],[2,'160']]){const scale=c(128);s.nativeFields[field]=uint(f(a(index)*scale));}
  s.nativeFields['16c']=uint(a(3));s.nativeFields['178']=a(4);s.nativeFields['184']=a(5);ms.nativeFields=s.nativeFields;
  for(const [index,field] of [[0,190],[1,194],[2,198]]){
   const model=invoke(l,'readSceneResource',{index,itemKey:s.itemKey,state:s});if(model===undefined)throw Error('Explicit null or actual Scene resource required');s.models[field]=model;
   if(model){command(l,model,'115c9a0',[1,0,field===198?0:1]);if(field!==198)command(l,model,'115c8e0',[1]);else{const scale=[c(28),c(28),c(28)];command(l,model,'vslot3c',[scale]);command(l,model,'vslot44');}}
  }
  //Source ctor owns19C already; this is NOT a guessed SEQ/mesh factory.
  s.component19c=invoke(l,'readBody19c',{state:s});if(!s.component19c)throw Error('Actual body-owned component19C required');
  if(s.models[190]&&s.models[194]){
   const resource=invoke(l,'readActionF4fa00',{index:0,itemKey:s.itemKey,state:s});if(resource===undefined)throw Error('Explicit F4FA00 result required');
   if(resource){const dc=c(72),d8=c(89),resourceSecondRead=invoke(l,'readActionF4fa00',{index:0,itemKey:s.itemKey,state:s});if(resourceSecondRead===undefined)throw Error('Explicit second F4FA00 snapshot required');const e4=invoke(l,'modelLookup',{model:s.models[190],name:'bod_02_Dummy',state:s}),e0=invoke(l,'modelLookup',{model:s.models[194],name:'bod_01',state:s});if(e4===undefined||e0===undefined)throw Error('Explicit endpoint lookup results required');run(l,'configure19c',{component:s.component19c,resource:resourceSecondRead,d8,dc,e0,e4,state:s});}
  }
  const cost={applied:false,restored:false};
  if(!bool(l,'readActorSlot3c',{state:s})&&!bool(l,'readStateProperty4',{state:s})){
   const divisor=c(59);if(divisor<=0)throw Error('Positive source cost divisor required');
   const attribute15A=invoke(l,'readAttribute15A',{state:s});if(!attribute15A||!Number.isFinite(attribute15A.flat)||!Number.isFinite(attribute15A.percent))throw Error('Actual attribute15A query outputs required');
   const required=s5runtimeAnchoringRequiredSp({itemKey:s.itemKey,attribute15A});
   const amount=f(required/divisor);cost.amount=amount;
   if(amount!==0){const before=finite(invoke(l,'readMp',{state:s}),'MP'),candidate=Math.max(0,f(before-amount));run(l,'writeMp',{state:s,value:candidate,stage:'entry-write'});cost.applied=true;
    //Read AFTER initial write, matching the native restore predicate ordering.
    if(!bool(l,'readNativeSpWritePermitted',{state:s})){run(l,'writeMp',{state:s,value:before,stage:'entry-restore'});cost.restored=true;}
   }
  }
  if(!bool(l,'readActorSlot3c',{state:s})){writeActor(l,'physicsPrepassEnabled',false);writeActor(l,'raw114',0);writeActor(l,'spRegenerationEnabled',false);}
  run(l,'globalEnterToggle',{state:s,value:0,nativeFunction:'753F70',predicate:'actor equals global1642DFC+110'});
  requestS5RuntimeAnchoringPrimaryPhase(machine,1);requestS5RuntimeAnchoringSecondaryPhase(machine,1);
  run(l,'sequenceCacheEntry',{state:s,itemKey:s.itemKey,seqIndex:0,bodyCacheOffset:0x1a8,lookupFunction:'7B6F00',createFunction:'63FD10',addFunction:'5629F0',addArguments:{index:1,bone:'',argument0:0,argumentFloat:2500,argumentLast:0},condition:'lookup-result148 equals body1A8 sentinel'});
  s.status='entered';return {accepted:true,cost,nativeReady:false,nativeCompared:false};
 }catch(error){s.status='failed';throw error;}
}
export function leaveS5RuntimeAnchoringLifecycle(l,{machine,nativeContext}={}){
 if(!matches(l,machine,nativeContext))return {accepted:false,reason:'matching-installed-body32-required',nativeReady:false};
 if(l.state.status==='left'||l.state.status==='new')return {accepted:false,reason:'no-consumable-entered-lifecycle',nativeReady:false};
 const s=l.state;
 run(l,'baseLeave',{machine,state:s,nativeFunction:'561710'});
 run(l,'globalLeavePrelude',{state:s,nativeWindow:'639608..6396D2'});
 requestS5RuntimeAnchoringPrimaryPhase(machine,0);requestS5RuntimeAnchoringSecondaryPhase(machine,0);
 //63F2A0 releases body1A4 via global1642DFC+20→AFE3D0 then clears1A4;
 //it is NOT a model190 detach. The manager/descriptor stays a required port.
 run(l,'releaseBody1a4',{state:s,sourceFunction:'63F2A0',managerGlobalField:0x20,releaseFunction:'AFE3D0',clearFieldOffset:0x1a4});
 if(!bool(l,'readActorSlot3c',{state:s})){writeActor(l,'physicsPrepassEnabled',true);writeActor(l,'raw114',2);writeActor(l,'spRegenerationEnabled',true);detach(l,s.models[198]);}
 run(l,'globalLeaveToggle',{state:s,value:1,nativeFunction:'753F70',predicate:'actor equals global1642DFC+110'});
 for(const field of [190,194]){detach(l,s.models[field]);s.models[field]=null;}
 detach(l,s.component19c);s.status='left';
 return {accepted:true,retainedResources:['198','19c','1a8'],nativeReady:false,nativeCompared:false};
}
