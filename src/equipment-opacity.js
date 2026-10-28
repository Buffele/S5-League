import {NumberKeyframeTrack} from 'three';
import {MODEL_ALPHA_DRAW_THRESHOLD} from './model-alpha.js';

// ModelDataDraw115AE60 gates C4*C8 before rendering, including opaque models.
// The qualified opaque tracks below are strictly0/1; parent-alpha composition
// and native intermediate blend behavior remain separate from this correction.
export const EQUIPPED_ALPHA_DRAW_THRESHOLD=MODEL_ALPHA_DRAW_THRESHOLD;

// Use the equipped model's existing animation clock, including seek, looping,
// interruption and crossfade. Never merge homonymous models by their name.
export function appendEquipmentOpacityTracks(clips,files,meshes,contract){
 if(contract.schema!=='s5-equipped-opacity-v1')throw Error('Unknown equipped opacity contract');
 const gates=[];
 for(const scene of contract.scenes){
  const file=files.find(f=>f.source===scene.source);
  // A preview may explicitly load only one of the qualified scenes.
  if(!file)continue;
  for(const model of scene.models){
   const source=file.models[model.sourceModelIndex];
   const binary=model.mode==='binary-draw-gate';
   if(source?.name!==model.name||(binary?source.renderState!==0:!(source.renderState&34)))throw Error('Equipped opacity model/index mismatch');
   const mesh=meshes.find(m=>m.userData.source===scene.source&&m.userData.sourceModelIndex===model.sourceModelIndex);
   if(!mesh)throw Error('Missing equipped opacity mesh');
   const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
   if(binary){
    if(materials.some(m=>m.transparent))throw Error('Binary opacity requires the existing opaque material');
    mesh.userData.equipmentAlpha=1;gates.push({mesh,materials});
   }else if(materials.some(m=>!m.transparent))throw Error('Equipped opacity requires a transparent source material');
   for(const clip of clips){
    const track=model.tracks[clip.name]||model.tracks.BASE;
    if(!track)throw Error('Missing equipped opacity animation '+clip.name);
    const keys=track.floatKeys;
    if(!keys.length)continue;
    if(keys.some((k,i)=>!Number.isFinite(k[0])||k[0]<0||i&&k[0]<keys[i-1][0]||!Number.isFinite(k[1])||k[1]<0||k[1]>1))throw Error('Invalid equipped opacity keys');
    if(binary){
     if(keys.some(k=>k[1]!==0&&k[1]!==1))throw Error('Unqualified intermediate opaque alpha');
     clip.tracks.push(new NumberKeyframeTrack(`${mesh.uuid}.userData[equipmentAlpha]`,keys.map(k=>k[0]/4800),keys.map(k=>k[1])));
    }else for(let i=0;i<materials.length;i++)clip.tracks.push(new NumberKeyframeTrack(`${mesh.uuid}.material[${i}].opacity`,keys.map(k=>k[0]/4800),keys.map(k=>k[1])));
   }
  }
 }
 return {clips,sync(){
  for(const {mesh,materials} of gates)for(const material of materials)material.visible=mesh.userData.equipmentAlpha>=EQUIPPED_ALPHA_DRAW_THRESHOLD;
 }};
}
