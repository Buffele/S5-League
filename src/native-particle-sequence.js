// Field conversion shared with the validated Air Gun emitter decoder.
// Particle conversion only; Lightning uses native-lightning/lightning-effect.
export function convertParticleSequence(raw,root){
 if(!raw.coverage.reachesExactEof)throw Error('Incomplete effect sequence');
 const nodes=raw.nodes.map(n=>{
  if(n.type!=='CActParticle')throw Error('Unsupported particle sequence node '+n.type);
  const {base:b,control:c,blockA:a,blockB:appearance,textures:t}=n.fields,p=c.primaryWords;
  const emitterKeys=a.entries.map(k=>{const e={'object+0c':k.field0c.int32,'object+10':+k.flag10};k.words14to60.forEach((v,i)=>{const address=0x14+i*4;e['object+'+address.toString(16)]=[0x34,0x58,0x5c,0x60].includes(address)?v.int32:v.float32;});return e;});
  const e=emitterKeys[0],uv=t.entries.map(k=>k.uvWords.map(v=>v.float32));
  return {id:n.index,type:n.type,parentType:b.field0c.int32,parent:b.field10.int32,bone:b.name.value,start:b.startTimeField.int32/1000,end:b.endTimeField.int32/1000,
   capacity:c.field58.int32,rate:e['object+5c'],lifeMs:e['object+58'],lifeVariationMs:p[3].int32,speed:p[4].float32,speedVariation:p[5].float32,widthVariation:p[6].float32,heightVariation:p[7].float32,acceleration:p.slice(8,11).map(v=>v.float32),angularRange:p[11].float32,appearance:appearance.entries.map(row=>row.map(v=>v.float32)),
   native:{'18':p[0].int32,'1c':p[1].int32,'20':p[2].int32,'54':+c.flag54,'58':c.field58.int32,'5c':+c.flag5c,'60':c.field60.int32,'64':+c.flag64,'6c':c.field6c.int32},emitterKeys,emitterDurationMs:a.field10.int32,emitterLoop:+a.flag14,
   textures:t.entries.map(k=>root+'/textures/'+k.path.value.split(/[\\/]/).at(-1).replace(/\.[^.]+$/,'.png')),uv:uv[0],textureUVs:uv};
 });
 return {duration:Math.max(raw.header.durationField/1000,...nodes.map(n=>n.end)),nodes};
}
