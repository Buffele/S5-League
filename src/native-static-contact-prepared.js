// Optional preparation of immutable compiled contact geometry. Query ordering,
// masks, current enables, source ownership and the original fallback live in
// native-static-contact-query. No frequency or collision policy changes here.
const f=Math.fround,policies=new WeakMap(),trees=new WeakMap(),boundsOwners=new WeakMap(),geometryOwners=new WeakMap(),geometryCache=new WeakMap();
const vector=p=>{if(!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isFinite(n)||!Number.isFinite(f(n))))throw TypeError('Finite native XYZ required');return p.map(f);};
const sub=(a,b)=>a.map((n,i)=>f(n-b[i]));
const dot=(a,b)=>f(f(f(a[0]*b[0])+f(a[1]*b[1]))+f(a[2]*b[2]));
const cross=(a,b)=>[f(f(a[1]*b[2])-f(a[2]*b[1])),f(f(a[2]*b[0])-f(a[0]*b[2])),f(f(a[0]*b[1])-f(a[1]*b[0]))];
const length=a=>f(Math.sqrt(dot(a,a)));
const normalize=a=>{const n=length(a);return n===0?a.slice():a.map(x=>f(x*f(1/n)));};
const bitsView=new DataView(new ArrayBuffer(4));
const bits=n=>{bitsView.setFloat32(0,n,true);return bitsView.getUint32(0,true);};
function policyRecord(policy){const value=policies.get(policy);if(!value)throw TypeError('Owned native static contact preparation policy required');return value;}

export function createNativeStaticContactPreparation({arithmeticProfile,pureArithmetic}={}){
 if(pureArithmetic!==true||!Object.isFrozen(arithmeticProfile)||arithmeticProfile?.qualified!==true||typeof arithmeticProfile.roundX87!=='function'||typeof arithmeticProfile.source!=='string'||!arithmeticProfile.source.trim())throw TypeError('Explicit pure, frozen qualified contact arithmetic profile required');
 const policy=Object.freeze({kind:'native-static-contact-preparation',maxRadiiVariants:32,nativeReady:false});
 policies.set(policy,{profile:arithmeticProfile,q:arithmeticProfile.roundX87,preparedRecords:0,preparedTriangles:0,preparedCalls:0,sizeFallbacks:0});return policy;
}
export function assertNativeStaticContactPreparation(policy){policyRecord(policy);return policy;}
export function nativeStaticContactPreparationSnapshot(policy){const p=policyRecord(policy);return {preparedRecords:p.preparedRecords,preparedTriangles:p.preparedTriangles,preparedCalls:p.preparedCalls,sizeFallbacks:p.sizeFallbacks,maxRadiiVariants:32,nativeReady:false};}
export function prepareNativeStaticContactBounds(policy,value){
 const owner=policyRecord(policy),min=vector(value?.min),max=vector(value?.max);if(min.some((n,i)=>n>max[i]))throw TypeError('Ordered native bounds required');
 const bounds=Object.freeze({min:Object.freeze(min),max:Object.freeze(max)});boundsOwners.set(bounds,owner);return bounds;
}
export function prepareNativeStaticContactVertices(policy,vertices){const owner=policyRecord(policy),copy=vertices.map(p=>Object.freeze(vector(p)));Object.freeze(copy);geometryOwners.set(copy,owner);return copy;}
export function bindNativeStaticContactPreparation(tree,policy){const owner=policyRecord(policy);if(!tree||typeof tree!=='object'||trees.has(tree))throw TypeError('Distinct compiled contact tree required');trees.set(tree,owner);return tree;}

