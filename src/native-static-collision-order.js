//72B1F0 ->730710 blast2 path. Caller supplies already qualified linked child
// lists; this never sorts by owner IDs, object names, geometry or map identity.
export function nativeBlast2FactoryOrder({sections,profileChildren}){
 if(!Array.isArray(sections)||!(profileChildren instanceof Map))throw TypeError('Explicit sections and ordered child lists required');
 const entries=new Map();
 for(const entry of sections){
  if(typeof entry?.section!=='string'||typeof entry.name!=='string'||entries.has(entry.section))throw TypeError('Unique section/name records required');
  entries.set(entry.section,entry);
 }
 const factories=[],consumedSections=[],unsupportedProfiles=[];let index=1;
 for(;;index++){
  const section=`BLASTINFO_${String(index).padStart(2,'0')}`,entry=entries.get(section);if(!entry)break;
  consumedSections.push(section);
  if(!entry.name.startsWith('blast2')){unsupportedProfiles.push(entry.name);continue;}
  if(!profileChildren.has(entry.name))continue;
  const children=profileChildren.get(entry.name);if(!Array.isArray(children))throw TypeError('Ordered child array required');
  for(const child of children)factories.push({section,profile:entry.name,child,pieceCount:1});
 }
 return {factories,consumedSections,firstMissingSection:`BLASTINFO_${String(index).padStart(2,'0')}`,
  unsupportedProfiles,qualified:unsupportedProfiles.length===0,nativeReady:false};
}
