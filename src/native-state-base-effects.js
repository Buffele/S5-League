// Decoded561FC0..5624E2. Collection6C iteration stays live, including its
// end and pre-incremented cursor. Native resource/refcount/effect routines
// require qualified implementations; none is inferred from a render name.
const uint=(n,label)=>{if(!Number.isInteger(n)||n<0||n>0xffffffff)throw TypeError(`Explicit uint32 ${label} required`);return n;};
const byte=(n,label)=>{uint(n,label);if(n>255)throw TypeError(`Explicit byte ${label} required`);return n;};
const scalar=(n,label)=>{if(!Number.isFinite(n)||!Number.isFinite(Math.fround(n)))throw TypeError(`Explicit float32 ${label} required`);return Math.fround(n);};
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);
const bool=(v,label)=>{if(typeof v!=='boolean')throw TypeError(`Explicit boolean ${label} required`);return v;};
const timer=value=>{if(!value)throw TypeError('Explicit entry timer50 required');return {count:uint(value.count,'count50'),limit:uint(value.limit,'limit54'),elapsed:uint(value.elapsed,'elapsed58'),paused:bool(value.paused,'paused5C')};};
export const NATIVE_STATE_EFFECTS_SOURCE=Object.freeze({start:0x561fc0,endExclusive:0x5624e2});
export function createNativeStateBaseEffects({source,ports}={}){
 if(typeof source!=='string'||!source.trim())throw TypeError('Explicit base effects source required');
 return (dtMs,api)=>{
  dtMs=uint(dtMs,'engine delta');const trace=[];let ticked=0,triggered=0;
  const invoke=(name,args={})=>{
   if(!sync(ports?.[name]))throw TypeError(`Explicit synchronous base effects port ${name} required`);
   const result=ports[name]({...args,dtMs,api});
   if(result&&typeof result.then==='function')throw TypeError(`Base effects port ${name} must complete synchronously`);
   trace.push({port:name,...args});if(result?.qualified!==true)throw Error(result?.reason??`${name}-unqualified`);return result;
  };
  const value=(name,args)=>invoke(name,args).value;
  const actor=()=>uint(value('readActor54'),'state actor54');
  const flag=(entry,offset)=>byte(value('readEntryByte',{entry,offset}),`entry${offset.toString(16)}`)!==0;
  const setHandle=(entry,handle)=>invoke('assignEffect68',{entry,handle:uint(handle,'effect68')});
  const report=literal=>invoke('reportSourceError',{literal});
  let cursor=value('beginEntries6c');
  while(!bool(value('isEntriesEnd6c',{cursor}),'current effects end')){
   const entry=value('readEntry6c',{cursor});if(entry===undefined||entry===null)throw TypeError('Explicit current effect entry required');
   cursor=value('nextEntry6c',{cursor});
   if(byte(value('testEntryVirtualF8',{entry}),'state virtualF8')===0)continue;
   const before=timer(value('readTimer50',{entry})),wasWithin=before.limit>=before.elapsed;ticked++;
   if(!before.paused)invoke('writeTimer50',{entry,value:{...before,count:(before.count+1)>>>0,elapsed:(before.elapsed+dtMs)>>>0}});
   const current=timer(value('readTimer50',{entry}));
   if(wasWithin===(current.limit>=current.elapsed))continue;
   triggered++;
   const manager=uint(value('readWorldEffectManager20'),'world manager20');
   if(actor()===0){report(0x13ac1b8);return {qualified:true,aborted:'missing-actor54',ticked,triggered,trace,nativeReady:false};}
   if(uint(value('readActor70',{actor:actor()}),'actor70')===0){report(0x13ac200);return {qualified:true,aborted:'missing-actor70',ticked,triggered,trace,nativeReady:false};}
   let eligible=true;
   if(flag(entry,0x64)&&byte(value('readActor19c',{actor:actor()}),'actor19C')===0)eligible=false;
   if(byte(value('readActor19c',{actor:actor()}),'actor19C')!==0&&!flag(entry,0x64))eligible=false;
   if(!eligible){setHandle(entry,0);continue;}
   let nameOffset=0;
   const alternate=flag(entry,0x65);
   if(alternate||uint(value('readEntryNameLength28',{entry}),'entry name length28')!==0){
    if(byte(value('readActor288',{actor:actor()}),'actor288')!==0)nameOffset=0x18;
   }
   const name=value('readEntryString',{entry,offset:nameOffset});if(typeof name!=='string'||name.includes('\0'))throw TypeError('Explicit decoded effect name required');
   const resources=uint(value('readResourceManager54c940'),'resource manager');let handle=0;
   if(resources!==0){
    const owner=uint(value('readActor70',{actor:actor()}),'actor70');
    const secondary=value('readEntryString',{entry,offset:0x30});if(typeof secondary!=='string'||secondary.includes('\0'))throw TypeError('Explicit decoded secondary effect name required');
    handle=uint(value('createEffectAff110',{resources,name,secondary,owner}),'new effect handle');
   }
   setHandle(entry,handle);
   if(uint(value('readCurrentLocalActor120'),'local actor120')===actor()){
    const currentHandle=uint(value('readEffect68',{entry}),'current effect handle');
    if(currentHandle===0)throw Error('Source local effect slot2C requires a nonnull effect68');
    invoke('effectVirtual2c',{handle:currentHandle,argument:0});
   }
   const currentHandle=uint(value('readEffect68',{entry}),'current effect handle');
   const weight=scalar(value('readEntryFloat48',{entry}),'entry48');
   if(byte(value('submitEffectAfe220',{manager,handle:currentHandle,weight}),'AFE220 result')===0){setHandle(entry,0);report(0x13ac258);}
  }
  return {qualified:true,ticked,triggered,trace,source,nativeReady:false,nativeExecutionCompared:false,calledRoutinesVerified:false};
 };
}
