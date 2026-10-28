// Explicit TEST V2 host geometry. No Controller, avatar, map loader or preview dependencies.
import {worldTriangles} from './collision.js';
const f=Math.fround,unit=.006;
const rampKeys=['minX','maxX','minZ','maxZ','bottom','top'];
function captureHost(world){
 if(!world||!['object','function'].includes(typeof world))throw TypeError('Explicit current host collision world required');
 const triangles=world.triangles,colliders=world.colliders,ramp=world.ramp;
 if(triangles!==undefined&&!Array.isArray(triangles)||colliders!==undefined&&!Array.isArray(colliders))throw TypeError('Current host collision arrays must be arrays when supplied');
 if(!Array.isArray(triangles)&&!Array.isArray(colliders)&&!ramp)throw TypeError('At least one real host collision array or ramp required');
 if(ramp!==undefined&&ramp!==null&&(!ramp||typeof ramp!=='object'||!rampKeys.every(key=>Number.isFinite(ramp[key]))))throw TypeError('Complete finite current host ramp required');
 if(colliders?.some(box=>box?.oneWay)||ramp?.oneWay)throw Error('Surfaces à sens unique non prises en charge dans TEST V2.');
 const state={owner:world,triangles:triangles??[],colliders:colliders??[],ramp:ramp??undefined,queryTriangleRecords:world.queryTriangleRecords};
 state.signature=[world,triangles,triangles?.length,colliders,colliders?.length,ramp,...rampKeys.map(key=>ramp?.[key])];
 return state;
}

function buildGeometry(world,{leafSize=24,allowEmpty=false}={}){
 if(!Number.isInteger(leafSize)||leafSize<1||leafSize>128)throw TypeError('Bounded prototype leaf size required');
 const raw=worldTriangles(world);
 if(!raw.length&&!allowEmpty||raw.length>250000)throw Error('Loaded map collision geometry unavailable or exceeds prototype limit');
 let nodes=0;
 const triangles=raw.map(points=>{
  if(points.oneWay)throw Error('Cette carte contient des surfaces à sens unique non prises en charge dans ce test.');
  if(points.length!==3)throw Error('Incomplete loaded map triangle');
  const vertices=points.map(point=>[point.x,point.y,point.z].map(n=>f(n/unit)));
  if(!vertices.flat().every(Number.isFinite))throw Error('Nonfinite loaded map collision geometry');
  const min=[0,1,2].map(i=>Math.min(...vertices.map(p=>p[i]))),max=[0,1,2].map(i=>Math.max(...vertices.map(p=>p[i])));
  return {vertices,bounds:{min,max},center:min.map((v,i)=>(v+max[i])/2)};
 });
 function build(items){
  nodes++;const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const item of items)for(let i=0;i<3;i++){min[i]=Math.min(min[i],item.bounds.min[i]);max[i]=Math.max(max[i],item.bounds.max[i]);}
  const bounds={min:min.map(n=>f(n-1)),max:max.map(n=>f(n+1))};
  if(items.length<=leafSize){
   const vertices=items.flatMap(item=>item.vertices),packets=items.map(({vertices:[a,b,c]})=>({origin:a,edge1:b.map((v,i)=>f(v-a[i])),edge2:c.map((v,i)=>f(v-a[i]))}));
   return {bounds,branch:false,records:[{key:'s5-host-test-map',qualified:true,raw10:1,raw18:0,raw34:true,triangleCount:items.length,vertices,packets,triangleBounds:items.map(item=>item.bounds)}]};
  }
  const axis=[0,1,2].sort((a,b)=>(max[b]-min[b])-(max[a]-min[a]))[0];
  const sorted=items.slice().sort((a,b)=>a.center[axis]-b.center[axis]);
  const children=Array.from({length:8},(_,i)=>{const chunk=sorted.slice(Math.floor(i*sorted.length/8),Math.floor((i+1)*sorted.length/8));return chunk.length?build(chunk):null;});
  return {bounds,branch:true,children};
 }
 // captureHost has already required an actual supplied host array/ramp.
 // An explicitly empty host collection is exhaustive, not missing native data.
 const tree=triangles.length?build(triangles):null;
 return {world:{complete:true,treeComplete:true,tree,children:[]},triangleCount:triangles.length,nodeCount:nodes,
  qualification:{geometry:'Complete supplied current S5 host collision geometry',index:'Host TEST V2 eight-child spatial index; not native registration or octree construction',dynamicObjects:true,nativeReady:false,testMode:'V2'},dispose(){}};
}

export function createCollisionTestMapGeometry(world,options={}){return buildGeometry(captureHost(world),options);}

// Read from actor.collision.world, including inherited role/destructible views.
// Producers replace changed triangle/collider arrays; in-place vertex edits are
// deliberately not scanned every frame. Ramp scalar changes are inexpensive.
export function createCollisionV2TestWorld(initialWorld,{leafSize=24}={}){
 if(!Number.isInteger(leafSize)||leafSize<1||leafSize>128)throw TypeError('Bounded TEST V2 leaf size required');
 let currentWorld=initialWorld,current=null,signature=null,rebuilds=0,disposed=false;
 return Object.freeze({
  read(world=currentWorld){
   if(disposed)throw Error('TEST V2 collision index disposed');
   const state=captureHost(world);
   if(!signature||signature.length!==state.signature.length||signature.some((value,index)=>!Object.is(value,state.signature[index]))){
    const next=buildGeometry(state,{leafSize,allowEmpty:true});
    current?.dispose();current=next;signature=state.signature;rebuilds++;
   }
   currentWorld=world;return current;
  },
  dispose(){if(disposed)return;disposed=true;current?.dispose();current=null;signature=null;},
  diagnostics(){return {disposed,rebuilds,triangleCount:current?.triangleCount??0,testMode:'V2',nativeReady:false};},
 });
}
