import {Vector3,Triangle,BoxGeometry,Mesh,MeshStandardMaterial,MeshBasicMaterial,DoubleSide} from 'three';
import {collisionTriangles} from './scene-assets.js';

export const WINDOW_LEDGE_END_INSET=.25;

// Explicit sprint-only gameplay support on the narrow exterior window ledges.
// Keep the reference shell; the two small upper windows receive an explicit
// exterior lip (same mesh for render and collision). This is an S5 gameplay
// reconstruction, not a measured native S5Runtime dimension or global sticky edge.
export function installTrainWindowSupports(world,prefab){
 const bounds=model=>{
  const min=[Infinity,Infinity,Infinity],max=min.map(v=>-v);
  model.vertices.forEach((v,i)=>{min[i%3]=Math.min(min[i%3],v);max[i%3]=Math.max(max[i%3],v);});return {min,max};
 };
 const regions=[],upperLips=[];
 // Pane and frame source IDs, not export-dependent render mesh indices.
 for(const [paneId,frameId,upper] of [[75,15,false],[77,10,true],[79,9,true],[81,6,false],[83,4,false],[85,7,false],[87,8,false],[93,5,false]]){
  const pane=prefab.models.find(m=>m.sourceModel===`0:${paneId}`),frame=prefab.models.find(m=>m.sourceModel===`0:${frameId}`);
  if(!pane||!frame)throw Error('Gabarit de rebord du train absent');
  const p=bounds(pane),f=bounds(frame),side=Math.sign(p.min[2]);
  if(upper){
   const topFaces=prefab.collision.filter(t=>t.every(v=>Math.abs(v[1]-f.max[1])<.0001)&&
    t.some(v=>v[0]>=p.min[0]&&v[0]<=p.max[0]&&Math.sign(v[2])===side));
   const outer=Math.max(...topFaces.flat().map(v=>Math.abs(v[2])));
   if(!Number.isFinite(outer))throw Error('Rebord supérieur du train absent');
   // The old edge sits under the sloped shell. Expose a 0.14-unit lip so an
   // exterior ellipsoid can reach it; do not move/recess the glass itself.
   upperLips.push({paneId,minX:p.min[0]+WINDOW_LEDGE_END_INSET,maxX:p.max[0]-WINDOW_LEDGE_END_INSET,y:f.max[1],side,inner:outer-.015,outer:outer+.14});
  }
  // At the top of the small window, the exterior approach meets the frame
  // lip before the recessed glass edge. Both must be covered.
  for(const y of upper?[f.min[1],p.max[1],f.max[1]]:[f.min[1]])regions.push({
   paneId,minX:p.min[0]+WINDOW_LEDGE_END_INSET,maxX:p.max[0]-WINDOW_LEDGE_END_INSET,y,side,
   minZ:Math.min(Math.abs(p.min[2]),Math.abs(p.max[2]))-.03,
   maxZ:Math.max(Math.abs(f.min[2]),Math.abs(f.max[2]))+.04,
  });
 }
 const faces=prefab.collision.filter(t=>regions.some(r=>t.every(p=>Math.abs(p[1]-r.y)<.0001)))
  .map(t=>new Triangle(...t.map(p=>new Vector3(...p))));
 let added=false;
 for(const module of world.modules.values()){
  if(module.definition.prefab!==prefab.id)continue;
  for(const lip of upperLips){
   const name=`S5 exterior upper window lip ${lip.paneId}`;
   let collider=module.collisions.find(m=>m.name===name);
   if(!collider){
    const geometry=new BoxGeometry(lip.maxX-lip.minX,.025,lip.outer-lip.inner);
    geometry.translate((lip.minX+lip.maxX)/2,lip.y-.0125,lip.side*(lip.inner+lip.outer)/2);
    const visible=new Mesh(geometry,new MeshStandardMaterial({color:0x23344d,roughness:.6,metalness:.2}));
    visible.name=name;visible.castShadow=true;visible.receiveShadow=true;
    collider=new Mesh(geometry,new MeshBasicMaterial({side:DoubleSide}));
    collider.name=name;collider.visible=false;collider.userData.collision=true;collider.userData.oneWayTop=true;
    module.group.add(visible,collider);module.collisions.push(collider);module.meshes.push(visible);added=true;
   }
   const top=[new Vector3(lip.minX,lip.y,lip.side*lip.inner),new Vector3(lip.maxX,lip.y,lip.side*lip.inner),
    new Vector3(lip.maxX,lip.y,lip.side*lip.outer),new Vector3(lip.minX,lip.y,lip.side*lip.outer)];
   faces.push(new Triangle(top[0],top[1],top[2]),new Triangle(top[0],top[2],top[3]));
  }
 }
 if(added){
  world.group.updateMatrixWorld(true);
  world.meshes=[...world.modules.values()].filter(m=>m.definition.enabled!==false).flatMap(m=>m.collisions);
  world.triangles=collisionTriangles(world.meshes);
 }
 world.edgeSupportKey=contact=>{
  // Shared-edge sweeps can report either adjacent triangle first. Match the
  // contact point to a real horizontal ledge face, not that arbitrary normal.
  // The ellipsoid must already touch it with an upward contact (caller check).
  for(const module of world.modules.values()){
   if(module.definition.prefab!==prefab.id||module.definition.enabled===false)continue;
   const p=module.group.worldToLocal(new Vector3().copy(contact.point));
   const region=regions.find(r=>p.x>=r.minX&&p.x<=r.maxX&&Math.abs(p.y-r.y)<.0001&&
     Math.sign(p.z)===r.side&&Math.abs(p.z)>=r.minZ&&Math.abs(p.z)<=r.maxZ);
   if(region&&faces.some(t=>t.closestPointToPoint(p,new Vector3()).distanceToSquared(p)<1e-8))return `${module.definition.id}:${region.paneId}`;
  }
  return null;
 };
 world.supportsEdgeContact=contact=>world.edgeSupportKey(contact)!==null;
 return regions;
}
