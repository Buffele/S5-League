import {createS5RuntimeAnchoringMachine,advanceS5RuntimeAnchoringMachine,inputS5RuntimeAnchoringMachine} from './s5runtime-skill-anchoring-machine.js';
import {evaluateS5RuntimeAnchoringEligibility} from './s5runtime-skill-anchoring-kernel.js';
import {NATIVE_FRAME_TAIL_STAGES,validateNativeFrameTailDiagnostic,runNativeFrameTailDiagnostic} from './native-frame-tail-diagnostic.js';
import {createAnchoringPointSourcePorts} from './anchoring-point-source.js';

const schedulerNames=['baseTick','baseInput','readActorSlot3c','readActorSlot40','primaryTransition','secondaryTransition','aimTick','readActorPoints','actor70','phase5Orientation','secondaryTickEffects','helper63F760'];
const hostNames=['readEligibilityContext','bodyEnter','bodyLeave','physicsTick','afterFrameTail','resolveHostExit'];
function qualified(port,name){
 if(typeof port?.tick!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(port.tick.constructor?.name))throw TypeError(`Anchoring synchronous port required: ${name}`);
 if(!['source-port','s5-explicit-adaptation'].includes(port.provenance?.kind)||typeof port.provenance.source!=='string'||!port.provenance.source.trim())throw TypeError(`Anchoring port provenance required: ${name}`);
 return {tick:port.tick,provenance:{...port.provenance}};
}
function invoke(port,args){const value=port.tick(args);if(value&&(typeof value.then==='function'||typeof value.next==='function'))throw TypeError('Deferred Anchoring host result refused');return value;}
function receipt(port,args){const value=invoke(port,args);if(value?.executedSourceBranch!==true)throw Error('Anchoring source/adaptation branch receipt required');return value;}
function target(value){
 if(!Number.isInteger(value?.actorStateId)||value.actorStateId<0||typeof value.controllerState!=='string'||!value.controllerState.trim()||typeof value.provenance!=='string'||!value.provenance.trim())throw TypeError('Explicit Anchoring destination mapping required');
 return Object.freeze({...value});
}

