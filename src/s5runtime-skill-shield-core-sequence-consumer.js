import {createShieldCoreSequenceClock,advanceShieldCoreSequenceClock,shieldCoreSequenceAttachmentPlan} from './s5runtime-skill-shield-core-sequence-clock.js';

// Explicit renderer ports: no automatic use of shared Sequence's finite clock.
export function createShieldCoreSequenceConsumer({modelNodes,ports,portProvenance,clockProfile}={}){
 for(const key of ['create','update','remove','readAttachmentMatrix']){
  if(typeof ports?.[key]!=='function'||['AsyncFunction','GeneratorFunction','AsyncGeneratorFunction'].includes(ports[key].constructor.name))throw Error('Synchronous non-generator '+key+' port required');
  if(typeof portProvenance?.[key]!=='string'||!portProvenance[key].trim())throw Error(key+' provenance required');
 }
 if(typeof clockProfile?.provenance!=='string'||!clockProfile.provenance.trim())throw Error('Qualified clock profile required');
 // Validate before allocating renderer handles.
 createShieldCoreSequenceClock(clockProfile);
 let instances=[],activeSerial=null,disposed=false;
 const sync=value=>{if(value&&typeof value.then==='function')throw Error('Thenable renderer port result');return value;};
 const matrix=descriptor=>{
  const values=sync(ports.readAttachmentMatrix(descriptor));
  if(!values||values.length!==16||!Array.from(values).every(Number.isFinite))throw Error('Explicit attachment matrix16 required');
  return Array.from(values);
 };
 function clear(reason='component-remove'){
  const old=instances;instances=[];activeSerial=null;
  const errors=[];
  for(const instance of old)try{sync(ports.remove(instance.handle,{descriptor:instance.descriptor,reason}));}catch(error){errors.push(error);}
  if(errors.length)throw new AggregateError(errors,'Core sequence cleanup failed');
 }
 return {
  start({itemKey,activationSerial,provenance}={}){
   if(disposed)throw Error('Disposed core sequence consumer');
   if(!Number.isSafeInteger(activationSerial)||activationSerial<1)throw Error('Explicit activation serial required');
   if(activeSerial===activationSerial)return false;
   const plan=shieldCoreSequenceAttachmentPlan({itemKey,modelNodes,provenance});
   // Verify every current attachment before replacing a previously valid set.
   const matrices=plan.map(matrix);
   clear('component-replace');
   try{
    for(const [index,descriptor] of plan.entries()){
     const clock=createShieldCoreSequenceClock(clockProfile);
     const handle=sync(ports.create({descriptor,matrixElements:matrices[index],clock:{...clock}}));
     if(handle==null)throw Error('Renderer must return a concrete core sequence handle');
     instances.push({descriptor,handle,clock});
    }
    activeSerial=activationSerial;
   }catch(error){try{clear('create-rollback');}catch(cleanup){throw new AggregateError([error,cleanup],'Core create and rollback failed');}throw error;}
   return true;
  },
  advance({dtMs}={}){
   if(disposed)throw Error('Disposed core sequence consumer');
   // Validate dt even with no active renderer handles.
   if(!Number.isInteger(dtMs)||dtMs<0||dtMs>0xffffffff)throw Error('Native uint32 dtMs required');
   const matrices=instances.map(i=>matrix(i.descriptor));
   for(const [index,instance] of instances.entries()){
    const clock=advanceShieldCoreSequenceClock(instance.clock,dtMs);
    sync(ports.update(instance.handle,{descriptor:instance.descriptor,matrixElements:matrices[index],dtMs,...clock}));
   }
  },
  clear,
  snapshot(){return {activationSerial:activeSerial,instances:instances.map(i=>({descriptorIndex:i.descriptor.descriptorIndex,parentName:i.descriptor.parentName,currentMs:i.clock.currentMs})),portProvenance:{...portProvenance},nativeParticleRendererVerified:false,nativeWorldTransformVerified:false,nativeReady:false};},
  dispose(){if(disposed)return;disposed=true;clear('dispose');},
 };
}
