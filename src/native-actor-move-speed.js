// Source51DAE0 arithmetic/branches only. Logical typed values at source read
// sites are explicit; protected XOR storage is not accepted as decoded data.
const f=Math.fround;
const num=(v,name)=>{if(!Number.isFinite(v))throw new TypeError(`${name} finite logical scalar required`);return f(v);};
const bool=(v,name)=>{if(typeof v!=='boolean')throw new TypeError(`${name} explicit boolean required`);return v;};
const uint=(v,name)=>{if(!Number.isInteger(v)||v<0||v>0xffffffff)throw new TypeError(`${name} uint32 required`);return v;};
function origin(p,name){if(!['source-port','s5-explicit-adaptation'].includes(p?.kind)||typeof p.source!=='string'||!p.source.trim())throw new TypeError(`${name} provenance required`);}

export function evaluateNativeActorMoveSpeed51dae0(snapshot,{condition154}={}){
 origin(snapshot?.provenance,'snapshot');origin(condition154?.provenance,'condition154');
 if(typeof condition154?.tick!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(condition154.tick.constructor.name))throw new TypeError('Synchronous condition154 port required');
 const trace=[],registry=snapshot.registry??{};
 const floor=num(registry.float0,'Float0');
 if(!Array.isArray(registry.gameTempo15Reads)||registry.gameTempo15Reads.length!==3)throw new TypeError('Three explicit GameTempo15 source-read values required');
 const baseReads=registry.gameTempo15Reads.map((v,i)=>num(v,`GameTempo15 read${i}`));
 let value=num(snapshot.actorBase250Key15f3d94,'actor250 key15F3D94 logical base');
 const stage=(name,details={})=>trace.push({stage:name,value,...details});stage('protected-base');
 const query=(code,accumulator)=>{
  const before={flat:f(accumulator.flat),percent:f(accumulator.percent)};
  const result=condition154.tick({code,mask:0xffffffff,...before});
  if(result?.then)throw new TypeError('condition154 returned asynchronous result');
  const after={flat:num(result?.flat,`condition${code.toString(16)} flat`),percent:num(result?.percent,`condition${code.toString(16)} percent`)};
  trace.push({stage:'actor-slot154',code,mask:0xffffffff,before,after:{...after}});return after;
 };
 const role=snapshot.role??{};const present=bool(role.manager124Present,'manager124Present');
 const mode=present?uint(role.mode124_34,'manager124 mode'):null;
 if(mode!==null&&mode>255)throw new TypeError('manager124 mode must fit decoded byte');
 if(present&&mode===8){
  const actorLow=uint(role.actor48,'actor48'),actorHigh=uint(role.actor4c,'actor4c')&0xffff;
  const ownerLow=uint(role.ownerLow,'DD91C0 low'),ownerHigh=uint(role.ownerHigh,'DD91C0 high');
  const matches=actorLow===ownerLow&&actorHigh===ownerHigh;
  if(matches)value=f(value*num(role.multiplier124_d4,'manager124+D4'));
  stage('mode8-owner',{matches});
 }else{
  const standard=snapshot.standard??{},byte=uint(standard.manager238Byte9c,'manager238 byte9C');if(byte>255)throw new TypeError('manager238 byte9C must fit byte');
  if(byte===0&&bool(standard.equipmentExistsBeforePredicate,'first equipment lookup exists')&&bool(standard.parametersExistBeforePredicate,'first equipment parameters exist')&&bool(standard.native52d5d0Result,'52D5D0 result')&&bool(standard.native108eb20Result,'108EB20 result for equipment type15F466C')){
   const queried=query(0x132,{flat:0,percent:0});
   const factor=queried.flat<=0?1:queried.flat;
   value=f(f(num(registry.float35,'Float35')*factor)*value);stage('standard-132-factor',{factor});
  }else stage('standard-132-skipped');
 }
 const equipment=snapshot.equipmentAtSecondLookup??{};
 if(bool(equipment.exists,'second equipment lookup exists')){
  const hasParameters=bool(equipment.parametersExist,'second equipment parameters exist');
  // Native null parameters multiply by Float0; absent equipment skips multiply.
  const rate=hasParameters?num(equipment.moveSpeedRate15f4688,'equipment move_speed_rate15F4688'):0;
  value=f(value*rate);stage('equipment-multiply',{hasParameters,rate});
 }else stage('equipment-absent');
 value=f(value+num(snapshot.actor368Flat1c,'actor368+1C'));stage('actor-flat');
 value=f(f(baseReads[0]*num(snapshot.actor368Percenta0,'actor368+A0'))+value);stage('actor-percent');
 let accumulator=query(0x133,{flat:0,percent:0});
 accumulator=query(0x25a,accumulator); // same native pointers; no sum invented
 value=f(value+accumulator.flat);stage('condition-flat');
 value=f(f(accumulator.percent*baseReads[1])+value);stage('condition-percent');
 value=f(f(baseReads[2]*num(snapshot.actorProtected3c0AfterConditions,'protected actor3C0 after conditions'))+value);stage('actor3c0-percent');
 if(value<floor)value=floor;stage('minimum-clamp');
 if(!Number.isFinite(value))throw new RangeError('Native arithmetic overflow/NaN outside supported finite profile');
 return {speedNative:value,sourceGetter:'51DAE0',trace,provenance:{snapshot:{...snapshot.provenance},condition154:{...condition154.provenance}},nativeReady:false,nativeActorObserved:false,predicateTruthVerified:false};
}

export function createNativeActorMoveSpeedReader({readSnapshot,condition154}={}){
 for(const [name,p] of Object.entries({readSnapshot,condition154})){
  origin(p?.provenance,name);
  if(typeof p?.tick!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(p.tick.constructor.name))throw new TypeError(`${name} synchronous port required`);
 }
 let last=null,serial=0;
 return {
  provenance:{kind:'source-port',source:'51DAE0 evaluator with explicit snapshot and sequential slot154 ports'},
  tick(context){const value=readSnapshot.tick(context);if(value?.then)throw new TypeError('Asynchronous speed snapshot unsupported');last=evaluateNativeActorMoveSpeed51dae0(value,{condition154});serial++;return last.speedNative;},
  snapshot:()=>({serial,last:last?structuredClone(last):null,inputs:{snapshot:{...readSnapshot.provenance},condition154:{...condition154.provenance}},nativeReady:false,predicateTruthVerified:false}),
 };
}
