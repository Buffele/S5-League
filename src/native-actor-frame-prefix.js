// Complete decoded control flow51EAE2..51EFEB, preceding the separately
// ported timer suffix. Reached called routines require source implementations;
// only52AC90 is elided, because its pinned body has no observable operation.
const f=Math.fround;
const uint=(v,n)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw TypeError(`Explicit uint32 ${n} required`);return v;};
const byte=(v,n)=>{uint(v,n);if(v>255)throw TypeError(`Explicit byte ${n} required`);return v;};
const scalar=(v,n)=>{if(!Number.isFinite(v)||!Number.isFinite(f(v)))throw TypeError(`Finite float32 ${n} required`);return f(v);};
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);
const pointer=(v,n)=>uint(v,n);
const boolean=(v,n)=>{if(typeof v!=='boolean')throw TypeError(`Explicit boolean ${n} required`);return v;};
const timer=v=>{if(!v)throw TypeError('Owned prefix timer370 required');return {count:uint(v.count,'count370'),limit:uint(v.limit,'limit374'),elapsed:uint(v.elapsed,'elapsed378'),paused:boolean(v.paused,'paused37C')};};
export const NATIVE_ACTOR_FRAME_PREFIX_SOURCE=Object.freeze({start:0x51eae2,endExclusive:0x51efeb});
export function createNativeActorFramePrefix({source,ports}={}){
 if(typeof source!=='string'||!source.trim())throw TypeError('Explicit source prefix provenance required');
 return (dtMs,api)=>{
  dtMs=uint(dtMs,'engine delta');const trace=[];
  const invoke=(name,args={})=>{
   if(!sync(ports?.[name]))throw TypeError(`Reached synchronous source prefix port ${name} required`);
   const result=ports[name]({...args,dtMs,api});
   if(result&&typeof result.then==='function')throw TypeError(`Source prefix port ${name} must complete synchronously`);
   trace.push({port:name,...args});if(result?.qualified!==true)throw Error(result?.reason??`${name}-unqualified`);return result;
  };
  const value=(name,args)=>invoke(name,args).value;
  const field=offset=>pointer(value('readActorPointer',{offset}),`actor${offset.toString(16)}`);
  const globalActor=()=>pointer(value('readGlobalActor110'),'global actor110');
  const rule=()=>pointer(value('readGlobalRule124'),'rule124');
  const sourceState=()=>{const result=field(0x1c);if(result===0)throw Error('Source prefix requires current state before unguarded state1C read');return result;};
  const virtualByte=(slot,args={})=>byte(value('readActorVirtual',{slot,...args}),`actor slot${slot.toString(16)}`);
  invoke('tickProperties521510');
  invoke('actorSlot220');
  invoke('beginCollisionScope7B4E30',{collection:field(0x35c)});
  trace.push({sourceNoEffect:0x52ac90});
  let actorStatus=0xffffffff;
  if(globalActor()!==0){const actor=globalActor();if(actor===0)throw Error('Source actor110 disappeared before virtual210');actorStatus=uint(value('readOtherActorVirtual210',{actor}),'actor110 virtual210');}
  invoke('tick984D30',{statusByte:actorStatus&255});
  invoke('tick9835B0');
  invoke('tick985270');
  if(byte(value('readManagerFlag48'),'manager48')!==0)invoke('tick984470');
  let containsActor=false,membershipByte=0;
  if(rule()!==0){
   const currentRule=rule();if(currentRule===0)throw Error('Source rule disappeared before mode read');
   if(byte(value('readRuleMode34',{rule:currentRule}),'rule34')===0x0a){
    const memberRule=rule();if(memberRule===0)throw Error('Source rule disappeared before membership');
    const ruleField10=pointer(value('readRuleField10',{rule:memberRule}),'rule10');
    const identity=value('readActorIdentity2C');
    if(!Array.isArray(identity)||identity.length!==2)throw TypeError('Explicit source identity DWORD pair required');
    const masked=[uint(identity[0],'identity0'),uint(identity[1],'identity1')&0xffff];
    membershipByte=byte(value('testRuleContains1090830',{container:ruleField10,identity:masked}),'membership result');containsActor=membershipByte!==0;
    if(containsActor){
     if(actorStatus<=2){const rate=scalar(value('readLiteralFloat',{address:0x14c908c}),'literal14C908C');invoke('tick9839D0',{vector:[rate,rate,rate]});}
     else invoke('invoke986790',{argument:0});
     // State and equipment are reread at the source points, including writes
     // performed by the movement callback above.
     if(uint(value('readStateId1C',{state:sourceState()}),'state1C id')!==2&&uint(value('readStateId1C',{state:sourceState()}),'state1C id')!==0x1c&&field(0x1d4)!==0&&virtualByte(0x210)===0){
      if(virtualByte(0x164,{argument:0})!==0){
       invoke('equipmentVirtualEC',{equipment:field(0x1d4),argument:0});
       if(field(0x1d8)!==0)invoke('equipmentVirtualEC',{equipment:field(0x1d8),argument:0});
      }else{
       const scale=scalar(value('readLiteralFloat',{address:0x13ab27c}),'literal13AB27C');
       invoke('equipmentVirtualCC',{equipment:field(0x1d4),value:scale,argument:1});
       invoke('equipmentVirtualEC',{equipment:field(0x1d4),argument:membershipByte});
       if(field(0x1d8)!==0)invoke('equipmentVirtualEC',{equipment:field(0x1d8),argument:membershipByte});
      }
     }
    }
   }
  }
  if(byte(value('readActorByte',{offset:0x382}),'actor382')!==0&&byte(value('readActorByte',{offset:0x380}),'actor380')===1){
   const before=timer(value('readTimer370'));let active=true;
   if(!before.paused){
    const next={...before,count:(before.count+1)>>>0,elapsed:(before.elapsed+dtMs)>>>0};invoke('writeTimer370',{value:next});active=next.limit>=next.elapsed;
   }
   if(!active){
    const manager=pointer(value('readGlobal165AC90'),'manager165AC90');
    const first=byte(value('readManager782090',{manager,argument:0}),'782090 first');
    invoke('invoke5212A0',{argument0:0,argument1:first});
    const nextManager=pointer(value('readGlobal165AC90'),'manager165AC90');
    const second=byte(value('readManager782090',{manager:nextManager}),'782090 second');
    const consumer=pointer(value('readConsumer4ADFB0'),'4ADFB0 consumer');
    invoke('invokeF33320',{consumer,argument0:0,argument1:second});
   }
  }
  invoke('tickComponentB79680',{component:field(0x2b4)});
  invoke('actorSlot264');
  return {qualified:true,source,trace,containsActor,actorStatus,nativeExecutionCompared:false,calledRoutineImplementationsVerified:false,nativeReady:false};
 };
}
