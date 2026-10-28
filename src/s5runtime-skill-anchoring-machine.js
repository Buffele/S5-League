import {advanceS5RuntimeAnchoringPullMotion} from './s5runtime-skill-anchoring-motion.js';
import {s5runtimeAnchoringInputRequests} from './s5runtime-skill-anchoring-kernel.js';
const portNames=['baseTick','baseInput','readActorSlot3c','readActorSlot40','primaryTransition','secondaryTransition','aimTick','readActorPoints','actor70','phase5Orientation','secondaryTickEffects','helper63F760','bodyReturn'];
const u32=v=>Number.isInteger(v)&&v>=0&&v<=0xffffffff;
function phase(v){if(!Number.isInteger(v)||v<0||v>5)throw Error('Raw Anchoring phase0..5 required');return v;}
function timer(v){if(!v||!['counter','durationMs','elapsedMs'].every(k=>u32(v[k]))||typeof v.blocked!=='boolean')throw Error('Raw source timer required');return {...v};}
function sync(fn,label){if(typeof fn!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(fn.constructor?.name))throw Error('Synchronous source port required: '+label);}
function call(machine,name,args){const r=machine.ports[name](args);if(r&&typeof r.then==='function')throw Error('Thenable source port forbidden: '+name);if(r&&typeof r.next==='function')throw Error('Iterator source port forbidden: '+name);return r;}
function booleanRead(machine,name){const r=call(machine,name,{state:machine.state});if(typeof r!=='boolean')throw Error('Raw bool read required: '+name);return r;}
function effect(machine,name,args){const r=call(machine,name,args);if(r?.executedSourceBranch!==true)throw Error('Explicit source branch execution required: '+name);return r;}
function advanceTimer(t,dt,blockedKeepsActive=false){if(t.blocked)return blockedKeepsActive?false:t.elapsedMs>t.durationMs;t.counter=(t.counter+1)>>>0;t.elapsedMs=(t.elapsedMs+dt)>>>0;return t.elapsedMs>t.durationMs;}
const ratio=t=>t.durationMs===0?0:Math.fround(Math.fround(t.elapsedMs)/Math.fround(t.durationMs));

