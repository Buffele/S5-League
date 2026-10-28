import {conquestPawnParticleSequence,prepareConquestPawnParticleSource,CONQUEST_PAWN_PARTICLE_SOURCE_ASSETS} from './conquest-pawn-particle-source.js';
import {createConquestPawnDeathFrame,assertConquestPawnDeathActorSource} from './conquest-pawn-death-frame.js';
import {createConquestPawnDeathSequence} from './conquest-pawn-death-sequence.js';
import {CONQUEST_PAWN_PARTICLE_PRESENTATION_MODE} from './conquest-pawn-particle-root-plan.js';
import {ConquestPawnEffectLifetimeKernel,conquestSequenceControllerMembership,unregisterConquestOrdinaryEffectWrapper} from './conquest-pawn-effect-lifetime-kernel.js';
import {tickNativeSequenceManager} from './native-sequence-manager.js';
import {assertConquestPawnParticleRenderBank,prepareConquestPawnParticleRenderBank} from './conquest-pawn-particle-render.js';
import {conquestEnterBaseParticleSequence,prepareConquestEnterBaseParticleSource,CONQUEST_ENTER_BASE_PARTICLE_SOURCE_ASSETS} from './conquest-enter-base-particle-source.js';
import {assertConquestEnterBaseParticleRenderBank,prepareConquestEnterBaseParticleRenderBank} from './conquest-enter-base-particle-render.js';
import {createConquestEnterBaseDeathSequence} from './conquest-enter-base-death-sequence.js';
import {CONQUEST_ENTER_BASE_PARTICLE_PRESENTATION_MODE} from './conquest-enter-base-particle-root-plan.js';

const owners=new WeakMap(),rootOf=node=>{while(node?.parent)node=node.parent;return node;};

// Prepare once for the retained scene/session, before synchronous actor birth.
// All subsequent Death transitions reuse these authenticated decoded banks.
export async function prepareConquestPawnDeathEffects({fetchAsset=globalThis.fetch,decodeImage=globalThis.createImageBitmap,...options}={}){
 if(typeof fetchAsset!=='function'||typeof decodeImage!=='function')throw Error('Actual Death asset fetch and image decoder required');
 const read=async asset=>{const response=await fetchAsset(asset.url);if(!response?.ok)throw Error('Death source asset unavailable '+asset.url);return response.arrayBuffer();};
 const [ordinary,base]=await Promise.all([Promise.all(CONQUEST_PAWN_PARTICLE_SOURCE_ASSETS.map(read)),Promise.all(CONQUEST_ENTER_BASE_PARTICLE_SOURCE_ASSETS.map(read))]);
 const [source,baseSource]=await Promise.all([prepareConquestPawnParticleSource({sequenceBytes:ordinary[0],parsedJsonBytes:ordinary[1]}),prepareConquestEnterBaseParticleSource({sequenceBytes:base[0],parsedJsonBytes:base[1],manifestBytes:base[2]})]);
 let renderBank,baseBank;
 try{
  renderBank=await prepareConquestPawnParticleRenderBank({source,fetchAsset,decodeImage});
  baseBank=await prepareConquestEnterBaseParticleRenderBank({source:baseSource,fetchAsset,decodeImage});
  return createConquestPawnDeathEffects({...options,source,renderBank,presentationMode:CONQUEST_PAWN_PARTICLE_PRESENTATION_MODE,
   enterBaseResources:{source:baseSource,renderBank:baseBank,presentationMode:CONQUEST_ENTER_BASE_PARTICLE_PRESENTATION_MODE},ownsRenderBanks:true});
 }catch(error){renderBank?.dispose();baseBank?.dispose();throw error;}
}

