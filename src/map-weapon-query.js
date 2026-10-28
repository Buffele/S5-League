import {Ray,Triangle,Vector3} from 'three';

// Bounded map ray context, separate from actor locomotion and damage delivery.
// Only supplied scene-weapon (0x40) and living broken-object (0x8000) records
// participate. Shield/obstruction/other native providers remain caller-owned.
export const MAP_WEAPON_QUERY_CATEGORIES=Object.freeze({staticWeapon:0x40,brokenObject:0x8000});
const vector=(value,label)=>{
 const array=Array.isArray(value)?value:[value?.x,value?.y,value?.z];
 if(array.length!==3||!array.every(Number.isFinite))throw TypeError('Finite '+label+' vec3 required');
 return new Vector3(...array);
};
const ordinal=(value,label)=>{if(!Number.isSafeInteger(value)||value<0)throw TypeError('Nonnegative safe '+label+' required');return value;};
const versionValue=value=>{
 if(!['number','string','bigint'].includes(typeof value)||(typeof value==='number'&&!Number.isFinite(value)))throw TypeError('Primitive finite collision version required');
 return value;
};
function compile(record,category){
 if(!record||!Array.isArray(record.points)||record.points.length!==3)throw TypeError('Source triangle record required');
 for(const key of ['sourceModelIndex','sourceNodeIndex','triangleIndex'])ordinal(record[key],key);
 const broken=category===MAP_WEAPON_QUERY_CATEGORIES.brokenObject;
 if(broken&&(typeof record.instanceKey!=='string'||!record.instanceKey))throw TypeError('Explicit broken-object instanceKey required');
 const points=record.points.map(point=>vector(point,'source point'));
 return {record,category,points,normal:new Triangle(...points).getNormal(new Vector3()),
  min:points[0].clone().min(points[1]).min(points[2]),max:points[0].clone().max(points[1]).max(points[2])};
}

/**
 * Input records/points are caller-owned immutable source authority. Their exact
 * object references are returned, never frozen or modified by this module.
 * readVersion changes whenever alive/generation changes; health-only changes
 * need not invalidate collision. readInstanceState is synchronous and read-only.
 * Equal-distance ties keep the first supplied static record, then broken record.
 * This deterministic S5 order does not claim native provider ordering parity.
 */
export function createMapWeaponQuery({staticRecords=[],brokenRecords=[],readVersion,readInstanceState}={}){
 if(!Array.isArray(staticRecords)||!Array.isArray(brokenRecords))throw TypeError('Source record arrays required');
 if(brokenRecords.length&&(typeof readVersion!=='function'||typeof readInstanceState!=='function'))throw TypeError('Explicit broken-object state/version readers required');
 if(readVersion!==undefined&&typeof readVersion!=='function')throw TypeError('Collision version reader must be a function');
 const versionReader=readVersion??(()=>0),staticSource=Object.freeze([...staticRecords]),brokenSource=Object.freeze([...brokenRecords]);
 const statics=staticSource.map(record=>compile(record,MAP_WEAPON_QUERY_CATEGORIES.staticWeapon));
 const broken=brokenSource.map(record=>compile(record,MAP_WEAPON_QUERY_CATEGORIES.brokenObject));
 let cached=null;
 function current(){
  const version=versionValue(versionReader());
  if(cached&&Object.is(cached.version,version))return cached;
  const states=new Map();
  for(const item of broken)if(!states.has(item.record.instanceKey)){
   const state=readInstanceState(item.record.instanceKey);
   if(!state||typeof state.alive!=='boolean')throw TypeError('Explicit instance alive state required');
   states.set(item.record.instanceKey,Object.freeze({alive:state.alive,generation:ordinal(state.generation,'instance generation')}));
  }
  if(!Object.is(versionValue(versionReader()),version))throw Error('Collision version changed during query snapshot');
  const activeBroken=broken.filter(item=>states.get(item.record.instanceKey).alive),active=[...statics,...activeBroken];
  const instances=Object.freeze([...states].map(([instanceKey,state])=>Object.freeze({instanceKey,...state})));
  const snapshot=Object.freeze({version,instances,staticRecords:staticSource,brokenRecords:Object.freeze(activeBroken.map(item=>item.record)),records:Object.freeze(active.map(item=>item.record))});
  cached={version,states,active,snapshot};return cached;
 }
 function raycast(origin,displacement){
  const start=vector(origin,'ray origin'),delta=vector(displacement,'ray displacement'),length=delta.length();
  if(!Number.isFinite(length))throw RangeError('Finite ray length required');
  if(length===0)return null;
  const state=current(),ray=new Ray(start,delta.clone().divideScalar(length)),end=start.clone().add(delta),min=start.clone().min(end),max=start.clone().max(end);
  const point=new Vector3();let best=null,bestDistance=Infinity;
  for(const item of state.active){
   if(item.min.x>max.x||item.max.x<min.x||item.min.y>max.y||item.max.y<min.y||item.min.z>max.z||item.max.z<min.z)continue;
   // THREE's triangle ray rejects exact degenerates itself. No ellipsoid-space
   // validator or epsilon-based source face filtering is applied to this ray.
   if(!ray.intersectTriangle(...item.points,false,point))continue;
   const distance=point.distanceTo(start);
   if(distance>length||distance>=bestDistance)continue;
   const normal=item.normal.clone();if(normal.dot(delta)>0)normal.negate();
   const record=item.record,instance=item.category===MAP_WEAPON_QUERY_CATEGORIES.brokenObject?state.states.get(record.instanceKey):null;
   const token=Object.freeze({instanceKey:instance?record.instanceKey:null,generation:instance?.generation??null,version:state.version,
    category:item.category,sourceModelIndex:record.sourceModelIndex,sourceNodeIndex:record.sourceNodeIndex,triangleIndex:record.triangleIndex});
   best={time:distance/length,point:point.clone(),normal,sourceRecord:record,category:item.category,token};bestDistance=distance;
  }
  return best;
 }
 return Object.freeze({raycast,snapshot:()=>current().snapshot,staticRecords:staticSource,brokenRecords:brokenSource,
  qualification:Object.freeze({scope:'Caller-supplied 0x40 scene weapon and live 0x8000 broken-object triangles only',
   nativeSolverParityCertified:false,nativeOtherProvidersIncluded:false,actorRoleDependent:false,damageApplied:false,
   tokenPolicy:'Captured hit provenance; receiver validates instance/generation. A later global revision does not itself revoke another instance token.'})});
}
