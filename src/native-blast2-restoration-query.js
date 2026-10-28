// 734EC0 source restoration safety orchestration. Source/current collections
// and collider virtual34 implementations are mandatory reached ports.
const f=Math.fround,uint=value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff;
const sync=fn=>typeof fn==='function'&&!['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name);
const handle=value=>value!==undefined&&value!==null&&(typeof value==='object'||typeof value==='string'&&value.length>0||uint(value)&&value!==0);
function xyz(value,label){if(!Array.isArray(value)||value.length!==3||value.some(n=>typeof n!=='number'||!Number.isFinite(n)||!Number.isFinite(f(n))))throw Error(label+' requires finite float32 XYZ');return value.map(f);}
const MULTIPLIER=f(1.2);

export function queryNativeBlast2Restoration({ownerId,ports,source,maxCalls=10000}={}){
 const trace=[];let calls=0;
 const refuse=reason=>({qualified:false,allowed:false,reason,trace,nativeReady:false});
 try{
  if(!uint(ownerId)||!ports||typeof source!=='string'||!source.trim()||!Number.isSafeInteger(maxCalls)||maxCalls<1)throw Error('Explicit source owner, ports, evidence and bounded query budget required');
  function read(name,request={}){
   if(++calls>maxCalls)throw Error('restoration-query-budget-exceeded');
   if(!sync(ports[name]))throw Error(name+' unavailable');
   trace.push({port:name});const result=ports[name]({...request,ownerId});
   if(result&&typeof result.then==='function'||result?.qualified!==true)throw Error(name+' unqualified');
   return result;
  }
  const value=(name,request,check)=>{const result=read(name,request);if(!check(result.value))throw Error(name+' malformed');return result.value;};
  const identity=(name,request)=>value(name,request,handle);
  const count=(name,request)=>value(name,request,uint);
  const byte=(name,request)=>value(name,request,n=>uint(n)&&n<=255);
  const vector=(name,request)=>xyz(read(name,request).value,name);
  const initialColliderCount=count('readPieceColliderCount0C');
  const initialManager=identity('readTeamsManager1644AA4');
  const teamCount=count('readTeamCountB16500',{manager:initialManager});
  function inspect(actor,branch,index){
   if(byte('readActorVirtual44',{actor,branch,index})===0)return null;
   //1181240 and its subcalls only initialize local type/XYZ/radius. Its
   //11812C0 destructor and1198BF0 only rewrite the dead local vtable.
   trace.push({local:'volume-init1181240',branch,index});
   try{
    const dimensions=vector('readSolverDimensions7B0BB0',{solver:identity('readActorSolver118',{actor,branch,index,read:'dimensions'})});
    const position=vector('readSolverRaw678',{solver:identity('readActorSolver118',{actor,branch,index,read:'position'})});
    const offset=vector('readSolverOffset7B0C50',{solver:identity('readActorSolver118',{actor,branch,index,read:'offset'})});
    // SSE addss/mulss. Finite float32 domain only; NaNs/overflow refuse.
    const center=offset.map((n,i)=>f(n+position[i]));
    const maxXY=dimensions[0]>dimensions[1]?dimensions[0]:dimensions[1];
    const maximum=maxXY>dimensions[2]?(dimensions[0]>dimensions[1]?dimensions[0]:dimensions[1]):dimensions[2];
    const radius=f(maximum*MULTIPLIER);
    if(center.some(n=>!Number.isFinite(n))||!Number.isFinite(radius))throw Error('restoration-volume-float32-overflow');
    const volume={type:'sphere1181240',center,radius};
    for(let colliderIndex=0;colliderIndex<initialColliderCount;colliderIndex++){
     const entry=read('readPieceColliderAt0C',{index:colliderIndex});
     if(!uint(entry.currentCount)||entry.currentCount<=colliderIndex||!handle(entry.collider))throw Error('piece-collider-current-index-unqualified');
     const hit=byte('queryColliderVirtual34',{collider:entry.collider,mask:0x80,volume,sourceOwnerId:ownerId,arg0:0});
     if(hit!==0)return {branch,index,colliderIndex,volume};
    }
    return null;
   }finally{trace.push({local:'volume-destroy11812C0',branch,index});}
  }
  for(let teamIndex=0;teamIndex<teamCount;teamIndex++){
   const manager=identity('readTeamsManager1644AA4');
   const team=identity('readTeamB16850',{manager,index:teamIndex});
   if(byte('readTeamEnabled4CA260',{team,offset:8})===0)continue;
   const actorCount=count('readTeamActorCountB14610',{team});
   for(let index=0;index<actorCount;index++){
    const actor=identity('readTeamActorB14900',{team,index});
    const blocked=inspect(actor,'teams',index);
    if(blocked)return {qualified:true,allowed:false,blocked:{teamIndex,...blocked},trace,evidence:source,nativeReady:false};
   }
  }
  const existence=read('readAlternateManager6BD650');
  if(typeof existence.exists!=='boolean')throw Error('readAlternateManager6BD650 existence malformed');
  if(existence.exists){
   const current=read('readAlternateManager6BD650');
   if(current.exists!==true||!handle(current.handle))throw Error('alternate-manager-disappeared');
   for(let index=0;index<count('readAlternateActorCount6852F0',{manager:current.handle});index++){
    const actor=identity('readAlternateActor685320',{manager:current.handle,index});
    const blocked=inspect(actor,'alternate',index);
    if(blocked)return {qualified:true,allowed:false,blocked,trace,evidence:source,nativeReady:false};
   }
  }
  return {qualified:true,allowed:true,trace,evidence:source,nativeReady:false};
 }catch(error){return refuse(error instanceof Error?error.message:String(error));}
}

export function createNativeBlast2RestorationPort({ports,source,maxCalls}={}){
 if(!ports||typeof source!=='string'||!source.trim())throw TypeError('Explicit source restoration ports required');
 let running=false;
 return request=>{
  if(running)return {qualified:false,allowed:false,reason:'restoration-port-reentered',nativeReady:false};
  running=true;
  try{return queryNativeBlast2Restoration({ownerId:request?.owner?.ownerId,ports,source,maxCalls});}
  finally{running=false;}
 };
}
