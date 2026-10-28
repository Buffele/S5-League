import * as THREE from 'three';

const surfaceProperties=['background','fog','environment','backgroundIntensity','backgroundRotation','environmentIntensity','environmentRotation'];
const isRotation=name=>name==='backgroundRotation'||name==='environmentRotation';
export function captureMapSurface(scene){
 return Object.fromEntries(surfaceProperties.map(name=>[name,isRotation(name)?scene[name].clone():scene[name]]));
}

// Keep complete worlds (geometry, textures, animations and collisions) alive
// for this tab. A rejected load can be retried; concurrent loads share work.
export class MapSession {
 constructor(load){this.load=load;this.entries=new Map();this.current=null;}
 async get(key){
  if(!this.entries.has(key)){
   const pending=Promise.resolve().then(()=>this.load(key));
   this.entries.set(key,pending);
   pending.catch(()=>{if(this.entries.get(key)===pending)this.entries.delete(key);});
  }
  return this.entries.get(key);
 }
 async activate(key,scene){
  const entry=await this.get(key);
  this.current?.world.restorePresentation?.();
  this.current?.root.removeFromParent();
  scene.add(entry.root);
  for(const name of surfaceProperties){
   const value=entry.surface[name];
   if(isRotation(name))scene[name].copy(value);
   else scene[name]=value;
  }
  this.current=entry;return entry;
 }
}

export async function buildMapEntry(build){
 const stage=new THREE.Scene();stage.background=new THREE.Color(0x75caff);stage.fog=new THREE.Fog(0x9ad4f7,50,140);
 const world=await build(stage),root=new THREE.Group();root.name=`Map / ${world.name||'Arène'}`;
 root.add(...stage.children);root.updateMatrixWorld(true);
 const surface=captureMapSurface(stage);
 return {world,root,surface};
}
