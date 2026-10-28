const f=Math.fround;
const names=['readActorSlot7c','readFloat1053900','readActorSlot6c','readGlobalPoint164','readBodyRange184','readCamera1fc','writeRawBody1a0','writeActor2d8','writeActor2e4'];
function scalar(value,label){if(!Number.isFinite(value)||!Number.isFinite(f(value)))throw TypeError(`${label}: finite float32 required`);return f(value);}
function vector(value,label){if(!Array.isArray(value)||value.length!==3)throw TypeError(`${label}: explicit source XYZ required`);return value.map(v=>scalar(v,label));}
function qualified(port,name){if(typeof port?.tick!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(port.tick.constructor?.name))throw TypeError(`${name}: synchronous source port required`);if(!['source-port','s5-explicit-adaptation'].includes(port.provenance?.kind)||typeof port.provenance.source!=='string'||!port.provenance.source.trim())throw TypeError(`${name}: provenance required`);return {tick:port.tick,provenance:{...port.provenance}};}
function call(port,...args){const result=port.tick(...args);if(result&&(typeof result.then==='function'||typeof result.next==='function'))throw TypeError('Deferred Anchoring point result refused');return result;}

// Ordered local point-writing spans only:63BD69..63BF97,63C2FE..63C529,
//639E82..63A09D. Model/camera/animation continuations remain separate consumers.
// Registry Float33, both range reads and camera1FC are supplied, never defaulted.
export function createAnchoringPointSourcePorts(ports){
 const p=Object.fromEntries(names.map(name=>[name,qualified(ports?.[name],name)]));
 let busy=false;
 return Object.freeze({run({stage,coordinateSpace,nativeContext,rawBody1a0}={}){
  if(!['phase1-enter','phase2-enter','aim-tick'].includes(stage)||coordinateSpace!=='s5runtime-source'||typeof rawBody1a0!=='boolean')throw TypeError('Explicit Anchoring point span, source coordinates and raw body bit required');
  const flags={nativeReady:false,nativeCompared:false,finalAnchorTargetVerified:false,remainingBodyEffectsImplemented:false};
  if(nativeContext?.enabled!==true||nativeContext.bodyVtable!==0x13b6884||typeof nativeContext.actorSlot3c!=='boolean')return {...flags,accepted:false,reason:'qualified-body32-context-required'};
  if(nativeContext.actorSlot3c)return {...flags,accepted:true,skipped:true,rawBody1a0};
  if(stage==='aim-tick'?nativeContext.activeAimBranchConfirmed!==true:nativeContext.primaryEntryEffectsConfirmed!==true)return {...flags,accepted:false,reason:'actual-source-branch-required'};
  if(busy)throw Error('Reentrant Anchoring point span refused');busy=true;
  try{
   const origin=vector(call(p.readActorSlot7c,{readStage:'computation',stage}),'actorSlot7c computation');
   const scale=scalar(call(p.readFloat1053900,33),'Float33');
   const height=scalar(call(p.readActorSlot6c,{stage}),'actorSlot6c');
   origin[1]=scalar(f(origin[1]+f(height*scale)),'adjusted originY');
   const point=vector(call(p.readGlobalPoint164,{stage}),'global164'),delta=point.map((v,i)=>scalar(f(v-origin[i]),'distance delta'));
   const square=f(f(f(delta[0]*delta[0])+f(delta[1]*delta[1]))+f(delta[2]*delta[2]));
   const distance=scalar(f(Math.sqrt(square)),'source distance');
   const comparisonRange=scalar(call(p.readBodyRange184,{readStage:'comparison',stage}),'body184 comparison');
   //Phase2's equality branch reads range AGAIN and camera even for zero excess.
   const adjust=stage==='phase2-enter'?!(comparisonRange>distance):distance>comparisonRange;
   let adjustmentRange=null,target=[...point];
   if(adjust){
    adjustmentRange=scalar(call(p.readBodyRange184,{readStage:'adjustment',stage}),'body184 adjustment');
    const camera=vector(call(p.readCamera1fc,{stage}),'camera1fc'),excess=f(distance-adjustmentRange);
    target=point.map((v,i)=>scalar(f(v-f(camera[i]*excess)),'adjusted target'));
   }
   let bit=rawBody1a0,bitWritten=false;
   if(stage==='aim-tick'){bit=!adjust;bitWritten=true;}
   else if(stage==='phase2-enter'&&!adjust){bit=true;bitWritten=true;}
   if(bitWritten)call(p.writeRawBody1a0,bit,{stage});
   const writerOrigin=vector(call(p.readActorSlot7c,{readStage:'writer',stage}),'actorSlot7c writer');
   call(p.writeActor2d8,Object.freeze(writerOrigin),{stage});
   call(p.writeActor2e4,Object.freeze(target),{stage});
   return Object.freeze({...flags,accepted:true,stage,sourceAdjustedOrigin:Object.freeze(origin),distance,comparisonRange,adjustmentRange,
    cameraRead:adjust,float33:scale,actor2d8Vector:Object.freeze(writerOrigin),actor2e4Vector:Object.freeze(target),rawBody1a0:bit,bitWritten});
  }finally{busy=false;}
 },sourceSpans:Object.freeze(['63BD69..63BF97','63C2FE..63C529','639E82..63A09D']),nativeReady:false});
}
