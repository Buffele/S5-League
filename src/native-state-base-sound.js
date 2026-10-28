//562640 dispatches timed sound records78..7C to564510/5649A0. It does
// not select Normal/Run locomotion clips. Sound resources/RNG/animator
// matrices and B110B0 side effects retain explicit qualified source ports.
const f=Math.fround;
const uint=(n,label)=>{if(!Number.isInteger(n)||n<0||n>0xffffffff)throw TypeError(`Explicit uint32 ${label} required`);return n;};
const byte=(n,label)=>{uint(n,label);if(n>255)throw TypeError(`Explicit byte ${label} required`);return n;};
const scalar=(n,label)=>{if(!Number.isFinite(n)||!Number.isFinite(f(n)))throw TypeError(`Explicit float32 ${label} required`);return f(n);};
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','AsyncGeneratorFunction','GeneratorFunction'].includes(fn.constructor.name);
const boolean=(v,label)=>{if(typeof v!=='boolean')throw TypeError(`Explicit boolean ${label} required`);return v;};
const timer=v=>{if(!v)throw TypeError('Explicit sound timer64 required');return {count:uint(v.count,'count64'),limit:uint(v.limit,'limit68'),elapsed:uint(v.elapsed,'elapsed6C'),paused:boolean(v.paused,'paused70')};};
const text=v=>{if(typeof v!=='string'||v.includes('\0'))throw TypeError('Explicit decoded source string required');return v;};
function reader(ports,api,trace){return (name,args={})=>{
 if(!sync(ports?.[name]))throw TypeError(`Explicit synchronous source sound port ${name} required`);
 const result=ports[name]({...args,api});if(result&&typeof result.then==='function')throw TypeError('Source sound ports must complete synchronously');
 trace.push({port:name,...args});if(result?.qualified!==true)throw Error(result?.reason??`${name}-unqualified`);return result.value;
};}
export const NATIVE_STATE_SOUND_TICK_SOURCE=Object.freeze({start:0x562640,endExclusive:0x5627c8});
export function createNativeStateBaseSoundTick({source,ports}={}){
 if(typeof source!=='string'||!source.trim())throw TypeError('Explicit source sound provenance required');
 return (dtMs,api)=>{
  dtMs=uint(dtMs,'engine delta');const trace=[],read=reader(ports,api,trace);let ticked=0,triggered=0;
  let cursor=read('beginEntries78');
  while(!boolean(read('isEntriesEnd78',{cursor}),'live sound end')){
   const entry=read('readEntry78',{cursor});if(entry===undefined||entry===null)throw TypeError('Explicit current sound entry required');
   cursor=read('nextEntry78',{cursor});const before=timer(read('readTimer64',{entry}));ticked++;
   if(!before.paused)read('writeTimer64',{entry,value:{...before,count:(before.count+1)>>>0,elapsed:(before.elapsed+dtMs)>>>0}});
   const current=timer(read('readTimer64',{entry}));
   if((before.limit>=before.elapsed)===(current.limit>=current.elapsed))continue;
   if(uint(read('readActor54'),'actor54')===0)continue;
   const alternate=byte(read('readActor19c'),'actor19C')!==0;
   read(alternate?'play5649a0':'play564510',{entry});triggered++;
  }
  return {qualified:true,ticked,triggered,trace,source,nativeReady:false,nativeExecutionCompared:false};
 };
}

//564510 and5649A0 differ only in vector offsets and their literal string.
// The port reads the current CRT random result. No Math.random, invented
// sound list, guessed locator or clamped random index is supplied.
export function createNativeStateSoundPlayback({source,alternate,ports}={}){
 if(typeof source!=='string'||!source.trim()||typeof alternate!=='boolean')throw TypeError('Explicit sound playback source and variant required');
 const base=alternate?0x30:0;
 return (entry,api)=>{
  const trace=[],read=reader(ports,api,trace);
  const length=offset=>uint(read('readVectorLength',{entry,offset}),'source vector length');
  const at=(offset,index,kind)=>{
   if(index>=length(offset))throw RangeError('Source sound vector index outside current bounds');
   return read(kind,{entry,offset,index});
  };
  if(length(base)===0)return {qualified:true,path:'empty-source-vector',trace,nativeReady:false};
  const count=length(base);if(count>0x7fffffff)throw RangeError('Source sound vector outside qualified signed count domain');
  const random=uint(read('readRandomIat139a578'),'source rand');if(random>0x7fffffff)throw RangeError('Source rand outside signed conversion domain');
  const divisor=scalar(read('readLiteral13ac764'),'source random divisor');if(divisor<=0)throw RangeError('Positive source random divisor required');
  const scaled=f(f(f(random)/divisor)*f(count));
  if(!Number.isFinite(scaled)||scaled<0||scaled>=0x100000000)throw RangeError('Random index conversion outside qualified uint32 domain');
  const index=Math.trunc(scaled);
  let animator=uint(read('readActor70'),'actor70');if(animator===0)throw Error('Source sound playback requires actor70');
  const locator=text(at(base+0x18,index,'readVectorString'));
  const sentinel=text(read('readLiteralString',{address:alternate?0x13ac257:0x13ac1b7}));
  if(locator!==sentinel){
   const locatorAgain=text(at(base+0x18,index,'readVectorString'));
   const selected=uint(read('lookupAnimatorB4',{animator,name:locatorAgain}),'named animator');if(selected!==0)animator=selected;
  }
  const alternateName=text(at(base+0x0c,index,'readVectorString'));let name;
  if(alternateName.length===0)name=text(at(base,index,'readVectorString'));
  else if(byte(read('readActor288'),'actor288')===0)name=text(at(base,index,'readVectorString'));
  else name=text(at(base+0x0c,index,'readVectorString'));
  const local=uint(read('readCurrentLocalActor120'),'local actor120'),actor=uint(read('readActor54'),'actor54');
  const spatial=local===actor?0:1;
  if(index>=length(base+0x24))throw RangeError('Source sound volume index outside current bounds');
  const manager=uint(read('readAudioManager24'),'audio manager24');
  const volume=scalar(read('readVectorFloat',{entry,offset:base+0x24,index}),'sound volume');
  // Native pushes Z,Y,X and invokes virtual58 separately for each value.
  const z=scalar(read('readAnimatorMatrixComponent58',{animator,offset:0x38}),'matrix38');
  const y=scalar(read('readAnimatorMatrixComponent58',{animator,offset:0x34}),'matrix34');
  const x=scalar(read('readAnimatorMatrixComponent58',{animator,offset:0x30}),'matrix30');
  read('invokeSoundB110b0',{manager,name,spatial,argument0:0,position:[x,y,z],volume,argumentLast:0});
  return {qualified:true,path:'played',index,trace,source,nativeReady:false,nativeExecutionCompared:false,calledRoutinesVerified:false};
 };
}
