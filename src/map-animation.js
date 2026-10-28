// SCN animation times are 3ds Max ticks (4800 per second).
const TICKS_PER_SECOND=4800;
export function sampleAlpha(keys,tick){
 if(tick<=keys[0][0])return keys[0][1];
 for(let i=1;i<keys.length;i++){
  const [end,b]=keys[i], [start,a]=keys[i-1];
  if(tick<=end)return a+(b-a)*(tick-start)/(end-start);
 }
 return keys.at(-1)[1];
}
export function createMapAnimation(asset,data){
 const tracks=[];
 for(const mesh of asset.meshes){
  const model=data.models[mesh.userData.sourceModelIndex];
  const animation=Object.values(model?.animations||{}).find(a=>a?.alphaKeys?.length);
  if(!animation)continue;
  tracks.push({materials:[].concat(mesh.material),keys:animation.alphaKeys,duration:animation.durationTicks});
  for(const material of [].concat(mesh.material)){material.transparent=true;material.needsUpdate=true;}
 }
 let elapsed=0;
 const update=dt=>{
  elapsed+=Math.max(0,dt)*TICKS_PER_SECOND;
  for(const {materials,keys,duration} of tracks){
   const opacity=sampleAlpha(keys,duration>0?elapsed%duration:0);
   for(const material of materials)material.opacity=opacity;
  }
 };
 update(0);
 return {update,trackCount:tracks.length};
}
