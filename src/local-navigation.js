// Local bot navigation derived from the current collision surfaces. This is an
// S5 path planner, not a recovered S5Runtime navigation mesh or movement controller.
import {Ray,Vector3} from 'three';
const cell=1.25,key=(x,z)=>`${x},${z}`;
export function createLocalNavigation(world){
 let source=null,nodes=[],cells=new Map();
 function rebuild(){
  source=world.triangles;nodes=[];cells=new Map();const bins=new Map();
  const triangles=world.triangles?.length?world.triangles:world.colliders.flatMap(b=>[[[b.minX,b.maxY,b.minZ],[b.maxX,b.maxY,b.maxZ],[b.maxX,b.maxY,b.minZ]],[[b.minX,b.maxY,b.minZ],[b.minX,b.maxY,b.maxZ],[b.maxX,b.maxY,b.maxZ]]]);
  for(const t of triangles){
   const [a,b,c]=t,den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(den)<1e-6)continue;
   const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
   if(ny/Math.hypot(nx,ny,nz)<.45)continue;
   const minX=Math.ceil(Math.min(a[0],b[0],c[0])/cell),maxX=Math.floor(Math.max(a[0],b[0],c[0])/cell),minZ=Math.ceil(Math.min(a[2],b[2],c[2])/cell),maxZ=Math.floor(Math.max(a[2],b[2],c[2])/cell);
   if((maxX-minX)*(maxZ-minZ)>20000)continue;
   for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){
    const px=x*cell,pz=z*cell,u=((b[2]-c[2])*(px-c[0])+(c[0]-b[0])*(pz-c[2]))/den,v=((c[2]-a[2])*(px-c[0])+(a[0]-c[0])*(pz-c[2]))/den;
    if(u<-.001||v<-.001||u+v>1.001)continue;const y=u*a[1]+v*b[1]+(1-u-v)*c[1];if(y<(world.deathY??-15)||y>40)continue;
    const k=key(x,z),heights=bins.get(k)||[];if(!heights.some(h=>Math.abs(h-y)<.25))heights.push(y);bins.set(k,heights);
   }
  }
  for(const [k,heights] of bins){const [x,z]=k.split(',').map(Number),ids=[];for(const y of heights){const n={id:nodes.length,x:x*cell,y:y+.02,z:z*cell,ix:x,iz:z,neighbors:[]};nodes.push(n);ids.push(n.id);}cells.set(k,ids);}
  const obstacles=new Map();
  for(const t of triangles){const vectors=t.map(p=>new Vector3(...p)),minX=Math.floor((Math.min(...t.map(p=>p[0]))-.4)/cell),maxX=Math.ceil((Math.max(...t.map(p=>p[0]))+.4)/cell),minZ=Math.floor((Math.min(...t.map(p=>p[2]))-.4)/cell),maxZ=Math.ceil((Math.max(...t.map(p=>p[2]))+.4)/cell);if((maxX-minX)*(maxZ-minZ)>20000)continue;
   for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){const k=key(x,z),list=obstacles.get(k)||[];list.push(vectors);obstacles.set(k,list);}
  }
  const clear=(a,b,dx,dz)=>{
   const candidates=new Set([...(obstacles.get(key(a.ix,a.iz))||[]),...(obstacles.get(key(b.ix,b.iz))||[])]),length=Math.hypot(dx,dz),ox=-dz/length*.32,oz=dx/length*.32;
   for(const [offsetX,offsetZ,height] of [[0,0,1.6],[ox,oz,.9],[-ox,-oz,.9]]){
    const from=new Vector3(a.x+offsetX,(b.y>a.y+.4?b.y:a.y)+height,a.z+offsetZ),to=new Vector3(b.x+offsetX,b.y+height,b.z+offsetZ),delta=to.clone().sub(from),distance=delta.length(),ray=new Ray(from,delta.normalize()),hit=new Vector3();
    for(const t of candidates)if(ray.intersectTriangle(...t,false,hit)&&hit.distanceTo(from)<distance-.01)return false;
   }return true;
  };
  for(const n of nodes)for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])for(const id of cells.get(key(n.ix+dx,n.iz+dz))||[]){const next=nodes[id],dy=next.y-n.y;if(dy<=2.2&&dy>=-4&&clear(n,next,dx,dz))n.neighbors.push({id,cost:Math.hypot(dx,dz)*cell+Math.max(0,dy)*2});}
 }
 function nearest(p){let best=null,cost=Infinity;for(const n of nodes){const d=Math.hypot(n.x-p.x,n.z-p.z)+Math.abs(n.y-p.y)*2;if(d<cost){cost=d;best=n;}}return best;}
 return {get nodeCount(){return nodes.length;},path(from,to){
  if(source!==world.triangles||!nodes.length)rebuild();const start=nearest(from),end=nearest(to);if(!start||!end)return [];
  const open=new Set([start.id]),came=new Map(),cost=new Map([[start.id,0]]);let visited=0;
  while(open.size&&visited++<12000){let current=null,best=Infinity;for(const id of open){const n=nodes[id],score=cost.get(id)+Math.hypot(n.x-end.x,n.z-end.z);if(score<best){best=score;current=id;}}
   if(current===end.id){const path=[nodes[current]];while(came.has(current)){current=came.get(current);path.unshift(nodes[current]);}return path;}
   open.delete(current);for(const e of nodes[current].neighbors){const next=cost.get(current)+e.cost;if(next<(cost.get(e.id)??Infinity)){cost.set(e.id,next);came.set(e.id,current);open.add(e.id);}}
  }return [];
 }};
}