// Retained S5 scene resources around the recovered source collections. The
// native wrapper's reference-count allocator is not impersonated: explicit
// S5 leases retain the real sequence/frame until their owning collection lets
// them go. Visibility/GPU/numerical observation remain separate parity gates.
export function createConquestPawnDeathEffects({source,world,scene,camera,renderBank,nextRandom15,
 numericalProfile,trigProfile,qualityProfile,clockProfile,presentationMode,enterBaseResources=null,ownsRenderBanks=false}={}){
 const spec=conquestPawnParticleSequence(source);
 if(spec.durationMs!==1000||world?.nativeMapId!==46||!scene?.isScene||rootOf(world.group)!==scene||!camera?.isCamera||!renderBank||presentationMode!==CONQUEST_PAWN_PARTICLE_PRESENTATION_MODE)throw Error('Prepared ordinary Pawn Death resources and explicit S5 scene presentation required');
 assertConquestPawnParticleRenderBank(renderBank,{source});
 if(typeof ownsRenderBanks!=='boolean')throw Error('Explicit Death render-bank ownership required');
 const baseSource=enterBaseResources?.source??null,baseBank=enterBaseResources?.renderBank??null,baseMode=enterBaseResources?.presentationMode??null;
 if(enterBaseResources!==null){
  if(conquestEnterBaseParticleSequence(baseSource).durationMs!==2500||baseMode!==CONQUEST_ENTER_BASE_PARTICLE_PRESENTATION_MODE)throw Error('Exact Enter Base source and explicit dedicated presentation required');
  assertConquestEnterBaseParticleRenderBank(baseBank,{source:baseSource});
 }
 const controllers=[],controllerModes=new Map(),wrappers=new Set(),reservedController10=Object.freeze({kind:'owned-empty-S5-sequence-helper',actions:[],externalNodes:[]}),manager={controllers,reservedController10};
 let disposed=false,serial=0,ticks=0,lastDraws=[];
 function live(){if(disposed||rootOf(world.group)!==scene)throw Error('Current Conquest Pawn Death scene service required');assertConquestPawnParticleRenderBank(renderBank,{source});if(baseSource!==null)assertConquestEnterBaseParticleRenderBank(baseBank,{source:baseSource});}
 function wrapperLive(wrapper){if(!wrappers.has(wrapper)||wrapper.disposed)throw Error('Actual retained Pawn Death wrapper required');return wrapper;}
 function releaseWrapper(wrapper,reason){
  wrapperLive(wrapper);const index=wrapper.leases.indexOf(reason);if(index<0)throw Error('Unowned Pawn effect lease release');wrapper.leases.splice(index,1);
  if(wrapper.leases.length===0){wrapper.sequence.dispose();wrapper.frame.dispose();wrapper.disposed=true;wrappers.delete(wrapper);}
 }
 function removeController(controller){
  const index=controllers.indexOf(controller);if(index<0)return false;controller.reset();controllers.splice(index,1);controllerModes.delete(controller);return true;
 }
 const membership=controller=>conquestSequenceControllerMembership({controller,reservedController10,orderedControllers:controllers});
 const sequencePorts={
  // This helper has no public writer or action payload in this S5 service.
  // The native allocator/helper object's full behavior remains unqualified.
  cleanupHelper(){for(const action of reservedController10.actions)action.dispose();reservedController10.actions.length=0;reservedController10.externalNodes.length=0;},begin:()=>0,hasCurrent:i=>i<controllers.length,readController:i=>controllers[i],
  updateController:(controller,deltaMs)=>controller.tickController(deltaMs).active,
  readResetEnabled:()=>true,resetController:controller=>controller.reset(),
  remove:i=>{controllerModes.delete(controllers[i]);controllers.splice(i,1);return i;},next:i=>i+1,
 };
 const kernel=new ConquestPawnEffectLifetimeKernel({
  readServices:()=>({manager8:manager,sceneC:scene,sound10:null}),
  retainWrapper(wrapper,reason){wrapperLive(wrapper);wrapper.leases.push(reason);},releaseWrapper,
  setupWrapper(wrapper,services){
   wrapperLive(wrapper);if(services.manager!==manager||services.scene!==scene||services.sound!==null||wrapper.setup)throw Error('Owned one-shot Pawn wrapper setup required');
   wrapper.sequence.bindCapturedRoot();controllers.push(wrapper.sequence);controllerModes.set(wrapper.sequence,wrapper.mode);wrapper.setup=true;return true;
  },
  readController:wrapper=>wrapperLive(wrapper).sequence,
  attachActionParents:controller=>controller.attachActionParents(),
  readMembership:wrapper=>membership(wrapperLive(wrapper).sequence),
  unregisterWrapper(wrapper,retainedManager){
   wrapperLive(wrapper);if(retainedManager!==manager)throw Error('Retained source sequence manager changed');
   return unregisterConquestOrdinaryEffectWrapper(wrapper.fields,{
    readMembership:membership,removeController,
    readParent:node=>node.parent,removeChild:(parent,node)=>parent.remove(node),
    setParent:(node,parent)=>{if(node.parent!==parent)throw Error('Actual Death root detach failed');},
    clearStrongField(fields,offset){if(offset===0x28)fields.root28=null;else if(offset===0x2c)fields.secondary2C=null;else if(offset===0x20)fields.scene20=null;else throw Error('Unqualified wrapper strong field');},
    clearEmptyChildren:children=>{if(children.length)throw Error('Ordinary Pawn wrapper child collection changed');children.length=0;},
   });
  },
  tickSequenceManager:(_manager,deltaMs)=>tickNativeSequenceManager(deltaMs,sequencePorts),
 });
 const api=Object.freeze({async warm(renderer,camera,scene){live();const reports=[await renderBank.warm(renderer,camera,scene)];if(baseBank)reports.push(await baseBank.warm(renderer,camera,scene));live();return reports;},
  prepareDeathEffect(state,{enterBase,effectOverride,persistentPresentation}={}){
   live();if(typeof enterBase!=='boolean'||enterBase!==(state?.actor?.nativeField33C===2)||effectOverride!==(enterBase?'Resources/Effects/enter_base.seq':null))throw Error('Exact Pawn Death source effect selection required');
   if(enterBase&&baseSource===null)throw Error('Seven-node Resources/Effects/enter_base.seq runtime is not prepared; ordinary Death is not a substitute');
   let frame,sequence,wrapper;
   try{
    frame=createConquestPawnDeathFrame({actor:state?.actor,state,world,scene,persistentPresentation});
    const createSequence=enterBase?createConquestEnterBaseDeathSequence:createConquestPawnDeathSequence;
    sequence=createSequence({source:enterBase?baseSource:source,frameOwner:frame,actor:state.actor,world,scene,camera,renderBank:enterBase?baseBank:renderBank,nextRandom15,numericalProfile,trigProfile,qualityProfile,clockProfile});
    wrapper={id:++serial,actor:state.actor,leaseOwner:Object.freeze({kind:'retained-S5-Pawn-Death-effect'}),frame,sequence,mode:enterBase?baseMode:presentationMode,leases:['factory-local'],setup:false,disposed:false,fields:{manager,root28:frame.logicalRoot,secondary2C:null,scene20:scene,controller30:sequence,children24:[]}};wrappers.add(wrapper);
    if(!kernel.register(wrapper,1))throw Error('Actual Pawn Death wrapper registration failed');
    const result=Object.freeze({accepted:true,actor:state.actor,effectId:wrapper.id,path:frame.sequencePath,renderer:enterBase?'s5-owned-source-enter-base-particles':'s5-owned-source-pawn-particles',nativeReady:false});
    releaseWrapper(wrapper,'factory-local');return result;
   }catch(error){
    if(wrapper&&wrappers.has(wrapper)){try{kernel.remove(wrapper);removeController(wrapper.sequence);}catch(cleanup){sequence?.dispose();frame?.dispose();wrappers.delete(wrapper);throw new AggregateError([error,cleanup],'Pawn Death registration cleanup failed');}if(wrappers.has(wrapper)&&wrapper.leases.includes('factory-local'))releaseWrapper(wrapper,'factory-local');}
    else{sequence?.dispose();frame?.dispose();}throw error;
   }
  },
  readActorLeases(actor){
   live();return [...wrappers].filter(wrapper=>wrapper.actor===actor&&!wrapper.disposed).map(wrapper=>wrapper.leaseOwner);
  },
  tick(deltaMs){
   live();lastDraws=[];
   // AFE100 polls/removes wrappers BEFORE121D960 advances their controllers.
   // A controller ending now therefore loses its wrapper at the next poll.
   kernel.tick(deltaMs);
   if(deltaMs!==0)for(const controller of controllers)lastDraws.push(controller.tickPresentation(deltaMs,{mode:controllerModes.get(controller)}));
   ticks++;return api.snapshot();
  },
  snapshot(){
   live();return {activeEffects:kernel.snapshot().count,activeSequences:controllers.length,ticks,
    renderedParticles:lastDraws.reduce((sum,d)=>sum+d.renderedParticles,0),presentationMode,ownsRenderBanks,
    sourceOrderedLifecycleQualified:true,ordinaryDeathRuntimePrepared:true,enterBaseRuntimePrepared:baseSource!==null,
    nativeReservedControllerQualified:false,nativeRefCountQualified:false,nativeSceneAdmissionQualified:false,nativeGPUQualified:false,nativeClockProfileObserved:false,nativeReady:false};
  },
  dispose(){
   if(disposed)return;const errors=[];
   for(const wrapper of [...wrappers])try{kernel.remove(wrapper);}catch(error){errors.push(error);}
   for(const wrapper of [...wrappers]){try{wrapper.sequence.dispose();wrapper.frame.dispose();}catch(error){errors.push(error);}wrapper.disposed=true;}
   wrappers.clear();controllers.length=0;controllerModes.clear();disposed=true;lastDraws=[];
   if(ownsRenderBanks)for(const bank of [renderBank,baseBank].filter(Boolean))try{bank.dispose();}catch(error){errors.push(error);}
   if(errors.length)throw new AggregateError(errors,'Pawn Death effects cleanup failed');
  },
 });
 owners.set(api,{world,scene,live});return api;
}
export function assertConquestPawnDeathEffects(owner,{actor,world,scene}={}){
 const r=owners.get(owner);if(!r||world!==undefined&&r.world!==world||scene!==undefined&&r.scene!==scene||actor!==undefined&&rootOf(actor.model.group)!==r.scene)throw Error('Typed actual Pawn Death effect service required');if(actor!==undefined)assertConquestPawnDeathActorSource(actor);r.live();return owner;
}
