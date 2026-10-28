import {hasSealedConquestStaticSource} from './conquest-static-source-frame.js';
import {isConquestSourceCollisionDescriptor} from './conquest-collision-source.js';
import {CONQUEST_SOURCE_DATA} from './conquest-source-data.js';
import {assertConquestQueenActor} from './conquest-queen-ai.js';

const owners=new WeakMap(),captures=new WeakMap(),f=Math.fround;
const ini='mapinfo/bginfo-wave_middle.ini',hash='0176e846ef48b96f5e9cece2e3956e644f74fb0bad547ed491ce83ce1c660fb1';
export function assertConquestQueenRayDistanceLimit(owner,{world}={}){const r=owners.get(owner);if(!r||r.world!==world)throw Error('Typed Queen map46 ray-distance owner required');r.live();return owner;}
export function assertConquestQueenRayDistanceCapture(capture,{actor,world}={}){const r=captures.get(capture);if(!r||r.actor!==actor||world!==undefined&&r.world!==world)throw Error('Typed actual Queen LuaCreate range capture required');r.live();return capture;}

// 861D60 executes the original min(map6C,option33,map68) and writes15F4404.
// A2289A..A228D3 publishes that current float into this Lua script at creation.
// The current S5 option is deliberately explicit; native Conquest option33
// selection is not inferred from the PE's initial25000 or camera clipping.
export function createConquestQueenRayDistanceLimit({world,option33}={}){
 if(!Number.isFinite(option33)||!Number.isFinite(f(option33))||f(option33)<=0)throw Error('Explicit positive S5 source option33 policy required');
 const bundle=world?.sourceData,collision=world?.collisionSourceWorld,descriptors=world?.nativeCollisionSources;
 if(world?.nativeMapId!==46||!hasSealedConquestStaticSource(world,bundle)||!collision||collision.sourceData!==bundle||!Array.isArray(descriptors)||descriptors.length!==4||CONQUEST_SOURCE_DATA.sourceHashes[ini]!==hash)throw Error('Current authenticated sealed map46 range source required');
 const retained=descriptors.map(descriptor=>({descriptor,source:descriptor.source,records:descriptor.readRecords()}));
 let disposed=false;const actorCaptures=new Map(),view=f(option33),limit=Math.min(f(100000),f(150000),view);
 const live=()=>{if(disposed||world.sourceData!==bundle||world.collisionSourceWorld!==collision||world.nativeCollisionSources!==descriptors||collision.active!==true||!hasSealedConquestStaticSource(world,bundle)||CONQUEST_SOURCE_DATA.sourceHashes[ini]!==hash||descriptors.length!==retained.length||retained.some((r,i)=>descriptors[i]!==r.descriptor||!isConquestSourceCollisionDescriptor(r.descriptor,r)||r.descriptor.readRecords()!==r.records))throw Error('Current owned Queen map46 ray-distance source required');};
 const api=Object.freeze({
  capture({actor}={}){live();assertConquestQueenActor(actor);if(actorCaptures.has(actor))throw Error('Release prior Queen LuaCreate capture before replacement');const model=actor.model,stats=actor.spawnStats;
   const capture=Object.freeze({rayDistanceLimit:limit,option33:view,mapId:46,sourcePublication:0xa2289a,sourceRangeEquationQualified:true,nativeOption33Observed:false,nativeReady:false});
   captures.set(capture,{actor,world,live:()=>{live();if(actorCaptures.get(actor)!==capture||actor.model!==model||actor.spawnStats!==stats)throw Error('Current owned Queen LuaCreate range capture required');assertConquestQueenActor(actor);}});actorCaptures.set(actor,capture);return capture;},
  releaseActor(actor){live();actorCaptures.delete(actor);},
  snapshot(){live();return {mapId:46,fogMaxDist:100000,cullDist:150000,option33:view,rayDistanceLimit:limit,capturedActors:actorCaptures.size,sourceRangeEquationQualified:true,optionPolicy:'explicit S5 option33 parameter',nativeOption33Observed:false,nativeReady:false};},
  dispose(){if(disposed)return;disposed=true;actorCaptures.clear();},
 });owners.set(api,{world,live});live();return api;
}
