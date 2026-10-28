import {Box3,Triangle,Vector3} from 'three';
import {worldMeleeBox,worldMeleeFan,worldMeleeCylinder} from './native-melee.js';
import {SCN_SCENE_SCALE,sourceActorVector} from './s5runtime-coordinates.js';

const CATEGORY=0x8000,RAW_HIT_CAP=200;
const vector=(value,label)=>{
 const a=Array.isArray(value)?value:[value?.x,value?.y,value?.z];
 if(a.length!==3||!a.every(Number.isFinite))throw TypeError('Finite '+label+' vec3 required');
 return new Vector3(...a);
};
const positive=(value,label)=>{if(!Number.isFinite(value)||value<=0)throw TypeError('Positive '+label+' required');return value;};
const horizontalRotate=(v,degrees)=>{
 const angle=degrees*.017453292521994,c=Math.cos(angle),s=Math.sin(angle);
 return new Vector3(v.x*c+v.z*s,0,v.z*c-v.x*s);
};
function sourcePoint(value,actor,scale){
 const p=vector(value,'source anchor');positive(scale,'source scale');
 if(!Number.isFinite(actor?.facing))throw TypeError('Finite actor facing required');
 const offset=sourceActorVector(p,actor.facing,scale);
 return vector(actor.position,'actor position').add(vector(offset,'transformed anchor'));
}

// Clips the actual triangle polygon, never an actor AABB or its centroid.
function clip(polygon,signedDistance){
 if(!polygon.length)return polygon;
 const out=[];let a=polygon.at(-1),da=signedDistance(a);
 for(const b of polygon){
  const db=signedDistance(b),insideA=da>=0,insideB=db>=0;
  if(insideA!==insideB)out.push(a.clone().lerp(b,da/(da-db)));
  if(insideB)out.push(b);a=b;da=db;
 }
 return out;
}
function heightClip(points,low,high){return clip(clip(points,p=>p.y-low),p=>high-p.y);}
function segmentDistanceXZSq(point,a,b){
 const dx=b.x-a.x,dz=b.z-a.z,length=dx*dx+dz*dz;
 const t=length?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/length)):0;
 return (point.x-a.x-t*dx)**2+(point.z-a.z-t*dz)**2;
}
function polygonDistanceXZSq(point,polygon){
 if(!polygon.length)return Infinity;
 // The clipped polygon is convex; projected triangle-fan containment also
 // handles a triangle crossing the disk while all its vertices lie outside.
 const a=polygon[0];
 for(let i=1;i+1<polygon.length;i++){
  const b=polygon[i],c=polygon[i+1],den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
  if(den===0)continue;
  const u=((b.z-c.z)*(point.x-c.x)+(c.x-b.x)*(point.z-c.z))/den;
  const v=((c.z-a.z)*(point.x-c.x)+(a.x-c.x)*(point.z-c.z))/den;
  if(u>=0&&v>=0&&u+v<=1)return 0;
 }
 let distance=Infinity;
 for(let i=0;i<polygon.length;i++)distance=Math.min(distance,segmentDistanceXZSq(point,polygon[i],polygon[(i+1)%polygon.length]));
 return distance;
}
function boxPredicate(box){
 const center=vector(box.center,'box center'),axes=box.axes.map(axis=>vector(axis,'box axis'));
 const half=vector(box.halfExtents,'box half extents'),bounds=new Box3(half.clone().negate(),half);
 return points=>bounds.intersectsTriangle(new Triangle(...points.map(point=>{
  const delta=point.clone().sub(center);return new Vector3(...axes.map(axis=>delta.dot(axis)));
 })));
}
function predicate(shape,actor,scale){
 if(shape.type==='box')return boxPredicate(worldMeleeBox(shape,actor,scale));
 if(shape.type==='cylinder'){
  const c=worldMeleeCylinder(shape,actor,scale),center=vector(c.center,'cylinder center');
  return points=>polygonDistanceXZSq(center,heightClip(points,center.y-c.height/2,center.y+c.height/2))<=c.radius**2;
 }
 if(shape.type==='fan'){
  const f=worldMeleeFan(shape,actor,scale),a=vector(f.anchor,'fan anchor'),d=vector(f.direction,'fan direction');
  const core=boxPredicate(worldMeleeBox({type:'box',anchor:shape.anchor,direction:shape.direction,dimensions:(shape.scalars??shape.parameters).slice(0,3)},actor,scale));
  const q1=a.clone().addScaledVector(horizontalRotate(d,-90),f.width/2),q2=a.clone().addScaledVector(horizontalRotate(d,90),f.width/2);
  const n1=horizontalRotate(horizontalRotate(d,-f.angleParameter/2),90),n2=horizontalRotate(horizontalRotate(d,f.angleParameter/2),-90);
  return points=>{
   if(core(points))return true;
   let polygon=heightClip(points,a.y-f.height/2,a.y+f.height/2);
   for(const [normal,origin] of [[d,a],[n1,q1],[n2,q2]])polygon=clip(polygon,p=>normal.dot(p.clone().sub(origin)));
   return polygonDistanceXZSq(q1,polygon)<=f.depth**2||polygonDistanceXZSq(q2,polygon)<=f.depth**2;
  };
 }
 if(shape.type==='sphere'){
  let center,radius;
  if(shape.space==='world'){center=vector(shape.center,'world sphere center');radius=positive(shape.radius,'world sphere radius');}
  else{
   if(shape.space!==undefined&&shape.space!=='source-actor')throw TypeError('Unknown sphere coordinate space');
   center=sourcePoint(shape.anchor??shape.center,actor,scale);radius=positive(shape.radius,'source sphere radius')*scale;
  }
  const closest=new Vector3();
  return points=>{
   if(points.every(point=>point.y<center.y-radius)||points.every(point=>point.y>center.y+radius))return false;
   new Triangle(...points).closestPointToPoint(center,closest);return closest.distanceToSquared(center)<=radius**2;
  };
 }
 return null;
}