// Identity selects the exact pure arithmetic callback used for preparation.
// A different profile, even with similar fields, executes the original path.
export function nativeStaticContactPreparedQuery(tree,arithmeticProfile,{origin,displacement,radii}){
 const owner=trees.get(tree);if(!owner||owner.profile!==arithmeticProfile||owner.q!==arithmeticProfile.roundX87)return null;
 const q=owner.q,motion=makeTravel(displacement,q),key=radii[0]+'/'+radii[1]+'/'+radii[2];
 return {
  bounds:value=>boundsOwners.get(value)===owner?value:null,
  record(vertices){const prepared=prepareRecord(owner,vertices,radii,key,q);return prepared?index=>preparedContact(owner,prepared[index],origin,motion,q):null;},
 };
}
function makeTravel(displacement,q){const travelLength=length(displacement),direction=normalize(displacement),travel=direction.map(n=>f(q(n*travelLength)));return {travelLength,travel,travelSquared:f(q(travelLength*travelLength))};}
function prepareRecord(owner,vertices,radii,key,q){
 if(geometryOwners.get(vertices)!==owner)return null;
 let variants=geometryCache.get(vertices);if(!variants)geometryCache.set(vertices,variants=new Map());
 let prepared=variants.get(key);if(prepared)return prepared;
 if(variants.size>=32){owner.sizeFallbacks++;return null;}
 prepared=[];for(let i=0;i<vertices.length;i+=3){
  const normalized=[vertices[i],vertices[i+1],vertices[i+2]].map(p=>p.map((n,index)=>f(n/radii[index])));
  const normal=normalize(cross(sub(normalized[0],normalized[1]),sub(normalized[0],normalized[2]))),planeConstant=f(-dot(normal,normalized[0]));
  const e0=sub(normalized[1],normalized[0]),e1=sub(normalized[2],normalized[0]),a00=dot(e0,e0),a01=dot(e0,e1),a11=dot(e1,e1),determinant=f(q(q(a00*a11)-q(a01*a01)));
  const edges=normalized.map((v,index)=>{const edge=sub(normalized[(index+1)%3],v);return {edge,squared:dot(edge,edge)};});
  prepared.push({vertices:normalized,normal,planeConstant,e0,e1,a00,a01,a11,determinant,edges});
 }
 variants.set(key,prepared);owner.preparedRecords++;owner.preparedTriangles+=prepared.length;return prepared;
}
// Both private callers already supply f32 inputs; keep every q boundary below.
function lowest(a,b,c,limit,q){const determinant=f(q(q(b*b)-q(q(4*a)*c)));if(determinant<0)return null;const root=f(q(Math.sqrt(determinant)));let first=f(q(q(-b-root)/q(2*a))),second=f(q(q(-b+root)/q(2*a)));if(first>second)[first,second]=[second,first];if(first>0&&first<limit)return first;if(second>0&&second<limit)return second;return null;}
const dotXYZ=(ax,ay,az,bx,by,bz)=>f(f(f(ax*bx)+f(ay*by))+f(az*bz));
function insideXYZ(px,py,pz,g,q){
 const x=f(px-g.vertices[0][0]),y=f(py-g.vertices[0][1]),z=f(pz-g.vertices[0][2]),b0=dotXYZ(x,y,z,g.e0[0],g.e0[1],g.e0[2]),b1=dotXYZ(x,y,z,g.e1[0],g.e1[1],g.e1[2]);
 const u=f(q(q(b0*g.a11)-q(b1*g.a01))),v=f(q(q(b1*g.a00)-q(b0*g.a01))),w=f(q(q(u+v)-g.determinant));return !!((~(bits(u)|bits(v)))&bits(w)&0x80000000);
}
function preparedContact(owner,g,origin,motion,q){
 owner.preparedCalls++;const {vertices}=g,{travelLength,travel,travelSquared}=motion;
 const ox=origin[0],oy=origin[1],oz=origin[2],tx=travel[0],ty=travel[1],tz=travel[2];
 let nx=g.normal[0],ny=g.normal[1],nz=g.normal[2],planeConstant=g.planeConstant,signedDistance=f(q(dotXYZ(nx,ny,nz,ox,oy,oz)+planeConstant));
 if(signedDistance<0){planeConstant=f(-planeConstant);signedDistance=f(-signedDistance);nx=f(-nx);ny=f(-ny);nz=f(-nz);}
 let time=f(1),point=null,feature=null;
 if(Math.abs(signedDistance)>=1){
  const denominator=dotXYZ(nx,ny,nz,tx,ty,tz);let begin=f(q(q(-1-signedDistance)/denominator)),end=f(q(q(1-signedDistance)/denominator));
  if(begin>end)[begin,end]=[end,begin];if(begin>1||end<0)return {hit:false};
  if(begin<0)begin=0;if(end<0)end=0;if(begin>1)begin=1;if(end>1)end=1;
  const px=f(f(ox-nx)+f(q(tx*begin))),py=f(f(oy-ny)+f(q(ty*begin))),pz=f(f(oz-nz)+f(q(tz*begin)));
  if(Number.isFinite(px)&&Number.isFinite(py)&&Number.isFinite(pz)&&insideXYZ(px,py,pz,g,q)){time=begin;point=[px,py,pz];feature={kind:'face'};}
 }
 if(point===null){
  for(let index=0;index<3;index++){
   const v=vertices[index],b=f(q(dotXYZ(tx,ty,tz,f(ox-v[0]),f(oy-v[1]),f(oz-v[2]))*2)),x=f(v[0]-ox),y=f(v[1]-oy),z=f(v[2]-oz),c=f(q(dotXYZ(x,y,z,x,y,z)-1)),root=lowest(travelSquared,b,c,time,q);
   if(root!==null){time=root;point=v.slice();feature={kind:'vertex',index};}
  }
  for(let index=0;index<3;index++){
   const {edge,squared:edgeSquared}=g.edges[index],v=vertices[index],x=f(v[0]-ox),y=f(v[1]-oy),z=f(v[2]-oz),edgeTravel=dotXYZ(edge[0],edge[1],edge[2],tx,ty,tz),edgeOffset=dotXYZ(edge[0],edge[1],edge[2],x,y,z);
   const a=f(q(q(-travelSquared*edgeSquared)+q(edgeTravel*edgeTravel))),b=f(q(q(q(dotXYZ(tx,ty,tz,x,y,z)*2)*edgeSquared)-q(q(edgeTravel*2)*edgeOffset))),c=f(q(q(q(1-dotXYZ(x,y,z,x,y,z))*edgeSquared)+q(edgeOffset*edgeOffset))),root=lowest(a,b,c,time,q);
   if(root===null)continue;const edgeFraction=f(q(q(q(edgeTravel*root)-edgeOffset)/edgeSquared));
   if(edgeFraction>=0&&edgeFraction<=1){time=root;point=[f(v[0]+f(q(edge[0]*edgeFraction))),f(v[1]+f(q(edge[1]*edgeFraction))),f(v[2]+f(q(edge[2]*edgeFraction)))];feature={kind:'edge',index,fraction:edgeFraction};}
  }
 }
 return point===null?{hit:false}:{hit:true,time,distance:f(q(time*travelLength)),point,normal:[nx,ny,nz],feature};
}
