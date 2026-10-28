// GLTFLoader owns separate Texture wrappers per parser. A map installation
// can share their Source identity for exact, content-addressed PNGs before
// the first upload. Wrappers retain all sampler/UV/color-space properties.
// This bank is local to one installation, never a cross-world lifetime owner.
export function shareReconstructionTextureSources(assets,{mapKey='azit'}={}){
 if(!/^[a-z][a-z0-9-]{0,47}$/.test(mapKey))throw Error('Explicit reconstruction map key required');
 const imageRoot='/assets/maps/'+mapKey+'/reconstruction-textures/';
 const sources=new Map(),seen=new Set();let eligible=0,shared=0;
 for(const {scene,parser}of assets){
  if(!parser?.json||!parser.associations)continue;
  scene.traverse(object=>{
   if(!object.isMesh)return;
   for(const material of Array.isArray(object.material)?object.material:[object.material])for(const texture of Object.values(material)){
    if(!texture?.isTexture||seen.has(texture))continue;seen.add(texture);
    const index=parser.associations.get(texture)?.textures,definition=parser.json.textures?.[index],image=parser.json.images?.[definition?.source];
    if(typeof image?.uri!=='string'||!image.uri.startsWith(imageRoot)||! /^[a-f0-9]{64}\.png$/.test(image.uri.slice(imageRoot.length)))continue;
    const data=texture.source?.data;if(!data||!Number.isFinite(data.width)||!Number.isFinite(data.height))continue;
    // Current PNG GLTFLoader decode uses the same flip/premultiply options.
    // Include dimensions as an additional guard; upload/sampler differences
    // remain on each wrapper and in Three's own GPU source-state cache key.
    const key=image.uri+'|'+data.width+'x'+data.height;eligible++;
    if(sources.has(key)){if(texture.source!==sources.get(key)){texture.source=sources.get(key);shared++;}}
    else sources.set(key,texture.source);
   }
  });
 }
 return{eligibleTextures:eligible,uniqueSources:sources.size,sharedSources:shared,scope:'One reconstruction installation; Texture wrappers remain individually owned. ImageBitmap cache lifetime is unchanged.'};
}
