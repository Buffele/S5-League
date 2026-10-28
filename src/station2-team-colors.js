// Share each side's palette, but never mutate a GLTF material used by both teams.
export function applyStationTeamColors(groups){
 const cache=new Map();let surfaces=0;
 for(const group of groups){
  const team=group.userData.moduleId?.startsWith('alpha-')?'alpha':group.userData.moduleId?.startsWith('beta-')?'beta':null;
  if(!team)continue;
  group.traverse(mesh=>{
   if(!mesh.isMesh||!/Panneau bleu cobalt/.test(mesh.material?.name))return;
   const source=mesh.material,key=team+source.uuid;
   if(!cache.has(key)){const material=source.clone();material.name=source.name+(team==='alpha'?' / Alpha bleu':' / Beta corail');material.color.setRGB(...(team==='alpha'?[.035,.17,.64]:[.64,.065,.035]));material.userData={...source.userData,stationTeam:team};cache.set(key,material);}
   mesh.material=cache.get(key);surfaces++;
  });
 }
 let previous=false;
 return {surfaces,setSwapped(swapped){
  swapped=!!swapped;if(swapped===previous)return;previous=swapped;
  for(const material of cache.values()){
   const authored=material.userData.stationTeam,team=swapped?(authored==='alpha'?'beta':'alpha'):authored;
   material.color.setRGB(...(team==='alpha'?[.035,.17,.64]:[.64,.065,.035]));
  }
 }};
}