// Installs no defaults for Enter/Leave, presentation, target selection, physics,
// camera or collision. Those consumers must be supplied with explicit provenance.
// Callback side effects are not transactional; a failed body remains installed
// for explicit cleanup, rather than silently dropping source resources.
export function createAnchoringControllerBody(controller,configuration,bodyEntrySerial){
 if(!configuration||!Number.isSafeInteger(bodyEntrySerial)||bodyEntrySerial<1)throw TypeError('Explicit Anchoring body configuration and entry serial required');
 const ports=Object.fromEntries([...schedulerNames,...hostNames].map(name=>[name,qualified(configuration.ports?.[name],name)]));
 const presentation=configuration.presentation?qualified(configuration.presentation,'presentation'):null;
 const maskAndClockPolicy=configuration.presentation?.maskAndClockPolicy;
 if(presentation&&(typeof maskAndClockPolicy!=='string'||!maskAndClockPolicy.trim()))throw TypeError('Explicit Anchoring channel mask and clock policy required');
 const destinations={0x140:target(configuration.returnTargets?.[0x140]),0x144:target(configuration.returnTargets?.[0x144])};
 if(destinations[0x140].actorStateId!==24||destinations[0x144].actorStateId!==4)throw TypeError('Anchoring source destinations must be state24 and state4');
 const itemKey=controller.s5runtimeSkill.itemKey;
 const host={actorStateId:32,bodyEntrySerial,entered:false,left:false,failed:false,machine:null,frame:null};
 const pointSource=configuration.pointSourcePorts?createAnchoringPointSourcePorts(configuration.pointSourcePorts):null;
 let operation=null,sourceReturn=false;
 const start=name=>{if(operation!==null)throw Error('Reentrant Anchoring body execution refused');operation=name;};
 const context={enabled:true,bodyVtable:0x13b6884,bodyEntrySerial};
 const current=()=>{if(controller.s5runtimeAnchoringBodyState!==host||host.left)throw Error('Stale Anchoring body execution refused');};
 const execution=extra=>({controller,bodyEntrySerial,itemKey,machine:host.machine,pointSource,...extra});
 const tailPorts=Object.fromEntries(NATIVE_FRAME_TAIL_STAGES.map(stage=>[stage.id,qualified(configuration.frameTail?.callbacks?.[stage.id],'frameTail.'+stage.id)]));
 const tailCallbacks=Object.fromEntries(NATIVE_FRAME_TAIL_STAGES.map(stage=>{
  const port=tailPorts[stage.id];return [stage.id,{tick:(dtMs,meta)=>receipt(port,execution({dtMs,stage:meta.stage,bodyStillCurrent:controller.s5runtimeAnchoringBodyState===host})),
   provenance:{kind:port.provenance.kind==='source-port'?'source-port':'external-unverified',source:port.provenance.source}}];
 }));
 host.preflight=dtMs=>{current();if(!host.entered||host.failed)throw Error('Active committed Anchoring body required');return validateNativeFrameTailDiagnostic({enabled:true,dtMs,callbacks:tailCallbacks});};
 const schedulerPorts=Object.fromEntries(schedulerNames.map(name=>[name,args=>{current();return invoke(ports[name],execution(args));}]));
 schedulerPorts.bodyReturn=args=>{
  current();
  let result;sourceReturn=true;
  try{result=controller.returnS5RuntimeAnchoringBodyState({bodyEntrySerial,nativeTargetFieldOffset:args.nativeTargetFieldOffset});}
  finally{sourceReturn=false;}
  if(!result.accepted)throw Error('Anchoring body return was not committed');
  return {executedSourceBranch:true};
 };
 host.machine=createS5RuntimeAnchoringMachine({...configuration.entryState,itemKey,bodyEntrySerial,ports:schedulerPorts,
  provenance:{...Object.fromEntries(schedulerNames.map(name=>[name,ports[name].provenance.source])),bodyReturn:'Actual Controller body transition; explicit native field140/144 destination mapping'}});
 host.samplePresentation=dt=>{
  current();if(!host.entered||host.failed)throw Error('Active committed Anchoring body required');
  if(!presentation)throw Error('Explicit Anchoring presentation mapping and clock policy required');
  start('presentation');try{
  const sample=invoke(presentation,execution({state:host.machine.state,dt}));
  if(typeof sample?.clip!=='string'||!sample.clip||typeof sample.lower!=='string'||!sample.lower||typeof sample.loop!=='boolean'||typeof sample.lowerLoop!=='boolean'||![sample.speed,sample.lowerSpeed,sample.time,sample.fade].every(v=>Number.isFinite(v)&&v>=0)||!(Number.isSafeInteger(sample.restartKey)||typeof sample.restartKey==='string'&&sample.restartKey.length))throw TypeError('Complete explicit Anchoring presentation sample required');
  const phase=host.machine.state.primaryPhase;
  if(phase>0){const clips=['','L0002','L0000','L0002','L0001','00065'],loops=[false,true,false,true,true,false];if(sample.clip!==clips[phase]||sample.lower!==clips[phase]||sample.loop!==loops[phase]||sample.lowerLoop!==loops[phase])throw Error('Anchoring presentation contradicts source primary animation commands');}
  return {...sample,bodyEntrySerial,maskAndClockPolicy,nativeChannelMaskVerified:false,nativeFittingVerified:false,nativeReady:false};
  }catch(error){host.failed=true;throw error;}finally{operation=null;}
 };
 host.enter=()=>{
  current();if(host.entered||host.failed)throw Error('Anchoring Enter must execute once');
  start('enter');try{
  const nativeContext=invoke(ports.readEligibilityContext,execution());
  const eligibility=evaluateS5RuntimeAnchoringEligibility({itemKey,energy:controller.energy,nativeContext});
  if(!eligibility.eligible)return {...eligibility,accepted:false};
  try{receipt(ports.bodyEnter,execution({nativeContext}));if(host.machine.state.primaryPhase!==1||host.machine.state.secondaryPhase!==1)throw Error('Anchoring Enter must commit primary1 and secondary1');host.entered=true;}
  catch(error){host.failed=true;throw error;}
  return {accepted:true,actorStateId:32,bodyEntrySerial,nativeReady:false};
  }catch(error){host.failed=true;throw error;
  }finally{operation=null;}
 };
 host.input=nativeInputCode=>{
  current();if(!host.entered||host.failed)throw Error('Active committed Anchoring body required');
  start('input');
  try{return inputS5RuntimeAnchoringMachine(host.machine,{nativeInputCode,nativeContext:context});}
  catch(error){host.failed=true;throw error;}
  finally{operation=null;}
 };
 host.tick=(dtMs,input)=>{
  current();if(!host.entered||host.failed)throw Error('Active committed Anchoring body required');
  if(!Number.isInteger(dtMs)||dtMs<0||dtMs>0xffffffff)throw TypeError('Anchoring uint32 frame delta required');
  host.preflight(dtMs);
  start('tick');
  try{
  receipt(ports.physicsTick,execution({dtMs,input}));
  const result=advanceS5RuntimeAnchoringMachine(host.machine,{dtMs,nativeContext:context});
  // A source body return may have committed during Tick. The actor frame tail
  // still belongs to this execution and must explicitly observe that result.
  const tail=runNativeFrameTailDiagnostic({enabled:true,afterCurrentStateTick:true,dtMs,callbacks:tailCallbacks});
  const continuation=receipt(ports.afterFrameTail,execution({dtMs,input,bodyResult:result,tail,bodyStillCurrent:controller.s5runtimeAnchoringBodyState===host}));
  host.frame={...result,tail,continuation,bodyEntrySerial,nativeReady:false,nativeCompared:false};
  return host.frame;
  }catch(error){host.failed=true;throw error;}
  finally{operation=null;}
 };
 host.leave=({reason,nativeTargetFieldOffset}={})=>{
  current();
  const parentOperation=operation;
  if(parentOperation!==null&&!(parentOperation==='tick'&&sourceReturn))throw Error('Reentrant Anchoring body exit refused');
  operation='leave';try{
  const destination=nativeTargetFieldOffset===undefined?target(invoke(ports.resolveHostExit,execution({reason}))):destinations[nativeTargetFieldOffset];
  if(!destination)throw TypeError('Anchoring return must use source field140 or144');
  try{receipt(ports.bodyLeave,execution({reason,nativeTargetFieldOffset,destination}));if(host.machine.state.primaryPhase!==0||host.machine.state.secondaryPhase!==0)throw Error('Anchoring Leave must commit primary0 and secondary0');}
  catch(error){host.failed=true;throw error;}
  host.left=true;return destination;
  }catch(error){host.failed=true;throw error;
  }finally{operation=parentOperation;}
 };
 return host;
}
