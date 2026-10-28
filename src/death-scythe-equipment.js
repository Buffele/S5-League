// Explicit S5 fallback policy, not a reconstructed native animation dispatcher.
// Source GR poses already use attachment-local coordinates. Inverse(BASE) would
// reintroduce a scene-space transform into those poses, as in the Air Gun REX.
export function prepareDeathScytheEquipment(source){
 if(source.source!=='model/weapon/deathscythe_normal.scn')throw new TypeError('Expected classic Death Scythe scene');
 const file=structuredClone(source);delete file.attachmentNode;
 file.attachment='R_Hand_Dummy';file.idleAttachment='Spine_Dummy';file.defaultAnimation='GR000';
 const missing=['GR014','GR015','GR016','GR017','GR018','GR019','GR020'],adaptations=[];
 for(const bone of file.bones){const animations=bone.animations;if(!animations?.GR013)continue;
  for(const clip of missing)if(!animations[clip]){animations[clip]={copy:'GR013',data:null};adaptations.push({node:bone.name,clip,sourceClip:'GR013'});}
 }
 for(const model of file.models){const animations=model.animations;if(!animations?.GR013)continue;
  for(const clip of missing)if(!animations[clip]){animations[clip]=structuredClone(animations.GR013);adaptations.push({node:model.name,clip,sourceClip:'GR013'});}
 }
 file.runtimeAdaptations={policy:'reuse weapon GR013 only for seven absent directional equipment tracks; preserve every explicit source pose',nativeFallbackVerified:false,entries:adaptations};
 return file;
}
