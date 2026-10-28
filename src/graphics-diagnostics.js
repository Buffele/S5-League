export function auditTextureRoots(roots){
 const textures=new Set();
 for(const root of roots.filter(Boolean))root.traverse(object=>{
  for(const material of [].concat(object.material||[])){
   for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
   for(const uniform of Object.values(material.uniforms||{}))if(uniform.value?.isTexture)textures.add(uniform.value);
  }
 });
 const rows=[...textures].map(texture=>{
  const image=texture.image??{},width=image.naturalWidth||image.width||texture.mipmaps?.[0]?.width||0,height=image.naturalHeight||image.height||texture.mipmaps?.[0]?.height||0;
  const compressed=texture.isCompressedTexture===true;
  return {name:texture.name||image.currentSrc||image.src||'generated / embedded',width,height,compressed,anisotropy:texture.anisotropy,
   estimatedBytes:compressed?texture.mipmaps.reduce((n,m)=>n+(m.data?.byteLength||0),0):Math.ceil(width*height*4*(texture.generateMipmaps?4/3:1))};
 }).sort((a,b)=>b.estimatedBytes-a.estimatedBytes);
 return {scope:'Material textures referenced by supplied roots, including preloaded equipment; excludes render targets, environment and driver overhead. Cloned texture objects may share GPU storage.',
  textureObjects:rows.length,atLeast4k:rows.filter(r=>Math.max(r.width,r.height)>=3840).length,estimatedObjectBytes:rows.reduce((n,r)=>n+r.estimatedBytes,0),largest:rows.slice(0,40)};
}

// Opt-in DOM report lets browser QA read real renderer state without exposing a
// writable game console. No per-frame instrumentation in ordinary sessions.
export function installGraphicsDiagnostics({document,read}){
 const longTasks=[];let observer=null;
 if(globalThis.PerformanceObserver?.supportedEntryTypes?.includes('longtask')){
  observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())longTasks.push({startTime:entry.startTime,duration:entry.duration});if(longTasks.length>200)longTasks.splice(0,longTasks.length-200);});observer.observe({type:'longtask'});
 }
 const button=document.createElement('button'),output=document.createElement('output');
 button.textContent='Inspect graphics';button.id='graphics-audit';output.id='graphics-audit-result';output.hidden=true;
 button.style.cssText='position:fixed;right:16px;top:56px;z-index:100;padding:8px;background:#123646;color:white';
 button.onclick=event=>{event.stopPropagation();const result=read();output.dataset.report=JSON.stringify({...result,longTasksAfterReady:longTasks.filter(entry=>entry.startTime>=(result.startupReadyMs||Infinity))});button.textContent='Graphics report ready';};
 button.onpointerdown=event=>event.stopPropagation();document.body.append(button,output);
 return {dispose(){observer?.disconnect();button.remove();output.remove();}};
}
