import {nativeConstructedCellFromBounds} from './native-cell-triangle-clipping.js';
const f=Math.fround,expansion=.10000000149011612;
const xyz=value=>{
 if(!Array.isArray(value)||value.length!==3||!value.every(n=>Number.isFinite(n)&&Number.isFinite(f(n))))throw TypeError('Finite native XYZ required');
 return value.map(f);
};
const u32=n=>Number.isInteger(n)&&n>=0&&n<=0xffffffff;
const cloneBounds=b=>({min:xyz(b?.min),max:xyz(b?.max)});
const subtract=(a,b)=>a.map((n,i)=>f(n-b[i]));
const packet=([a,b,c])=>({origin:a.slice(),edge1:subtract(b,a),edge2:subtract(c,a)});
function unionPoint(bounds,p){for(let i=0;i<3;i++){if(p[i]<bounds.min[i])bounds.min[i]=p[i];if(p[i]>bounds.max[i])bounds.max[i]=p[i];}}
function triangleBounds(triangle){const bounds={min:triangle[0].slice(),max:triangle[0].slice()};for(const p of triangle.slice(1))unionPoint(bounds,p);return bounds;}

// Initial seed only. Never pass captured final envelopes as source cell seeds.
export function nativeStaticInitialRoot({size,depth}={}){
 size=xyz(size);
 if(size.some(n=>n<=0)||!Number.isInteger(depth)||depth<0||depth>255)throw TypeError('Positive native size and byte depth required');
 return {bounds:{min:size.map(n=>f(-n*.5)),max:size.map(n=>f(n*.5))},level:Math.max(1,Math.min(10,depth))-1};
}
export function nativeStaticChildBounds(bounds,index){
 if(!Number.isInteger(index)||index<0||index>7)throw TypeError('Child index0..7 required');
 const {center}=nativeConstructedCellFromBounds(bounds),{min,max}=cloneBounds(bounds);
 return {min:[index&1?center[0]:min[0],index&2?min[1]:center[1],index&4?min[2]:center[2]],
  max:[index&1?max[0]:center[0],index&2?center[1]:max[1],index&4?center[2]:max[2]]};
}

//126E170 reference admission profile: float32 stores, JS double for the x87
// expressions. Caller must select it explicitly; it is not an FPU-mode claim.
export function nativeStaticAdmission53(triangle,bounds){
 if(!Array.isArray(triangle)||triangle.length!==3)throw TypeError('Triangle3 required');
 triangle=triangle.map(xyz);
 const p=packet(triangle),points=[p.origin,p.origin.map((n,i)=>f(n+p.edge1[i])),p.origin.map((n,i)=>f(n+p.edge2[i]))];
 const {center,size}=nativeConstructedCellFromBounds(bounds),half=size.map(n=>f(n*.5));
 const vertices=points.map(v=>subtract(v,center));
 const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
 const cross=(a,b)=>[f(f(a[1]*b[2])-f(a[2]*b[1])),f(f(a[2]*b[0])-f(a[0]*b[2])),f(f(a[0]*b[1])-f(a[1]*b[0]))];
 for(const axis of [0,2,1]){const values=vertices.map(v=>v[axis]);if(Math.min(...values)>half[axis]||Math.max(...values)<-half[axis])return false;}
 const edges=[subtract(vertices[1],vertices[0]),subtract(vertices[2],vertices[1]),subtract(vertices[0],vertices[2])],normal=cross(edges[0],edges[1]);
 const vmin=normal.map((n,i)=>f((n>0?-half[i]:half[i])-vertices[0][i]));
 const vmax=normal.map((n,i)=>f((n>0?half[i]:-half[i])-vertices[0][i]));
 if(dot(normal,vmin)>0||dot(normal,vmax)<0)return false;
 const pairs=[[[0,2],[0,2],[1,2]],[[0,2],[0,2],[0,1]],[[0,1],[0,1],[1,2]]];
 for(let e=0;e<3;e++){
  const [x,y,z]=edges[e],project=[v=>f(z*v[1]-y*v[2]),v=>f(-z*v[0]+x*v[2]),v=>f(y*v[0]-x*v[1])];
  const radius=[f(Math.abs(z)*half[1]+Math.abs(y)*half[2]),f(Math.abs(z)*half[0]+Math.abs(x)*half[2]),f(Math.abs(y)*half[0]+Math.abs(x)*half[1])];
  for(let axis=0;axis<3;axis++){const values=pairs[e][axis].map(i=>project[axis](vertices[i]));if(Math.min(...values)>radius[axis]||Math.max(...values)<-radius[axis])return false;}
 }
 return true;
}

