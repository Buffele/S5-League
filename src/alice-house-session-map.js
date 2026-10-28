// Alice House's source BGINFO enables Chaser only. Free training also allows
// exploration without claiming a qualified match configuration.
export const ALICE_HOUSE_MAP='alice-house';
export function competitiveMapAllowed(map,mode){
 return ['arena','circle2','circle2-classic'].includes(map)||(map===ALICE_HOUSE_MAP&&mode==='chaser')||(map==='ironheart'&&mode==='siege');
}
export function aliceHouseMapAllowed(map,mode){
 if(map==='ironheart')return mode==='siege'||mode==='training';
 // Azit owns qualified source-trigger host adapters for free training and
 // local Deathmatch. Other native artist maps keep their existing gate.
 if(map==='azit')return mode==='training'||mode==='deathmatch';
 if(['bio-lab','blade-city'].includes(map))return mode==='training';
 return map!==ALICE_HOUSE_MAP||mode==='chaser'||mode==='training';
}

// Cached worlds are reused across modes. Remember the source factory default
// once, then choose before Controller construction/setWorld (including rollback).
const sourceSessionSpawns=new WeakMap();
export function applyAliceHouseSessionSpawn(world,mode){
 if(world?.nativeMapId!==225)return null;
 if(!sourceSessionSpawns.has(world))sourceSessionSpawns.set(world,{spawn:world.spawn?{...world.spawn}:null,previewFacing:world.previewFacing});
 const original=sourceSessionSpawns.get(world),training=mode==='training';
 if(training&&(!world.trainingSpawn?.qualified||!['x','y','z'].every(axis=>Number.isFinite(world.trainingSpawn.position?.[axis]))))throw Error('Alice free-training spawn is not qualified');
 world.spawn=training?{...world.trainingSpawn.position}:original.spawn?{...original.spawn}:null;
 const facing=training?world.trainingSpawn.facing:original.previewFacing;
 if(facing===undefined)delete world.previewFacing;else world.previewFacing=facing;
 world.sessionSpawnSelection={mode,kind:training?'free-training-exploration':'source-factory-default',nativeSpawn:false,
  policy:training?'Qualified S5 terrain exploration point outside Chaser spawn room. Real role-marker match spawns are unchanged.':'Restore the source factory default before the match applies its authenticated per-role marker poses.'};
 return world.spawn;
}
