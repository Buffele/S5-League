import {worldTriangles} from './collision.js';
const f=Math.fround,unit=.006;
// Spatial index of CURRENT host static faces. Native contact/height kernels
// consume its float32 geometry; this does not claim native octree membership.
export function createStaticContactIndex(readOneWayEnabled){
 let signature=null,current=null,rebuilds=0;
 return {
  read(world){
   const next=[world,world.triangles,world.triangles?.length,world.colliders,world.colliders?.length,world.ramp,
    ...['minX','maxX','minZ','maxZ','bottom','top'].map(k=>world.ramp?.[k])];
   if(signature&&next.every((v,i)=>v===signature[i]))return current;
   const items=worldTriangles(world).map((points,id)=>{
    const vertices=points.map(p=>[p.x,p.y,p.z].map(n=>f(n/unit)));
    const bounds={min:[0,1,2].map(i=>Math.min(...vertices.map(p=>p[i]))),max:[0,1,2].map(i=>Math.max(...vertices.map(p=>p[i])))};
    const [a,b,c]=vertices,packet={origin:a,edge1:b.map((n,i)=>f(n-a[i])),edge2:c.map((n,i)=>f(n-a[i]))};
    return {id,vertices,bounds,packet,oneWay:!!points.oneWay};
   });
   let nodes=0;
   function node(rows,path=''){
    if(!rows.length)return null;nodes++;
    const min=[0,1,2].map(i=>Math.min(...rows.map(r=>r.bounds.min[i]))),max=[0,1,2].map(i=>Math.max(...rows.map(r=>r.bounds.max[i])));
    const bounds={min:min.map(n=>f(n-1)),max:max.map(n=>f(n+1))};
    if(rows.length<=24){
     const record=(group,key)=>({key,qualified:true,raw10:1,raw18:0,raw34:true,triangleCount:group.length,
      vertices:group.flatMap(r=>r.vertices),packets:group.map(r=>r.packet),triangleBounds:group.map(r=>r.bounds)});
     const ordinary=rows.filter(r=>!r.oneWay),records=ordinary.length?[record(ordinary,'static:'+path)]:[];
     for(const row of rows.filter(r=>r.oneWay)){
      const value=record([row],'oneway:'+row.id);
      Object.defineProperty(value,'raw34',{get:()=>readOneWayEnabled(row)});records.push(value);
     }
     return {bounds,branch:false,records};
    }
    const axis=[0,1,2].sort((a,b)=>(max[b]-min[b])-(max[a]-min[a]))[0];
    const sorted=rows.slice().sort((a,b)=>(a.bounds.min[axis]+a.bounds.max[axis])-(b.bounds.min[axis]+b.bounds.max[axis]));
    return {bounds,branch:true,children:Array.from({length:8},(_,i)=>node(sorted.slice(Math.floor(i*rows.length/8),Math.floor((i+1)*rows.length/8)),path+i))};
   }
   current={tree:node(items),complete:true,treeComplete:true,children:[]};signature=next;rebuilds++;
   current.triangleCount=items.length;current.nodeCount=nodes;return current;
  },
  diagnostics:()=>({rebuilds,triangleCount:current?.triangleCount??0,nodeCount:current?.nodeCount??0}),
  dispose(){signature=null;current=null;},
 };
}