// Geometry backend only. The host supplies source completeness, ordered groups,
// admission arithmetic and clipping arithmetic explicitly. No map lookup,
// filtered-S5 fallback, FPU inference, cache loading, or Controller coupling.
export function buildNativeStaticTree({root,groups,sourceProfile,admitTriangle,clipTriangle}={}){
 if(!sourceProfile||sourceProfile.branch!=='source-rebuild'||sourceProfile.geometry!=='complete-source-triangles'||
  typeof sourceProfile.evidence!=='string'||!sourceProfile.evidence.trim()||!Array.isArray(sourceProfile.sources)||
  !sourceProfile.sources.length||sourceProfile.sources.some(s=>typeof s!=='string'||!s))throw TypeError('Explicit complete source-rebuild profile/evidence required');
 if(!root||!Number.isInteger(root.level)||root.level<0||root.level>9||!Array.isArray(groups)||typeof admitTriangle!=='function'||typeof clipTriangle!=='function')throw TypeError('Initial root, ordered groups, admission and clip callbacks required');
 const seed=cloneBounds(root.bounds);nativeConstructedCellFromBounds(seed);
 const initialNodes=new Map(),capacityStops=[],seen=new Set();
 const make=(path,bounds,level)=>{
  if(!initialNodes.has(path))initialNodes.set(path,{fullPath:path,initialBounds:bounds,level,records:[]});
  return initialNodes.get(path);
 };
 make('',seed,root.level);
 for(const group of groups){
  const groupSources=group?.sources??[group?.source];
  if(!group||typeof group.key!=='string'||seen.has(group.key)||!u32(group.raw10)||!u32(group.raw18)||
   !(group.raw14==null||Number.isInteger(group.raw14)&&group.raw14>=0&&group.raw14<=255)||
   ![0,1].includes(group.builderArgument)||!Array.isArray(group.triangles)||!Array.isArray(groupSources)||!groupSources.length||
   new Set(groupSources).size!==groupSources.length||groupSources.some(source=>!sourceProfile.sources.includes(source))||
   group.source!=null&&!groupSources.includes(group.source))throw TypeError('Unique qualified source record identity, flags, sources and triangles required');
  seen.add(group.key);
  const input=group.triangles.map(t=>{if(!Array.isArray(t)||t.length!==3)throw TypeError('Triangle3 required');return t.map(xyz);});
  function visit(path,bounds,level,triangles){
   const node=make(path,bounds,level);
   if(level){
    for(let index=0;index<8;index++){
     const child=nativeStaticChildBounds(bounds,index),selected=triangles.filter(t=>{
      const result=admitTriangle(t,child);if(typeof result!=='boolean')throw TypeError('Admission callback must return a boolean');return result;
     });
     if(selected.length)visit(path+index,child,level-1,selected);
    }
    return;
   }
   const generated=[],vertices=[];let vertexCount=0;
   for(const triangle of triangles){
    if(group.builderArgument===0){generated.push(triangle);vertices.push(...triangle);continue;}
    const clipped=clipTriangle({triangle,cell:nativeConstructedCellFromBounds(bounds),existingVertexCount:vertexCount});
    if(!clipped||typeof clipped.accepted!=='boolean')throw TypeError('Explicit clip result required');
    if(!clipped.accepted){capacityStops.push({path,key:group.key,vertexCount});break;}
    if(!Array.isArray(clipped.indices)||!Array.isArray(clipped.polygon)||!Number.isInteger(clipped.vertexCount)||clipped.vertexCount<vertexCount)throw TypeError('Clip polygon, fan indices and vertex count required');
    for(const indices of clipped.indices){
     if(!Array.isArray(indices)||indices.length!==3||indices.some(index=>!Number.isInteger(index)||index<vertexCount||index-vertexCount>=clipped.polygon.length))throw TypeError('Valid source fan indices required');
     const fan=indices.map(index=>xyz(clipped.polygon[index-vertexCount]));generated.push(fan);vertices.push(...fan);
    }
    vertexCount=clipped.vertexCount;
   }
   // Native128D620 creates the record before clipping, including empty output.
   node.records.push({key:group.key,raw10:group.raw10,raw18:group.raw18,raw14:group.raw14,
    source:groupSources.length===1?groupSources[0]:null,sources:groupSources.slice(),
    sourceTriangleCount:triangles.length,vertices,packets:generated.map(packet),triangleBounds:generated.map(triangleBounds)});
  }
  if(input.length)visit('',seed,root.level,input);
 }
 const finalNodes=new Map();
 const profileSnapshot={...sourceProfile,sources:sourceProfile.sources.slice()};
 //11FE760 guards postprocess with world+E5. This pure source builder does not
 // possess that live flag. An empty/unadmitted input therefore remains
 // explicitly unprocessed, rather than manufacturing an ordered empty root.
 if(![...initialNodes.values()].some(node=>node.records.length))return {
  tree:null,initialNodes,initialNodesWithFinalBounds:finalNodes,capacityStops,sourceProfile:profileSnapshot,
  processed:false,empty:true,reason:'no-admitted-leaf-records',nativeReady:false,nativeMovementCompared:false};
 function finalize(path){
  const initial=initialNodes.get(path);if(!initial)return null;
  const original=cloneBounds(initial.initialBounds),children=Array.from({length:8},(_,i)=>finalize(path+i));
  let bounds;
  if(initial.level===0){bounds=cloneBounds(original);for(const record of initial.records)for(const point of record.vertices)unionPoint(bounds,point);}
  else{
   bounds={min:original.max.slice(),max:original.min.slice()};
   for(const child of children)if(child){unionPoint(bounds,child.bounds.min);unionPoint(bounds,child.bounds.max);}
   for(let i=0;i<3;i++){if(original.min[i]>bounds.min[i])bounds.min[i]=original.min[i];if(bounds.max[i]>original.max[i])bounds.max[i]=original.max[i];}
   for(let i=0;i<8;i++)if(children[i]){const occupied=children[i].children.filter(Boolean);if(occupied.length===1)children[i]=occupied[0];}
  }
  bounds={min:bounds.min.map(n=>f(n-expansion)),max:bounds.max.map(n=>f(n+expansion))};
  const valid=bounds.min.every((n,i)=>n<=bounds.max[i]),center=valid?nativeConstructedCellFromBounds(bounds).center:null;
  const node={...initial,initialBounds:original,bounds,center,valid,children};finalNodes.set(path,node);return node;
 }
 const tree=finalize(''),invalidNodePaths=[...finalNodes.values()].filter(node=>!node.valid).map(node=>node.fullPath);
 return {tree,initialNodes,initialNodesWithFinalBounds:finalNodes,capacityStops,sourceProfile:profileSnapshot,
  processed:true,empty:false,invalidNodePaths,nativeReady:false,nativeMovementCompared:false};
}

export function nativeStaticHeightTree(finalTree,{geometryQualified=false,readEnabled}={}){
 if(typeof geometryQualified!=='boolean'||typeof readEnabled!=='function')throw TypeError('Explicit geometry qualification and current enable reader required');
 if(!finalTree)throw TypeError('A processed nonempty source tree is required; empty/unprocessed input is unqualified');
 function convert(node,path){
  if(!node)return null;
  if(node.valid!==true||node.bounds.min.some((n,i)=>n>node.bounds.max[i]))throw TypeError('Invalid/unprocessed source bounds cannot qualify a height tree');
  return {bounds:cloneBounds(node.bounds),branch:node.level!==0,children:node.children.map((child,i)=>convert(child,path+i)),
   records:node.records.map(record=>{
    const value={key:record.key,qualified:geometryQualified,raw10:record.raw10,raw18:record.raw18,raw14:record.raw14,
     packets:record.packets,triangleBounds:record.triangleBounds};
    Object.defineProperty(value,'raw34',{enumerable:true,get:()=>readEnabled({path,fullPath:node.fullPath,key:record.key,raw10:record.raw10,raw18:record.raw18,source:record.source,sources:record.sources.slice()})});
    return value;
   })};
 }
 return convert(finalTree,'');
}