/** Query only; no HP/state mutation. Source box/fan/cylinder use native-melee's
 * actor transform and native units. Sphere defaults to an actor-local native
 * anchor/center+radius; space:'world' explicitly selects world center/radius.
 * Ray origin/displacement are already world values and delegate to query.raycast.
 * IDs are unique per query/activation result; separate attacks in one frame
 * remain distinct. Caller owns activation/frame delivery, not this geometry API.
 */
export function queryMapWeaponVolume(query,shape,actor,{scale=SCN_SCENE_SCALE}={}){
 const qualification={nativeTriangleConsumerCertified:false,nativeOtherProvidersIncluded:false,damageApplied:false,
  ordering:'Supplied source triangle order; deterministic S5, not native provider/BVH order.',
  boundaries:'Inclusive S5 geometric boundary; not bit-exact native query or x87/SSE emulation.'};
 if(!shape||!['box','fan','cylinder','sphere','ray'].includes(shape.type))return {supported:false,verified:false,hits:[],reason:'Unsupported source weapon shape; no fallback probes.',qualification};
 if(shape.type==='ray'){
  if(typeof query?.raycast!=='function')throw TypeError('Explicit map ray query required');
  const hit=query.raycast(shape.origin,shape.displacement);
  return {supported:true,verified:true,hits:hit?[hit]:[],rawTriangleHits:hit?1:0,rawTriangleCapReached:false,qualification:{...qualification,scope:'Delegated world segment; ray provider decides 0x40/0x8000 nearest hit.'}};
 }
 if(typeof query?.snapshot!=='function')throw TypeError('Explicit versioned map weapon snapshot required');
 const intersects=predicate(shape,actor,scale),snapshot=query.snapshot();
 if(!Array.isArray(snapshot?.brokenRecords)||!Array.isArray(snapshot?.instances))throw TypeError('Captured source broken records and instance generations required');
 const instances=new Map(snapshot.instances.map(instance=>[instance.instanceKey,instance])),hits=[],unique=new Set();let rawTriangleHits=0;
 for(const record of snapshot.brokenRecords){
  const instance=instances.get(record.instanceKey);
  if(!instance||!instance.alive||!Number.isSafeInteger(instance.generation)||instance.generation<0)throw TypeError('Snapshot broken record has no captured live generation');
  if(!Array.isArray(record.points)||record.points.length!==3)throw TypeError('Source triangle required');
  const points=record.points.map(point=>vector(point,'source triangle point'));
  if(!intersects(points))continue;
  rawTriangleHits++;
  if(!unique.has(record.instanceKey)){
   unique.add(record.instanceKey);
   const token=Object.freeze({instanceKey:record.instanceKey,generation:instance.generation,version:snapshot.version,category:CATEGORY,
    sourceModelIndex:record.sourceModelIndex,sourceNodeIndex:record.sourceNodeIndex,triangleIndex:record.triangleIndex});
   hits.push({instanceKey:record.instanceKey,category:CATEGORY,sourceRecord:record,token});
  }
  if(rawTriangleHits===RAW_HIT_CAP)break;
 }
 return {supported:true,verified:true,hits,version:snapshot.version,rawTriangleHits,rawTriangleCapReached:rawTriangleHits===RAW_HIT_CAP,
  rawTriangleCap:RAW_HIT_CAP,qualification:{...qualification,scope:'Living supplied 0x8000 props only; volume mask0x8180 excludes static weapon0x40.',
   deduplication:'Unique instanceKey within this snapshot query result, before caller activation/frame delivery.',
   cap:'At most200 raw triangle intersections before ID deduplication; cap reached does not prove additional omitted hits.'}};
}
