import * as THREE from 'three';

// Select a walkable collision surface at the geometric centre, never scenery
// or the sky dome. If the centre is a hole, use the nearest walkable triangle.
export function chaserSpawn(world){
 const triangles=world.triangles||[],floor=[],solids=[];
 for(const points of triangles){
  const t=new THREE.Triangle(...points.map(p=>new THREE.Vector3(...p)));
  solids.push(t);
  if(t.getNormal(new THREE.Vector3()).y>.65)floor.push(t);
 }
 if(floor.length){
  const bounds=new THREE.Box3();for(const t of floor)for(const p of [t.a,t.b,t.c])bounds.expandByPoint(p);
  const centre=bounds.getCenter(new THREE.Vector3());
  // Start near the playable spawn level: overhead bridges/roof tops are not
  // the central court below them (Azure has a crossing beam at y=5.6).
  centre.y=Number.isFinite(world.spawn?.y)?world.spawn.y+.5:bounds.max.y+5;
  // A central landmark can occupy the exact centre (Azure's beacon). Require
  // standing clearance, then search outward in short rings around the centre.
  const closest=new THREE.Vector3();
  const landing=(x,z)=>{
   const ray=new THREE.Ray(new THREE.Vector3(x,centre.y,z),new THREE.Vector3(0,-1,0));
   const hits=floor.map(t=>ray.intersectTriangle(t.a,t.b,t.c,false,new THREE.Vector3())).filter(Boolean).sort((a,b)=>b.y-a.y);
   for(const hit of hits){
    const head=new THREE.Ray(new THREE.Vector3(x,hit.y+.08,z),new THREE.Vector3(0,1,0));
    if(solids.some(t=>{const p=head.intersectTriangle(t.a,t.b,t.c,false,new THREE.Vector3());return p&&p.y-hit.y<2.1;}))continue;
    if([.5,1.2,1.8].some(y=>{const p=new THREE.Vector3(x,hit.y+y,z);return solids.some(t=>t.closestPointToPoint(p,closest).distanceTo(p)<.4);} ))continue;
    return {x,y:hit.y+.02,z};
   }
  };
  let point=landing(centre.x,centre.z);if(point)return point;
  for(let radius=.5;radius<=10;radius+=.5)for(let i=0;i<16;i++){
   point=landing(centre.x+radius*Math.cos(i*Math.PI/8),centre.z+radius*Math.sin(i*Math.PI/8));if(point)return point;
  }
  const candidates=floor.map(t=>t.getMidpoint(new THREE.Vector3())).sort((a,b)=>Math.hypot(a.x-centre.x,a.z-centre.z)-Math.hypot(b.x-centre.x,b.z-centre.z));
  for(const candidate of candidates){point=landing(candidate.x,candidate.z);if(point)return point;}
  throw Error('Chaser : aucune surface centrale praticable avec dégagement');
 }
 const ground=(world.colliders||[]).filter(c=>c.maxY<=1&&c.maxX-c.minX>2&&c.maxZ-c.minZ>2).sort((a,b)=>(b.maxX-b.minX)*(b.maxZ-b.minZ)-(a.maxX-a.minX)*(a.maxZ-a.minZ))[0];
 if(ground)return {x:(ground.minX+ground.maxX)/2,y:ground.maxY+.02,z:(ground.minZ+ground.maxZ)/2};
 throw Error('Chaser : aucune surface centrale praticable');
}
