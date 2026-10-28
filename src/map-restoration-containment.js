// Additional local S5 restoration safety, not a native virtual34 port.
// Slice actual triangles at body-center Y. Only closed, nonintersecting rings
// qualify; open panels, ambiguous junctions and coplanar faces add no volume.
// 1e-7 world-unit endpoint welding absorbs arithmetic reversal on shared edges.
// It does not add faces, enlarge a polygon, or close an authored opening.
export const RESTORATION_SECTION_EPSILON=1e-7;
const epsilon=RESTORATION_SECTION_EPSILON;
const finite=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
const close=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])<=epsilon;
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function section(records,point){
 const vertices=[],edges=new Map();
 const node=p=>{let index=vertices.findIndex(v=>close(v.p,p));if(index<0){index=vertices.length;vertices.push({p,adjacent:new Set()});}return index;};
 for(const record of records){
  const points=record?.points;if(!Array.isArray(points)||points.length!==3||!points.every(finite))return {qualified:false,inside:false,reason:'invalid-triangle'};
  const distances=points.map(p=>p.y-point.y);
  if(distances.every(d=>Math.abs(d)<=epsilon))return {qualified:false,inside:false,reason:'coplanar-section'};
  const hits=[];
  const add=p=>{if(!hits.some(other=>close(other,p)))hits.push(p);};
  for(let i=0;i<3;i++){
   const a=points[i],b=points[(i+1)%3],da=distances[i],db=distances[(i+1)%3];
   if(Math.abs(da)<=epsilon)add([a.x,a.z]);
   if(da<-epsilon&&db>epsilon||da>epsilon&&db<-epsilon){const t=da/(da-db);add([a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t]);}
  }
  if(hits.length<2)continue;
  if(hits.length!==2)return {qualified:false,inside:false,reason:'ambiguous-triangle-section'};
  const a=node(hits[0]),b=node(hits[1]);if(a===b)continue;
  const key=a<b?`${a}:${b}`:`${b}:${a}`;edges.set(key,[a,b]);vertices[a].adjacent.add(b);vertices[b].adjacent.add(a);
 }
 if(!edges.size)return {qualified:false,inside:false,reason:'no-section'};
 if(vertices.some(v=>v.adjacent.size!==2))return {qualified:false,inside:false,reason:'open-or-branched-section'};
 const segments=[...edges.values()];
 // A self-crossing graph or overlapping rings has no unambiguous inside.
 for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
  const [ai,bi]=segments[i],[ci,di]=segments[j];if([ai,bi].some(id=>id===ci||id===di))continue;
  const [a,b,c,d]=[ai,bi,ci,di].map(id=>vertices[id].p);
  const tolerance=epsilon*(Math.hypot(b[0]-a[0],b[1]-a[1])+Math.hypot(d[0]-c[0],d[1]-c[1]));
  const signs=[cross(a,b,c),cross(a,b,d),cross(c,d,a),cross(c,d,b)];
  const overlap=Math.max(Math.min(a[0],b[0]),Math.min(c[0],d[0]))<=Math.min(Math.max(a[0],b[0]),Math.max(c[0],d[0]))+epsilon&&Math.max(Math.min(a[1],b[1]),Math.min(c[1],d[1]))<=Math.min(Math.max(a[1],b[1]),Math.max(c[1],d[1]))+epsilon;
  if(overlap&&Math.min(signs[0],signs[1])<=tolerance&&Math.max(signs[0],signs[1])>=-tolerance&&Math.min(signs[2],signs[3])<=tolerance&&Math.max(signs[2],signs[3])>=-tolerance)return {qualified:false,inside:false,reason:'intersecting-section'};
 }
 // Every component is a degree-two cycle. Even/odd crossing preserves holes
 // and concavities without interpreting a bounding rectangle as occupied.
 let inside=false;
 for(const [ai,bi]of segments){const a=vertices[ai].p,b=vertices[bi].p;if((a[1]>point.z)!==(b[1]>point.z)&&point.x<a[0]+(point.z-a[1])*(b[0]-a[0])/(b[1]-a[1]))inside=!inside;}
 return {qualified:true,inside,reason:inside?'inside-closed-source-section':'outside-closed-source-section'};
}

export function classifyRestorationContainment(records,point){
 if(!Array.isArray(records)||!finite(point))return {qualified:false,inside:false,reason:'invalid-section-input'};
 const owners=new Map();for(const record of records){
  const id=record?.sourceModelIndex;if(!Number.isSafeInteger(id)||id<0)return {qualified:false,inside:false,reason:'unqualified-source-owner'};
  if(!owners.has(id))owners.set(id,[]);owners.get(id).push(record);
 }
 const sections=[...owners.values()].map(records=>section(records,point));
 return sections.find(value=>value.qualified&&value.inside)??sections.find(value=>!value.qualified)??{qualified:sections.length>0,inside:false,reason:'outside-closed-source-sections'};
}
