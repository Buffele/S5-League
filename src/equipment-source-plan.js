// Source paths only. These are the same assets selected by loadAvatar; this
// worker prefetch never evaluates poses, builds rigs or changes readiness gates.
const nativeFolders={demonicknuckle:'demonic-knuckle',deathscythe:'death-scythe',vitalshock:'vital-shock',sigmablade:'sigma-blade',handgun:'handgun',assaultrifle:'assault-rifle',burstshotgun:'burst-shotgun',heavymachinegun:'heavy-machine-gun',twinblade:'twin-blade',bat:'bat',ironboots:'iron-boots',assassinclaw:'assassin-claw'};
const animationFolders={breaker:'breaker',katana:'katana',airgun:'airgun',cannonade:'cannonade',rocketlauncher:'rocket-launcher',semirifle:'semi-rifle',submachinegun:'submachine-gun',revolver:'revolver'};
const assetIds={submachinegun:'submachine-gun',smashrifle:'smash-rifle',semirifle:'semi-rifle',twinblade:'twin-blade',rocketlauncher:'rocket-launcher'};
export function equipmentSourceUrls(item,scope={}){
 const {sex='male',appearance='s5runtime',outfit='01'}={...scope,...(item.kind==='character'?item:{})};
 const urls=[`/assets/s5runtime/rig-${sex}.json`];
 if(appearance!=='urban')urls.push(appearance==='meshy'?`/assets/characters/meshy/outfit-${sex}.json`:appearance==='s5runtime'?`/assets/s5runtime/outfit-${sex}-${outfit}.json`:'/assets/s4-model-reference.json');
 if(item.kind==='character')return urls;
 const {weapon,skin}=item,folder=nativeFolders[weapon],animation=animationFolders[weapon];
 urls.push(folder?`/assets/s5runtime/${folder}/model.json`:weapon==='revolver'?'/assets/s5runtime/weapons/revolver/model.json':`/assets/s5runtime/weapon-${assetIds[weapon]||weapon}-${skin}.json`);
 if(weapon==='sigmablade')urls.push('/assets/s5runtime/sigma-blade/model-transformed.json');
 if(folder)urls.push(`/assets/s5runtime/${folder}/animations/${sex}.json`);
 if(animation)urls.push(`/assets/s5runtime/animations/${animation}/${sex}.json`);
 return urls;
}
export async function warmEquipmentSources(item,scope,{readJson,warmTexture,seen=new Set(),beforeFile=async()=>{}}){
 for(const url of equipmentSourceUrls(item,scope)){
  if(seen.has(url))continue;
  await beforeFile();const data=await readJson(url);
  // Only texture references are read. Do not clone source data back to the UI.
  for(const file of Array.isArray(data)?data:[])for(const model of ((url.includes('/outfit-')||url==='/assets/s4-model-reference.json')&&file.source?.includes('/weapon/')?[]:file.models||[]))for(const texture of model.textures||[])for(const name of [texture.name,texture.lightmap]){
   if(!name)continue;const path=name.startsWith('/')?name:`/assets/${name}`;
   if(seen.has(path))continue;
   await beforeFile();await warmTexture(path);seen.add(path);
  }
  seen.add(url);
 }
}