// Scheduler only. Ports MUST implement/qualify the remaining native side
// effects; this module supplies no silent visual/cost/physics substitutes.
export function createS5RuntimeAnchoringMachine({itemKey,bodyEntrySerial,primaryPhase,secondaryPhase,rawBody1a0,primaryTimer,secondaryTimer,ports,provenance}={}){
 if(![3010001,3010002].includes(itemKey)||!Number.isSafeInteger(bodyEntrySerial)||bodyEntrySerial<0||typeof rawBody1a0!=='boolean')throw Error('Explicit Anchoring actor/body identity required');
 for(const name of portNames){sync(ports?.[name],name);if(typeof provenance?.[name]!=='string'||!provenance[name].trim())throw Error('Source/adaptation provenance required: '+name);}
 return {state:{itemKey,bodyEntrySerial,primaryPhase:phase(primaryPhase),secondaryPhase:phase(secondaryPhase),rawBody1a0,primaryTimer:timer(primaryTimer),secondaryTimer:timer(secondaryTimer)},ports:{...ports},provenance:{...provenance},nativeReady:false,nativeCompared:false};
}
export function requestS5RuntimeAnchoringPrimaryPhase(machine,nextPhase){
 const s=machine.state,previous=s.primaryPhase;phase(nextPhase);
 if(previous===nextPhase)return {changed:false,effectsExecuted:false};
 const effects=nextPhase===0||nextPhase>previous;
 if(effects){
  const r=effect(machine,'primaryTransition',{state:s,previousPhase:previous,nextPhase});
  const nextTimer=timer(r.primaryTimer);if(nextTimer.counter!==0||nextTimer.elapsedMs!==0||nextTimer.blocked!==s.primaryTimer.blocked)throw Error('Primary entry timer reset must preserve blocked');
  if(typeof r.rawBody1a0!=='boolean')throw Error('Raw body1A0 after primary effects required');
  s.primaryTimer=nextTimer;s.rawBody1a0=r.rawBody1a0;
 }
 //63BCA4→63DE69 bypasses effects but still writes118 at63DE6F.
 s.primaryPhase=nextPhase;return {changed:true,effectsExecuted:effects};
}
export function requestS5RuntimeAnchoringSecondaryPhase(machine,nextPhase){
 const s=machine.state,previous=s.secondaryPhase;phase(nextPhase);if(previous===nextPhase)return {changed:false};
 const preserveTimer=nextPhase===5&&previous===1;
 //63DECD prelude removes attachments even when phase1→5 skips its branch.
 const r=effect(machine,'secondaryTransition',{state:s,previousPhase:previous,nextPhase,preludeDetachRequired:true,preserveTimer});
 if(!preserveTimer){const nextTimer=timer(r.secondaryTimer);if(nextTimer.counter!==0||nextTimer.elapsedMs!==0||nextTimer.blocked!==s.secondaryTimer.blocked)throw Error('Secondary entry timer reset must preserve blocked');s.secondaryTimer=nextTimer;}
 s.secondaryPhase=nextPhase;return {changed:true,preserveTimer};
}
export function inputS5RuntimeAnchoringMachine(machine,{nativeInputCode,nativeContext}={}){
 const s=machine.state;
 if(nativeContext?.enabled!==true||nativeContext.bodyVtable!==0x13b6884||nativeContext.bodyEntrySerial!==s.bodyEntrySerial)return {accepted:false,nativeReady:false};
 const actorSlot3c=booleanRead(machine,'readActorSlot3c');
 const r=s5runtimeAnchoringInputRequests({primaryPhase:s.primaryPhase,nativeInputCode,nativeContext:{enabled:true,bodyVtable:0x13b6884,actorSlot3c}});
 if(r.commands.primaryPhaseRequest!==undefined)requestS5RuntimeAnchoringPrimaryPhase(machine,r.commands.primaryPhaseRequest);
 if(r.commands.secondaryPhaseRequest!==undefined)requestS5RuntimeAnchoringSecondaryPhase(machine,r.commands.secondaryPhaseRequest);
 if(r.forwardToBase)effect(machine,'baseInput',{state:s,nativeInputCode,nativeFunction:'501D40'});
 return {accepted:true,forwardedToBase:r.forwardToBase,primaryPhase:s.primaryPhase,secondaryPhase:s.secondaryPhase,nativeReady:false};
}
export function advanceS5RuntimeAnchoringMachine(machine,{dtMs,nativeContext}={}){
 if(!u32(dtMs))throw Error('Native uint32 Tick delta required');
 const s=machine.state;
 if(nativeContext?.enabled!==true||nativeContext.bodyVtable!==0x13b6884||nativeContext.bodyEntrySerial!==s.bodyEntrySerial)return {accepted:false,reason:'matching-actual-body32-required',nativeReady:false};
 effect(machine,'baseTick',{state:s,dtMs}); //639B2E→5617F0
 const remote=booleanRead(machine,'readActorSlot3c');
 const primaryAtEntry=s.primaryPhase;
 if(!remote){
  if(primaryAtEntry===1){
   if(advanceTimer(s.primaryTimer,dtMs,true))requestS5RuntimeAnchoringPrimaryPhase(machine,2);
   else{const r=effect(machine,'aimTick',{state:s,dtMs});if(typeof r.rawBody1a0!=='boolean')throw Error('Raw aim body1A0 result required');s.rawBody1a0=r.rawBody1a0;}
  }else if(primaryAtEntry===2){
   if(advanceTimer(s.primaryTimer,dtMs,true)){
    if(s.secondaryPhase===3)requestS5RuntimeAnchoringPrimaryPhase(machine,3);
    else if(s.secondaryPhase===4)requestS5RuntimeAnchoringPrimaryPhase(machine,s.rawBody1a0?4:5);
   }
  }else if(primaryAtEntry===3){
   if(s.secondaryPhase===4)requestS5RuntimeAnchoringPrimaryPhase(machine,s.rawBody1a0?4:5);
  }else if(primaryAtEntry===4){
   const points=call(machine,'readActorPoints',{state:s});
   const r=advanceS5RuntimeAnchoringPullMotion(s.primaryTimer,{dtMs,primaryPhase:4,nativeContext:{enabled:true,bodyVtable:0x13b6884,actorSlot3c:false},actor2d8Vector:points?.actor2d8Vector,actor2e4Vector:points?.actor2e4Vector});
   effect(machine,'actor70',{state:s,displacement:r.commands.actor70Displacement});
   if(r.expired)requestS5RuntimeAnchoringPrimaryPhase(machine,5);
  }else if(primaryAtEntry===5){
   if(advanceTimer(s.primaryTimer,dtMs,true))requestS5RuntimeAnchoringPrimaryPhase(machine,0);
   else effect(machine,'phase5Orientation',{state:s,dtMs,ratio:ratio(s.primaryTimer)});
  }
 }else if(primaryAtEntry===2&&advanceTimer(s.primaryTimer,dtMs,true))requestS5RuntimeAnchoringPrimaryPhase(machine,3);

 //639B46→63AB00 runs AFTER primary Tick/effects in the same frame.
 const secondaryAtEntry=s.secondaryPhase;
 if(secondaryAtEntry===1){
  if(s.primaryPhase===2&&!booleanRead(machine,'readActorSlot40'))requestS5RuntimeAnchoringSecondaryPhase(machine,2);
 }else if([2,3,5].includes(secondaryAtEntry)&&s.secondaryTimer.durationMs!==0){
  const expired=advanceTimer(s.secondaryTimer,dtMs,secondaryAtEntry!==3);
  //Phase2 expired has its own node194 branch; phase3 updates presentation
  //before expiry check; phase5 expired skips the active presentation branch.
  if(secondaryAtEntry!==5||!expired)effect(machine,'secondaryTickEffects',{state:s,phase:secondaryAtEntry,dtMs,expired,ratio:ratio(s.secondaryTimer)});
  if(expired&&!booleanRead(machine,'readActorSlot40'))requestS5RuntimeAnchoringSecondaryPhase(machine,secondaryAtEntry===5?0:secondaryAtEntry+1);
 }else if(secondaryAtEntry===4&&s.primaryPhase===5&&!booleanRead(machine,'readActorSlot40'))requestS5RuntimeAnchoringSecondaryPhase(machine,5);

 if(!booleanRead(machine,'readActorSlot3c')){
  effect(machine,'helper63F760',{state:s,value:1});
  if(s.primaryPhase===0&&s.secondaryPhase===0)effect(machine,'bodyReturn',{state:s,nativeTargetFieldOffset:s.rawBody1a0?0x140:0x144});
 }
 return {accepted:true,primaryPhase:s.primaryPhase,secondaryPhase:s.secondaryPhase,nativeReady:false,nativeCompared:false,remainingEffectsImplementedByExplicitPorts:true};
}
